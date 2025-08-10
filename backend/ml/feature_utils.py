import re
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import Snapshot, Commit


def bugfix_commit(message: str) -> bool:
    """Heuristic to detect bug-fix commits from the message."""
    bugfix_pattern = r"\b(fix|bug|error|patch)\b"
    return bool(re.search(bugfix_pattern, message.lower()))


def compute_features(
    session: Session, file_id: int, commit_ts: float, churn: int, path: str
) -> list[float]:
    """Compute features for hotspot prediction.

    Features:
    - churn
    - path depth
    - is test file flag
    - time since last edit for this file (seconds)
    """
    path_depth = path.count("/") + 1
    is_test_file = 1 if "test" in path.lower() else 0

    # Find the most recent previous snapshot for this file prior to current commit_ts
    previous = (
        session.query(Snapshot, Commit)
        .join(Commit, Snapshot.commit_id == Commit.id)
        .filter(Snapshot.file_id == file_id)
        .filter(Commit.timestamp < commit_ts)
        .order_by(desc(Commit.timestamp))
        .first()
    )

    if previous:
        _, prev_commit = previous
        time_since_last_edit = commit_ts - float(prev_commit.timestamp)
    else:
        time_since_last_edit = 0.0

    return [float(churn), float(path_depth), float(is_test_file), float(time_since_last_edit)]