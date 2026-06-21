import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await api.get('/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfileData(res.data);
            } catch (err) {
                setError('Failed to load profile');
            }
        };
        fetchProfile();
    }, []);

    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!profileData) return <div>Loading profile...</div>;

    return (
        <div style={{ padding: 20 }}>
            <h2>Profile: {profileData.username}</h2>
            <ul>
                <li>Email: {profileData.email}</li>
                <li>Status: {profileData.status}</li>
                <li>Matches Won: {profileData.matchesWon}</li>
                <li>Total Matches: {profileData.totalMatches}</li>
            </ul>
        </div>
    );
}
