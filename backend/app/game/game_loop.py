import asyncio
import time
from app.services.game_service import game_service

TICK_RATE = 30
TICK_INTERVAL = 1 / TICK_RATE


async def game_loop(broadcast_fn):
    while True:
        start = time.time()

        game_service.update(TICK_INTERVAL)
        state = game_service.get_state()
        await broadcast_fn(state)

        elapsed = time.time() - start
        await asyncio.sleep(max(0, TICK_INTERVAL - elapsed))
