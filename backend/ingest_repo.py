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

            # Only process files changed in this commit to avoid inflating snapshots
            changed_paths = list(commit.stats.files.keys())
            for path in changed_paths:
                # Ensure File row exists
                file = self.session.query(File).filter(File.path == path).first()
                if not file:
                    file = File(path=path)
                    self.session.add(file)
                    self.session.commit()
                    file = self.session.query(File).filter(File.path == path).first()

                # Calculate churn from git stats (insertions + deletions)
                stats = commit.stats.files.get(path, {"insertions": 0, "deletions": 0})
                churn = int(stats.get("insertions", 0)) + int(stats.get("deletions", 0))

                # Compute features and predict hotspot score
                features = compute_features(self.session, file.id, commit.committed_date, churn, path)
                hotspot_score = predict(features)

                # Determine label by looking ahead to next commit
                label = 0
                if i < len(commits) - 1:
                    next_commit = commits[i + 1]
                    if path in next_commit.stats.files:
                        label = 1 if bugfix_commit(next_commit.message) else 0

                # Insert snapshot, including cached features for training
                snapshot = Snapshot(
                    commit_id=commit.hexsha,
                    file_id=file.id,
                    churn=churn,
                    hotspot_score=hotspot_score,
                    label=label,
                    tmp_features=features,
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
