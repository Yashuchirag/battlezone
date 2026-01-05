from sqlalchemy.orm import Session
from app.models.player import Player

def get_player_by_id(db: Session, player_id: int):
    return db.query(Player).filter(Player.id == player_id).first()

def get_player_by_name(db: Session, name: str):
    return db.query(Player).filter(Player.name == name).first()

def create_player(db: Session, name: str):
    player = Player(name=name)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player

def update_stats(db: Session, player_id: int, kills=0, deaths=0, score=0):
    player = get_player_by_id(db, player_id)
    if not player:
        return None

    player.kills += kills
    player.deaths += deaths
    player.score += score

    db.commit()
    return player
