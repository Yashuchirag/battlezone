import React from 'react';

export default function HUD({ score, ammo, health, kills, connected, killFeed, leaderboard, showLeaderboard }) {
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

            <div className="kill-feed">
                {(killFeed || []).map((e, idx) => (
                    <div key={`${e.ts}-${idx}`} className="kill-feed-item">
                        {e.shooter} eliminated {e.victim}
                    </div>
                ))}
            </div>

            {showLeaderboard && (
                <div className="leaderboard">
                    <div className="leaderboard-title">Leaderboard (L)</div>
                    <div className="leaderboard-table">
                        <div className="leaderboard-row leaderboard-header">
                            <div>#</div>
                            <div>Player</div>
                            <div>K</div>
                            <div>D</div>
                            <div>Score</div>
                        </div>
                        {(leaderboard || []).map((p, i) => (
                            <div key={p.id ?? `${p.name}-${i}`} className="leaderboard-row">
                                <div>{i + 1}</div>
                                <div className="leaderboard-name">{p.name}</div>
                                <div>{p.kills ?? 0}</div>
                                <div>{p.deaths ?? 0}</div>
                                <div>{p.score ?? 0}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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