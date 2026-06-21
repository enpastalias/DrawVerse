import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Home() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '2rem 0',
            animation: 'fadeIn 0.6s ease-out forwards'
        }}>
            <Card style={{ 
                textAlign: 'center', 
                maxWidth: '650px', 
                width: '100%', 
                padding: '4rem 2rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }} glow={true} hoverEffect={false}>
                
                {/* Visual Accent */}
                <div style={{
                    margin: '0 auto 1.5rem auto',
                    background: 'rgba(139, 92, 246, 0.12)',
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid rgba(139, 92, 246, 0.3)',
                    boxShadow: 'var(--glow-shadow)',
                    animation: 'bounceSlow 3s infinite ease-in-out'
                }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </div>

                <h1 style={{ 
                    fontSize: '3.2rem', 
                    fontWeight: '800', 
                    letterSpacing: '-0.04em',
                    lineHeight: '1.1',
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, #fff 30%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Welcome to DrawVerse
                </h1>
                
                <p style={{ 
                    fontSize: '1.15rem', 
                    color: 'var(--text-muted)',
                    maxWidth: '480px',
                    margin: '0 auto 2.5rem auto',
                    lineHeight: '1.6',
                    fontWeight: '400'
                }}>
                    The ultimate real-time multiplayer drawing and guessing experience. Create a room, invite friends, and see who is the master artist!
                </p>

                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'center', 
                    gap: '12px',
                    maxWidth: '380px',
                    margin: '0 auto'
                }}>
                    <Link to="/lobby" style={{ textDecoration: 'none', display: 'block' }}>
                        <Button variant="primary" style={{ width: '100%', padding: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                Enter Lobby
                            </span>
                        </Button>
                    </Link>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <Button variant="secondary" style={{ width: '100%' }}>
                                Login
                            </Button>
                        </Link>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <Button variant="outline" style={{ width: '100%' }}>
                                Register
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}
