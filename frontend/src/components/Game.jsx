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
    const [killFeed, setKillFeed] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
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

        socket.on('killFeed', (data) => {
            const entry = {
                shooter: data?.shooter,
                victim: data?.victim,
                ts: Date.now()
            };
            setKillFeed((prev) => [entry, ...prev].slice(0, 6));
        });

        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('http://localhost:8000/players');
                if (!res.ok) return;
                const players = await res.json();
                const sorted = [...players].sort((a, b) => {
                    if ((b.kills ?? 0) !== (a.kills ?? 0)) return (b.kills ?? 0) - (a.kills ?? 0);
                    return (b.score ?? 0) - (a.score ?? 0);
                });
                setLeaderboard(sorted.slice(0, 10));
            } catch (e) {
                // ignore
            }
        };

        fetchLeaderboard();
        const leaderboardInterval = setInterval(fetchLeaderboard, 5000);

        const onKeyDown = (e) => {
            if (e.code === 'KeyL') {
                setShowLeaderboard((v) => !v);
            }
        };
        window.addEventListener('keydown', onKeyDown);

        socket.on('gameState', (state) => {
            gameManager.syncGameState(state);
        });

        gameManager.start();

        return () => {
            clearInterval(leaderboardInterval);
            window.removeEventListener('keydown', onKeyDown);
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
            <HUD
                {...gameState}
                connected={connected}
                killFeed={killFeed}
                leaderboard={leaderboard}
                showLeaderboard={showLeaderboard}
            />
            <UI gameOver={gameOver} score={gameState.score} onRestart={restartGame} />
        </>
    );
}