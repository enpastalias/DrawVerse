import React from 'react';

export default function Button({
    children,
    onClick,
    variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline'
    type = 'button',
    disabled = false,
    className = '',
    style = {},
    ...props
}) {
    const baseStyle = {
        fontFamily: 'var(--font-gaming)',
        fontWeight: '700',
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        outline: 'none',
        userSelect: 'none',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        ...style
    };

    let variantStyle = {};
    
    if (variant === 'primary') {
        variantStyle = {
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
        };
    } else if (variant === 'secondary') {
        variantStyle = {
            background: 'var(--bg-surface-hover)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
        };
    } else if (variant === 'danger') {
        variantStyle = {
            background: 'linear-gradient(135deg, var(--color-danger) 0%, #dc2626 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
        };
    } else if (variant === 'outline') {
        variantStyle = {
            background: 'transparent',
            color: 'var(--text-main)',
            border: '2px solid var(--border-color)',
        };
    }

    // Interactive behaviors using event handlers
    const handleMouseOver = (e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
            e.currentTarget.style.filter = 'brightness(1.1)';
        } else if (variant === 'danger') {
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
            e.currentTarget.style.filter = 'brightness(1.1)';
        } else if (variant === 'secondary') {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
            e.currentTarget.style.background = 'rgba(50, 53, 82, 0.7)';
        } else if (variant === 'outline') {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.2)';
        }
    };

    const handleMouseOut = (e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.filter = 'none';
        if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.4)';
        } else if (variant === 'danger') {
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
        } else if (variant === 'secondary') {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
        } else if (variant === 'outline') {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
        }
    };

    const handleMouseDown = (e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
    };

    const handleMouseUp = (e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variantStyle }}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className={className}
            {...props}
        >
            {children}
        </button>
    );
}
