import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

export default function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [matches, setMatches] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileAndHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                
                const [profileRes, historyRes] = await Promise.all([
                    api.get('/users/profile', { headers }),
                    api.get('/history', { headers })
                ]);
                
                setProfileData(profileRes.data);
                setMatches(historyRes.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load profile or history');
            }
        };
        fetchProfileAndHistory();
    }, []);

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                padding: '2rem'
            }}>
                <Card style={{ borderColor: 'rgba(239, 68, 68, 0.3)', padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ color: 'var(--color-danger)', fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Error Loading Profile</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{error}</p>
                </Card>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                padding: '4rem 0'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div className="pulse-glow" style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: '3px solid var(--color-primary)',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Loading Profile...</p>
                    {/* Add keyframe for spin if not already defined */}
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    // Calculations
    const totalMatches = profileData.totalMatches || 0;
    const matchesWon = profileData.matchesWon || 0;
    const winRatio = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;

    // Generate avatar color
    const getAvatarColor = (name) => {
        const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const hue = charCodeSum % 360;
        return `hsl(${hue}, 65%, 50%)`;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            padding: '1rem 0',
            animation: 'fadeIn 0.5s ease-out forwards'
        }}>
            <div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                    Player Profile
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Track your DrawVerse achievements and statistics
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '2rem',
                alignItems: 'start'
            }} className="profile-grid-responsive">
                {/* User Card */}
                <Card style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '3rem 2rem'
                }}>
                    <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: getAvatarColor(profileData.username),
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        border: '4px solid rgba(255,255,255,0.05)'
                    }}>
                        {profileData.username.charAt(0).toUpperCase()}
                    </div>

                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                        {profileData.username}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                        {profileData.email}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <StatusBadge type="cyan">Player</StatusBadge>
                        <StatusBadge type="success">{profileData.status || 'Active'}</StatusBadge>
                    </div>
                </Card>

                {/* Stats Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: '#fff' }}>
                        Performance Statistics
                    </h3>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        {/* Stat Card 1 */}
                        <Card style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Matches
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>
                                {totalMatches}
                            </div>
                        </Card>

                        {/* Stat Card 2 */}
                        <Card style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Matches Won
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-success)' }}>
                                {matchesWon}
                            </div>
                        </Card>

                        {/* Stat Card 3 */}
                        <Card style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Win Ratio
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
                                {winRatio}%
                            </div>
                        </Card>

                        {/* Recent Matches Section */}
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: '#fff', marginTop: '1.5rem' }}>
                            Recent Matches
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {matches.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem'
                                }}>
                                    No matches played yet. Enter the lobby to play!
                                </div>
                            ) : (
                                matches.map(match => {
                                    const localUserInMatch = match.players.find(p => p.username === profileData.username);
                                    const isWinner = match.winner.username === profileData.username;
                                    const rank = localUserInMatch ? localUserInMatch.rank : '-';
                                    const score = localUserInMatch ? localUserInMatch.score : 0;
                                    const formattedDate = new Date(match.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });

                                    return (
                                        <Card 
                                            key={match._id} 
                                            style={{ 
                                                padding: '1.25rem 1.5rem', 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                borderLeft: isWinner ? '4px solid var(--color-success)' : '4px solid var(--border-color)',
                                                background: 'var(--bg-surface)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>
                                                        {isWinner ? '🏆 Victory' : `Rank #${rank}`}
                                                    </span>
                                                    <StatusBadge type={isWinner ? 'success' : 'cyan'} style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>
                                                        {isWinner ? 'Won' : 'Played'}
                                                    </StatusBadge>
                                                </div>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    Room: {match.roomCode} • {formattedDate}
                                                </span>
                                            </div>
                                            
                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontWeight: '800', color: isWinner ? '#eab308' : 'var(--color-primary-hover)', fontSize: '1.1rem' }}>
                                                    {score} pts
                                                </span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    Winner: {match.winner.username}
                                                </span>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <Card style={{ 
                        padding: '1.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
                        borderColor: 'rgba(139, 92, 246, 0.15)'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(139, 92, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary-hover)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            flexShrink: 0
                        }}>
                            🏆
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '0.15rem' }}>
                                Global Rank: Amateur Artist
                            </h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Win 5 more matches to rank up to Brush Master!
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
            
            <style>{`
                @media(min-width: 768px) {
                    .profile-grid-responsive {
                        grid-template-columns: 280px 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
