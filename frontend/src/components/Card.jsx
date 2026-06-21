import React from 'react';

export default function Card({
    children,
    className = '',
    style = {},
    glow = false,
    hoverEffect = false,
    ...props
}) {
    const cardStyle = {
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        boxShadow: glow 
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.4), var(--glow-shadow)' 
            : '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
    };

    const handleMouseOver = (e) => {
        if (!hoverEffect) return;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), var(--glow-shadow)';
    };

    const handleMouseOut = (e) => {
        if (!hoverEffect) return;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = glow 
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.4), var(--glow-shadow)' 
            : '0 8px 32px 0 rgba(0, 0, 0, 0.4)';
    };

    return (
        <div
            style={cardStyle}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            className={`glass-panel ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
