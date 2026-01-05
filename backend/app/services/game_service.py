from typing import Dict, Any
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.models.player import Player
import time

class GameService:
    def __init__(self):
        self.active_players: Dict[str, Dict[str, Any]] = {}
        self.game_state = {
            'enemies': [],
            'powerups': []
        }

    async def player_connected(self, sid: str, name: str):
        self.active_players[sid] = {
            'id': sid,
            'name': name,
            'position': [0, 1.6, 0],
            'rotation': 0,
            'health': 100,
            'score': 0,
            'connected_at': time.time()
        }

        db = SessionLocal()
        try:
            player = db.query(Player).filter(Player.name == name).first()
            if not player:
                player = Player(name=name)
                db.add(player)
                db.commit()
        finally:
            db.close()

    async def player_disconnected(self, sid: str):
        if sid in self.active_players:
            player_data = self.active_players[sid]
            
            db = SessionLocal()
            try:
                player = db.query(Player).filter(
                    Player.name == player_data['name']
                ).first()
                
                if player:
                    session_time = time.time() - player_data['connected_at']
                    player.play_time += session_time
                    player.score += player_data['score']
                    db.commit()
            finally:
                db.close()

            del self.active_players[sid]

    async def update_player_position(self, sid: str, data: Dict[str, Any]):
        if sid in self.active_players:
            self.active_players[sid]['position'] = data.get('position')
            self.active_players[sid]['rotation'] = data.get('rotation')

    async def process_hit(self, shooter_sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        target_sid = data.get('targetId')
        
        if target_sid in self.active_players:
            self.active_players[target_sid]['health'] -= data.get('damage', 10)
            
            if self.active_players[target_sid]['health'] <= 0:
                self.active_players[shooter_sid]['score'] += 100
                self.active_players[target_sid]['health'] = 100
                
                db = SessionLocal()
                try:
                    shooter = db.query(Player).filter(
                        Player.name == self.active_players[shooter_sid]['name']
                    ).first()
                    target = db.query(Player).filter(
                        Player.name == self.active_players[target_sid]['name']
                    ).first()
                    
                    if shooter:
                        shooter.kills += 1
                    if target:
                        target.deaths += 1
                    
                    db.commit()
                finally:
                    db.close()

                return {
                    'killed': True,
                    'shooter': shooter_sid,
                    'target': target_sid
                }
        
        return {'killed': False}

    def get_game_state(self) -> Dict[str, Any]:
        return {
            'players': self.active_players,
            'enemies': self.game_state['enemies'],
            'powerups': self.game_state['powerups']
        }