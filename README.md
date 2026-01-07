# Battlezone

## Backend
venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload

## Frontend
npm install
npm run dev