import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            setName(res.data.name);
            setEmail(res.data.email);
            setRole(res.data.role);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/profile', { name, password });
            setMessage('Profile updated successfully');
            setPassword('');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1>My Profile</h1>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        backgroundColor: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 'bold', marginRight: '1.5rem'
                    }}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2>{name}</h2>
                        <span className="badge badge-blue">{role}</span>
                    </div>
                </div>

                {message && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

                <form onSubmit={handleUpdate}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email (Cannot be changed)</label>
                        <input className="input" value={email} disabled style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password (Leave blank to keep current)</label>
                        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Profile</button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
