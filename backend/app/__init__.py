from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

app = FastAPI(title="FPS Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = "redis://localhost:6379/0"

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:3000"],
    client_manager=socketio.AsyncRedisManager(REDIS_URL)
)

socket_app = socketio.ASGIApp(sio, app)