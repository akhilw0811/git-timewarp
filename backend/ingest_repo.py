import git
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Repository, Commit, FileChange
from ml.fake_hotspot import calculate_hotspot_score

class RepoIngester:
    def __init__(self, db_url="sqlite:///timewarp.db"):
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def ingest_repository(self, repo_path):
        repo = git.Repo(repo_path)
        repo_name = os.path.basename(repo_path)
        
        db_repo = Repository(name=repo_name, path=repo_path)
        self.session.add(db_repo)
        self.session.commit()
        
        for commit in repo.iter_commits():
            db_commit = Commit(
                hash=commit.hexsha,
                author=commit.author.name,
                message=commit.message,
                timestamp=datetime.fromtimestamp(commit.committed_date),
                repository_id=db_repo.id
            )
            self.session.add(db_commit)
            self.session.commit()
            
            for file_path, stats in commit.stats.files.items():
                churn_score = stats['insertions'] + stats['deletions']
                hotspot_score = calculate_hotspot_score(file_path, churn_score)
                
                file_change = FileChange(
                    file_path=file_path,
                    lines_added=stats['insertions'],
                    lines_deleted=stats['deletions'],
                    churn_score=churn_score,
                    hotspot_score=hotspot_score,
                    commit_id=db_commit.id
                )
                self.session.add(file_change)
            
            self.session.commit()
    
    def close(self):
        self.session.close()

if __name__ == "__main__":
    ingester = RepoIngester()
    ingester.ingest_repository("./sample-repo")
    ingester.close() 