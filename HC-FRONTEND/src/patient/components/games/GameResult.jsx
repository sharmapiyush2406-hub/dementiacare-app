import React from 'react';

function GameResult({ score, time, moves, onPlayAgain, onBack, scorePercentage, isNewBest }) {
    const displayTime = time ? `${Math.floor(time / 60)}m ${time % 60}s` : null;

    return (
        <div className="result-screen">
            <div className="result-icon">🎉</div>
            <h2 className="result-title">Great Job!</h2>
            <p className="result-subtitle">Activity Completed</p>
            
            <div className="result-stats">
                {scorePercentage !== undefined && <p><span>Score:</span> <strong>{scorePercentage}%</strong></p>}
                {score !== undefined && scorePercentage === undefined && <p><span>Score:</span> <strong>{score}</strong></p>}
                {displayTime && <p><span>Time:</span> <strong>{displayTime}</strong></p>}
                {moves !== undefined && <p><span>Moves/Attempts:</span> <strong>{moves}</strong></p>}
            </div>

            {isNewBest && (
                <div className="new-best-badge">
                    ⭐ New Best Score!
                </div>
            )}

            <div className="result-actions">
                <button className="play-btn" style={{ width: 'auto', padding: '12px 32px' }} onClick={onPlayAgain}>
                    Play Again
                </button>
                <button className="back-btn" onClick={onBack}>
                    Back to Games
                </button>
            </div>
        </div>
    );
}

export default GameResult;
