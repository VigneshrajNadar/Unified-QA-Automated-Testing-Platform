import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkVeil from '../components/DarkVeil';
import {
    FaRocket,
    FaShieldAlt,
    FaChartLine,
    FaCheckCircle,
    FaBug,
    FaBolt,
    FaCode,
    FaMobileAlt,
    FaRobot,
    FaServer,
    FaDatabase,
    FaGlobe,
} from 'react-icons/fa';
import {
    SiSelenium,
    SiPostman,
    SiJira,
    SiSlack,
    SiGithub,
    SiDocker
} from 'react-icons/si';
import {
    MdDashboard,
    MdSecurity,
    MdShoppingCart,
    MdSpeed,
    MdMonitorHeart,
    MdCloudQueue,
    MdAutoAwesome,
    MdApi,
    MdImage,
    MdBugReport,
    MdAssignment,
    MdFolderSpecial,
    MdPlayCircle,
    MdPeople
} from 'react-icons/md';

import './LandingPage.css';

import api from '../api';

const LandingPage = () => {
    const navigate = useNavigate();
    const observerRef = useRef(null);
    const [activeTool, setActiveTool] = useState(0);
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalRuns: 0,
        totalTestCases: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch public stats", err);
                // Fallback to 0 or pretend data if fail, but 'only true data' requested
                // so we keep 0.
            }
        };
        fetchStats();
    }, []);

    const tools = [
        {
            name: 'Selenium',
            tag: 'Automation Core',
            icon: <SiSelenium />,
            description: 'Industry-standard web automation framework. Execute complex interaction scripts across all major browsers with stability.',
            features: ['Cross-browser regression testing', 'Legacy application support', 'Complex user flow automation']
        },
        {
            name: 'Postman',
            tag: 'API Testing',
            icon: <SiPostman />,
            description: 'Import collections directly. Validate REST, GraphQL, and SOAP endpoints with automated schema verification.',
            features: ['API Contract Testing', 'Automated Health Checks', 'Response Time Monitoring']
        },
        {
            name: 'Swagger',
            tag: 'API Schema',
            icon: <MdApi />,
            description: 'Parse OpenAPI/Swagger definitions to automatically generate comprehensive API test suites.',
            features: ['Schema Validation', 'Auto-Test Generation', 'Endpoint Discovery']
        },
        {
            name: 'GitHub',
            tag: 'CI/CD & Source',
            icon: <SiGithub />,
            description: 'Trigger test runs on pull requests. Report status checks and link failures directly to lines of code.',
            features: ['PR Quality Gates', 'Version Control Integration', 'Action Triggers']
        },
        {
            name: 'Docker',
            tag: 'Environment',
            icon: <SiDocker />,
            description: 'Spin up isolated, containerized test runners on-demand. Ensure consistent environments for every execution.',
            features: ['Isolated Test Runners', 'Reproducible Environments', 'Parallel Execution grids']
        },
        {
            name: 'k6',
            tag: 'Performance',
            icon: <MdSpeed />,
            description: 'Execute high-load performance tests with k6. Analyze response times, throughput, and error rates.',
            features: ['Load Testing', 'Stress Testing', 'Performance Metrics']
        }
    ];

    const allTools = [
        { icon: <MdDashboard />, name: "Dashboard", desc: "Centralized command center for all quality metrics." },
        { icon: <MdFolderSpecial />, name: "Projects", desc: "Manage workspaces, versioning, and test suites." },
        { icon: <MdAssignment />, name: "Test Cases", desc: "Create, organize, and parameterize manual & auto tests." },
        { icon: <MdPlayCircle />, name: "Test Runs", desc: "Execute automated plans and track real-time progress." },
        { icon: <MdBugReport />, name: "Defects", desc: "Integrated bug tracking with severity & priority mgmt." },
        { icon: <MdAssignment />, name: "Requirements", desc: "Traceability matrix linking tests directly to logic." },
        { icon: <MdAutoAwesome />, name: "AI Generator", desc: "Generate complex test scripts from plain English." },
        { icon: <MdImage />, name: "Visual Testing", desc: "Pixel-perfect regression detection with diff overlays." },
        { icon: <MdApi />, name: "API Testing", desc: "Comprehensive REST & GraphQL endpoint validation." },
        { icon: <MdSpeed />, name: "Performance", desc: "Load testing, stress testing, and response analysis." },
        { icon: <MdAutoAwesome />, name: "Auto-Test", desc: "Background job runner for scheduled regression suites." },
        { icon: <MdCloudQueue />, name: "Selenium Cloud", desc: "Scalable cross-browser grid execution management." },
        { icon: <MdMonitorHeart />, name: "Web Monitor", desc: "24/7 Uptime, health, and latency monitoring." },
        { icon: <MdShoppingCart />, name: "E-Commerce", desc: "Specialized flows for cart, checkout, and inventory." },
        { icon: <MdSecurity />, name: "Security Suite", desc: "DAST/SAST scanning for vulnerabilities (OWASP)." },
        { icon: <MdPeople />, name: "User Mgmt", desc: "Role-based access control (RBAC) and team governance." },
    ];

    const handleMouseMove = (e) => {
        const checkCards = document.querySelectorAll('.tool-card, .toolkit-item');
        checkCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    };

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observerRef.current.observe(el));

        return () => observerRef.current.disconnect();
    }, []);

    return (
        <div className="landing-container">
            {/* Background */}
            <div className="background-veil">
                <DarkVeil />
            </div>

            {/* Navigation */}
            <nav className="navbar">
                <div style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#fff' }}>
                    QA <span style={{ color: '#6366f1' }}>Tool</span>
                </div>
                {/* <div className="nav-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#solutions" className="nav-link">Solutions</a>
                    <a href="#resources" className="nav-link">Resources</a>
                </div> */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/login')} className="btn-login">
                        Log In
                    </button>
                    <button onClick={() => navigate('/signup')} style={{
                        background: '#6366f1',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}>
                        Start Free
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container hero-section">


                <h1 className="hero-title">
                    The Future of <br />
                    <span className="gradient-text">Automated QA Testing</span>
                </h1>

                <p className="hero-sub">
                    Orchestrate end-to-end testing, visual regression, and performance analysis
                    in one unified platform. Stop debugging environment issues and start shipping.
                </p>

                <div className="hero-actions">
                    <button onClick={() => navigate('/signup')} className="btn-primary-glow">
                        Get Started
                    </button>

                </div>
            </main>



            {/* Tool Ecosystem Section */}
            <section className="container ecosystem-section reveal">
                <div className="section-title">
                    <h2 className="text-shimmer" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        Supported Ecosystem
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                        Seamlessly integrates with your existing stack.
                    </p>
                </div>

                <div
                    className="ecosystem-container"
                    onMouseLeave={() => setActiveTool(0)} // Reset to first item on leave
                >
                    {tools.map((tool, index) => (
                        <div
                            key={index}
                            className={`tool-card ${activeTool === index ? 'active' : ''}`}
                            onMouseEnter={() => setActiveTool(index)}
                            onMouseMove={handleMouseMove}
                        >
                            <div className="tool-content">
                                <div className="tool-header">
                                    <div className="tool-icon-wrapper">{tool.icon}</div>
                                    <div className="tool-info">
                                        <h3>{tool.name}</h3>
                                        <span>{tool.tag}</span>
                                    </div>
                                </div>
                                <div className="tool-details">
                                    <p className="tool-description">{tool.description}</p>
                                    <ul>
                                        {tool.features.map((feature, i) => (
                                            <li key={i}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Workflow Pipeline Section (EngiVerse Style) */}
            <section className="container pipeline-section reveal">
                <div className="section-title">
                    <h2 className="text-shimmer" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        End-to-End Workflow
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                        From commit to deployment, we automate every step.
                    </p>
                </div>

                <div className="pipeline-container">
                    <div className="pipeline-step">
                        <div className="step-icon">
                            <SiGithub />
                        </div>
                        <h3>Code Commit</h3>
                        <p>Trigger tests on every push</p>
                        <div className="connector"></div>
                    </div>

                    <div className="pipeline-step">
                        <div className="step-icon">
                            <SiDocker />
                        </div>
                        <h3>Environment</h3>
                        <p>Spin up isolated containers</p>
                        <div className="connector"></div>
                    </div>

                    <div className="pipeline-step">
                        <div className="step-icon">
                            <SiSelenium />
                        </div>
                        <h3>Execute</h3>
                        <p>Run parallel browser tests</p>
                        <div className="connector"></div>
                    </div>

                    <div className="pipeline-step">
                        <div className="step-icon">
                            <FaChartLine />
                        </div>
                        <h3>Analyze</h3>
                        <p>Visualize metrics & export reports</p>
                    </div>
                </div>
            </section>

            {/* Detailed Capabilities Section */}
            <section className="container capabilities-section">
                <div className="capabilities-grid">
                    <div className="reveal">
                        <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                            Engineered for <br />Scale & Precision.
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: '1.8' }}>
                            Our platform isn't just a wrapper—it's a complete testing infrastructure.
                            From handling flakey tests with AI-driven retries to providing deep
                            DOM-level insights for every failure.
                        </p>
                    </div>

                    <div className="reveal">
                        <ul className="capability-list">
                            <li className="capability-item">
                                <div className="cap-icon"><FaRobot /></div>
                                <div className="cap-content">
                                    <h4>AI Test Generation</h4>
                                    <p>Generate comprehensive manual and automated test cases from simple text requirements using advanced LLMs.</p>
                                </div>
                            </li>
                            <li className="capability-item">
                                <div className="cap-icon"><FaServer /></div>
                                <div className="cap-content">
                                    <h4>Parallel Grid Execution</h4>
                                    <p>Run 100+ tests simultaneously in isolated Docker containers.</p>
                                </div>
                            </li>
                            <li className="capability-item">
                                <div className="cap-icon"><FaBug /></div>
                                <div className="cap-content">
                                    <h4>Visual Regression Testing</h4>
                                    <p>Detect pixel-perfect UI changes by comparing screenshots against baselines to catch visual bugs.</p>
                                </div>
                            </li>
                            <li className="capability-item">
                                <div className="cap-icon"><FaGlobe /></div>
                                <div className="cap-content">
                                    <h4>Cross-Browser Matrix</h4>
                                    <p>Test across Chrome, Firefox, Safari, and Edge with a single config.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Specialized Modules Section - NEW */}
            <section className="container specialized-section reveal">
                <div className="section-title">
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        Specialized Modules
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                        Domain-specific tools built directly into the platform.
                    </p>
                </div>

                <div className="capabilities-grid">
                    <div className="glass-card reveal">
                        <div className="bento-icon"><MdSecurity /></div>
                        <h3>Advanced Security Suite</h3>
                        <p>
                            Integrated SAST & DAST scanners that detect SQL Injection, XSS,
                            Misconfigurations, and Sensitive File Exposure automatically.
                        </p>
                    </div>
                    <div className="glass-card reveal">
                        <div className="bento-icon"><MdMonitorHeart /></div>
                        <h3>24/7 Web Monitor</h3>
                        <p>
                            Continuous uptime tracking and broken link detection.
                            Get health scores and response time analytics in real-time.
                        </p>
                        <div className="tag-badge">Selenium Powered</div>
                    </div>
                    <div className="glass-card reveal">
                        <div className="bento-icon"><MdShoppingCart /></div>
                        <h3>E-Commerce Automation</h3>
                        <p>
                            Pre-built specialized flows for online stores.
                            Validate cart logic, checkout processes, and inventory security.
                        </p>
                    </div>
                </div>
            </section>

            {/* Technical Excellence Section - NEW */}
            <section className="container tech-section reveal">
                <div className="section-title">
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        Technical Excellence
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                        Built for developers who care about code quality.
                    </p>
                </div>

                <div className="capabilities-grid">
                    <div className="glass-card reveal">
                        <div className="bento-icon"><MdFolderSpecial /></div>
                        <h3>Playwright Integrated</h3>
                        <p>
                            Leverage the speed and reliability of Playwright for visual regression
                            tests alongside your Selenium grid.
                        </p>
                    </div>
                    <div className="glass-card reveal">
                        <div className="bento-icon"><FaCode /></div>
                        <h3>Code Complexity</h3>
                        <p>
                            Automatic cyclomatic complexity analysis and maintainability index
                            scoring for every JavaScript file.
                        </p>
                    </div>
                    <div className="glass-card reveal">
                        <div className="bento-icon"><MdAssignment /></div>
                        <h3>Smart Reporting</h3>
                        <p>
                            Generate detailed PDF and Excel executive summaries with embedded
                            screenshots and pass/fail trends.
                        </p>
                    </div>
                </div>
            </section>

            {/* Complete Toolkit Grid */}
            <section className="container toolkit-section reveal">
                <div className="section-title">
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        The Complete Platform
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                        Every tool you need to ship confident code, all in one place.
                    </p>
                </div>

                <div className="toolkit-grid">
                    {allTools.map((tool, index) => (
                        <div
                            key={index}
                            className="glass-card toolkit-item reveal"
                            onMouseMove={handleMouseMove}
                        >
                            <div className="toolkit-icon">{tool.icon}</div>
                            <div className="toolkit-info">
                                <h4>{tool.name}</h4>
                                <p>{tool.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials Removed - Replaced with Tool Ecosystem details */}

            {/* Stats Section - REAL DATA */}
            <section className="reveal">
                <div className="stats-container">
                    <div className="stat-item">
                        <div className="stat-value">{stats.totalRuns || 0}</div>
                        <div className="stat-label">Tests Executed</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{stats.totalProjects || 0}</div>
                        <div className="stat-label">Active Projects</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{stats.totalTestCases || 0}</div>
                        <div className="stat-label">Test Cases Managed</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#64748b',
                background: 'rgba(0,0,0,0.5)'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>QA Tool</span>
                </div>
                <p>&copy; 2026 QA Tool Inc. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
