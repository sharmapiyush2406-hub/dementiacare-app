import React from 'react';
import '../../shared/styles/Dashboard.css';

const StatsCard = ({ title, value, icon, color = 'blue', trend, trendValue }) => {
    return (
        <div className={`stats-card-professional ${color}`}>
            <div className="stats-content">
                <div className="stats-info">
                    <h3 className="stats-title">{title}</h3>
                    <p className="stats-value">{value}</p>
                    {trend && (
                        <p className={`stats-trend ${trend > 0 ? 'positive' : 'negative'}`}>
                            <span className="trend-value">{trendValue}</span> {trend}
                        </p>
                    )}
                </div>
                <div className={`stats-icon-container ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
