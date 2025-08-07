from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    create_engine,
    JSON,
    Index,
    UniqueConstraint,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import os

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

    commit = relationship("Commit", back_populates="snapshots")
    file = relationship("File", back_populates="snapshots")

    __table_args__ = (
        UniqueConstraint("commit_id", "file_id", name="uq_snapshot_commit_file"),
        Index("ix_snapshot_commit", "commit_id"),
        Index("ix_snapshot_file", "file_id"),
    )


def get_engine(db_url: str | None = None):
    if not db_url:
        db_url = os.getenv("DATABASE_URL", "sqlite:///timewarp.db")
    return create_engine(db_url)


def SessionLocal(db_url: str | None = None):
    engine = get_engine(db_url)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()
