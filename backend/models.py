from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Repository(Base):
    __tablename__ = 'repositories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    commits = relationship("Commit", back_populates="repository")

class Commit(Base):
    __tablename__ = 'commits'
    
    id = Column(Integer, primary_key=True)
    hash = Column(String(40), nullable=False, unique=True)
    author = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    repository_id = Column(Integer, ForeignKey('repositories.id'))
    
    repository = relationship("Repository", back_populates="commits")
    file_changes = relationship("FileChange", back_populates="commit")

class FileChange(Base):
    __tablename__ = 'file_changes'
    
    id = Column(Integer, primary_key=True)
    file_path = Column(String(500), nullable=False)
    lines_added = Column(Integer, default=0)
    lines_deleted = Column(Integer, default=0)
    churn_score = Column(Float, default=0.0)
    hotspot_score = Column(Float, default=0.0)
    commit_id = Column(Integer, ForeignKey('commits.id'))
    
    commit = relationship("Commit", back_populates="file_changes") 