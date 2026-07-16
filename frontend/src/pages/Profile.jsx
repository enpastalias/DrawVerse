import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

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
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    if (!profileData) {
        return <div style={{ padding: '20px' }}>Loading Profile...</div>;
    }

    const totalMatches = profileData.totalMatches || 0;
    const matchesWon = profileData.matchesWon || 0;
    const winRatio = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Player Profile</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>{profileData.username}</h3>
                <p>Email: {profileData.email}</p>
                <p>Status: {profileData.status || 'Active'}</p>

                <h4>Statistics</h4>
                <ul>
                    <li>Total Matches: {totalMatches}</li>
                    <li>Matches Won: {matchesWon}</li>
                    <li>Win Ratio: {winRatio}%</li>
                </ul>
            </div>

            <div className="card">
                <h3>Recent Matches</h3>
                {matches.length === 0 ? (
                    <p>No matches played yet.</p>
                ) : (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {matches.map(match => {
                            const isWinner = match.winner.username === profileData.username;
                            const localUser = match.players.find(p => p.username === profileData.username);
                            const score = localUser ? localUser.score : 0;
                            const date = new Date(match.createdAt).toLocaleDateString();

                            return (
                                <li key={match._id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                                    <p><strong>Room:</strong> {match.roomCode} ({date})</p>
                                    <p><strong>Result:</strong> {isWinner ? 'Won 🏆' : 'Played'} - {score} pts</p>
                                    <p><strong>Winner:</strong> {match.winner.username}</p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
