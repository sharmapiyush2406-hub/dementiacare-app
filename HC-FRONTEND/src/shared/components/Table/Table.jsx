import React from 'react';
import './Table.css';

/**
 * Reusable Professional Table Component
 * 
 * @param {string} title - Optional title for the table
 * @param {Array} columns - Array of column definitions: { header: string, accessor: string, render?: (row) => node }
 * @param {Array} data - Array of data objects
 * @param {string} keyField - Unique key for each row (default: 'id')
 */
const Table = ({ title, columns, data, keyField = 'id' }) => {
    return (
        <div className="pro-table-wrapper">
            {title && (
                <div className="pro-table-header">
                    <h3>{title}</h3>
                </div>
            )}


            <div className="pro-table-container">
                <table className="pro-table">
                    <thead>
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <tr key={row[keyField] || rowIndex}>
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} data-label={col.header}>
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="pro-table-empty">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;



