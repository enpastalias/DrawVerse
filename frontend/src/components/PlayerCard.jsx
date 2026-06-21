import React from 'react';
import StatusBadge from './StatusBadge';

export default function PlayerCard({
    player,
    isLocalPlayer = false,
    isDrawer = false,
    style = {},
    ...props
}) {
    // Generate a simple deterministic gradient background based on the username
    const getAvatarGradient = (name) => {
        const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const hue1 = charCodeSum % 360;
        const hue2 = (hue1 + 60) % 360;
        return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%) 0%, hsl(${hue2}, 80%, 45%) 100%)`;
    };

    const cardStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: isDrawer 
            ? '1.5px solid var(--color-secondary)' 
            : isLocalPlayer 
                ? '1.5px solid var(--color-primary)' 
                : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDrawer 
            ? 'var(--glow-shadow-cyan)' 
            : isLocalPlayer 
                ? 'var(--glow-shadow)' 
                : 'none',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        ...style
    };

    const avatarStyle = {
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background: getAvatarGradient(player.username),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        fontSize: '1.2rem',
        textTransform: 'uppercase',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        position: 'relative'
    };

    return (
        <div style={cardStyle} {...props}>
            <div style={avatarStyle}>
                {player.username.charAt(0)}
                {player.isHost && (
                    <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#fbbf24',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} title="Host">
                        {/* Crown SVG */}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                            <path d="M3 20h18" />
                        </svg>
                    </div>
                )}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                    fontWeight: '600', 
                    fontSize: '1rem', 
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {player.username}
                    <span style={{ 
                        marginLeft: 'auto', 
                        fontSize: '0.85rem', 
                        fontWeight: '800', 
                        color: 'var(--color-secondary)',
                        background: 'rgba(6, 182, 212, 0.1)',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '4px',
                        flexShrink: 0
                    }}>
                        {player.score || 0} pts
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    {player.isHost && <StatusBadge type="warning">Host</StatusBadge>}
                    {isDrawer && <StatusBadge type="cyan">Drawing</StatusBadge>}
                    {isLocalPlayer && <StatusBadge type="primary">You</StatusBadge>}
                </div>
            </div>
        </div>
    );
}
