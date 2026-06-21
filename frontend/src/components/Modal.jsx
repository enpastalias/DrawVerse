import React from 'react';

export default function Modal({
    children,
    isOpen = false,
    title = '',
    style = {},
    ...props
}) {
    if (!isOpen) return null;

    const overlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 10, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.25s ease-out forwards',
    };

    const containerStyle = {
        textAlign: 'center',
        padding: '2.5rem',
        background: '#151726',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), var(--glow-shadow)',
        width: '90%',
        maxWidth: '450px',
        animation: 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        ...style
    };

    return (
        <div style={overlayStyle} {...props}>
            <div style={containerStyle}>
                {title && (
                    <h3 style={{ 
                        margin: '0 0 1.5rem 0', 
                        fontSize: '1.5rem', 
                        fontWeight: '700',
                        letterSpacing: '-0.01em',
                        background: 'linear-gradient(90deg, #fff, var(--text-muted))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {title}
                    </h3>
                )}
                {children}
            </div>
        </div>
    );
}
