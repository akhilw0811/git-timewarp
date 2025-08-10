import os
import tempfile
import subprocess
import pytest
from fastapi.testclient import TestClient

from api.app import app
from models import SessionLocal, Commit, File, Snapshot


@pytest.fixture(scope="function")
def temp_repo_and_db(tmp_path):
    # Initialize a temporary git repo
    subprocess.run(["git", "init"], cwd=tmp_path, check=True)
    (tmp_path / "a.txt").write_text("hello\n")
    subprocess.run(["git", "add", "a.txt"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-m", "Initial"], cwd=tmp_path, check=True)

    (tmp_path / "a.txt").write_text("hello world\n")
    subprocess.run(["git", "add", "a.txt"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-m", "fix: update a"], cwd=tmp_path, check=True)

    # Create a temp DB
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    db_url = f"sqlite:///{db_path}"

    # Seed DB with minimal data for API to function
    session = SessionLocal(db_url)
    try:
        commits = list(subprocess.check_output(["git", "rev-list", "--reverse", "HEAD"], cwd=tmp_path).decode().strip().split("\n"))
        # Create commit rows; only minimal for test
        for sha in commits:
            session.add(Commit(id=sha, timestamp=1.0, author="t", message="m"))
        session.commit()

        # Create file and snapshot for last commit
        file = File(path="a.txt")
        session.add(file)
        session.commit()
        session.add(Snapshot(commit_id=commits[-1], file_id=file.id, churn=1, hotspot_score=0.1))
        session.commit()
    finally:
        session.close()

    # Configure app to use this DB by monkeypatching env
    os.environ["DATABASE_URL"] = db_url
    # Configure diff repo path
    os.environ["REPO_PATH"] = str(tmp_path)

    yield {"repo": tmp_path, "db_url": db_url, "commits": commits}

    # Cleanup
    try:
        os.unlink(db_path)
    except OSError:
        pass


def test_timeline_and_snapshot_and_diff(temp_repo_and_db):
    client = TestClient(app)

    # timeline
    r = client.get("/timeline", params={"page": 1, "page_size": 10})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 2

    # snapshot for last commit
    last_commit = temp_repo_and_db["commits"][-1]
    r2 = client.get(f"/snapshot/{last_commit}")
    assert r2.status_code == 200
    files = r2.json()
    assert any(f["path"] == "a.txt" for f in files)

    # diff endpoint
    r3 = client.get(f"/diff/{last_commit}/a.txt")
    assert r3.status_code == 200
    diff = r3.json()
    assert "hello" in diff["after"]

