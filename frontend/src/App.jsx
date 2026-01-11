import React, { useState } from 'react';
import Game from './components/Game';

export default function App() {
    const [gameStarted, setGameStarted] = useState(false);
    const [playerName, setPlayerName] = useState('');

    const startGame = () => {
        if (playerName.trim()) {
        setGameStarted(true);
        }
    };

    if (!gameStarted) {
        return (
            <div className="menu">
                <h1>3D FPS Game</h1>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            startGame()
                        }
                    }}
                />
                <button onClick={startGame}>Start Game</button>
            </div>
        );
    }

    return <Game playerName={playerName} />;
}