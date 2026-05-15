import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleSelection = () => {
    const navigate = useNavigate();
    const { selectRole } = useAuth();
    const [scrollY, setScrollY] = useState(0);
    const [expandedFeature, setExpandedFeature] = useState(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleGetStarted = () => {
        navigate('/login');
    };

    // Detailed features from your project
    const features = [
        {
            icon: '📊',
            title: 'Dashboard & Analytics',
            desc: 'Real-time overview of all testing activities with comprehensive metrics and charts',
            path: '/',
            details: [
                'Project overview with test case counts',
                'Test execution status tracking (Pass/Fail/Blocked)',
                'Defect statistics and severity breakdown',
                'Recent activity timeline',
                'Test coverage metrics',
                'Team performance analytics'
            ],
            techStack: 'React Charts, Real-time Updates'
        },
        {
            icon: '📁',
            title: 'Project Management',
            desc: 'Organize testing efforts with projects, modules, and team collaboration',
            path: '/projects',
            details: [
                'Create and manage multiple projects',
                'Add modules and sub-modules for organization',
                'Assign team members to projects',
                'Track project-level test metrics',
                'Project-specific test case libraries',
                'Export project reports'
            ],
            techStack: 'SQLite Database, RESTful API'
        },
        {
            icon: '📝',
            title: 'Test Case Management',
            desc: 'Complete test case lifecycle management with version control and reusability',
            path: '/test-cases',
            details: [
                'Create test cases with title, description, and steps',
                'Define preconditions and expected results',
                'Set priority levels (High, Medium, Low)',
                'Categorize by test types (Functional, Regression, Smoke, etc.)',
                'Link test cases to requirements',
                'Bulk import/export capabilities',
                'Search and filter test cases',
                'Reusable test case components'
            ],
            techStack: 'Rich Text Editor, Advanced Filtering'
        },
        {
            icon: '▶️',
            title: 'Test Execution & Runs',
            desc: 'Execute test suites and track results with detailed logging and defect creation',
            path: '/test-runs',
            details: [
                'Create test suites from multiple test cases',
                'Execute test runs with real-time status updates',
                'Mark results as Pass, Fail, or Blocked',
                'Log defects directly from failed tests',
                'Add execution notes and comments',
                'Track execution time and duration',
                'View execution history',
                'Generate execution reports'
            ],
            techStack: 'Real-time Execution Engine'
        },
        {
            icon: '🐛',
            title: 'Defect Management',
            desc: 'Comprehensive defect tracking with attachments, status workflow, and reporting',
            path: '/defects',
            details: [
                'Log defects with title and description',
                'Set severity (Critical, High, Medium, Low)',
                'Set priority for resolution',
                'Track status (Open, In Progress, Resolved, Closed)',
                'Attach screenshots and files',
                'Link defects to test cases',
                'Assign to team members',
                'Export defects to PDF/Excel',
                'View defect screenshots inline'
            ],
            techStack: 'File Upload, PDF/Excel Export'
        },
        {
            icon: '📋',
            title: 'Requirements Traceability',
            desc: 'Link requirements to test cases for complete coverage and traceability matrix',
            path: '/requirements',
            details: [
                'Create and manage requirements',
                'Link requirements to test cases',
                'Track requirement coverage',
                'Generate traceability matrix',
                'Identify untested requirements',
                'Requirements status tracking'
            ],
            techStack: 'Relational Mapping'
        },
        {
            icon: '🤖',
            title: 'AI Test Case Generator',
            desc: 'Automatically generate test cases from requirements using AI/ML algorithms',
            path: '/ai-testgen',
            details: [
                'Input user stories or requirements',
                'AI generates comprehensive test scenarios',
                'Includes positive and negative test cases',
                'Edge case detection',
                'Customizable generation parameters',
                'Review and edit generated tests',
                'Save to test case library'
            ],
            techStack: 'AI/ML Integration, NLP'
        },
        {
            icon: '⚡',
            title: 'Automated Test Execution',
            desc: 'Run automated tests with support for multiple frameworks and parallel execution',
            path: '/autotest',
            details: [
                'Upload test scripts',
                'Execute automated test suites',
                'Parallel test execution',
                'Real-time execution logs',
                'Test result aggregation',
                'Integration with CI/CD pipelines',
                'Scheduled test runs'
            ],
            techStack: 'Test Automation Framework'
        },
        {
            icon: '📸',
            title: 'Visual Regression Testing',
            desc: 'Capture and compare screenshots to detect visual changes and UI regressions',
            path: '/visual-testing',
            details: [
                'Capture baseline screenshots',
                'Run visual comparison tests',
                'Pixel-by-pixel diff analysis',
                'Highlight visual differences',
                'Approve or reject changes',
                'Multi-browser screenshot capture',
                'Responsive design testing',
                'Visual test history'
            ],
            techStack: 'Screenshot Comparison, Image Processing'
        },
        {
            icon: '🔌',
            title: 'API Testing Suite',
            desc: 'Test REST APIs with request builder, validation, and collection management',
            path: '/api-testing',
            details: [
                'Create API test collections',
                'Build HTTP requests (GET, POST, PUT, DELETE)',
                'Add headers and authentication',
                'JSON/XML request body support',
                'Response validation and assertions',
                'Save and organize API tests',
                'Environment variables support',
                'Response time tracking'
            ],
            techStack: 'HTTP Client, JSON Validator'
        },
        {
            icon: '☁️',
            title: 'Selenium Cloud Execution',
            desc: 'Upload and execute Selenium WebDriver scripts on cloud infrastructure',
            path: '/selenium',
            details: [
                'Upload Selenium test scripts',
                'Cloud-based test execution',
                'Multi-browser support',
                'Execution job tracking',
                'Real-time execution logs',
                'Screenshot capture on failure',
                'Job history and results',
                'Scalable test infrastructure'
            ],
            techStack: 'Selenium WebDriver, Cloud Infrastructure'
        },
        {
            icon: '🕸️',
            title: 'Web Monitoring',
            desc: 'Monitor websites with automated checks and scheduled Selenium scripts',
            path: '/monitor',
            details: [
                'Create website monitors',
                'Schedule periodic checks',
                'Automated Selenium script execution',
                'Uptime monitoring',
                'Performance tracking',
                'Alert notifications',
                'Monitor history and logs'
            ],
            techStack: 'Scheduled Jobs, Monitoring Engine'
        },
        {
            icon: '🛍️',
            title: 'E-Commerce Testing',
            desc: 'Automated testing for e-commerce platforms with product validation',
            path: '/ecommerce',
            details: [
                'Product search automation',
                'Price comparison testing',
                'Cart functionality validation',
                'Checkout process testing',
                'Multi-platform support',
                'Test result reporting'
            ],
            techStack: 'E-Commerce Automation Framework'
        },
        {
            icon: '🚀',
            title: 'Performance Testing',
            desc: 'Load testing, stress testing, and performance metrics analysis',
            path: '/performance',
            details: [
                'Load testing with virtual users',
                'Stress testing capabilities',
                'Response time measurement',
                'Throughput analysis',
                'Resource utilization tracking',
                'Performance bottleneck detection',
                'Generate performance reports',
                'Scalability testing'
            ],
            techStack: 'Load Testing Engine, Metrics Collection'
        },
        {
            icon: '🛡️',
            title: 'Security Testing',
            desc: 'SAST and DAST security scanning with vulnerability detection and compliance',
            path: '/security',
            details: [
                'Static Application Security Testing (SAST)',
                'Dynamic Application Security Testing (DAST)',
                'Vulnerability scanning',
                'OWASP Top 10 compliance checks',
                'SQL injection detection',
                'XSS vulnerability testing',
                'Security report generation',
                'Remediation recommendations'
            ],
            techStack: 'Security Scanning Engine, OWASP Standards'
        }
    ];

    const systemFeatures = [
        {
            category: 'User & Access Management',
            icon: '👥',
            items: [
                { title: 'Role-Based Access', desc: 'Admin, Tester, and Developer roles with different permissions' },
                { title: 'User Profiles', desc: 'Manage user information and preferences' },
                { title: 'Team Collaboration', desc: 'Multi-user support with activity tracking' }
            ]
        },
        {
            category: 'Reporting & Export',
            icon: '📊',
            items: [
                { title: 'PDF Reports', desc: 'Export defects and test results to PDF format' },
                { title: 'Excel Export', desc: 'Download data in Excel spreadsheets' },
                { title: 'Custom Reports', desc: 'Generate customized testing reports' }
            ]
        },
        {
            category: 'Test Organization',
            icon: '🗂️',
            items: [
                { title: 'Test Suites', desc: 'Group test cases into executable suites' },
                { title: 'Test Types', desc: 'Functional, Regression, Smoke, Integration, UAT, and more' },
                { title: 'Tagging System', desc: 'Organize tests with custom tags' }
            ]
        },
        {
            category: 'Data Management',
            icon: '💾',
            items: [
                { title: 'File Attachments', desc: 'Upload screenshots, logs, and documents' },
                { title: 'SQLite Database', desc: 'Reliable local database storage' },
                { title: 'Data Export', desc: 'Export test data for backup and analysis' }
            ]
        }
    ];

    const techStack = [
        { name: 'React 19', category: 'Frontend', desc: 'Modern UI framework' },
        { name: 'Node.js', category: 'Backend', desc: 'Server runtime' },
        { name: 'Express 5', category: 'Backend', desc: 'Web framework' },
        { name: 'SQLite3', category: 'Database', desc: 'Embedded database' },
        { name: 'Vite', category: 'Build Tool', desc: 'Fast development' },
        { name: 'Selenium', category: 'Automation', desc: 'Browser automation' }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-body)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Grid Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                opacity: 0.5,
                transform: `translateY(${scrollY * 0.5}px)`
            }}></div>

            {/* Gradient Orbs */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'float 8s ease-in-out infinite'
            }}></div>
            <div style={{
                position: 'fixed',
                bottom: '-20%',
                left: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(118, 75, 162, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'float 10s ease-in-out infinite reverse'
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero Section */}
                <div style={{
                    padding: '6rem 2rem',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.6rem 1.8rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        borderRadius: '50px',
                        marginBottom: '2rem',
                        fontSize: '0.95rem',
                        color: 'var(--primary)',
                        animation: 'fadeInDown 0.8s ease-out',
                        fontWeight: '500'
                    }}>
                        ✨ Complete Quality Assurance Testing Platform
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                        fontWeight: '800',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'fadeInUp 1s ease-out'
                    }}>
                        QA Tool
                    </h1>

                    <p style={{
                        fontSize: '1.3rem',
                        color: 'var(--text-light)',
                        marginBottom: '2rem',
                        maxWidth: '900px',
                        margin: '0 auto 2rem',
                        lineHeight: '1.8',
                        animation: 'fadeInUp 1.2s ease-out'
                    }}>
                        Comprehensive test management system with 15 integrated testing tools including
                        AI-powered automation, visual regression testing, API testing, performance analysis,
                        and security scanning
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        marginBottom: '2rem',
                        animation: 'fadeInUp 1.4s ease-out'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>15+</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Testing Tools</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>Full Stack</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>React + Node.js</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>SQLite</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Database</div>
                        </div>
                    </div>

                    <button
                        onClick={handleGetStarted}
                        className="btn btn-primary"
                        style={{
                            padding: '1.2rem 3.5rem',
                            fontSize: '1.1rem',
                            borderRadius: '50px',
                            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                            transition: 'all 0.3s ease',
                            border: 'none',
                            animation: 'fadeInUp 1.6s ease-out, pulse 2s ease-in-out infinite'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.3)';
                        }}
                    >
                        Launch QA Tool →
                    </button>
                </div>

                {/* Main Features Section with Detailed Info */}
                <div style={{
                    padding: '4rem 2rem',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '700',
                            marginBottom: '1rem',
                            color: 'var(--text-main)'
                        }}>
                            15 Integrated Testing Tools
                        </h2>
                        <p style={{
                            fontSize: '1.2rem',
                            color: 'var(--text-light)',
                            maxWidth: '700px',
                            margin: '0 auto'
                        }}>
                            Everything you need for comprehensive software testing in one platform
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '2rem'
                    }}>
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="card"
                                style={{
                                    padding: '2.5rem',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    animation: `fadeInUp ${1.5 + idx * 0.05}s ease-out`
                                }}
                                onClick={() => setExpandedFeature(expandedFeature === idx ? null : idx)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.4)';
                                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(102, 126, 234, 0.2)';
                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                }}
                            >
                                <div style={{
                                    fontSize: '3.5rem',
                                    marginBottom: '1.5rem',
                                    filter: 'drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    marginBottom: '1rem',
                                    color: 'var(--text-main)',
                                    fontWeight: '600'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    color: 'var(--text-light)',
                                    fontSize: '1rem',
                                    lineHeight: '1.7',
                                    marginBottom: '1.5rem'
                                }}>
                                    {feature.desc}
                                </p>

                                {/* Expandable Details */}
                                {expandedFeature === idx && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        paddingTop: '1.5rem',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                        animation: 'fadeInUp 0.3s ease-out'
                                    }}>
                                        <h4 style={{
                                            fontSize: '1.1rem',
                                            color: 'var(--primary)',
                                            marginBottom: '1rem',
                                            fontWeight: '600'
                                        }}>
                                            Key Features:
                                        </h4>
                                        <ul style={{
                                            listStyle: 'none',
                                            padding: 0,
                                            margin: '0 0 1.5rem 0'
                                        }}>
                                            {feature.details.map((detail, i) => (
                                                <li key={i} style={{
                                                    color: 'var(--text-light)',
                                                    fontSize: '0.95rem',
                                                    padding: '0.5rem 0',
                                                    display: 'flex',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <span style={{
                                                        color: 'var(--primary)',
                                                        marginRight: '0.75rem',
                                                        fontSize: '1.2rem',
                                                        flexShrink: 0
                                                    }}>✓</span>
                                                    <span>{detail}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(102, 126, 234, 0.1)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-dim)',
                                            marginBottom: '1rem'
                                        }}>
                                            <strong style={{ color: 'var(--primary)' }}>Tech:</strong> {feature.techStack}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectRole('admin');
                                                navigate(feature.path);
                                            }}
                                            className="btn btn-primary"
                                            style={{
                                                width: 'auto',
                                                minWidth: '100%',
                                                padding: '0.6rem 1rem',
                                                fontSize: '0.9rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            Open {feature.title} →
                                        </button>
                                    </div>
                                )}

                                {!expandedFeature || expandedFeature !== idx ? (
                                    <div style={{
                                        marginTop: '1rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--primary)',
                                        fontWeight: '500'
                                    }}>
                                        Click to see details →
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Features */}
                <div style={{
                    padding: '4rem 2rem',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    background: 'rgba(102, 126, 234, 0.02)',
                    borderRadius: '30px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '700',
                            marginBottom: '1rem',
                            color: 'var(--text-main)'
                        }}>
                            Additional System Features
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '3rem'
                    }}>
                        {systemFeatures.map((category, idx) => (
                            <div key={idx} style={{ animation: `fadeInUp ${2 + idx * 0.1}s ease-out` }}>
                                <div style={{
                                    fontSize: '2.5rem',
                                    marginBottom: '1rem'
                                }}>
                                    {category.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '1.5rem',
                                    marginBottom: '1.5rem',
                                    color: 'var(--text-main)',
                                    fontWeight: '600'
                                }}>
                                    {category.category}
                                </h3>
                                {category.items.map((item, i) => (
                                    <div key={i} style={{
                                        marginBottom: '1.5rem',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            color: 'var(--text-main)',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {item.title}
                                        </div>
                                        <div style={{
                                            fontSize: '0.95rem',
                                            color: 'var(--text-light)',
                                            lineHeight: '1.6'
                                        }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tech Stack */}
                <div style={{
                    padding: '4rem 2rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '700',
                            marginBottom: '1rem',
                            color: 'var(--text-main)'
                        }}>
                            Technology Stack
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            color: 'var(--text-light)'
                        }}>
                            Built with modern, reliable technologies
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '2rem'
                    }}>
                        {techStack.map((tech, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '2rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '15px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    animation: `fadeInUp ${2.5 + idx * 0.1}s ease-out`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                }}
                            >
                                <div style={{
                                    fontSize: '1.3rem',
                                    fontWeight: '700',
                                    color: 'var(--text-main)',
                                    marginBottom: '0.5rem'
                                }}>
                                    {tech.name}
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--primary)',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {tech.category}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-dim)'
                                }}>
                                    {tech.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div style={{
                    padding: '6rem 2rem',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <div style={{
                        padding: '4rem 2rem',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: '30px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '700',
                            marginBottom: '1.5rem',
                            color: 'var(--text-main)'
                        }}>
                            Ready to Start Testing?
                        </h2>
                        <p style={{
                            fontSize: '1.2rem',
                            color: 'var(--text-light)',
                            marginBottom: '3rem',
                            maxWidth: '700px',
                            margin: '0 auto 3rem'
                        }}>
                            Access all 15 testing tools, manage projects, execute tests, and track defects - all in one comprehensive platform
                        </p>
                        <button
                            onClick={handleGetStarted}
                            className="btn btn-primary"
                            style={{
                                padding: '1.2rem 3.5rem',
                                fontSize: '1.2rem',
                                borderRadius: '50px',
                                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease',
                                border: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.4)';
                            }}
                        >
                            Launch QA Tool →
                        </button>
                    </div>
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
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3); }
                    50% { box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5); }
                }
            `}</style>
        </div>
    );
};

export default RoleSelection;
