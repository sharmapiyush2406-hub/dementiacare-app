import React, { useState, useEffect } from 'react';
import GameResult from './GameResult';

const ALL_ITEMS = ['🍎', '🥛', '🔑', '📖', '👓', '🎩', '🌂', '👟', '⌚', '📱', '🖊️', '☕'];

function RememberItems({ onBack, onGameEnd, isNewBest }) {
    const [round, setRound] = useState(1);
    const [itemsToShow, setItemsToShow] = useState([]);
    const [phase, setPhase] = useState('intro'); // 'intro', 'show', 'guess', 'finished'
    const [selectedItems, setSelectedItems] = useState([]);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [options, setOptions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(5);

    const maxRounds = 3;

    const completionHandled = React.useRef(false);
    const startTimeRef = React.useRef(null);

    useEffect(() => {
        let mainTimer;
        if (phase === 'show' || phase === 'guess') {
            mainTimer = setInterval(() => {
                if (startTimeRef.current) {
                    setTime(Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000)));
                } else {
                    setTime(t => t + 1);
                }
            }, 1000);
        }
        return () => clearInterval(mainTimer);
    }, [phase]);

    useEffect(() => {
        let showTimer;
        if (phase === 'show') {
            showTimer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setPhase('guess');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(showTimer);
    }, [phase]);

    const startRound = (r) => {
        let count = 3;
        let timeForRound = 5;
        
        if (r === 1) { count = 3; timeForRound = 5; }
        else if (r === 2) { count = 4; timeForRound = 4; }
        else if (r === 3) { count = 5; timeForRound = 4; }
        
        const shuffled = [...ALL_ITEMS].sort(() => Math.random() - 0.5);
        const toShow = shuffled.slice(0, count);
        
        setItemsToShow(toShow);
        
        const distractorsCount = Math.min(ALL_ITEMS.length - count, count + 2);
        const distractors = shuffled.slice(count, count + distractorsCount);
        const allOptions = [...toShow, ...distractors].sort(() => Math.random() - 0.5);
        
        setOptions(allOptions);
        setSelectedItems([]);
        setPhase('show');
        setTimeLeft(timeForRound);
    };

    const startGame = () => {
        completionHandled.current = false;
        startTimeRef.current = Date.now();
        setRound(1);
        setScore(0);
        setTime(0);
        startRound(1);
    };

    const handleItemClick = (item) => {
        if (selectedItems.includes(item)) {
            setSelectedItems(selectedItems.filter(i => i !== item));
        } else {
            if (selectedItems.length < itemsToShow.length) {
                setSelectedItems([...selectedItems, item]);
            }
        }
    };

    const [feedback, setFeedback] = useState(null);

    const handleSubmit = () => {
        if (phase === 'finished' || feedback !== null) return;
        
        const isCorrect = selectedItems.length === itemsToShow.length && selectedItems.every(item => itemsToShow.includes(item));
        
        if (isCorrect) {
            setFeedback('correct');
            setTimeout(() => {
                setFeedback(null);
                const newScore = score + itemsToShow.length;
                setScore(newScore);

                if (round < maxRounds) {
                    setRound(round + 1);
                    startRound(round + 1);
                } else {
                    if (completionHandled.current) return;
                    completionHandled.current = true;
                    
                    const elapsedSeconds = startTimeRef.current ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000)) : time;
                    setTime(elapsedSeconds);
                    
                    setPhase('finished');
                    const totalPossible = 3 + 4 + 5; // 12
                    const scorePerc = Math.round((newScore / totalPossible) * 100);
                    if (onGameEnd) {
                        onGameEnd(scorePerc, elapsedSeconds);
                    }
                }
            }, 1500);
        } else {
            setFeedback('incorrect');
            setTimeout(() => {
                setFeedback(null);
                setSelectedItems([]);
            }, 2500);
        }
    };

    if (phase === 'intro') {
        return (
            <div className="game-board-container">
                <div className="intro-container">
                    <div className="intro-content">
                        <h2 className="intro-title">👀 Remember the Items</h2>
                        <p className="intro-desc">
                            Remember the objects you see and recall them after they disappear. Train your visual working memory and attention.
                        </p>
                        
                        <div className="intro-features">
                            <span className="feature-chip">👁 Observe</span>
                            <span className="feature-chip">🧠 Recall</span>
                            <span className="feature-chip">🎯 Select</span>
                        </div>
                        
                        <div className="intro-instructions">
                            <h4>How to Play</h4>
                            <p>Look carefully at the objects on the screen. When the timer runs out, they will disappear and be mixed with other items. Select the exact objects you saw previously.</p>
                        </div>
                        
                        <div className="intro-actions">
                            <button className="intro-play-btn" onClick={startGame}>
                                ▶ Start Game
                            </button>
                            <button className="intro-cancel-btn" onClick={onBack}>
                                Cancel
                            </button>
                        </div>
                    </div>
                    
                    <div className="intro-visual-area">
                        <div className="intro-visual-remember">
                            <span>☕</span>
                            <span>👓</span>
                            <span>🍎</span>
                            <span>🌂</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'finished') {
        const totalPossible = 12;
        const scorePerc = Math.round((score / totalPossible) * 100);
        return (
            <GameResult 
                scorePercentage={scorePerc}
                time={time}
                onPlayAgain={startGame}
                onBack={onBack}
                isNewBest={isNewBest}
            />
        );
    }

    return (
        <div className="game-board-container">
            <div className="game-top-bar">
                <button className="back-btn" onClick={onBack}>← Quit</button>
                <div className="game-stats">
                    <span>Round: {round}/{maxRounds}</span>
                    <span>Time: {time}s</span>
                </div>
            </div>

            {phase === 'show' ? (
                <div>
                    <div className="remember-message">
                        Remember these items
                    </div>
                    <div className="remember-countdown">
                        Time remaining: {timeLeft}s
                    </div>
                    <div className="remember-display">
                        {itemsToShow.map((item, idx) => (
                            <span key={idx}>{item}</span>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="remember-message" style={{ marginBottom: '8px' }}>
                        Which items did you see?
                    </div>
                    {feedback === 'incorrect' ? (
                        <div style={{ textAlign: 'center', color: '#e11d48', marginBottom: '24px', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#ffe4e6', padding: '12px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto 24px' }}>
                            Not quite! Some selected items were not shown. Try again.
                        </div>
                    ) : feedback === 'correct' ? (
                        <div style={{ textAlign: 'center', color: '#16a34a', marginBottom: '24px', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto 24px' }}>
                            Great job! All items matched! 🎉
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px', fontWeight: 'bold' }}>
                            Selected: {selectedItems.length} / {itemsToShow.length}
                        </div>
                    )}
                    <div className="remember-options">
                        {options.map((item, idx) => (
                            <button 
                                key={idx}
                                className={`remember-btn ${selectedItems.includes(item) ? 'selected' : ''}`}
                                onClick={() => handleItemClick(item)}
                                disabled={feedback !== null}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <button 
                            className="play-btn" 
                            style={{ width: 'auto', padding: '16px 40px', fontSize: '1.2rem' }}
                            onClick={handleSubmit}
                            disabled={selectedItems.length !== itemsToShow.length || feedback !== null}
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RememberItems;
