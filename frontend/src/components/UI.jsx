import React from 'react';

export default function UI({ gameOver, score, onRestart }) {
    if (!gameOver) return null;

    return (
        <div className="overlay">
            <div className="game-over">
                <h1>Game Over</h1>
                <p>Final Score: {score}</p>
                <button onClick={onRestart}>Play Again</button>
            </div>
        </div>
    );
}