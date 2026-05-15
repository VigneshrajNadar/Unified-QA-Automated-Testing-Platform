import React, { useState, useEffect } from 'react';
import api from '../api';
import './AITestGenerator.css';

const AITestGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedCases, setGeneratedCases] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedCases, setSelectedCases] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects", err);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGeneratedCases([]);
        setSuccessMsg('');

        try {
            const res = await api.post('/ai/generate', { prompt });
            let resultText = res.data.result;

            // Clean up if AI output has extra text (logs, markdown)
            const startIndex = resultText.indexOf('[');
            const endIndex = resultText.lastIndexOf(']');

            if (startIndex !== -1 && endIndex !== -1) {
                resultText = resultText.substring(startIndex, endIndex + 1);
            } else {
                // Fallback attempt
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            try {
                const parsed = JSON.parse(resultText);
                if (Array.isArray(parsed)) {
                    setGeneratedCases(parsed);
                    // Select all by default
                    const initialSelection = {};
                    parsed.forEach((_, idx) => initialSelection[idx] = true);
                    setSelectedCases(initialSelection);
                } else {
                    setError("AI response was not a valid list. Raw output: " + resultText.substring(0, 100) + "...");
                }
            } catch (parseErr) {
                setError("Failed to parse AI response as JSON. Try again. Raw: " + resultText.substring(0, 100));
            }

        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedProject) {
            setError("Please select a project to save these test cases to.");
            return;
        }

        setSaving(true);
        setSuccessMsg('');
        let savedCount = 0;

        try {
            const casesToSave = generatedCases.filter((_, idx) => selectedCases[idx]);

            for (const tc of casesToSave) {
                await api.post('/testcases', {
                    project_id: selectedProject,
                    title: tc.title,
                    description: tc.description,
                    preconditions: tc.preconditions,
                    steps: tc.steps,
                    expected_result: tc.expected_result,
                    priority: tc.priority || 'Medium',
                    module_id: null // Optional: could add module selection later
                });
                savedCount++;
            }
            setSuccessMsg(`Successfully saved ${savedCount} test cases to project!`);
            setGeneratedCases([]); // Clear after save
        } catch (err) {
            setError("Error saving test cases: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSelection = (idx) => {
        setSelectedCases(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    return (
        <div className="ai-page">
            <div className="ai-header">
                <h1>AI Test Case Generator 🤖</h1>
                <p>Describe your feature, parse the output, and save directly to your project.</p>
            </div>

            <div className="ai-grid">
                <div className="input-card">
                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="form-group">
                            <label>Target Project (Required for Saving)</label>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="project-select"
                            >
                                <option value="">-- Select Project --</option>
                                {projects.map(p => (
                                    <option key={p.project_id} value={p.project_id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Feature Requirement</label>
                            <textarea
                                placeholder="Describe the feature..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                style={{ height: '100%' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
                            {loading ? 'Generating...' : '✨ Generate & Parse'}
                        </button>
                    </form>
                    {error && <div className="error-message">{error}</div>}
                    {successMsg && <div className="success-message" style={{ color: '#4ade80', marginTop: '1rem', padding: '1rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px' }}>{successMsg}</div>}
                </div>

                <div className="result-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Generated Cases ({generatedCases.length})</h3>
                        {generatedCases.length > 0 && (
                            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: 'auto', background: '#10b981' }}>
                                {saving ? 'Saving...' : '💾 Save Selected'}
                            </button>
                        )}
                    </div>

                    <div className="markdown-output">
                        {loading ? (
                            <div className="loading-placeholder"><div className="spinner"></div><p>Asking AI...</p></div>
                        ) : generatedCases.length > 0 ? (
                            <div className="cases-list">
                                {generatedCases.map((tc, idx) => (
                                    <div key={idx} className={`generated-case ${selectedCases[idx] ? 'selected' : ''}`} onClick={() => toggleSelection(idx)}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            <input
                                                type="checkbox"
                                                checked={!!selectedCases[idx]}
                                                onChange={() => { }}
                                                style={{ marginTop: '0.3rem', transform: 'scale(1.2)' }}
                                            />
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>{tc.title}</h4>
                                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>{tc.description}</p>
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                    <strong>Steps:</strong> {tc.steps?.substring(0, 50)}...
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-placeholder"><p>Results will appear here...</p></div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default AITestGenerator;
