import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings as SettingsIcon, Save, ShieldAlert, CheckCircle2, 
    Activity, Shield, Bell, Key, Database, Sliders,
    AlignLeft, Lock, FileText, Zap, ChevronRight, Users, Plus, Trash2, Webhook, Play, Terminal, Copy, Check, GitBranch
} from 'lucide-react';
import api from '../api';

const Settings = () => {
    const [settings, setSettings] = useState({
        coverage_threshold: 80,
        complexity_threshold: 10,
        security_strictness: 'High',
        notifications_enabled: true,
        rtm_strictness: 'Strict',
        defect_custom_fields: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    // Sidebar Tabs State
    const [activeTab, setActiveTab] = useState('quality');
    
    // RBAC state
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState({ name: '', description: '' });

    // Webhooks state
    const [webhooks, setWebhooks] = useState([]);
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', secret: '', events: ['run_completed'] });

    // CI/CD state
    const [ciCopied, setCiCopied] = useState(false);
    const [activeCiTab, setActiveCiTab] = useState('github');

    useEffect(() => {
        fetchSettings();
        fetchRoles();
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            const res = await api.get('/webhooks');
            setWebhooks(res.data);
        } catch (err) {
            console.error('Failed to fetch webhooks');
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (err) {
            console.error('Failed to fetch roles');
        }
    };

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
        setSaving(true);
        try {
            await api.post('/settings', {
                ...settings,
                notifications_enabled: settings.notifications_enabled ? 1 : 0
            });
            setMessage('Settings saved successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error: Failed to save settings');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            await api.post('/roles', newRole);
            setNewRole({ name: '', description: '' });
            fetchRoles();
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleDeleteRole = async (id) => {
        if(!window.confirm('Delete this role?')) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchRoles();
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleCreateWebhook = async (e) => {
        e.preventDefault();
        try {
            await api.post('/webhooks', newWebhook);
            setNewWebhook({ name: '', url: '', secret: '', events: ['run_completed'] });
            fetchWebhooks();
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleDeleteWebhook = async (id) => {
        if(!window.confirm('Delete this webhook?')) return;
        try {
            await api.delete(`/webhooks/${id}`);
            fetchWebhooks();
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'quality', label: 'Quality Thresholds', icon: <Activity className="w-4 h-4" />, desc: 'Configure coverage and complexity limits.' },
        { id: 'security', label: 'Security & Gates', icon: <Shield className="w-4 h-4" />, desc: 'Manage vulnerability policies and strictness.' },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, desc: 'Alerts for failed runs or critical findings.' },
        { id: 'custom-fields', label: 'Custom Fields', icon: <Database className="w-4 h-4" />, desc: 'Dynamic schemas for Defects.' },
        { id: 'rbac', label: 'RBAC Configurator', icon: <Users className="w-4 h-4" />, desc: 'Manage custom roles and permissions.' },
        { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" />, desc: 'Integrate with Slack, Teams, or custom endpoints.' },
        { id: 'integrations', label: 'CI/CD YAML Generator', icon: <Terminal className="w-4 h-4" />, desc: 'Export pipeline configs for GitHub/Jenkins.' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 w-full">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-slate-400" /> System Settings
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-xl">Configure global quality thresholds, security strictness, and system behavior policies for all projects.</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col lg:flex-row gap-6">
                
                {/* Left Sidebar Menu */}
                <div className="lg:w-1/3 xl:w-1/4 shrink-0">
                    <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden p-2">
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left flex flex-col p-4 rounded-2xl transition-all relative overflow-hidden group ${
                                        activeTab === tab.id 
                                        ? 'bg-white/10 border border-white/10 shadow-inner' 
                                        : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="activeTabBorder" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                    )}
                                    <div className={`flex items-center justify-between font-bold text-sm mb-1 ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>
                                        <div className="flex items-center gap-2">
                                            {React.cloneElement(tab.icon, { className: `w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500'}` })}
                                            {tab.label}
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'text-white translate-x-1' : 'text-slate-600 group-hover:translate-x-0.5'}`} />
                                    </div>
                                    <div className="text-[10px] text-slate-500 ml-6 pr-4">{tab.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-8 relative min-h-[500px]">
                    <form onSubmit={handleSubmit} className="h-full flex flex-col">
                        <div className="flex-1 space-y-8">
                            <AnimatePresence mode="wait">
                                
                                {/* QUALITY TAB */}
                                {activeTab === 'quality' && (
                                    <motion.div key="quality" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Quality Thresholds</h2>
                                            <p className="text-sm text-slate-400 mt-1">Set the minimum acceptable standards for code merging and test passing.</p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <label className="flex justify-between items-center mb-4">
                                                <div>
                                                    <span className="block text-sm font-bold text-white">Min Code Coverage (%)</span>
                                                    <span className="text-xs text-slate-400">Build pipelines will fail if overall coverage drops below this value.</span>
                                                </div>
                                                <span className="px-4 py-1.5 bg-[#0D1424] border border-white/10 rounded-lg text-blue-400 font-mono font-bold">{settings.coverage_threshold}%</span>
                                            </label>
                                            <input type="range" name="coverage_threshold" min="0" max="100" value={settings.coverage_threshold} onChange={handleChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                            <div className="flex-1">
                                                <label className="block text-sm font-bold text-white mb-1">Max Cyclomatic Complexity</label>
                                                <span className="text-xs text-slate-400">Functions exceeding this score will be flagged in code reviews.</span>
                                            </div>
                                            <input type="number" name="complexity_threshold" min="1" value={settings.complexity_threshold} onChange={handleChange} className="w-32 px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-center focus:outline-none focus:border-blue-500/50 transition-colors" />
                                        </div>
                                    </motion.div>
                                )}

                                {/* CUSTOM FIELDS TAB */}
                                {activeTab === 'custom-fields' && (
                                    <motion.div key="custom-fields" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Database className="w-5 h-5 text-indigo-400" /> Defect Custom Fields</h2>
                                            <p className="text-sm text-slate-400 mt-1">Configure dynamic schemas. These fields will appear when logging new defects.</p>
                                        </div>

                                        <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                            {settings.defect_custom_fields.map((field, index) => (
                                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Field Name</label>
                                                            <input type="text" value={field.name} onChange={(e) => {
                                                                const newFields = [...settings.defect_custom_fields];
                                                                newFields[index].name = e.target.value;
                                                                setSettings({ ...settings, defect_custom_fields: newFields });
                                                            }} className="w-full px-3 py-2 bg-[#0D1424] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none" placeholder="e.g. Browser Version" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Field Type</label>
                                                            <select value={field.type} onChange={(e) => {
                                                                const newFields = [...settings.defect_custom_fields];
                                                                newFields[index].type = e.target.value;
                                                                setSettings({ ...settings, defect_custom_fields: newFields });
                                                            }} className="w-full px-3 py-2 bg-[#0D1424] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none appearance-none">
                                                                <option value="text">Text</option>
                                                                <option value="number">Number</option>
                                                                <option value="dropdown">Dropdown</option>
                                                            </select>
                                                        </div>
                                                        {field.type === 'dropdown' && (
                                                            <div className="col-span-2">
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Options (Comma separated)</label>
                                                                <input type="text" value={field.options?.join(', ')} onChange={(e) => {
                                                                    const newFields = [...settings.defect_custom_fields];
                                                                    newFields[index].options = e.target.value.split(',').map(s => s.trim());
                                                                    setSettings({ ...settings, defect_custom_fields: newFields });
                                                                }} className="w-full px-3 py-2 bg-[#0D1424] border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none" placeholder="Option 1, Option 2, Option 3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button type="button" onClick={() => {
                                                        const newFields = settings.defect_custom_fields.filter((_, i) => i !== index);
                                                        setSettings({ ...settings, defect_custom_fields: newFields });
                                                    }} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-5">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                setSettings({ ...settings, defect_custom_fields: [...settings.defect_custom_fields, { name: '', type: 'text', options: [] }] });
                                            }} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl text-slate-400 hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                                <Plus className="w-4 h-4" /> Add Custom Field
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SECURITY TAB */}
                                {activeTab === 'security' && (
                                    <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-rose-400" /> Security & Policy Gates</h2>
                                            <p className="text-sm text-slate-400 mt-1">Define strictness levels for vulnerability management and requirements tracing.</p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <label className="block text-sm font-bold text-white mb-1">Security Scan Strictness</label>
                                            <p className="text-xs text-slate-400 mb-4">Determine which severity of vulnerabilities will cause automated builds to fail.</p>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {['Low', 'Medium', 'High'].map(level => (
                                                    <label key={level} className={`cursor-pointer p-4 rounded-xl border transition-all ${settings.security_strictness === level ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.1)]' : 'bg-[#0D1424] border-white/10 hover:border-white/20'}`}>
                                                        <input type="radio" name="security_strictness" value={level} checked={settings.security_strictness === level} onChange={handleChange} className="hidden" />
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`font-bold text-sm ${settings.security_strictness === level ? 'text-rose-400' : 'text-white'}`}>{level}</span>
                                                            {settings.security_strictness === level && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 leading-tight block">
                                                            {level === 'Low' && 'Only Critical vulnerabilities block builds.'}
                                                            {level === 'Medium' && 'Critical & High vulnerabilities block builds.'}
                                                            {level === 'High' && 'All identified vulnerabilities block builds.'}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <label className="block text-sm font-bold text-white mb-1">Requirements Traceability Matrix (RTM) Gate</label>
                                            <p className="text-xs text-slate-400 mb-4">Controls requirements trace matrix pass/fail evaluation across linked test cases.</p>
                                            <select name="rtm_strictness" value={settings.rtm_strictness} onChange={handleChange} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer">
                                                <option value="Strict">Strict (Fail if ANY associated test fails)</option>
                                                <option value="Lenient">Lenient (Pass if some tests are Blocked/Skipped)</option>
                                                <option value="Loose">Loose (Ignore warnings completely)</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                )}

                                {/* NOTIFICATIONS TAB */}
                                {activeTab === 'notifications' && (
                                    <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-400" /> Notifications & Alerts</h2>
                                            <p className="text-sm text-slate-400 mt-1">Manage how the system alerts administrators about critical events.</p>
                                        </div>

                                        <label className="flex items-start justify-between gap-4 p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-colors w-full group">
                                            <div>
                                                <div className="text-base font-bold text-white mb-1">Email Alerting System</div>
                                                <div className="text-sm text-slate-400">Receive instant email notifications for failed test runs, pipeline blockages, or critical security vulnerabilities detected in production.</div>
                                            </div>
                                            <div className="relative flex items-center justify-center shrink-0 mt-1">
                                                <input type="checkbox" name="notifications_enabled" checked={settings.notifications_enabled} onChange={handleChange} className="peer sr-only" />
                                                <div className="w-12 h-7 bg-[#0D1424] border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400"></div>
                                            </div>
                                        </label>
                                    </motion.div>
                                )}

                                {/* RBAC TAB */}
                                {activeTab === 'rbac' && (
                                    <motion.div key="rbac" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400" /> Dynamic Roles & Permissions</h2>
                                            <p className="text-sm text-slate-400 mt-1">Configure custom roles with specific feature access for your enterprise.</p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-white mb-4">Create New Role</h3>
                                            <div className="flex gap-4">
                                                <input type="text" placeholder="Role Name (e.g., Guest QA)" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} className="flex-1 px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                                                <input type="text" placeholder="Description" value={newRole.description} onChange={e => setNewRole({...newRole, description: e.target.value})} className="flex-1 px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                                                <button type="button" onClick={handleCreateRole} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> Add
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {roles.map(role => (
                                                <div key={role._id} className="flex justify-between items-center bg-[#0D1424] p-4 rounded-xl border border-white/5">
                                                    <div>
                                                        <h4 className="font-bold text-white flex items-center gap-2">
                                                            {role.name}
                                                            {!role.is_custom && <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider font-black">System Default</span>}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 mt-1">{role.description}</p>
                                                    </div>
                                                    {role.is_custom && (
                                                        <button type="button" onClick={() => handleDeleteRole(role._id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {roles.length === 0 && <p className="text-slate-500 text-sm italic">No custom roles defined.</p>}
                                        </div>
                                    </motion.div>
                                )}

                                {/* WEBHOOKS TAB */}
                                {activeTab === 'webhooks' && (
                                    <motion.div key="webhooks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Webhook className="w-5 h-5 text-emerald-400" /> Webhook Integrations</h2>
                                            <p className="text-sm text-slate-400 mt-1">Send real-time JSON payloads to external services (Slack, Discord, custom servers) on specific events.</p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-white mb-4">Create New Webhook</h3>
                                            <div className="space-y-4">
                                                <div className="flex gap-4">
                                                    <input type="text" placeholder="Webhook Name (e.g., Slack Alerts)" value={newWebhook.name} onChange={e => setNewWebhook({...newWebhook, name: e.target.value})} className="flex-1 px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                    <input type="url" placeholder="Endpoint URL (https://...)" value={newWebhook.url} onChange={e => setNewWebhook({...newWebhook, url: e.target.value})} className="flex-[2] px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                </div>
                                                <div className="flex gap-4">
                                                    <input type="password" placeholder="Secret Key (Optional, for HMAC signature)" value={newWebhook.secret} onChange={e => setNewWebhook({...newWebhook, secret: e.target.value})} className="flex-1 px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                                                    <button type="button" onClick={handleCreateWebhook} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2">
                                                        <Plus className="w-4 h-4" /> Add Webhook
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {webhooks.map(hook => (
                                                <div key={hook._id} className="flex justify-between items-center bg-[#0D1424] p-4 rounded-xl border border-white/5 group hover:border-white/20 transition-colors">
                                                    <div>
                                                        <h4 className="font-bold text-white flex items-center gap-2">
                                                            {hook.name}
                                                            {hook.is_active ? <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider font-black">Active</span> : <span className="text-[10px] bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded uppercase tracking-wider font-black">Disabled</span>}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 font-mono mt-1">{hook.url}</p>
                                                    </div>
                                                    <button type="button" onClick={() => handleDeleteWebhook(hook._id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {webhooks.length === 0 && <p className="text-slate-500 text-sm italic">No webhooks configured.</p>}
                                        </div>
                                    </motion.div>
                                )}

                                {/* INTEGRATIONS TAB */}
                                {activeTab === 'integrations' && (
                                    <motion.div key="integrations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="border-b border-white/10 pb-4 mb-6">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Terminal className="w-5 h-5 text-purple-400" /> CI/CD YAML Generator</h2>
                                            <p className="text-sm text-slate-400 mt-1">Generate pipeline configurations to integrate automated testing directly into your CI/CD workflows.</p>
                                        </div>

                                        <div className="bg-[#0D1424] border border-white/10 rounded-2xl overflow-hidden">
                                            <div className="flex border-b border-white/10">
                                                <button type="button" onClick={() => setActiveCiTab('github')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeCiTab === 'github' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>GitHub Actions</button>
                                                <button type="button" onClick={() => setActiveCiTab('jenkins')} className={`flex-1 py-3 text-sm font-bold transition-colors border-l border-white/10 ${activeCiTab === 'jenkins' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Jenkinsfile</button>
                                                <button type="button" onClick={() => setActiveCiTab('gitlab')} className={`flex-1 py-3 text-sm font-bold transition-colors border-l border-white/10 ${activeCiTab === 'gitlab' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>GitLab CI</button>
                                            </div>
                                            
                                            <div className="relative">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const code = activeCiTab === 'github' ? `name: QA Test Pipeline\n\non: [push, pull_request]\n\njobs:\n  run-tests:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - name: Trigger QA Platform Tests\n        run: |\n          curl -X POST https://api.yourqa.com/v1/trigger-run \\ \n          -H "Authorization: Bearer \${{ secrets.QA_API_KEY }}" \\ \n          -d '{"project_id": "global"}'`
                                                        : activeCiTab === 'jenkins' ? `pipeline {\n    agent any\n    stages {\n        stage('QA Platform Tests') {\n            steps {\n                withCredentials([string(credentialsId: 'qa-api-key', variable: 'QA_API_KEY')]) {\n                    sh '''\n                    curl -X POST https://api.yourqa.com/v1/trigger-run \\\n                    -H "Authorization: Bearer $QA_API_KEY" \\\n                    -d '{"project_id": "global"}'\n                    '''\n                }\n            }\n        }\n    }\n}`
                                                        : `stages:\n  - test\n\nqa_platform_tests:\n  stage: test\n  script:\n    - curl -X POST https://api.yourqa.com/v1/trigger-run -H "Authorization: Bearer $QA_API_KEY" -d '{"project_id": "global"}'`;
                                                        navigator.clipboard.writeText(code);
                                                        setCiCopied(true);
                                                        setTimeout(() => setCiCopied(false), 2000);
                                                    }}
                                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                                >
                                                    {ciCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                    {ciCopied ? 'Copied' : 'Copy'}
                                                </button>
                                                <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto custom-scrollbar">
                                                    {activeCiTab === 'github' && (
`name: QA Test Pipeline

on: [push, pull_request]

jobs:
  run-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger QA Platform Tests
        run: |
          curl -X POST https://api.yourqa.com/v1/trigger-run \\ 
          -H "Authorization: Bearer \${{ secrets.QA_API_KEY }}" \\ 
          -d '{"project_id": "global"}'`
                                                    )}
                                                    {activeCiTab === 'jenkins' && (
`pipeline {
    agent any
    stages {
        stage('QA Platform Tests') {
            steps {
                withCredentials([string(credentialsId: 'qa-api-key', variable: 'QA_API_KEY')]) {
                    sh '''
                    curl -X POST https://api.yourqa.com/v1/trigger-run \\
                    -H "Authorization: Bearer $QA_API_KEY" \\
                    -d '{"project_id": "global"}'
                    '''
                }
            }
        }
    }
}`
                                                    )}
                                                    {activeCiTab === 'gitlab' && (
`stages:
  - test

qa_platform_tests:
  stage: test
  script:
    - curl -X POST https://api.yourqa.com/v1/trigger-run \\
      -H "Authorization: Bearer $QA_API_KEY" \\
      -d '{"project_id": "global"}'`
                                                    )}
                                                </pre>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* Sticky Bottom Action Bar */}
                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0B0F19]/90 backdrop-blur sticky bottom-0 z-20 -mx-8 -mb-8 px-8 pb-8 rounded-b-3xl">
                            <AnimatePresence mode="wait">
                                {message ? (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold w-full sm:w-auto ${message.includes('Error') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                        {message.includes('Error') ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                        <span className="truncate">{message}</span>
                                    </motion.div>
                                ) : (
                                    <div className="text-xs text-slate-500 hidden sm:block">All changes are immediately applied to the system runtime upon saving.</div>
                                )}
                            </AnimatePresence>

                            <button type="submit" disabled={saving} className="flex justify-center items-center gap-2 px-8 py-3.5 bg-white text-black hover:bg-slate-200 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-50 w-full sm:w-auto shrink-0">
                                {saving ? <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Settings;
