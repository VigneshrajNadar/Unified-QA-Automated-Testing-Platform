import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const TestRuns = () => {
    const [activeTab, setActiveTab] = useState('runs'); // 'runs' or 'suites'
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');

    const [suites, setSuites] = useState([]);
    const [runs, setRuns] = useState([]);

    // Suite Form
    const [suiteName, setSuiteName] = useState('');
    const [suiteDesc, setSuiteDesc] = useState('');
    const [availableTestCases, setAvailableTestCases] = useState([]);
    const [selectedTestCases, setSelectedTestCases] = useState([]);

    // Run Form
    const [runName, setRunName] = useState('');
    const [selectedSuite, setSelectedSuite] = useState('');

    // Modal States
    const [showSuiteForm, setShowSuiteForm] = useState(false);
    const [showRunForm, setShowRunForm] = useState(false);

    // Custom Test Case Form
    const [showCustomTestCaseForm, setShowCustomTestCaseForm] = useState(false);
    const [customTestCase, setCustomTestCase] = useState({
        title: '',
        description: '',
        steps: '',
        expected_result: '',
        priority: 'Medium'
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchSuites();
            fetchRuns(); // In a real app, runs might be fetched per project too
            fetchTestCases();
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        const res = await api.get('/projects');
        setProjects(res.data);
    };

    const fetchSuites = async () => {
        const res = await api.get(`/runs/suites?project_id=${selectedProject}`);
        setSuites(res.data);
    };

    const fetchRuns = async () => {
        // Ideally filter by project, but for now fetch all or filter client side if API doesn't support
        // My API for runs doesn't support filtering by project yet, let's just fetch all? 
        // Wait, I didn't implement GET /api/runs (list all). I implemented GET /api/runs/:id.
        // I need to implement GET /api/runs in backend or just use what I have.
        // Let's implement a simple list fetch in backend or just skip listing for now?
        // No, I need to list runs. I'll add GET /api/runs to backend quickly or just mock it?
        // I'll assume I can add it or I'll just use the suites for now.
        // Actually, I missed GET /api/runs in backend. I only did GET /api/runs/:id.
        // I will add it to backend in a separate tool call or just fix it now.
        // Let's fix backend first? No, let's write frontend assuming it exists, then fix backend.
        try {
            const res = await api.get(`/runs?project_id=${selectedProject}`);
            setRuns(res.data);
        } catch (err) {
            console.log('Fetch runs failed', err);
        }
    };

    const fetchTestCases = async () => {
        const res = await api.get(`/testcases?project_id=${selectedProject}`);
        setAvailableTestCases(res.data);
    };

    const handleCreateSuite = async (e) => {
        e.preventDefault();
        try {
            await api.post('/runs/suites', {
                project_id: selectedProject,
                name: suiteName,
                description: suiteDesc,
                test_case_ids: selectedTestCases
            });
            setSuiteName('');
            setSuiteDesc('');
            setSelectedTestCases([]);
            setShowSuiteForm(false);
            fetchSuites();
            alert('Suite created');
        } catch (err) {
            alert('Failed to create suite');
        }
    };

    const handleCreateRun = async (e) => {
        e.preventDefault();
        try {
            await api.post('/runs', {
                project_id: selectedProject,
                test_suite_id: selectedSuite,
                name: runName
            });
            setRunName('');
            setSelectedSuite('');
            setShowRunForm(false);
            fetchRuns();
            alert('Run created');
        } catch (err) {
            alert('Failed to create run');
        }
    };

    const toggleTestCase = (id) => {
        if (selectedTestCases.includes(id)) {
            setSelectedTestCases(selectedTestCases.filter(tcId => tcId !== id));
        } else {
            setSelectedTestCases([...selectedTestCases, id]);
        }
    };

    const handleCreateCustomTestCase = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/testcases', {
                project_id: selectedProject,
                title: customTestCase.title,
                description: customTestCase.description,
                steps: customTestCase.steps,
                expected_result: customTestCase.expected_result,
                priority: customTestCase.priority,
                test_types: []
            });

            // Refresh test cases list
            await fetchTestCases();

            // Auto-select the newly created test case
            if (response.data.testCaseId) {
                setSelectedTestCases([...selectedTestCases, response.data.testCaseId]);
            }

            // Reset form and close modal
            setCustomTestCase({
                title: '',
                description: '',
                steps: '',
                expected_result: '',
                priority: 'Medium'
            });
            setShowCustomTestCaseForm(false);
            alert('Custom test case created and added to suite!');
        } catch (err) {
            alert('Failed to create custom test case');
        }
    };

    return (
        <div>
            <h1>Test Management</h1>

            <div style={{ marginBottom: '2rem' }}>
                <label>Select Project: </label>
                <select className="input" style={{ width: 'auto', display: 'inline-block' }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                    <option value="">-- Select Project --</option>
                    {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                </select>
            </div>

            {selectedProject && (
                <>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button className={`btn ${activeTab === 'runs' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('runs')} style={{ width: 'auto' }}>Test Runs</button>
                        <button className={`btn ${activeTab === 'suites' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('suites')} style={{ width: 'auto' }}>Test Suites</button>
                    </div>

                    {activeTab === 'suites' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setShowSuiteForm(true)} style={{ width: 'auto' }}>
                                    + New Test Suite
                                </button>
                            </div>

                            {showSuiteForm && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000, backdropFilter: 'blur(5px)'
                                }} onClick={() => setShowSuiteForm(false)}>
                                    <div className="card" style={{ width: '90%', maxWidth: '600px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                                        <h3 style={{ marginBottom: '1.5rem' }}>Create Test Suite</h3>
                                        <form onSubmit={handleCreateSuite}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Suite Name</label>
                                                <input className="input" placeholder="Suite Name" value={suiteName} onChange={e => setSuiteName(e.target.value)} required />
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                                <textarea className="input" placeholder="Description" value={suiteDesc} onChange={e => setSuiteDesc(e.target.value)} rows={3} />
                                            </div>

                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <p style={{ fontWeight: 'bold', margin: 0 }}>Select Test Cases:</p>
                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', width: 'auto' }}
                                                        onClick={() => setShowCustomTestCaseForm(true)}
                                                    >
                                                        + Create Custom Test Case
                                                    </button>
                                                </div>
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                                    {availableTestCases.length === 0 ? (
                                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '0.5rem' }}>No test cases available.</p>
                                                    ) : (
                                                        availableTestCases.map(tc => (
                                                            <div key={tc.test_case_id} style={{ marginBottom: '0.5rem' }}>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedTestCases.includes(tc.test_case_id)}
                                                                        onChange={() => toggleTestCase(tc.test_case_id)}
                                                                        style={{ width: '1.2rem', height: '1.2rem' }}
                                                                    />
                                                                    <span>{tc.title}</span>
                                                                </label>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowSuiteForm(false)} style={{ width: 'auto' }}>Cancel</button>
                                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Create Suite</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                {suites.length === 0 ? (
                                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                                        No test suites found. Create one to get started.
                                    </div>
                                ) : (
                                    suites.map(s => (
                                        <div key={s.test_suite_id} className="card">
                                            <h4>{s.name}</h4>
                                            <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>{s.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'runs' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button className="btn btn-primary" onClick={() => setShowRunForm(true)} style={{ width: 'auto' }}>
                                    + Start New Run
                                </button>
                            </div>

                            {showRunForm && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1000, backdropFilter: 'blur(5px)'
                                }} onClick={() => setShowRunForm(false)}>
                                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '2rem' }} onClick={e => e.stopPropagation()}>
                                        <h3 style={{ marginBottom: '1.5rem' }}>Start New Run</h3>
                                        <form onSubmit={handleCreateRun}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Run Name</label>
                                                <input className="input" placeholder="e.g. Release 1.0 Regression" value={runName} onChange={e => setRunName(e.target.value)} required />
                                            </div>
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Test Suite</label>
                                                <select className="input" value={selectedSuite} onChange={e => setSelectedSuite(e.target.value)} required>
                                                    <option value="">Select Test Suite</option>
                                                    {suites.map(s => <option key={s.test_suite_id} value={s.test_suite_id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowRunForm(false)} style={{ width: 'auto' }}>Cancel</button>
                                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Start Run</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                {runs.length === 0 ? (
                                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                                        No test runs executed yet. Start a new one!
                                    </div>
                                ) : (
                                    runs.map(r => (
                                        <div key={r.test_run_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4>{r.name}</h4>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Executed by: {r.executed_by_name || 'Unknown'}</p>
                                            </div>
                                            <Link to={`/execute-run/${r.test_run_id}`} className="btn btn-primary" style={{ width: 'auto' }}>Execute / View</Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Custom Test Case Modal */}
            {showCustomTestCaseForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div className="card" style={{
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Create Custom Test Case</h3>
                            <button
                                type="button"
                                onClick={() => setShowCustomTestCaseForm(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text)'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateCustomTestCase}>
                            <input
                                className="input"
                                placeholder="Test Case Title *"
                                value={customTestCase.title}
                                onChange={(e) => setCustomTestCase({ ...customTestCase, title: e.target.value })}
                                required
                            />
                            <textarea
                                className="input"
                                placeholder="Description"
                                value={customTestCase.description}
                                onChange={(e) => setCustomTestCase({ ...customTestCase, description: e.target.value })}
                                rows={3}
                            />
                            <textarea
                                className="input"
                                placeholder="Steps (one per line)"
                                value={customTestCase.steps}
                                onChange={(e) => setCustomTestCase({ ...customTestCase, steps: e.target.value })}
                                rows={4}
                            />
                            <textarea
                                className="input"
                                placeholder="Expected Result"
                                value={customTestCase.expected_result}
                                onChange={(e) => setCustomTestCase({ ...customTestCase, expected_result: e.target.value })}
                                rows={3}
                            />
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priority</label>
                                <select
                                    className="input"
                                    value={customTestCase.priority}
                                    onChange={(e) => setCustomTestCase({ ...customTestCase, priority: e.target.value })}
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowCustomTestCaseForm(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create & Add to Suite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestRuns;
