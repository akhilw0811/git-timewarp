from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import List, Dict, Any
import json

from models import Base, Repository, Commit, FileChange

app = FastAPI(title="TimeWarp Git API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine("sqlite:///timewarp.db")
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)

@app.get("/api/repositories")
async def get_repositories():
    db = SessionLocal()
    repos = db.query(Repository).all()
    db.close()
    return [{"id": repo.id, "name": repo.name, "path": repo.path} for repo in repos]

@app.get("/api/commits/{repo_id}")
async def get_commits(repo_id: int):
    db = SessionLocal()
    commits = db.query(Commit).filter(Commit.repository_id == repo_id).all()
    db.close()
    return [{"hash": c.hash, "author": c.author, "message": c.message, "timestamp": c.timestamp.isoformat()} for c in commits]

@app.get("/api/changes/{commit_hash}")
async def get_file_changes(commit_hash: str):
    db = SessionLocal()
    commit = db.query(Commit).filter(Commit.hash == commit_hash).first()
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")
    
    changes = db.query(FileChange).filter(FileChange.commit_id == commit.id).all()
    db.close()
    
    return [{
        "file_path": c.file_path,
        "lines_added": c.lines_added,
        "lines_deleted": c.lines_deleted,
        "churn_score": c.churn_score,
        "hotspot_score": c.hotspot_score
    } for c in changes]

@app.get("/api/snapshots/{repo_id}")
async def get_snapshots(repo_id: int):
    db = SessionLocal()
    commits = db.query(Commit).filter(Commit.repository_id == repo_id).order_by(Commit.timestamp).all()
    
    snapshots = []
    for commit in commits:
        changes = db.query(FileChange).filter(FileChange.commit_id == commit.id).all()
        snapshot = {
            "timestamp": commit.timestamp.isoformat(),
            "hash": commit.hash,
            "files": [{
                "path": c.file_path,
                "churn": c.churn_score,
                "hotspot": c.hotspot_score
            } for c in changes]
        }
        snapshots.append(snapshot)
    
    db.close()
    return snapshots 