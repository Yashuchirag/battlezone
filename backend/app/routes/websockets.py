from app import sio
from app.services.game_service import game_service
import logging
import asyncio

logger = logging.getLogger(__name__)


@sio.event
async def connect(sid, environ):
    query = environ.get("QUERY_STRING", "")
    params = dict(param.split("=") for param in query.split("&") if "=" in param)
    player_name = params.get("playerName", f"Player_{sid[:6]}")

    logger.info(f"Player {player_name} connected: {sid}")

    await game_service.player_connected(sid, player_name)

    await sio.emit(
        "playerJoined",
        {
            "id": sid,
            "name": player_name,
            "position": game_service.active_players[sid]["position"]
        },
        skip_sid=sid,
    )


@sio.event
async def disconnect(sid):
    logger.info(f"Player disconnected: {sid}")
    await game_service.player_disconnected(sid)
    await sio.emit("playerLeft", {"id": sid})


@sio.event
async def playerInput(sid, input_data):
    await game_service.update_player_position(sid, input_data)


@sio.event
async def playerMoved(sid, data):
    await game_service.update_player_position(sid, data)
    await sio.emit(
        "playerMoved",
        {
            "id": sid,
            "position": data.get("position"),
            "rotation": data.get("rotation")
        },
        skip_sid=sid,
    )


@sio.event
async def statsUpdate(sid, data):
    if sid not in game_service.active_players:
        return

    name = game_service.active_players[sid]["name"]

    kills = max(0, int(data.get("kills", 0) or 0))
    deaths = max(0, int(data.get("deaths", 0) or 0))
    score = max(0, int(data.get("score", 0) or 0))

    await asyncio.to_thread(
        game_service._update_player_stats,
        name,
        kills=kills,
        deaths=deaths,
        score=score,
    )


@sio.event
async def playerShot(sid, data=None):
    await sio.emit(
        "playerShot",
        {
            "id": sid,
            "position": (data or {}).get("position"),
            "direction": (data or {}).get("direction"),
        },
        skip_sid=sid,
    )

    for target_sid in list(game_service.active_players.keys()):
        if target_sid == sid:
            continue

        killed = await game_service.process_hit(sid, target_sid)
        if killed:
            shooter_name = game_service.active_players.get(sid, {}).get("name")
            victim_name = game_service.active_players.get(target_sid, {}).get("name")

            if shooter_name and victim_name:
                await sio.emit(
                    "killFeed",
                    {"shooter": shooter_name, "victim": victim_name}
                )

            await sio.emit(
                "playerHit",
                {"killed": True, "shooter": sid, "target": target_sid}
            )
