import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlaySquare, FolderKanban, Plus, X, Layers, Activity, Search, AlertCircle, Play } from 'lucide-react';
import api from '../api';

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
            fetchRuns(); 
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
            setActiveTab('runs');
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

            await fetchTestCases();
            if (response.data.testCaseId) {
                setSelectedTestCases([...selectedTestCases, response.data.testCaseId]);
            }

            setCustomTestCase({ title: '', description: '', steps: '', expected_result: '', priority: 'Medium' });
            setShowCustomTestCaseForm(false);
        } catch (err) {
            alert('Failed to create custom test case');
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <PlaySquare className="w-8 h-8 text-cyan-400" /> Test Execution
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Group test cases into suites and execute test runs.</p>
                </div>
            </motion.div>

            {/* Project Selector Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <FolderKanban className="w-5 h-5 text-blue-400" />
                    <select
                        value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}
                        className="w-full md:w-80 px-4 py-2.5 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                    >
                        <option value="" className="bg-[#0D1424]">-- Select a Project to Manage Runs --</option>
                        {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                    </select>
                </div>

                {selectedProject && (
                    <div className="flex p-1 bg-[#0D1424] border border-white/10 rounded-xl w-full md:w-auto">
                        <button 
                            onClick={() => setActiveTab('runs')} 
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'runs' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                        >
                            <Activity className="w-4 h-4" /> Test Runs
                        </button>
                        <button 
                            onClick={() => setActiveTab('suites')} 
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'suites' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                        >
                            <Layers className="w-4 h-4" /> Test Suites
                        </button>
                    </div>
                )}
            </motion.div>

            {!selectedProject && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 mt-8">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <FolderKanban className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Select a Project</h3>
                    <p className="text-slate-400 text-sm text-center max-w-md">Please select a project from the dropdown above to view and manage its test suites and execution runs.</p>
                </motion.div>
            )}

            {selectedProject && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    
                    {/* TEST SUITES TAB */}
                    {activeTab === 'suites' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button onClick={() => setShowSuiteForm(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-colors">
                                    <Plus className="w-4 h-4" /> New Test Suite
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {suites.length === 0 ? (
                                    <div className="col-span-full py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5">
                                        <Layers className="w-8 h-8 text-slate-500 mb-3" />
                                        <p className="text-sm font-medium text-slate-400">No test suites found for this project.</p>
                                    </div>
                                ) : (
                                    suites.map(s => (
                                        <div key={s.test_suite_id} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl group hover:border-blue-500/30 transition-colors relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[30px] rounded-full -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                                            <div className="flex items-start gap-3 mb-3 relative z-10">
                                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                                                    <Layers className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white leading-tight">{s.name}</h4>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-400 line-clamp-3 relative z-10">{s.description || 'No description'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* TEST RUNS TAB */}
                    {activeTab === 'runs' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button onClick={() => setShowRunForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-[#060B14] font-black text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                                    <Play className="w-4 h-4" fill="currentColor" /> Start New Run
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {runs.length === 0 ? (
                                    <div className="py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5">
                                        <Activity className="w-8 h-8 text-slate-500 mb-3" />
                                        <p className="text-sm font-medium text-slate-400">No test runs executed yet.</p>
                                    </div>
                                ) : (
                                    runs.map(r => (
                                        <div key={r.test_run_id} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                                    <PlaySquare className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white mb-1">{r.name}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                        <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Executed by {r.executed_by_name || 'Unknown'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(r.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link to={`/execute-run/${r.test_run_id}`} className="w-full md:w-auto px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-colors text-center">
                                                Execute / View Results
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* SUITE CREATION MODAL */}
            <AnimatePresence>
                {showSuiteForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuiteForm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-blue-400" /> Create Test Suite</h3>
                                <button onClick={() => setShowSuiteForm(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form id="suite-form" onSubmit={handleCreateSuite} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Suite Name *</label>
                                    <input required type="text" placeholder="e.g. Smoke Tests" value={suiteName} onChange={e => setSuiteName(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea rows={2} placeholder="Suite description..." value={suiteDesc} onChange={e => setSuiteDesc(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-none" />
                                </div>
                                
                                <div className="p-4 rounded-xl border border-white/10 bg-black/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Test Cases</label>
                                        <button type="button" onClick={() => setShowCustomTestCaseForm(true)} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Custom Test Case</button>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                        {availableTestCases.length === 0 ? (
                                            <p className="text-sm text-slate-500 py-4 text-center">No test cases available in this project.</p>
                                        ) : (
                                            availableTestCases.map(tc => (
                                                <label key={tc.test_case_id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTestCases.includes(tc.test_case_id) ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                                                    <input type="checkbox" checked={selectedTestCases.includes(tc.test_case_id)} onChange={() => toggleTestCase(tc.test_case_id)} className="accent-cyan-500 w-4 h-4 rounded border-white/20 bg-[#0D1424]" />
                                                    <span className="text-sm text-white font-medium select-none">{tc.title}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </form>
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0">
                                <button type="button" onClick={() => setShowSuiteForm(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" form="suite-form" className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-blue-400 hover:to-indigo-400 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">Create Suite</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* RUN CREATION MODAL */}
            <AnimatePresence>
                {showRunForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRunForm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><PlaySquare className="w-5 h-5 text-cyan-400" /> Start New Run</h3>
                                <button onClick={() => setShowRunForm(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form id="run-form" onSubmit={handleCreateRun} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Run Name *</label>
                                    <input required type="text" placeholder="e.g. Release 1.0 Regression" value={runName} onChange={e => setRunName(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Test Suite *</label>
                                    <select required value={selectedSuite} onChange={e => setSelectedSuite(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
                                        <option value="" className="bg-[#0D1424]">Select Test Suite</option>
                                        {suites.map(s => <option key={s.test_suite_id} value={s.test_suite_id} className="bg-[#0D1424]">{s.name}</option>)}
                                    </select>
                                </div>
                            </form>
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
                                <button type="button" onClick={() => setShowRunForm(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" form="run-form" className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#060B14] rounded-xl text-sm font-bold hover:from-cyan-400 hover:to-blue-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">Start Run</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CUSTOM TEST CASE MODAL */}
            <AnimatePresence>
                {showCustomTestCaseForm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCustomTestCaseForm(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-cyan-400" /> Quick Custom Test Case</h3>
                                <button onClick={() => setShowCustomTestCaseForm(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form id="custom-tc-form" onSubmit={handleCreateCustomTestCase} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title *</label>
                                    <input required type="text" placeholder="Title" value={customTestCase.title} onChange={e => setCustomTestCase({...customTestCase, title: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea rows={2} placeholder="Description" value={customTestCase.description} onChange={e => setCustomTestCase({...customTestCase, description: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Steps</label>
                                    <textarea rows={3} placeholder="Steps (one per line)" value={customTestCase.steps} onChange={e => setCustomTestCase({...customTestCase, steps: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none font-mono" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expected Result</label>
                                        <textarea rows={2} placeholder="Expected Result" value={customTestCase.expected_result} onChange={e => setCustomTestCase({...customTestCase, expected_result: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                        <select value={customTestCase.priority} onChange={e => setCustomTestCase({...customTestCase, priority: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                                            <option value="High" className="bg-[#0D1424]">High</option>
                                            <option value="Medium" className="bg-[#0D1424]">Medium</option>
                                            <option value="Low" className="bg-[#0D1424]">Low</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0">
                                <button type="button" onClick={() => setShowCustomTestCaseForm(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" form="custom-tc-form" className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-[#060B14] rounded-xl text-sm font-bold transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">Create & Add to Suite</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TestRuns;
