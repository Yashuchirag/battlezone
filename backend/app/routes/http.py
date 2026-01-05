from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.player import Player

router = APIRouter(prefix="/players", tags=["players"])

@router.get("/")
def list_players(db: Session = Depends(get_db)):
    players = db.query(Player).all()
    return [p.to_dict() for p in players]
