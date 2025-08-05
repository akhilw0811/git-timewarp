import pytest
import tempfile
import os
from unittest.mock import Mock, patch
from ingest_repo import RepoIngester
from models import Repository, Commit, FileChange

@pytest.fixture
def temp_db():
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    yield f"sqlite:///{db_path}"
    os.unlink(db_path)

@pytest.fixture
def ingester(temp_db):
    return RepoIngester(temp_db)

def test_repo_ingester_initialization(ingester):
    assert ingester.session is not None

@patch('ingest_repo.git.Repo')
def test_ingest_repository(mock_repo, ingester):
    mock_repo_instance = Mock()
    mock_commit = Mock()
    mock_commit.hexsha = "abc123"
    mock_commit.author.name = "Test Author"
    mock_commit.message = "Test commit"
    mock_commit.committed_date = 1640995200
    mock_commit.stats.files = {
        "test.py": {"insertions": 10, "deletions": 5}
    }
    
    mock_repo.return_value = mock_repo_instance
    mock_repo_instance.iter_commits.return_value = [mock_commit]
    
    ingester.ingest_repository("./test-repo")
    
    repos = ingester.session.query(Repository).all()
    assert len(repos) == 1
    assert repos[0].name == "test-repo"
    
    commits = ingester.session.query(Commit).all()
    assert len(commits) == 1
    assert commits[0].hash == "abc123"
    
    changes = ingester.session.query(FileChange).all()
    assert len(changes) == 1
    assert changes[0].file_path == "test.py"
    assert changes[0].lines_added == 10
    assert changes[0].lines_deleted == 5 