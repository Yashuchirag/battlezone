from typing import Dict, Any
import time

# NO database imports here (important)

MAX_HEALTH = 100
RESPAWN_HEALTH = 100
MAX_SPEED = 8.0  # units/sec


class GameService:
    def __init__(self):
        self.active_players: Dict[str, Dict[str, Any]] = {}

    # -------------------------------
    # Player lifecycle
    # -------------------------------
    def player_connected(self, sid: str, name: str):
        self.active_players[sid] = {
            "sid": sid,
            "name": name,
            "position": {"x": 0.0, "y": 1.6, "z": 0.0},
            "velocity": {"x": 0.0, "y": 0.0, "z": 0.0},
            "rotation": 0.0,
            "health": MAX_HEALTH,
            "score": 0,
            "connected_at": time.time(),
        }

    def player_disconnected(self, sid: str):
        self.active_players.pop(sid, None)

    # -------------------------------
    # Input processing (SAFE)
    # -------------------------------
    def apply_input(self, sid: str, input_data: Dict[str, Any]):
        """
        input_data example:
        {
            "moveX": -1,
            "moveZ": 1,
            "rotation": 90
        }
        """
        player = self.active_players.get(sid)
        if not player:
            return

        move_x = float(input_data.get("moveX", 0))
        move_z = float(input_data.get("moveZ", 0))

        # Clamp input to prevent speed hacks
        move_x = max(-1, min(1, move_x))
        move_z = max(-1, min(1, move_z))

        player["velocity"]["x"] = move_x * MAX_SPEED
        player["velocity"]["z"] = move_z * MAX_SPEED
        player["rotation"] = float(input_data.get("rotation", player["rotation"]))

    # -------------------------------
    # Server tick update
    # -------------------------------
    def update(self, delta_time: float):
        for player in self.active_players.values():
            player["position"]["x"] += player["velocity"]["x"] * delta_time
            player["position"]["z"] += player["velocity"]["z"] * delta_time

    # -------------------------------
    # Hit processing (SERVER AUTH)
    # -------------------------------
    def process_hit(self, shooter_sid: str, target_sid: str) -> bool:
        shooter = self.active_players.get(shooter_sid)
        target = self.active_players.get(target_sid)

        if not shooter or not target:
            return False

        # Server decides damage
        DAMAGE = 25
        target["health"] -= DAMAGE

        if target["health"] <= 0:
            shooter["score"] += 100
            target["health"] = RESPAWN_HEALTH
            return True

        return False

    # -------------------------------
    # State snapshot
    # -------------------------------
    def get_state(self):
        return {
            sid: {
                "position": p["position"],
                "rotation": p["rotation"],
                "health": p["health"],
                "score": p["score"],
            }
            for sid, p in self.active_players.items()
        }