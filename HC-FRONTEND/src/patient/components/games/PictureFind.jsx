import React, { useState, useEffect, useRef } from 'react';
import GameResult from './GameResult';

const imageModules = import.meta.glob('../../../assets/games/picture-find/*.jpg', { eager: true });
const parsedImages = Object.values(imageModules).map(mod => {
    const src = mod.default;
    // Extract category from filename (e.g., /assets/flower_1-Hash.jpg -> flower)
    const match = src.match(/([a-z]+)_\d+/i);
    const category = match ? match[1].toLowerCase() : 'misc';
    return { src, category };
});
const CATEGORIES = [...new Set(parsedImages.map(img => img.category))];

function PictureFind({ onBack, onGameEnd, isNewBest }) {
    const [level, setLevel] = useState(1);
    const [round, setRound] = useState(1);
    const [targetImage, setTargetImage] = useState(null);
    const [options, setOptions] = useState([]);
    const [phase, setPhase] = useState('intro'); // intro, target, find, finished
    const [score, setScore] = useState(0);
    const [attemptsInRound, setAttemptsInRound] = useState(0);
    const [timeLeft, setTimeLeft] = useState(5);
    const [feedback, setFeedback] = useState(null);

    const maxRounds = 3;
    const maxLevels = 3;

    const completionHandled = useRef(false);
    const startTimeRef = useRef(null);
    const lastCategoryRef = useRef(null);

    // Active Activity Timer logic
    const [activityTime, setActivityTime] = useState(0);
    useEffect(() => {
        let mainTimer;
        if (phase === 'target' || phase === 'find') {
            mainTimer = setInterval(() => {
                if (startTimeRef.current) {
                    setActivityTime(Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000)));
                }
            }, 1000);
        }
        return () => clearInterval(mainTimer);
    }, [phase]);

    // Target Phase countdown
    useEffect(() => {
        let showTimer;
        if (phase === 'target') {
            showTimer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setPhase('find');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(showTimer);
    }, [phase]);

    const startRound = (l) => {
        let gridCount = 8;
        let timeForRound = 6;
        
        if (l === 1) { gridCount = 8; timeForRound = 6; }
        else if (l === 2) { gridCount = 12; timeForRound = 5; }
        else if (l === 3) { gridCount = 16; timeForRound = 5; }
        
        gridCount = Math.min(gridCount, parsedImages.length);

        // Pick a category, avoiding the last one if possible
        let availableCategories = CATEGORIES.filter(c => c !== lastCategoryRef.current);
        if (availableCategories.length === 0) availableCategories = CATEGORIES;
        
        // eslint-disable-next-line react-hooks/purity
        const selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        lastCategoryRef.current = selectedCategory;

        let categoryImages = parsedImages.filter(img => img.category === selectedCategory);
        
        // Fill remaining slots with random distractors if the category doesn't have enough
        if (categoryImages.length < gridCount) {
            const otherImages = parsedImages.filter(img => img.category !== selectedCategory);
            const needed = gridCount - categoryImages.length;
            const shuffledOthers = [...otherImages].sort(() => Math.random() - 0.5);
            categoryImages = [...categoryImages, ...shuffledOthers.slice(0, needed)];
        }
        
        categoryImages = categoryImages.sort(() => Math.random() - 0.5);
        
        const target = categoryImages[0];
        setTargetImage(target.src);
        
        const distractors = categoryImages.slice(1, gridCount);
        const allOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
        
        setOptions(allOptions.map(opt => opt.src));
        setPhase('target');
        setTimeLeft(timeForRound);
        setAttemptsInRound(0);
        setFeedback(null);
    };

    const startGame = () => {
        if (parsedImages.length < 2) {
            console.error("Not enough images for Picture Find.");
            return;
        }
        completionHandled.current = false;
        // eslint-disable-next-line react-hooks/purity
        startTimeRef.current = Date.now();
        setLevel(1);
        setRound(1);
        setScore(0);
        setActivityTime(0);
        startRound(1);
    };

    const handleSelectImage = (img) => {
        if (phase !== 'find' || feedback !== null) return;
        
        if (img === targetImage) {
            // Correct
            let roundPoints = 100 / (maxLevels * maxRounds); // Each round max points
            if (attemptsInRound === 1) roundPoints *= 0.6;
            else if (attemptsInRound >= 2) roundPoints *= 0.3;
            
            const newScore = score + roundPoints;
            setScore(newScore);
            setFeedback({ type: 'success', text: "Great job! 🎉 That's the picture you remembered." });
            
            setTimeout(() => {
                let nextRound = round + 1;
                let nextLevel = level;
                
                if (nextRound > maxRounds) {
                    nextRound = 1;
                    nextLevel++;
                }
                
                if (nextLevel > maxLevels) {
                    setPhase('finished');
                    if (!completionHandled.current && onGameEnd) {
                        completionHandled.current = true;
                        const finalTime = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
                        onGameEnd(Math.round(newScore), finalTime);
                    }
                } else {
                    setLevel(nextLevel);
                    setRound(nextRound);
                    startRound(nextLevel);
                }
            }, 1500);
            
        } else {
            // Wrong
            setAttemptsInRound(a => a + 1);
            setFeedback({ type: 'error', text: "Not quite! Try again." });
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    if (phase === 'intro') {
        return (
            <div className="game-board-container picture-find-board">
                <div className="intro-container">
                    <div className="intro-content">
                        <h2 className="intro-title">🖼️ Picture Find</h2>
                        <p className="intro-desc">
                            Look carefully at a picture, remember it, and then find the same picture from a group of images.
                        </p>
                        <div className="intro-features">
                            <span className="feature-chip">👁️ Observe</span>
                            <span className="feature-chip">🧠 Remember</span>
                            <span className="feature-chip">🎯 Find</span>
                        </div>
                        <div className="intro-instructions">
                            <h4>How to Play</h4>
                            <p>1. <strong>Look</strong> carefully at the picture.<br/>
                               2. <strong>Remember</strong> it for 5–6 seconds.<br/>
                               3. <strong>Find</strong> the same picture when the grid appears.<br/>
                               4. <strong>Select</strong> by tapping the correct picture.</p>
                        </div>
                        <div className="intro-actions">
                            <button className="intro-play-btn" onClick={startGame}>Start Game</button>
                            <button className="intro-cancel-btn" onClick={onBack}>Cancel</button>
                        </div>
                    </div>
                    <div className="intro-visual-area">
                        <div className="intro-visual-remember">
                            🖼️ 🔍
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'finished') {
        return (
            <div className="game-board-container picture-find-board">
                <GameResult 
                    score={Math.round(score)}
                    timeSpent={activityTime}
                    isNewBest={isNewBest}
                    onPlayAgain={startGame}
                    onBack={onBack}
                    title="Picture Find Complete! 🎉"
                />
            </div>
        );
    }

    return (
        <div className="game-board-container picture-find-board">
            <div className="game-top-bar">
                <button className="back-btn" onClick={onBack}>← Quit</button>
                <div className="game-stats">
                    <span>Level: {level}/{maxLevels}</span>
                    <span>Round: {round}/{maxRounds}</span>
                    <span>Time: {activityTime}s</span>
                </div>
            </div>

            {feedback && (
                <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: 'clamp(8px, 1.5vh, 20px)',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: feedback.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {feedback.text}
                </div>
            )}

            {phase === 'target' && targetImage && (
                <div className="picture-target-container">
                    <h3 className="remember-message" style={{ margin: '0 0 clamp(4px, 1vh, 8px) 0' }}>Remember this picture carefully</h3>
                    <div className="picture-target-countdown">
                        {timeLeft}
                    </div>
                    <div className="picture-target-image-wrapper">
                        <img src={targetImage} alt="Target" className="picture-target-img" />
                    </div>
                </div>
            )}

            {phase === 'find' && (
                <div className="picture-find-container">
                    <h3 className="remember-message" style={{ margin: '0 0 clamp(4px, 1vh, 8px) 0' }}>Which picture did you see?</h3>
                    <p style={{textAlign: 'center', color: '#64748b', margin: '0 0 clamp(8px, 1.5vh, 24px) 0'}}>Find the same picture.</p>
                    <div className={`picture-find-grid level-${level}`}>
                        {options.map((img, idx) => (
                            <button 
                                key={idx} 
                                className="picture-find-btn"
                                onClick={() => handleSelectImage(img)}
                                disabled={feedback !== null}
                            >
                                <img src={img} alt="Choice" className="picture-find-img" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PictureFind;
