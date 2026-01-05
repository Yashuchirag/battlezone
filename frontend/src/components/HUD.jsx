import React from 'react';

export default function HUD({ score, ammo, health, kills, connected }) {
    return (
        <div className="hud">
            <div className="hud-top">
                <div>Score: {score}</div>
                <div>Kills: {kills}</div>
                <div className="connection-status">
                    <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
                    {connected ? 'Online' : 'Offline'}
                </div>
            </div>
            <div className="hud-bottom">
                <div className="ammo">Ammo: {ammo}/30</div>
                <div className="health">
                <div className="health-bar">
                    <div 
                        className="health-fill" 
                        style={{ width: `${health}%` }}
                    ></div>
                </div>
                    <span>{health}</span>
                </div>
            </div>
        </div>
    );
}