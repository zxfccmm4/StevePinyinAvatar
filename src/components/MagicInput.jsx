import React from 'react';

const MagicInput = ({ label, wrapperStyle, ...props }) => {
    // Extract border radius from wrapper style to apply to inner
    const borderRadius = wrapperStyle?.borderRadius || '12px';

    return (
        <div className="future-input-container" style={wrapperStyle}>
            <div className="future-input-inner" style={{
                padding: label ? '0 20px' : '10px 14px',
                borderRadius: borderRadius,
                height: '100%',
                boxSizing: 'border-box'
            }}>
                {label && (
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginRight: '8px' }}>
                        {label}
                    </label>
                )}
                <input
                    className="future-input-field"
                    style={{ height: '100%' }}
                    {...props}
                />
            </div>
        </div>
    );
};

export default MagicInput;
