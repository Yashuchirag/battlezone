from app import app, socket_app, sio
from app.database.db import engine, Base
import app.routes.websocket  # register socket events
from app.routes.http import router as player_router
from app.game.game_loop import game_loop
import asyncio

app.include_router(player_router)

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

    # Start server-authoritative game loop
    async def broadcast(state):
        await sio.emit("gameState", state)

    # Schedule the game loop
    asyncio.create_task(game_loop(broadcast))


@app.get("/")
async def root():
    return {"message": "FPS Game Server Running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}