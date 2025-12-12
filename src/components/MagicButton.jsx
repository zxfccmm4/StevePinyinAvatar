import React from 'react';

const MagicButton = ({ children, disabled, style, ...props }) => {
    // Base styles defined in index.css under .apple-ai-btn
    // We allow overriding style prop but ensure background remains transparent for the effect to work

    return (
        <button
            className="apple-ai-btn"
            disabled={disabled}
            style={{
                padding: 0, // Reset padding because inner span handles it
                background: 'transparent',
                fontSize: '15px',
                fontWeight: 600,
                opacity: disabled ? 0.8 : 1,
                ...style,
            }}
            {...props}
        >
            <div className="apple-ai-btn-inner">
                {children}
            </div>
        </button>
    );
};

export default MagicButton;
