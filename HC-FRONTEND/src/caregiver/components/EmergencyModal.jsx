import React, { useEffect } from 'react';
import '../../shared/styles/Dashboard.css';

const EmergencyModal = ({ alertData, onClose }) => {
  if (!alertData) return null;

  // Optional: Play a sound if you want it to be really noticeable
  // useEffect(() => {
  //   const audio = new Audio('/alarm.mp3'); 
  //   audio.play().catch(e => console.log('Audio play failed due to browser policies', e));
  // }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconContainer}>
          <span style={styles.icon}>🚨</span>
        </div>
        <h2 style={styles.title}>EMERGENCY SOS</h2>
        <p style={styles.message}>
          Patient <strong>{alertData.patientId}</strong> has triggered an SOS alert!
        </p>
        <p style={styles.time}>
          Time: {new Date(alertData.timestamp).toLocaleTimeString()}
        </p>
        
        {alertData.location && (
           <p style={styles.location}>
             Location: {alertData.location.latitude.toFixed(4)}, {alertData.location.longitude.toFixed(4)}
           </p>
        )}

        <button style={styles.ackButton} onClick={onClose}>
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};

// Inline styles for simplicity to ensure it works beautifully without needing extra CSS classes right now
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(255, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    animation: 'pulseBg 2s infinite'
  },
  modal: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    border: '4px solid #f44336'
  },
  iconContainer: {
    fontSize: '64px',
    marginBottom: '10px',
    animation: 'shake 0.5s infinite'
  },
  title: {
    color: '#f44336',
    fontSize: '32px',
    margin: '0 0 15px 0',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  message: {
    fontSize: '20px',
    color: '#333',
    margin: '0 0 10px 0'
  },
  time: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 20px 0'
  },
  location: {
    fontSize: '16px',
    color: '#d32f2f',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '8px'
  },
  ackButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    fontSize: '18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  }
};

export default EmergencyModal;
