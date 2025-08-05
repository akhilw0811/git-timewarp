import re
from sqlalchemy.orm import Session
from models import Snapshot


def bugfix_commit(message: str) -> bool:
    """Check if commit message indicates a bug fix."""
    # heuristic keywords fix|bug|error|patch (case-insensitive)
    bugfix_pattern = r'\b(fix|bug|error|patch)\b'
    return bool(re.search(bugfix_pattern, message.lower()))


def compute_features(session: Session, file_id: int, commit_ts: float, churn: int, path: str) -> list[float]:
    """Compute features for hotspot prediction."""
    # path_depth = path.count("/") + 1
    path_depth = path.count("/") + 1
    
    # is_test_file = 1 if "test" in path.lower() else 0
    is_test_file = 1 if "test" in path.lower() else 0
    
    # time_since_last_edit = seconds since previous snapshot for same file_id else 0
    previous_snapshot = (
        session.query(Snapshot)
        .filter(Snapshot.file_id == file_id)
        .filter(Snapshot.commit_id != commit_ts)  # Exclude current commit
        .order_by(Snapshot.commit_id.desc())
        .first()
    )
    
    if previous_snapshot:
        # Get the commit timestamp for the previous snapshot
        from models import Commit
        prev_commit = session.query(Commit).filter(Commit.id == previous_snapshot.commit_id).first()
        if prev_commit:
            time_since_last_edit = commit_ts - prev_commit.timestamp
        else:
            time_since_last_edit = 0.0
    else:
        time_since_last_edit = 0.0
    
    return [churn, path_depth, is_test_file, time_since_last_edit] 