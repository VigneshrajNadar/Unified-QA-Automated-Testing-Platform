import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';


import AnimatedBackground from './AnimatedBackground';

const Layout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isDark, setIsDark] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    };

    return (
        <div className="layout" style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
            <AnimatedBackground />
            <aside className="sidebar" style={{ zIndex: 10 }}>
                <h2 style={{ padding: '0 1rem', marginBottom: '2rem' }}>QA Tool</h2>
                <nav>
                    <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>Dashboard</Link>
                    <Link to="/projects" className={`sidebar-link ${isActive('/projects')}`}>Projects</Link>
                    <Link to="/test-cases" className={`sidebar-link ${isActive('/test-cases')}`}>Test Cases</Link>
                    <Link to="/test-runs" className={`sidebar-link ${isActive('/test-runs')}`}>Test Runs</Link>
                    <Link to="/defects" className={`sidebar-link ${isActive('/defects')}`}>Defects</Link>
                    <Link to="/requirements" className={`sidebar-link ${isActive('/requirements')}`}>Requirements</Link>
                    <Link to="/ai-testgen" className={`sidebar-link ${isActive('/ai-testgen')}`}>🤖 AI Test Generator</Link>
                    <Link to="/visual-testing" className={`sidebar-link ${isActive('/visual-testing')}`}>📸 Visual Testing</Link>
                    <Link to="/api-testing" className={`sidebar-link ${isActive('/api-testing')}`}>🔌 API Testing</Link>
                    <Link to="/performance" className={`sidebar-link ${isActive('/performance')}`}>🚀 Performance</Link>
                    <Link to="/autotest" className={`sidebar-link ${isActive('/autotest')}`}>⚡ Auto-Test</Link>
                    <Link to="/selenium" className={`sidebar-link ${isActive('/selenium')}`}>☁️ Selenium Cloud</Link>
                    <Link to="/monitor" className={`sidebar-link ${isActive('/monitor')}`}>🕸️ Selenium Web Monitor</Link>
                    <Link to="/ecommerce" className={`sidebar-link ${isActive('/ecommerce')}`}>🛍️ E-Commerce Auto</Link>
                    <Link to="/security" className={`sidebar-link ${isActive('/security')}`}>🛡️ Security Suite</Link>

                    <div style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
                    {user?.role?.toLowerCase() === 'admin' && <Link to="/users" className={`sidebar-link ${isActive('/users')}`}>Manage Users</Link>}
                    <Link to="/settings" className={`sidebar-link ${isActive('/settings')}`}>Settings</Link>

                    <button
                        onClick={useAuth().logout}
                        className="sidebar-link"
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            marginTop: '1rem'
                        }}
                    >
                        🚪 Logout
                    </button>
                </nav>

                {/* Sidebar Footer (User & Controls) */}
                <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        <span style={{ fontSize: '1.rem', marginRight: '0.5rem' }}>
                            {user?.role?.toLowerCase() === 'admin' && '👑'}
                            {user?.role?.toLowerCase() === 'tester' && '🧪'}
                            {user?.role?.toLowerCase() === 'lead' && '👨‍💼'}
                            {user?.role?.toLowerCase() === 'developer' && '💻'}
                            {user?.role?.toLowerCase() === 'viewer' && '👁️'}
                        </span>
                        {user?.name || 'User'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={toggleTheme} className="btn" style={{ flex: 1, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0.5rem' }}>
                            {isDark ? '☀️' : '🌙'}
                        </button>
                        <button onClick={useAuth().logout} className="btn" style={{ flex: 1, border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', padding: '0.5rem' }}>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
            <main className="main-content" style={{ zIndex: 10, position: 'relative' }}>
                {/* Navbar Removed */}
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
