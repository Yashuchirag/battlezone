from app import app, socket_app
from app.database.db import engine, Base
import app.routes.websocket  # IMPORTANT: side-effect import
import uvicorn

# Create database tables
Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "FPS Game Server Running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )