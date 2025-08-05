import pytest
import subprocess
import os
import tempfile
from models import SessionLocal, Commit, Snapshot
from cli import ingest_repository


def test_ingest_repository(tmp_path):
    """Test repository ingestion with temporary Git repo."""
    # Initialize Git repository in tmp_path
    subprocess.run(["git", "init"], cwd=tmp_path, check=True)

    # Create foo.txt and make first commit
    foo_path = tmp_path / "foo.txt"
    foo_path.write_text("Hello World")
    subprocess.run(["git", "add", "foo.txt"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=tmp_path, check=True)

    # Modify foo.txt and make second commit
    foo_path.write_text("Hello World Updated")
    subprocess.run(["git", "add", "foo.txt"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-m", "Update foo.txt"], cwd=tmp_path, check=True)

    # Create temporary database file
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    try:
        # Run ingestion
        db_url = f"sqlite:///{db_path}"
        ingest_repository(str(tmp_path), db_url)

        # Verify database state
        session = SessionLocal(db_url)
        try:
            commits = session.query(Commit).all()
            snapshots = session.query(Snapshot).all()

            # Assert we have at least 2 commits and 1 snapshot
            assert len(commits) >= 2, f"Expected ≥2 commits, got {len(commits)}"
            assert len(snapshots) >= 1, f"Expected ≥1 snapshot, got {len(snapshots)}"

            # Verify commit data (strip newlines from messages)
            commit_messages = [commit.message.strip() for commit in commits]
            assert "Initial commit" in commit_messages
            assert "Update foo.txt" in commit_messages

            # Verify hotspot scores are between 0 and 1 (real ML predictions)
            for snapshot in snapshots:
                assert 0 <= snapshot.hotspot_score <= 1, f"Hotspot score {snapshot.hotspot_score} not in [0,1]"
            
            # Assert at least one snapshot has a valid hotspot score
            assert any(0 <= snapshot.hotspot_score <= 1 for snapshot in snapshots), "No valid hotspot scores found"

        finally:
            session.close()
    finally:
        # Clean up temporary database file
        os.unlink(db_path)
