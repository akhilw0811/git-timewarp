import git
import os
import argparse
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Commit, File, Snapshot, SessionLocal
from ml.feature_utils import compute_features, bugfix_commit
from ml.real_hotspot import predict


class RepoIngester:
    def __init__(self, db_url="sqlite:///timewarp.db"):
        self.session = SessionLocal(db_url)

    def ingest_repository(self, repo_path):
        repo = git.Repo(repo_path)
        commits = list(repo.iter_commits("HEAD"))
        commits.reverse()  # oldest to newest

        total_commits = 0
        total_snapshots = 0

        for i, commit in enumerate(commits):
            # Insert commit if not exists
            existing_commit = (
                self.session.query(Commit).filter(Commit.id == commit.hexsha).first()
            )
            if not existing_commit:
                db_commit = Commit(
                    id=commit.hexsha,
                    timestamp=commit.committed_date,
                    author=commit.author.name,
                    message=commit.message,
                )
                self.session.add(db_commit)
                self.session.commit()
                total_commits += 1

            # Traverse commit tree blobs and ensure File rows exist
            for blob in commit.tree.traverse():
                if blob.type == "blob":  # Only process files, not directories
                    existing_file = (
                        self.session.query(File).filter(File.path == blob.path).first()
                    )
                    if not existing_file:
                        db_file = File(path=blob.path)
                        self.session.add(db_file)
                        self.session.commit()

                    # Get the file ID (either existing or newly created)
                    file = self.session.query(File).filter(File.path == blob.path).first()

                    # Calculate churn from git stats
                    churn = 0
                    if blob.path in commit.stats.files:
                        stats = commit.stats.files[blob.path]
                        churn = stats["insertions"] + stats["deletions"]

                    # Compute features
                    features = compute_features(
                        self.session, file.id, commit.committed_date, churn, blob.path
                    )

                    # Determine label by looking ahead to next commit
                    label = 0
                    if i < len(commits) - 1:
                        next_commit = commits[i + 1]
                        # Check if next commit touches this file
                        if blob.path in next_commit.stats.files:
                            label = 1 if bugfix_commit(next_commit.message) else 0

                    # Calculate hotspot score using real ML model
                    hotspot_score = predict(features)
                    
                    # Insert snapshot
                    snapshot = Snapshot(
                        commit_id=commit.hexsha,
                        file_id=file.id,
                        churn=churn,
                        hotspot_score=hotspot_score,
                        label=label,
                    )
                    self.session.add(snapshot)
                    total_snapshots += 1

            self.session.commit()

        print(f"{total_commits} commits, {total_snapshots} snapshots")

    def close(self):
        self.session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a git repository into the database")
    parser.add_argument("--repo", required=True, help="Path to the git repository")
    parser.add_argument("--db-url", default="sqlite:///timewarp.db", help="Database URL")
    args = parser.parse_args()
    
    ingester = RepoIngester(args.db_url)
    ingester.ingest_repository(args.repo)
    ingester.close()
