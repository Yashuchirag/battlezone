import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import GameManager from '../game/GameManager';
import { socket, connectSocket } from '../utils/socket';
import HUD from './HUD';
import UI from './UI';

export default function Game({ playerName }) {
    const containerRef = useRef(null);
    const gameManagerRef = useRef(null);
    const [gameState, setGameState] = useState({
        score: 0,
        ammo: 30,
        health: 100,
        kills: 0
    });
    const [gameOver, setGameOver] = useState(false);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize game
        const gameManager = new GameManager(
            containerRef.current,
            playerName,
            (state) => {
                setGameState(state);
                if (state.health <= 0) setGameOver(true);
            }
        );
        gameManagerRef.current = gameManager;

        // Connect to server
        connectSocket(playerName);

        socket.on('connect', () => {
            console.log('Connected to server');
            setConnected(true);
        });

        socket.on('playerJoined', (data) => {
            console.log('Player joined:', data);
            gameManager.addRemotePlayer(data);
        });

        socket.on('playerMoved', (data) => {
            gameManager.updateRemotePlayer(data);
        });

        socket.on('playerShot', (data) => {
            gameManager.handleRemoteShot(data);
        });

        socket.on('playerLeft', (data) => {
            gameManager.removeRemotePlayer(data.id);
        });

        socket.on('gameState', (state) => {
            gameManager.syncGameState(state);
        });

        gameManager.start();

        return () => {
            gameManager.destroy();
            socket.disconnect();
        };
    }, [playerName]);

    const restartGame = () => {
        window.location.reload();
    };

    return (
        <>
            <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
            <HUD {...gameState} connected={connected} />
            <UI gameOver={gameOver} score={gameState.score} onRestart={restartGame} />
        </>
    );
}