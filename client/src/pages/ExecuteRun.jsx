import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaySquare, Check, X, Ban, Bug, ArrowLeft, Layers, Image as ImageIcon } from 'lucide-react';
import api from '../api';

const ExecuteRun = () => {
    const { id } = useParams();
    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);

    const [expandedCaseId, setExpandedCaseId] = useState(null);
    const [stepResultsMap, setStepResultsMap] = useState({});

    // Defect Modal State
    const [showDefectModal, setShowDefectModal] = useState(false);
    const [currentTestCase, setCurrentTestCase] = useState(null);
    const [defectTitle, setDefectTitle] = useState('');
    const [defectDesc, setDefectDesc] = useState('');
    const [severity, setSeverity] = useState('Medium');
    const [priority, setPriority] = useState('Medium');
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchRun();
    }, [id]);

    const fetchRun = async () => {
        try {
            const res = await api.get(`/runs/${id}`);
            setRun(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (testCaseId, status) => {
        try {
            // Convert stepResultsMap[testCaseId] to array format if it exists
            let stepResultsArray = undefined;
            if (stepResultsMap[testCaseId]) {
                stepResultsArray = Object.keys(stepResultsMap[testCaseId]).map(stepNumber => ({
                    step_number: parseInt(stepNumber),
                    status: stepResultsMap[testCaseId][stepNumber]
                }));
            }

            await api.post(`/runs/${id}/results`, {
                test_case_id: testCaseId,
                status,
                actual_result: status === 'Pass' ? 'As expected' : 'Failed',
                comments: '',
                step_results: stepResultsArray
            });
            fetchRun();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleStepStatusChange = (testCaseId, stepNumber, status) => {
        setStepResultsMap(prev => ({
            ...prev,
            [testCaseId]: {
                ...(prev[testCaseId] || {}),
                [stepNumber]: status
            }
        }));
    };

    const openDefectModal = (testCase) => {
        setCurrentTestCase(testCase);
        setDefectTitle(`Defect for ${testCase.title}`);
        setShowDefectModal(true);
    };

    const handleLogDefect = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/defects', {
                test_case_id: currentTestCase.test_case_id,
                test_run_id: run.test_run_id,
                title: defectTitle,
                description: defectDesc,
                severity,
                priority,
                assignee_id: null
            });

            const defectId = res.data.defectId;

            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('entity_type', 'defect');
                formData.append('entity_id', defectId);
                await api.post('/attachments/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            await handleStatusUpdate(currentTestCase.test_case_id, 'Fail');

            setShowDefectModal(false);
            setFile(null);
            alert('Defect logged successfully');
        } catch (err) {
            alert('Failed to log defect');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
    );
    
    if (!run) return (
        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/5">
            <PlaySquare className="w-8 h-8 text-slate-500 mb-3" />
            <p className="text-sm font-medium text-slate-400">Run not found.</p>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pass': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Fail': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'Blocked': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Link to="/test-runs" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest w-fit px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            <ArrowLeft className="w-3 h-3" /> Back
                        </Link>
                        <Link to={`/runs/${id}`} className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest w-fit px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                            View Detailed Results
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <PlaySquare className="w-8 h-8 text-cyan-400" /> {run.name}
                    </h1>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Suite</p>
                        <p className="text-sm font-bold text-white">{run.suite_name || 'N/A'}</p>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4">Test Case</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Execute</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {run.results && run.results.map((r, i) => (
                                <React.Fragment key={r.test_case_id}>
                                    <tr className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-white font-medium cursor-pointer" onClick={() => setExpandedCaseId(expandedCaseId === r.test_case_id ? null : r.test_case_id)}>
                                            <div className="flex items-center gap-2">
                                                <div className={`transition-transform ${expandedCaseId === r.test_case_id ? 'rotate-90' : ''}`}>
                                                    <Play className="w-3.5 h-3.5 text-slate-500" />
                                                </div>
                                                {r.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => setExpandedCaseId(expandedCaseId === r.test_case_id ? null : r.test_case_id)}>
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${r.priority === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : r.priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                {r.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => setExpandedCaseId(expandedCaseId === r.test_case_id ? null : r.test_case_id)}>
                                            <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border ${getStatusColor(r.status)}`}>
                                                {r.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleStatusUpdate(r.test_case_id, 'Pass')} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors" title="Mark as Pass">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleStatusUpdate(r.test_case_id, 'Fail')} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors" title="Mark as Fail">
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleStatusUpdate(r.test_case_id, 'Blocked')} className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-colors" title="Mark as Blocked">
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-6 bg-white/10 mx-1"></div>
                                                <button onClick={() => openDefectModal(r)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/20 rounded-lg transition-colors">
                                                    <Bug className="w-3.5 h-3.5" /> Log Defect
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Step-by-Step Execution Drawer */}
                                    <AnimatePresence>
                                        {expandedCaseId === r.test_case_id && (
                                            <tr className="bg-white/[0.02]">
                                                <td colSpan="4" className="p-0 border-b border-white/5">
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="p-6">
                                                            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">Step-by-Step Execution</h4>
                                                            {r.steps && r.steps.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {r.steps.map(step => {
                                                                        const stepStatus = (stepResultsMap[r.test_case_id] && stepResultsMap[r.test_case_id][step.step_number]) || 
                                                                            (r.step_results?.find(sr => sr.step_number === step.step_number)?.status) || 'Pending';
                                                                        
                                                                        return (
                                                                            <div key={step._id} className="flex flex-col md:flex-row md:items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                                                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                                                                                    {step.step_number}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <div className="text-sm font-medium text-white mb-1">{step.action}</div>
                                                                                    <div className="text-xs text-slate-400 font-medium">Expected: <span className="text-slate-300">{step.expected_result}</span></div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 shrink-0">
                                                                                    <button 
                                                                                        onClick={() => handleStepStatusChange(r.test_case_id, step.step_number, 'Passed')} 
                                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${stepStatus === 'Passed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                                                                                    >
                                                                                        Pass
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => handleStepStatusChange(r.test_case_id, step.step_number, 'Failed')} 
                                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${stepStatus === 'Failed' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10'}`}
                                                                                    >
                                                                                        Fail
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400">
                                                                    No steps defined for this test case.
                                                                </div>
                                                            )}
                                                            <div className="mt-4 flex justify-end">
                                                                <button onClick={() => {
                                                                    const hasFails = r.steps?.some(step => stepResultsMap[r.test_case_id]?.[step.step_number] === 'Failed');
                                                                    handleStatusUpdate(r.test_case_id, hasFails ? 'Fail' : 'Pass');
                                                                }} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-colors">
                                                                    Save Step Results & Update Status
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {(!run.results || run.results.length === 0) && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No test cases found in this run.
                        </div>
                    )}
                </div>
            </motion.div>

            {/* DEFECT MODAL */}
            <AnimatePresence>
                {showDefectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDefectModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Bug className="w-5 h-5 text-rose-400" /> Log Defect</h3>
                                <button onClick={() => setShowDefectModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form id="defect-form" onSubmit={handleLogDefect} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Failing Test Case</p>
                                    <p className="text-sm text-white font-medium">{currentTestCase?.title}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Defect Title *</label>
                                    <input required type="text" placeholder="Title" value={defectTitle} onChange={e => setDefectTitle(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea rows={4} placeholder="Detailed description of the issue..." value={defectDesc} onChange={e => setDefectDesc(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors resize-none" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Severity</label>
                                        <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option value="Critical" className="bg-[#0D1424]">Critical</option>
                                            <option value="High" className="bg-[#0D1424]">High</option>
                                            <option value="Medium" className="bg-[#0D1424]">Medium</option>
                                            <option value="Low" className="bg-[#0D1424]">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                        <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option value="High" className="bg-[#0D1424]">High</option>
                                            <option value="Medium" className="bg-[#0D1424]">Medium</option>
                                            <option value="Low" className="bg-[#0D1424]">Low</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Screenshot (Optional)</label>
                                    <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors bg-white/5 flex flex-col items-center justify-center">
                                        <input type="file" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                                        <p className="text-sm font-medium text-white">{file ? file.name : 'Click or drag file to upload'}</p>
                                    </div>
                                </div>
                            </form>
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0">
                                <button type="button" onClick={() => setShowDefectModal(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" form="defect-form" className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-rose-400 hover:to-orange-400 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]">Submit Defect</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExecuteRun;
