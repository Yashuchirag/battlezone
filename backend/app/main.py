import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import socketio

from app import sio, app as fastapi_app
from app.database.db import engine, Base
import app.routes.websockets
from app.routes.http import router as player_router
from app.game.game_loop import game_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)

    async def broadcast(state):
        await sio.emit("gameState", state)

    game_task = asyncio.create_task(game_loop(broadcast))

    yield

    # Shutdown
    game_task.cancel()
    try:
        await game_task
    except asyncio.CancelledError:
        pass


# Attach lifespan
fastapi_app.router.lifespan_context = lifespan

# Register routes
fastapi_app.include_router(player_router)


@fastapi_app.get("/")
async def root():
    return {"message": "FPS Game Server Running"}


@fastapi_app.get("/health")
async def health():
    return {"status": "healthy"}


# ✅ THIS IS WHAT UVICORN NEEDS
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app
)