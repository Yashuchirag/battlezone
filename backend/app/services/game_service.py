from typing import Dict, Any
from app.database.db import SessionLocal
from app.models.player import Player
import time
import asyncio


class GameService:
    def __init__(self):
        self.active_players: Dict[str, Dict[str, Any]] = {}
        self.game_state = {
            "enemies": [],
            "powerups": []
        }

    # ---------------- PLAYER LIFECYCLE ----------------

    async def player_connected(self, sid: str, name: str):
        self.active_players[sid] = {
            "id": sid,
            "name": name,
            "position": [0, 1.6, 0],
            "rotation": 0,
            "health": 100,
            "score": 0,
            "connected_at": time.time()
        }

        # DB write (safe for now)
        await asyncio.to_thread(self._ensure_player_exists, name)

    def _ensure_player_exists(self, name: str):
        db = SessionLocal()
        try:
            player = db.query(Player).filter(Player.name == name).first()
            if not player:
                db.add(Player(name=name))
                db.commit()
        finally:
            db.close()

    async def player_disconnected(self, sid: str):
        if sid not in self.active_players:
            return

        player_data = self.active_players[sid]
        await asyncio.to_thread(self._persist_disconnect, player_data)
        del self.active_players[sid]

    def _persist_disconnect(self, player_data: Dict[str, Any]):
        db = SessionLocal()
        try:
            player = db.query(Player).filter(
                Player.name == player_data["name"]
            ).first()

            if player:
                session_time = time.time() - player_data["connected_at"]
                player.play_time += session_time
                player.score += player_data["score"]
                db.commit()
        finally:
            db.close()

    # ---------------- GAMEPLAY ----------------

    async def update_player_position(self, sid: str, data: Dict[str, Any]):
        if sid in self.active_players:
            self.active_players[sid]["position"] = data["position"]
            self.active_players[sid]["rotation"] = data["rotation"]


    def _update_player_stats(self, name: str, **kwargs):
        db = SessionLocal()
        try:
            player = db.query(Player).filter(Player.name == name).first()
            if not player:
                return

            for field, value in kwargs.items():
                setattr(player, field, getattr(player, field) + value)

            db.commit()
        finally:
            db.close()

    async def process_hit(self, shooter_sid: str, target_sid: str):
        if target_sid not in self.active_players:
            return False

        target = self.active_players[target_sid]
        target["health"] -= 10

        if target["health"] > 0:
            return False

        # Kill confirmed
        target["health"] = 100
        self.active_players[shooter_sid]["score"] += 100

        shooter_name = self.active_players[shooter_sid]["name"]
        victim_name = self.active_players[target_sid]["name"]

        await asyncio.to_thread(
            self._update_player_stats,
            shooter_name,
            kills=1,
            score=100
        )

        await asyncio.to_thread(
            self._update_player_stats,
            victim_name,
            deaths=1
        )

        return True



    def _persist_kill(self, shooter_sid: str, target_sid: str):
        db = SessionLocal()
        try:
            shooter = db.query(Player).filter(
                Player.name == self.active_players[shooter_sid]["name"]
            ).first()
            victim = db.query(Player).filter(
                Player.name == self.active_players[target_sid]["name"]
            ).first()

            if shooter:
                shooter.kills += 1
            if victim:
                victim.deaths += 1

            db.commit()
        finally:
            db.close()

    # ---------------- GAME LOOP ----------------

    def update(self, delta: float):
        """Enemy AI, cooldowns, physics (future)"""
        pass

    def get_state(self):
        return {
            "players": self.active_players,
            "enemies": self.game_state["enemies"],
            "powerups": self.game_state["powerups"]
        }


# ✅ SINGLETON INSTANCE (THIS IS CRITICAL)
game_service = GameService()
