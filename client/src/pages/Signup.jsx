import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

import AnimatedBackground from '../components/AnimatedBackground';

const Signup = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Tester');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', { name, email, password, role });
            // Redirect to login on success
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-body)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <AnimatedBackground />

            {/* Signup Card */}
            <div className="card" style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '500px',
                width: '100%',
                margin: '2rem',
                padding: '3rem',
                animation: 'fadeInUp 0.8s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        create account
                    </h1>
                    <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                        Join QA Tool today
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Full Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Email Address</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Role</label>
                        <select
                            className="input"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={{ width: '100%', cursor: 'pointer' }}
                        >
                            <option value="Tester">Tester</option>
                            <option value="QA Lead">QA Lead</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {error && (
                        <div style={{
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            width: '100%',
                            marginBottom: '1rem'
                        }}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-light)' }}>Already have an account? </span>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                textDecoration: 'underline'
                            }}
                        >
                            Log In
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-main);
                    font-weight: 500;
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, -20px); }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Signup;
