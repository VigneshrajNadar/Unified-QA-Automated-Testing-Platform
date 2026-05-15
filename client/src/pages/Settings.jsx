import { useState, useEffect } from 'react';
import api from '../api';

const Settings = () => {
    const [settings, setSettings] = useState({
        coverage_threshold: 80,
        complexity_threshold: 10,
        security_strictness: 'High',
        notifications_enabled: true,
        rtm_strictness: 'Strict'
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings({
                ...res.data,
                notifications_enabled: res.data.notifications_enabled === 1,
                rtm_strictness: res.data.rtm_strictness || 'Strict'
            });
        } catch (err) {
            console.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/settings', {
                ...settings,
                notifications_enabled: settings.notifications_enabled ? 1 : 0
            });
            setMessage('Settings updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update settings.');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <h1 className="mb-6">System Configuration</h1>

            <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Test Thresholds */}
                    <div>
                        <h3 className="mb-4 border-b border-gray-700 pb-2">Quality Thresholds</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Min Code Coverage (%)</label>
                                <input
                                    type="number"
                                    name="coverage_threshold"
                                    value={settings.coverage_threshold}
                                    onChange={handleChange}
                                    className="input"
                                    min="0" max="100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Builds will fail if coverage drops below this value.</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Max Cyclomatic Complexity</label>
                                <input
                                    type="number"
                                    name="complexity_threshold"
                                    value={settings.complexity_threshold}
                                    onChange={handleChange}
                                    className="input"
                                    min="1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Functions exceeding this complexity score will be flagged.</p>
                            </div>
                        </div>
                    </div>

                    {/* Security & Quality Gates */}
                    <div>
                        <h3 className="mb-4 border-b border-gray-700 pb-2">Policy & Gates</h3>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-1">Security Scan Strictness</label>
                            <select
                                name="security_strictness"
                                value={settings.security_strictness}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="Low">Low (Critical only)</option>
                                <option value="Medium">Medium (Critical & High)</option>
                                <option value="High">High (All vulnerabilities)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">RTM Quality Gate Strictness</label>
                            <select
                                name="rtm_strictness"
                                value={settings.rtm_strictness}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="Strict">Strict (Fail if any test fails)</option>
                                <option value="Lenient">Lenient (Pass if some Blocked/Not Run)</option>
                                <option value="Loose">Loose (Ignore warnings completely)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Controls when a requirement is marked as "Verified" or "Failed".</p>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div>
                        <h3 className="mb-4 border-b border-gray-700 pb-2">Notifications</h3>
                        <label className="checkbox-card">
                            <input
                                type="checkbox"
                                name="notifications_enabled"
                                checked={settings.notifications_enabled}
                                onChange={handleChange}
                            />
                            <span>Enable Email Notifications for Failed Runs</span>
                        </label>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="btn btn-primary w-full">
                            Save Configuration
                        </button>
                    </div>

                    {message && (
                        <div className={`p-3 rounded text-center ${message.includes('Success') ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Settings;
