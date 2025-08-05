#!/usr/bin/env python3

import argparse
import random
from git import Repo
from models import SessionLocal, Commit, File, Snapshot


def ingest_repository(repo_path: str, db_url: str):
    """Ingest a Git repository into the database."""
    session = SessionLocal(db_url)

    try:
        repo = Repo(repo_path)
        commits = list(repo.iter_commits("HEAD"))
        commits.reverse()  # oldest to newest

        total_commits = 0
        total_snapshots = 0

        for commit in commits:
            # Insert commit if not exists
            existing_commit = (
                session.query(Commit).filter(Commit.id == commit.hexsha).first()
            )
            if not existing_commit:
                db_commit = Commit(
                    id=commit.hexsha,
                    timestamp=commit.committed_date,
                    author=commit.author.name,
                    message=commit.message,
                )
                session.add(db_commit)
                session.commit()
                total_commits += 1

            # Traverse commit tree blobs and ensure File rows exist
            for blob in commit.tree.traverse():
                if blob.type == "blob":  # Only process files, not directories
                    existing_file = (
                        session.query(File).filter(File.path == blob.path).first()
                    )
                    if not existing_file:
                        db_file = File(path=blob.path)
                        session.add(db_file)
                        session.commit()

                    # Get the file ID (either existing or newly created)
                    file = session.query(File).filter(File.path == blob.path).first()

                    # Generate placeholder churn data
                    churn = random.randint(0, 20)

                    # Insert snapshot
                    snapshot = Snapshot(
                        commit_id=commit.hexsha,
                        file_id=file.id,
                        churn=churn,
                        hotspot_score=0.0,  # Will be calculated by ML model later
                    )
                    session.add(snapshot)
                    total_snapshots += 1

            session.commit()

        print(f"{total_commits} commits, {total_snapshots} snapshots")

    except Exception as e:
        print(f"Error ingesting repository: {e}")
        session.rollback()
        raise
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(
        description="Ingest Git repository into TimeWarp database"
    )
    parser.add_argument("--repo", required=True, help="Path to Git repository")
    parser.add_argument(
        "--db-url", default="sqlite:///timewarp.db", help="Database URL"
    )

    args = parser.parse_args()

    ingest_repository(args.repo, args.db_url)


if __name__ == "__main__":
    main()
