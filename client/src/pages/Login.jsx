import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

import AnimatedBackground from '../components/AnimatedBackground';

const Login = () => {
    const navigate = useNavigate();
    const { selectRole } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.token) {
                // Store token and user info
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Set role in auth context (normalize to lowercase)
                const userRole = (response.data.user.role || 'admin').toLowerCase().replace(' ', '_');
                selectRole(userRole);

                // Navigate to dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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

            {/* Login Card */}
            <div className="card" style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '450px',
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
                        Welcome Back
                    </h1>
                    <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                        Sign in to access QA Tool
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: 'var(--text-main)',
                            fontWeight: '500'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="input"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: 'var(--text-main)',
                            fontWeight: '500'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%' }}
                        />
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
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        background: 'rgba(102, 126, 234, 0.05)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: 'var(--text-light)'
                    }}>
                        <div className="demo-credentials">
                            <p><strong>Demo Credentials:</strong></p>
                            <p>Email: <code>admin@example.com</code></p>
                            <p>Password: <code>admin123</code></p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <span style={{ color: 'var(--text-light)' }}>New here? </span>
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                textDecoration: 'underline'
                            }}
                        >
                            Create an account
                        </button>
                    </div>
                </form>

                <div style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            textDecoration: 'underline'
                        }}
                    >
                        ← Back to Landing Page
                    </button>
                </div>
            </div>

            <style>{`
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

export default Login;
