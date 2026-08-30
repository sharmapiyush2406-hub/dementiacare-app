import React, { useState, useEffect } from 'react';
import GameResult from './GameResult';

const ALL_EMOJIS = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍍', '🥝', '🥥', '🥭', '🍋', '🍑'];

const LEVELS = [
    { level: 1, pairs: 4 },
    { level: 2, pairs: 6 },
    { level: 3, pairs: 8 }
];

function MemoryMatch({ onBack, onGameEnd, isNewBest }) {
    const [phase, setPhase] = useState('intro'); // 'intro', 'playing', 'finished'
    const [levelIdx, setLevelIdx] = useState(0);
    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedIndices, setMatchedIndices] = useState([]);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const completionHandled = React.useRef(false);
    const startTimeRef = React.useRef(null);

    useEffect(() => {
        let timer;
        if (phase === 'playing') {
            timer = setInterval(() => {
                // Keep UI ticking approximately, but actual time is calculated at the end
                if (startTimeRef.current) {
                    setTime(Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000)));
                } else {
                    setTime(t => t + 1);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [phase]);

    const startGame = React.useCallback((lIdx = 0) => {
        if (lIdx === 0) {
            completionHandled.current = false;
            startTimeRef.current = Date.now();
        }
        setLevelIdx(lIdx);
        const pairsCount = LEVELS[lIdx].pairs;
        const selectedEmojis = ALL_EMOJIS.slice(0, pairsCount);
        
        const shuffled = [...selectedEmojis, ...selectedEmojis]
            .sort(() => Math.random() - 0.5)
            .map(emoji => ({ emoji, id: Math.random() }));
            
        setCards(shuffled);
        setFlippedIndices([]);
        setMatchedIndices([]);
        
        if (lIdx === 0) {
            setMoves(0);
            setTime(0);
        }
        setPhase('playing');
        
        // Briefly reveal cards
        const allIndices = shuffled.map((_, i) => i);
        setFlippedIndices(allIndices);
        setTimeout(() => {
            setFlippedIndices([]);
        }, 1500);
    }, []);

    const handleLevelComplete = React.useCallback(() => {
        if (levelIdx < LEVELS.length - 1) {
            // Next level
            startGame(levelIdx + 1);
        } else {
            // Game complete
            if (completionHandled.current) return;
            completionHandled.current = true;
            
            const elapsedSeconds = startTimeRef.current ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000)) : time;
            setTime(elapsedSeconds);
            
            setPhase('finished');
            const totalPairs = LEVELS.reduce((sum, l) => sum + l.pairs, 0);
            const minPossibleMoves = totalPairs;
            const scorePerc = Math.max(0, 100 - (moves - minPossibleMoves) * 2);
            if (onGameEnd) {
                onGameEnd(scorePerc, elapsedSeconds);
            }
        }
    }, [levelIdx, moves, time, onGameEnd, startGame]);

    const handleCardClick = (index) => {
        if (phase !== 'playing') return;
        if (flippedIndices.length === 2) return;
        if (flippedIndices.includes(index) || matchedIndices.includes(index)) return;

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [firstIndex, secondIndex] = newFlipped;
            
            if (cards[firstIndex].emoji === cards[secondIndex].emoji) {
                setMatchedIndices(prev => [...prev, firstIndex, secondIndex]);
                setFlippedIndices([]);
            } else {
                setTimeout(() => {
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    // Use a separate effect to detect level completion
    useEffect(() => {
        if (cards.length > 0 && matchedIndices.length === cards.length && phase === 'playing') {
            const timer = setTimeout(() => {
                handleLevelComplete();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [matchedIndices.length, cards.length, phase, handleLevelComplete]);

    if (phase === 'intro') {
        return (
            <div className="game-board-container">
                <div className="intro-container">
                    <div className="intro-content">
                        <h2 className="intro-title">🧠 Memory Match</h2>
                        <p className="intro-desc">
                            Find and match all identical pairs. Progress through three levels of increasing difficulty to train your short-term memory and spatial recall.
                        </p>
                        
                        <div className="intro-features">
                            <span className="feature-chip">🃏 Match Pairs</span>
                            <span className="feature-chip">🧠 Sharpen Memory</span>
                            <span className="feature-chip">⭐ Earn Stars</span>
                        </div>
                        
                        <div className="intro-instructions">
                            <h4>How to Play</h4>
                            <p>Tap two cards to reveal them. If they match, they stay face up. If not, they flip back over. Try to remember their positions to match them all with as few moves as possible.</p>
                        </div>
                        
                        <div className="intro-actions">
                            <button className="intro-play-btn" onClick={() => startGame(0)}>
                                ▶ Start Game
                            </button>
                            <button className="intro-cancel-btn" onClick={onBack}>
                                Cancel
                            </button>
                        </div>
                    </div>
                    
                    <div className="intro-visual-area">
                        <div className="intro-visual-memory">
                            <div className="intro-visual-card blue">❓</div>
                            <div className="intro-visual-card">🍎</div>
                            <div className="intro-visual-card">🍎</div>
                            <div className="intro-visual-card blue">❓</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'finished') {
        const totalPairs = LEVELS.reduce((sum, l) => sum + l.pairs, 0);
        const scorePerc = Math.max(0, 100 - (moves - totalPairs) * 2);
        return (
            <GameResult 
                scorePercentage={scorePerc}
                time={time}
                moves={moves}
                onPlayAgain={() => startGame(0)}
                onBack={onBack}
                isNewBest={isNewBest}
            />
        );
    }

    const currentPairs = LEVELS[levelIdx].pairs;

    return (
        <div className="game-board-container">
            <div className="game-top-bar">
                <button className="back-btn" onClick={onBack}>← Quit</button>
                <div className="game-stats">
                    <span>Level {levelIdx + 1}/3</span>
                    <span>Pairs: {matchedIndices.length / 2} / {currentPairs}</span>
                    <span>Moves: {moves}</span>
                    <span>Time: {time}s</span>
                </div>
            </div>
            
            <div className={`memory-grid level-${levelIdx + 1}`}>
                {cards.map((card, index) => {
                    const isFlipped = flippedIndices.includes(index);
                    const isMatched = matchedIndices.includes(index);
                    
                    return (
                        <div 
                            key={card.id}
                            className={`memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                            onClick={() => handleCardClick(index)}
                        >
                            <span className="memory-content">{card.emoji}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MemoryMatch;
