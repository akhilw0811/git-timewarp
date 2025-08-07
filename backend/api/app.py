from fastapi import FastAPI, HTTPException
import re
from fastapi.middleware.cors import CORSMiddleware
from git import Repo
from typing import List
import os

from models import SessionLocal, Commit, File, Snapshot
from .models import CommitOut, SnapshotOut, DiffOut

app = FastAPI(title="TimeWarp Git API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/timeline", response_model=List[CommitOut])
async def get_timeline():
    """Get timeline of commits ordered by timestamp."""
    session = SessionLocal()
    try:
        commits = (
            session.query(Commit)
            .order_by(Commit.timestamp)
            .limit(2000)  # safety cap; add pagination later
            .all()
        )
        return [
            CommitOut(
                id=commit.id, timestamp=commit.timestamp, message=commit.message.strip()
            )
            for commit in commits
        ]
    finally:
        session.close()


@app.get("/snapshot/{commit_id}", response_model=List[SnapshotOut])
async def get_snapshot(commit_id: str):
    """Get file snapshots for a specific commit."""
    session = SessionLocal()
    try:
        snapshots = (
            session.query(Snapshot, File)
            .join(File, Snapshot.file_id == File.id)
            .filter(Snapshot.commit_id == commit_id)
            .all()
        )

        if not snapshots:
            raise HTTPException(status_code=404, detail="Commit not found")

        return [
            SnapshotOut(
                path=file.path,
                churn=snapshot.churn,
                hotspot_score=snapshot.hotspot_score,
            )
            for snapshot, file in snapshots
        ]
    finally:
        session.close()


@app.get("/diff/{commit_id}/{path:path}", response_model=DiffOut)
async def get_diff(commit_id: str, path: str):
    """Get diff for a specific file at a commit."""
    session = SessionLocal()
    try:
        # Basic input validation
        if not re.fullmatch(r"[0-9a-fA-F]{6,64}", commit_id):
            raise HTTPException(status_code=400, detail="Invalid commit id")
        if ".." in path or path.startswith("/") or path.startswith("\\"):
            raise HTTPException(status_code=400, detail="Invalid path")

        # Get the commit
        commit = session.query(Commit).filter(Commit.id == commit_id).first()
        if not commit:
            raise HTTPException(status_code=404, detail="Commit not found")

        # Get the file
        file = session.query(File).filter(File.path == path).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Get parent commit for diff - prefer REPO_PATH env, fallback to project root
        repo_path = os.getenv(
            "REPO_PATH",
            os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."),
        )
        repo = Repo(repo_path)
        # commit_id may not exist in shallow clones; if missing, walk back until found
        try:
            current_commit = repo.commit(commit_id)
        except Exception:
            # Fallback: use HEAD if the specific commit is missing (e.g., due to shallow history)
            current_commit = repo.head.commit

        if len(current_commit.parents) == 0:
            # Root commit - no parent to diff against
            return DiffOut(
                before="",
                after=current_commit.tree[path]
                .data_stream.read()
                .decode("utf-8", errors="ignore"),
            )

        parent_commit = current_commit.parents[0]

        # Get file content from current and parent commits
        try:
            current_content = (
                current_commit.tree[path]
                .data_stream.read()
                .decode("utf-8", errors="ignore")
            )
        except Exception:
            current_content = ""

        try:
            parent_content = (
                parent_commit.tree[path]
                .data_stream.read()
                .decode("utf-8", errors="ignore")
            )
        except Exception:
            parent_content = ""

        return DiffOut(before=parent_content, after=current_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting diff: {str(e)}")
    finally:
        session.close()
