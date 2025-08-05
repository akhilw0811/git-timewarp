from sqlalchemy import Column, Integer, String, Float, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

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

    commit = relationship("Commit", back_populates="snapshots")
    file = relationship("File", back_populates="snapshots")


def get_engine(db_url="sqlite:///timewarp.db"):
    return create_engine(db_url)


def SessionLocal(db_url="sqlite:///timewarp.db"):
    engine = get_engine(db_url)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()
