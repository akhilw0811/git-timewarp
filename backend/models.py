from sqlalchemy import Column, Integer, String, Float, ForeignKey, create_engine, JSON
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import os
from typing import Dict, Optional

Base = declarative_base()


class Commit(Base):
    __tablename__ = "commits"

    id = Column(String, primary_key=True)
    timestamp = Column(Float, nullable=False)
    author = Column(String, nullable=False)
    message = Column(String, nullable=False)

    snapshots = relationship("Snapshot", back_populates="commit")


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True)
    path = Column(String, unique=True, nullable=False)

    snapshots = relationship("Snapshot", back_populates="file")


class Snapshot(Base):
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True)
    commit_id = Column(String, ForeignKey("commits.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    churn = Column(Integer, default=0)
    hotspot_score = Column(Float, default=0.0)
    label = Column(Integer, nullable=True)
    # Optional cached feature vector used for training
    tmp_features = Column(JSON, nullable=True)

    commit = relationship("Commit", back_populates="snapshots")
    file = relationship("File", back_populates="snapshots")


_session_factory_cache: Dict[str, sessionmaker] = {}


def _get_or_create_session_factory(db_url: str) -> sessionmaker:
    global _session_factory_cache
    if db_url not in _session_factory_cache:
        engine = create_engine(db_url)
        # Ensure tables exist once per engine
        Base.metadata.create_all(engine)
        _session_factory_cache[db_url] = sessionmaker(bind=engine)
    return _session_factory_cache[db_url]


def get_engine(db_url: Optional[str] = None):
    if not db_url:
        db_url = os.getenv("DATABASE_URL", "sqlite:///timewarp.db")
    return create_engine(db_url)


def SessionLocal(db_url: Optional[str] = None):
    if not db_url:
        db_url = os.getenv("DATABASE_URL", "sqlite:///timewarp.db")
    factory = _get_or_create_session_factory(db_url)
    return factory()
