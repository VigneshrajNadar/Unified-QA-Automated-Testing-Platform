import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SeleniumExecute = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [scriptName, setScriptName] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [browsers, setBrowsers] = useState(['chrome']); // Default chrome
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleBrowserToggle = (browser) => {
        setBrowsers(prev =>
            prev.includes(browser)
                ? prev.filter(b => b !== browser)
                : [...prev, browser]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !scriptName) return alert('Please provide script and name.');
        if (browsers.length === 0) return alert('Select at least one browser.');

        setUploading(true);
        try {
            // 1. Upload Script
            const formData = new FormData();
            formData.append('script', file);
            formData.append('name', scriptName);
            formData.append('description', 'Uploaded via Web UI');
            formData.append('user_id', 1); // Mock user ID

            const uploadRes = await api.post('/selenium/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const scriptId = uploadRes.data.script_id;

            // 2. Run Test
            const runRes = await api.post('/selenium/run', {
                script_id: scriptId,
                browsers: browsers,
                target_url: targetUrl,
                user_id: 1
            });

            navigate(`/selenium/job/${runRes.data.job_id}`);

        } catch (err) {
            console.error(err);
            alert('Failed to execute test.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="selenium-execute">
            <h1>Execute Selenium Test</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Test Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={scriptName}
                            onChange={(e) => setScriptName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Target URL</label>
                        <input
                            type="url"
                            className="form-control"
                            placeholder="https://example.com"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Upload Script (.js)</label>
                        <input
                            type="file"
                            className="form-control"
                            accept=".js"
                            onChange={handleFileChange}
                            required
                        />
                        <small>Only Node.js Selenium scripts supported for now.</small>
                    </div>

                    <div className="form-group">
                        <label>Select Browsers</label>
                        <div className="browser-selection">
                            <label className={`browser-option ${browsers.includes('chrome') ? 'selected' : ''}`}>
                                <input type="checkbox" checked={browsers.includes('chrome')} onChange={() => handleBrowserToggle('chrome')} />
                                🔵 Chrome
                            </label>
                            <label className={`browser-option ${browsers.includes('firefox') ? 'selected' : ''}`}>
                                <input type="checkbox" checked={browsers.includes('firefox')} onChange={() => handleBrowserToggle('firefox')} />
                                🦊 Firefox
                            </label>

                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={uploading} style={{ width: 'auto' }}>
                        {uploading ? 'Starting...' : '🚀 Start Execution'}
                    </button>
                </form>
            </div>

            <style>{`
                .browser-selection { display: flex; gap: 1rem; margin-top: 0.5rem; }
                .browser-option { 
                    padding: 1rem; 
                    border: 1px solid var(--border); 
                    border-radius: 8px; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem;
                }
                .browser-option.selected {
                    background: var(--primary-light);
                    border-color: var(--primary);
                }
                .form-group label {
                    color: white;
                    margin-bottom: 0.5rem;
                    display: block;
                }
            `}</style>
        </div>
    );
};

export default SeleniumExecute;
