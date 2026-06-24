import { useState } from 'react';
import '../../shared/styles/Dashboard.css';
import socket from '../../services/socket';

const EmergencyButton = () => {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleEmergency = () => {
        setLoading(true);

        // Read the logged-in patient's userId from localStorage
        let patientUserId = 'unknown';
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            patientUserId = user._id || 'unknown';
        } catch (e) {}

        socket.emit('sos-alert', {
            patientUserId,
            timestamp: new Date().toISOString(),
        });

        setTimeout(() => {
            setLoading(false);
            setSent(true);
            setTimeout(() => setSent(false), 5000);
        }, 800);
    };

    return (
        <div className="emergency-container">
            <button
                className={`emergency-btn ${loading ? 'loading' : ''}`}
                onClick={handleEmergency}
                disabled={loading || sent}
            >
                <div className="emergency-icon">🆘</div>
                <div className="emergency-text">
                    <span className="emergency-title">EMERGENCY HELP</span>
                    <span className="emergency-subtitle">
                        {sent ? 'Alert sent to caregiver!' : 'Click for Immediate Assistance'}
                    </span>
                </div>
            </button>
            {sent && (
                <p className="emergency-status" style={{ color: '#f44336', fontWeight: 'bold' }}>
                    ✅ Your caregiver has been notified!
                </p>
            )}
        </div>
    );
};

export default EmergencyButton;
