import React, { useState } from 'react';
import PatientLayout from "../layouts/PatientLayout";
import "../styles/Games.css";
import MemoryMatch from "../components/games/MemoryMatch";
import RememberItems from "../components/games/RememberItems";
import PictureFind from "../components/games/PictureFind";

const gamesList = [
    {
        id: 'memory',
        title: 'Memory Match',
        description: 'Match identical cards and test your memory.',
        category: 'Memory',
        icon: '🧠',
        difficulty: 'Easy-Medium',
        time: '2-3 min',
        component: MemoryMatch
    },
    {
        id: 'remember',
        title: 'Remember the Items',
        description: 'Remember the objects you see and recall them after they disappear.',
        category: 'Recall',
        icon: '👀',
        difficulty: 'Easy - Medium',
        time: '2-4 min',
        component: RememberItems
    },
    {
        id: 'picture',
        title: 'Picture Find',
        description: 'Memorize a picture, then find it from a group of images.',
        category: 'Visual Recognition',
        icon: '🖼️',
        difficulty: 'Easy - Medium',
        time: '2-4 min',
        component: PictureFind
    }
];

function Games() {
    const [activeGame, setActiveGame] = useState(null);
    const [activityStats, setActivityStats] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const patientId = user._id || 'unknown';
            const STORAGE_KEY = `cognitiveActivityStats_${patientId}`;
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to parse cognitive stats", e);
        }
        return {
            gamesPlayed: 0,
            bestScore: 0,
            streak: 0,
            activityTime: 0,
            lastActivityDate: null,
            lastGoalCompletionDate: null
        };
    });

    const dailyChallenge = React.useMemo(() => {
        const today = new Date();
        // Use Date.UTC to normalize local dates exactly to midnight, eliminating Daylight Saving Time inconsistencies
        const localMidnightUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const epochMidnightUTC = Date.UTC(2024, 0, 1); // Stable application epoch
        
        const diffInDays = Math.round((localMidnightUTC - epochMidnightUTC) / (1000 * 60 * 60 * 24));
        return gamesList[diffInDays % gamesList.length];
    }, []);

    const [isNewBest, setIsNewBest] = useState(false);

    const handleGameEnd = (score, timeSpentSeconds) => {
        setIsNewBest(score > activityStats.bestScore && activityStats.gamesPlayed > 0);
        
        setActivityStats(prev => {
            // Get local date string in YYYY-MM-DD format without timezone shifting issues
            const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
            let newStreak = prev.streak || 0;
            
            if (!prev.lastActivityDate) {
                newStreak = 1;
            } else if (prev.lastActivityDate !== today) {
                const lastDate = new Date(prev.lastActivityDate + 'T00:00:00');
                const currentDate = new Date(today + 'T00:00:00');
                const diffTime = currentDate - lastDate;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1 || diffDays < 0) {
                    newStreak = 1;
                }
            }
            
            const updatedStats = {
                ...prev,
                gamesPlayed: (prev.gamesPlayed || 0) + 1,
                bestScore: Math.max(prev.bestScore || 0, score),
                streak: newStreak,
                activityTime: (prev.activityTime || 0) + timeSpentSeconds,
                lastActivityDate: today,
                lastGoalCompletionDate: today
            };
            
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const patientId = user._id || 'unknown';
                const STORAGE_KEY = `cognitiveActivityStats_${patientId}`;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
            } catch (e) {
                console.error("Failed to save cognitive stats", e);
            }
            
            return updatedStats;
        });
    };

    const handleBackToGames = () => {
        setActiveGame(null);
        setIsNewBest(false);
    };

    const formatActivityTime = (totalSeconds) => {
        if (totalSeconds < 60) {
            return `${totalSeconds} sec`;
        }
        return `${Math.round(totalSeconds / 60)} min`;
    };

    const renderDashboard = () => {
        const todayStr = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const isGoalCompletedToday = activityStats.lastGoalCompletionDate === todayStr;

        return (
            <div className="games-page-container">
                <div className="hero-section">
                    <div className="hero-content">
                        <h2>🧠 Cognitive Activity Center</h2>
                        <p>Take a few minutes to exercise your memory, attention and recall through simple interactive activities.</p>
                        <div className="hero-goal">
                            <div className="hero-goal-title">Today's Goal</div>
                            <div className="hero-goal-text">
                                {isGoalCompletedToday ? '✅ 1 / 1 completed' : '⬜ 0 / 1 completed'}
                                <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '8px' }}>
                                    (Complete 1 cognitive activity today)
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">🧩</div>
                </div>

            <div className="daily-challenge">
                <div className="challenge-header">⭐ Today's Cognitive Challenge</div>
                <div className="challenge-content">
                    <div className="challenge-info">
                        <h3>{dailyChallenge.icon} {dailyChallenge.title}</h3>
                        <p>{dailyChallenge.description}</p>
                        <div className="challenge-stats">
                            <span>Best Score: <strong>{activityStats.bestScore}%</strong></span>
                            <span>Reward: <strong>⭐</strong></span>
                        </div>
                    </div>
                    <button 
                        className="play-btn" 
                        style={{ width: 'auto', padding: '12px 32px' }}
                        onClick={() => setActiveGame(dailyChallenge.id)}
                    >
                        Play Challenge
                    </button>
                </div>
            </div>

            <div className="games-grid">
                {gamesList.map((game) => (
                    <div key={game.id} className="game-card">
                        <div className="game-icon-large">{game.icon}</div>
                        <span className="game-category">{game.category}</span>
                        <h3 className="game-title">{game.title}</h3>
                        <p className="game-description">{game.description}</p>
                        
                        <div className="game-meta">
                            <div><span>Difficulty:</span> <strong>{game.difficulty}</strong></div>
                            <div><span>Time:</span> <strong>{game.time}</strong></div>
                            <div><span>Best:</span> <strong>{activityStats.bestScore}%</strong></div>
                        </div>

                        <button 
                            className="play-btn"
                            onClick={() => setActiveGame(game.id)}
                        >
                            Play Game
                        </button>
                    </div>
                ))}
            </div>

            <div className="progress-section">
                <h3 className="progress-header">🏆 Your Activity Progress</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-label">Games Completed</span>
                        <span className="stat-value">{activityStats.gamesPlayed}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Best Score</span>
                        <span className="stat-value">{activityStats.bestScore}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Streak</span>
                        <span className="stat-value">{activityStats.streak} {activityStats.streak === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Activity Time</span>
                        <span className="stat-value">{formatActivityTime(activityStats.activityTime)}</span>
                    </div>
                </div>
                {activityStats.gamesPlayed > 0 && (
                    <div className="achievements-row">
                        <span className="achievement-badge">⭐ First Game Completed</span>
                        {activityStats.bestScore === 100 && <span className="achievement-badge">🏆 Perfect Score</span>}
                    </div>
                )}
            </div>
        </div>
    );
    };

    const ActiveGameComponent = activeGame 
        ? gamesList.find(g => g.id === activeGame)?.component 
        : null;

    return (
        <PatientLayout>
            {!activeGame ? (
                renderDashboard()
            ) : (
                <div className="games-page-container">
                    {ActiveGameComponent && (
                        <ActiveGameComponent 
                            onBack={handleBackToGames} 
                            onGameEnd={handleGameEnd}
                            isNewBest={isNewBest}
                        />
                    )}
                </div>
            )}
        </PatientLayout>
    );
}

export default Games;
