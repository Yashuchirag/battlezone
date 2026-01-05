from app import sio
from app.services.game_service import GameService
import logging

logger = logging.getLogger(__name__)
game_service = GameService()

@sio.event
async def connect(sid, environ):
    query = environ.get('QUERY_STRING', '')
    params = dict(param.split('=') for param in query.split('&') if '=' in param)
    player_name = params.get('playerName', f'Player_{sid[:6]}')
    
    logger.info(f"Player {player_name} connected: {sid}")
    await game_service.player_connected(sid, player_name)
    
    await sio.emit('playerJoined', {
        'id': sid,
        'name': player_name,
        'position': [0, 1.6, 0]
    }, skip_sid=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Player disconnected: {sid}")
    await game_service.player_disconnected(sid)
    await sio.emit('playerLeft', {'id': sid})

@sio.event
async def playerMoved(sid, data):
    await game_service.update_player_position(sid, data)
    await sio.emit('playerMoved', {
        'id': sid,
        **data
    }, skip_sid=sid)

@sio.event
async def playerShot(sid, data):
    await sio.emit('playerShot', {
        'id': sid,
        **data
    }, skip_sid=sid)

@sio.event
async def playerHit(sid, data):
    result = await game_service.process_hit(sid, data)
    await sio.emit('playerHit', result)