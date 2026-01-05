from sqlalchemy import Column, Integer, String, Float, DateTime, CheckConstraint
from sqlalchemy.sql import func
from app.database.db import Base

class Player(Base):
    __tablename__ = "players"

    __table_args__ = (
        CheckConstraint("kills >= 0"),
        CheckConstraint("deaths >= 0"),
        CheckConstraint("score >= 0"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    score = Column(Integer, default=0)
    play_time = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "kills": self.kills,
            "deaths": self.deaths,
            "score": self.score,
            "play_time": self.play_time
        }
