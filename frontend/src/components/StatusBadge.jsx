import React from 'react';

export default function StatusBadge({
    children,
    type = 'primary', // 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'cyan'
    style = {},
    className = '',
    ...props
}) {
    let background = 'rgba(139, 92, 246, 0.15)';
    let color = 'var(--color-primary-hover)';
    let border = '1px solid rgba(139, 92, 246, 0.3)';

    if (type === 'secondary') {
        background = 'rgba(255, 255, 255, 0.08)';
        color = 'var(--text-muted)';
        border = '1px solid rgba(255, 255, 255, 0.15)';
    } else if (type === 'success') {
        background = 'rgba(16, 185, 129, 0.15)';
        color = '#34d399';
        border = '1px solid rgba(16, 185, 129, 0.3)';
    } else if (type === 'warning') {
        background = 'rgba(245, 158, 11, 0.15)';
        color = '#fbbf24';
        border = '1px solid rgba(245, 158, 11, 0.3)';
    } else if (type === 'danger') {
        background = 'rgba(239, 68, 68, 0.15)';
        color = '#f87171';
        border = '1px solid rgba(239, 68, 68, 0.3)';
    } else if (type === 'cyan') {
        background = 'rgba(6, 182, 212, 0.15)';
        color = '#22d3ee';
        border = '1px solid rgba(6, 182, 212, 0.3)';
    }

    const badgeStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.25rem 0.65rem',
        borderRadius: '50px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background,
        color,
        border,
        userSelect: 'none',
        ...style
    };

    return (
        <span style={badgeStyle} className={className} {...props}>
            {children}
        </span>
    );
}
