from app import sio
from app.services.game_service import game_service
import logging

logger = logging.getLogger(__name__)

@sio.event
async def connect(sid, environ):
    query = environ.get("QUERY_STRING", "")
    params = dict(param.split("=") for param in query.split("&") if "=" in param)
    player_name = params.get("playerName", f"Player_{sid[:6]}")

    logger.info(f"Player {player_name} connected: {sid}")
    game_service.player_connected(sid, player_name)

    await sio.emit(
        "playerJoined",
        {"id": sid, "name": player_name, "position": game_service.active_players[sid]["position"]},
        skip_sid=sid,
    )

@sio.event
async def disconnect(sid):
    logger.info(f"Player disconnected: {sid}")
    game_service.player_disconnected(sid)
    await sio.emit("playerLeft", {"id": sid})

@sio.event
async def playerInput(sid, input_data):
    game_service.apply_input(sid, input_data)

@sio.event
async def playerShot(sid):
    # Naive hit detection for demo; replace with proper raycast
    for target_sid in game_service.active_players:
        if target_sid == sid:
            continue
        killed = game_service.process_hit(sid, target_sid)
        if killed:
            await sio.emit("playerHit", {"killed": True, "shooter": sid, "target": target_sid})
