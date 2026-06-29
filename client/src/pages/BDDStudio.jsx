import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Download, Trash2, Wand2, Copy, Check, ChevronDown, ChevronRight, PlusCircle } from 'lucide-react';
import api from '../api';

const STEP_TYPES = ['Given', 'When', 'Then', 'And', 'But'];
const STEP_COLORS = {
    Given: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    When: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    Then: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    And: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    But: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

const emptyScenario = () => ({
    id: Date.now(),
    title: 'New Scenario',
    steps: [{ id: Date.now(), type: 'Given', text: '' }]
});

const BDDStudio = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [feature, setFeature] = useState({
        title: 'My Feature',
        description: 'In order to ...\nAs a ...\nI want to ...',
        scenarios: [emptyScenario()]
    });
    const [activeScenario, setActiveScenario] = useState(0);
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [showAiModal, setShowAiModal] = useState(false);

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data);
            if (res.data.length > 0) setSelectedProject(res.data[0].project_id);
        });
    }, []);

    // Generate Gherkin text from state
    const generateGherkin = () => {
        let output = `Feature: ${feature.title}\n`;
        if (feature.description) {
            output += `  ${feature.description.replace(/\n/g, '\n  ')}\n`;
        }
        feature.scenarios.forEach(scenario => {
            output += `\n  Scenario: ${scenario.title}\n`;
            scenario.steps.forEach(step => {
                output += `    ${step.type} ${step.text}\n`;
            });
        });
        return output;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateGherkin());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([generateGherkin()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${feature.title.replace(/\s+/g, '_').toLowerCase()}.feature`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const addScenario = () => {
        const newScenario = emptyScenario();
        setFeature(f => ({ ...f, scenarios: [...f.scenarios, newScenario] }));
        setActiveScenario(feature.scenarios.length);
    };

    const deleteScenario = (idx) => {
        setFeature(f => ({ ...f, scenarios: f.scenarios.filter((_, i) => i !== idx) }));
        setActiveScenario(Math.max(0, idx - 1));
    };

    const updateScenarioTitle = (idx, title) => {
        setFeature(f => {
            const s = [...f.scenarios];
            s[idx] = { ...s[idx], title };
            return { ...f, scenarios: s };
        });
    };

    const addStep = (scenarioIdx) => {
        setFeature(f => {
            const s = [...f.scenarios];
            const lastType = s[scenarioIdx].steps.slice(-1)[0]?.type || 'Given';
            s[scenarioIdx] = { ...s[scenarioIdx], steps: [...s[scenarioIdx].steps, { id: Date.now(), type: lastType === 'Then' ? 'And' : 'And', text: '' }] };
            return { ...f, scenarios: s };
        });
    };

    const updateStep = (scenarioIdx, stepIdx, field, value) => {
        setFeature(f => {
            const s = JSON.parse(JSON.stringify(f.scenarios));
            s[scenarioIdx].steps[stepIdx][field] = value;
            return { ...f, scenarios: s };
        });
    };

    const deleteStep = (scenarioIdx, stepIdx) => {
        setFeature(f => {
            const s = JSON.parse(JSON.stringify(f.scenarios));
            s[scenarioIdx].steps = s[scenarioIdx].steps.filter((_, i) => i !== stepIdx);
            return { ...f, scenarios: s };
        });
    };

    const handleAiGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setShowAiModal(false);
        try {
            const prompt = `You are a BDD expert. Generate a complete Gherkin feature scenario for the following user story:
"${aiPrompt}"

Respond with ONLY a JSON object in this format:
{
  "title": "Scenario title",
  "steps": [
    { "type": "Given", "text": "..." },
    { "type": "When", "text": "..." },
    { "type": "Then", "text": "..." }
  ]
}`;
            const res = await api.post('/ai/chat', { prompt });
            let content = res.data.response || res.data.reply || '';
            if (content.startsWith('```json')) content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
            else if (content.startsWith('```')) content = content.replace(/^```\n/, '').replace(/\n```$/, '');
            const parsed = JSON.parse(content);
            const newScenario = {
                id: Date.now(),
                title: parsed.title || 'AI Generated Scenario',
                steps: (parsed.steps || []).map((s, i) => ({ id: Date.now() + i, type: s.type || 'Given', text: s.text || '' }))
            };
            setFeature(f => ({ ...f, scenarios: [...f.scenarios, newScenario] }));
            setActiveScenario(feature.scenarios.length);
        } catch (err) {
            console.error('AI BDD Generation failed:', err);
            alert('AI generation failed. Please try again.');
        } finally {
            setGenerating(false);
            setAiPrompt('');
        }
    };

    const gherkinText = generateGherkin();
    const scenario = feature.scenarios[activeScenario];

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-lg border border-emerald-500/30 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> BDD Studio</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Gherkin Scenario Builder</h1>
                    <p className="text-sm text-slate-400 mt-2">Write Given/When/Then test scenarios visually and export as <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">.feature</code> files.</p>
                </div>
                <div className="flex items-center gap-3 z-10">
                    <button onClick={() => setShowAiModal(true)} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50">
                        {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4" /> AI Generate</>}
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm rounded-xl transition-all">
                        {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Gherkin</>}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Download className="w-4 h-4" /> Export .feature
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Left: Visual Builder */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-3 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">

                    {/* Feature Meta */}
                    <div className="space-y-4 border-b border-white/10 pb-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Feature Title</label>
                            <input type="text" value={feature.title} onChange={e => setFeature(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-emerald-500/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Feature Description (User Story)</label>
                            <textarea value={feature.description} onChange={e => setFeature(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none" />
                        </div>
                    </div>

                    {/* Scenario Tabs */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                            {feature.scenarios.map((s, idx) => (
                                <button key={s.id} onClick={() => setActiveScenario(idx)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shrink-0 transition-all border ${activeScenario === idx ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'}`}>
                                    <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                    {s.title}
                                    {feature.scenarios.length > 1 && (
                                        <span onClick={(e) => { e.stopPropagation(); deleteScenario(idx); }} className="ml-1 text-slate-600 hover:text-rose-400 transition-colors">×</span>
                                    )}
                                </button>
                            ))}
                            <button onClick={addScenario} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition-all shrink-0">
                                <PlusCircle className="w-4 h-4" /> Scenario
                            </button>
                        </div>

                        {scenario && (
                            <AnimatePresence mode="wait">
                                <motion.div key={scenario.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scenario Title</label>
                                        <input type="text" value={scenario.title} onChange={e => updateScenarioTitle(activeScenario, e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500/50 transition-colors text-sm" />
                                    </div>

                                    <div className="space-y-3">
                                        {scenario.steps.map((step, stepIdx) => (
                                            <motion.div key={step.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                                                <select value={step.type} onChange={e => updateStep(activeScenario, stepIdx, 'type', e.target.value)} className={`shrink-0 w-24 px-2 py-2.5 rounded-xl font-black text-xs border appearance-none text-center focus:outline-none transition-colors ${STEP_COLORS[step.type] || 'text-slate-400 border-white/10 bg-white/5'} bg-transparent`}>
                                                    {STEP_TYPES.map(t => <option key={t} value={t} className="bg-[#0D1424] text-white">{t}</option>)}
                                                </select>
                                                <input type="text" value={step.text} onChange={e => updateStep(activeScenario, stepIdx, 'text', e.target.value)} placeholder={`Enter ${step.type} step...`} className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" />
                                                {scenario.steps.length > 1 && (
                                                    <button onClick={() => deleteStep(activeScenario, stepIdx)} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                    <button onClick={() => addStep(activeScenario)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-xl border border-white/5 border-dashed hover:border-white/20 w-full justify-center">
                                        <Plus className="w-4 h-4" /> Add Step
                                    </button>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>

                {/* Right: Live Gherkin Preview */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-2 bg-[#060B14] border border-white/10 rounded-3xl shadow-xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-500 opacity-70" />
                                <div className="w-3 h-3 rounded-full bg-amber-500 opacity-70" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-70" />
                            </div>
                            <span className="text-xs font-mono text-slate-400">{feature.title.replace(/\s+/g, '_').toLowerCase()}.feature</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Live Preview</span>
                    </div>
                    <pre className="flex-1 overflow-auto p-6 text-sm font-mono leading-7 custom-scrollbar">
                        {gherkinText.split('\n').map((line, i) => {
                            let color = 'text-slate-300';
                            if (line.trim().startsWith('Feature:')) color = 'text-white font-black';
                            else if (line.trim().startsWith('Scenario:')) color = 'text-cyan-400 font-bold';
                            else if (line.trim().startsWith('Given')) color = 'text-blue-400';
                            else if (line.trim().startsWith('When')) color = 'text-amber-400';
                            else if (line.trim().startsWith('Then')) color = 'text-emerald-400';
                            else if (line.trim().startsWith('And') || line.trim().startsWith('But')) color = 'text-purple-400';
                            else if (line.trim().startsWith('In order') || line.trim().startsWith('As a') || line.trim().startsWith('I want')) color = 'text-slate-500';
                            return <div key={i} className={color}>{line || '\u00A0'}</div>;
                        })}
                    </pre>
                </motion.div>
            </div>

            {/* AI Generate Modal */}
            <AnimatePresence>
                {showAiModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAiModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#0D1424] border border-purple-500/20 rounded-3xl shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-2">
                                <Wand2 className="w-6 h-6 text-purple-400" />
                                <h3 className="text-xl font-black text-white">AI Scenario Generator</h3>
                            </div>
                            <p className="text-sm text-slate-400 mb-6">Describe a user story or feature in plain English, and AI will generate a complete Gherkin scenario for you.</p>
                            <form onSubmit={handleAiGenerate}>
                                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} required rows={4} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none mb-4" placeholder="e.g. A user should be able to log in with valid email and password and be redirected to the dashboard." />
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowAiModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-purple-500 hover:to-indigo-500 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"><Wand2 className="w-4 h-4 inline mr-2" />Generate</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BDDStudio;
