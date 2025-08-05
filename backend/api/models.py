from pydantic import BaseModel
from typing import List


class CommitOut(BaseModel):
    id: str
    timestamp: float
    message: str


class SnapshotOut(BaseModel):
    path: str
    churn: int
    hotspot_score: float


class DiffOut(BaseModel):
    before: str
    after: str
