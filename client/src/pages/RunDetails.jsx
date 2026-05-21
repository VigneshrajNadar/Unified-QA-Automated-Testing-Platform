import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlaySquare, Download, FileText, FileSpreadsheet, ShieldAlert, Zap, Activity, Bug, ArrowLeft, Terminal, LayoutDashboard, Target, GitBranch, Box } from 'lucide-react';
import api from '../api';

const RunDetails = () => {
    const { runId } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [runData, setRunData] = useState(null);
    const [staticIssues, setStaticIssues] = useState([]);
    const [securityIssues, setSecurityIssues] = useState([]);
    const [defects, setDefects] = useState([]);
    const [complexityMetrics, setComplexityMetrics] = useState([]);
    const [coverageSummary, setCoverageSummary] = useState(null);
    const [testTypeResults, setTestTypeResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRunDetails();
    }, [runId]);

    const fetchRunDetails = async () => {
        try {
            const runRes = await api.get(`/runs/${runId}`);
            setRunData(runRes.data);

            const staticRes = await api.get(`/runs/${runId}/static-issues`);
            setStaticIssues(staticRes.data || []);

            const securityRes = await api.get(`/runs/${runId}/security-issues`);
            setSecurityIssues(securityRes.data || []);

            const defectsRes = await api.get(`/defects?run_id=${runId}`);
            setDefects(defectsRes.data || []);

            const complexityRes = await api.get(`/runs/${runId}/complexity-metrics`);
            setComplexityMetrics(complexityRes.data || []);

            const coverageRes = await api.get(`/runs/${runId}/coverage-summary`);
            setCoverageSummary(coverageRes.data);

            const typeRes = await api.get(`/runs/${runId}/test-type-results`);
            setTestTypeResults(typeRes.data || []);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const downloadReport = async (type, format) => {
        try {
            const response = await api.get(`/reports/${type}/${runId}/${format}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report_${runId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download report');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
    );

    const getResult = (type) => testTypeResults.find(r => r.test_type === type);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'static', label: `Static (${staticIssues.length})`, icon: Terminal },
        { id: 'security', label: `Security (${securityIssues.length})`, icon: ShieldAlert },
        { id: 'complexity', label: 'Complexity', icon: Activity },
        { id: 'coverage', label: 'Coverage', icon: Target },
        ...(getResult('Performance Testing') ? [{ id: 'performance', label: 'Performance', icon: Zap }] : []),
        ...(getResult('Integration Testing') ? [{ id: 'integration', label: 'Integration', icon: Box }] : []),
        ...(getResult('Regression Testing') ? [{ id: 'regression', label: 'Regression', icon: GitBranch }] : []),
        { id: 'defects', label: `Defects (${defects.length})`, icon: Bug },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <Link to="/test-runs" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest mb-3 w-fit px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        <ArrowLeft className="w-3 h-3" /> Back to Test Runs
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <PlaySquare className="w-8 h-8 text-cyan-400" /> Run #{runId} Summary
                    </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => downloadReport('defects', 'pdf')} className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-sm rounded-xl transition-colors">
                        <FileText className="w-4 h-4" /> Defect PDF
                    </button>
                    <button onClick={() => downloadReport('defects', 'excel')} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm rounded-xl transition-colors">
                        <FileSpreadsheet className="w-4 h-4" /> Defect Excel
                    </button>
                    <button onClick={() => downloadReport('execution', 'pdf')} className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 font-bold text-sm rounded-xl transition-colors">
                        <Download className="w-4 h-4" /> Execution PDF
                    </button>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-[#0D1424] rounded-xl border border-white/10 w-full overflow-x-auto custom-scrollbar">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden min-h-[400px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Execution Status</h3>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${runData?.status === 'Passed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                {runData?.status || 'Unknown'}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-colors">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Static Issues</p>
                                <h3 className="text-3xl font-black text-white">{staticIssues.length}</h3>
                            </div>
                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 hover:border-rose-500/30 transition-colors">
                                <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Security Issues</p>
                                <h3 className="text-3xl font-black text-rose-500">{securityIssues.length}</h3>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-colors">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Defects Created</p>
                                <h3 className="text-3xl font-black text-white">{defects.length}</h3>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-colors">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Project ID</p>
                                <h3 className="text-xl font-black text-white mt-1">PRJ-{runData?.project_id || 'N/A'}</h3>
                            </div>
                        </div>

                        <div className="p-4 bg-[#0D1424] border border-white/10 rounded-xl mt-6">
                            <p className="text-sm text-slate-400"><strong>Started At:</strong> <span className="text-white">{runData?.started_at ? new Date(runData.started_at).toLocaleString() : 'N/A'}</span></p>
                        </div>
                    </div>
                )}

                {/* STATIC TAB */}
                {activeTab === 'static' && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Static Analysis Issues</h3>
                        {staticIssues.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Terminal className="w-8 h-8 text-slate-500 mb-3" />
                                <p className="text-sm text-slate-400">No static analysis issues found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3">Severity</th>
                                            <th className="px-4 py-3">File</th>
                                            <th className="px-4 py-3">Line</th>
                                            <th className="px-4 py-3">Rule</th>
                                            <th className="px-4 py-3">Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {staticIssues.map((issue, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors text-slate-400">
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${issue.severity === 'Error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                        {issue.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-white">{issue.file}</td>
                                                <td className="px-4 py-3 font-mono">{issue.line}</td>
                                                <td className="px-4 py-3"><code className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-400 font-mono text-xs">{issue.rule}</code></td>
                                                <td className="px-4 py-3">{issue.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Security Vulnerabilities</h3>
                        {securityIssues.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                <ShieldAlert className="w-8 h-8 text-emerald-500/50 mb-3" />
                                <p className="text-sm text-emerald-400/70">No security vulnerabilities found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3">Severity</th>
                                            <th className="px-4 py-3">Package/File</th>
                                            <th className="px-4 py-3">Rule</th>
                                            <th className="px-4 py-3">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {securityIssues.map((issue, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors text-slate-400">
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${issue.severity === 'critical' || issue.severity === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                        {issue.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-white">{issue.file}</td>
                                                <td className="px-4 py-3"><code className="px-1.5 py-0.5 rounded bg-black/40 text-rose-400 font-mono text-xs">{issue.rule}</code></td>
                                                <td className="px-4 py-3">{issue.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* COMPLEXITY TAB */}
                {activeTab === 'complexity' && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Complexity Metrics</h3>
                        {complexityMetrics.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Activity className="w-8 h-8 text-slate-500 mb-3" />
                                <p className="text-sm text-slate-400">No complexity metrics available.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3">File</th>
                                            <th className="px-4 py-3">Complexity Score</th>
                                            <th className="px-4 py-3">Maintainability Index</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {complexityMetrics.map((metric, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors text-slate-400">
                                                <td className="px-4 py-3 text-white">{metric.file}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${metric.complexity_score > 10 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                        {metric.complexity_score}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono">{metric.maintainability_index}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* COVERAGE TAB */}
                {activeTab === 'coverage' && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Code Coverage</h3>
                        {coverageSummary ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Line Coverage', cov: coverageSummary.lines_covered, tot: coverageSummary.lines_total },
                                    { label: 'Branch Coverage', cov: coverageSummary.branches_covered, tot: coverageSummary.branches_total },
                                    { label: 'Function Coverage', cov: coverageSummary.functions_covered, tot: coverageSummary.functions_total }
                                ].map((item, i) => {
                                    const percent = Math.round((item.cov / item.tot) * 100) || 0;
                                    const isLow = percent < 60;
                                    return (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="flex justify-between items-end relative z-10 mb-4">
                                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                <span className={`text-4xl font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>{percent}%</span>
                                            </div>
                                            
                                            <div className="w-full bg-black/40 rounded-full h-2.5 mb-2 overflow-hidden border border-white/5">
                                                <div className={`h-2.5 rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <p className="text-xs text-slate-500 text-right">{item.cov} / {item.tot} units</p>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Target className="w-8 h-8 text-slate-500 mb-3" />
                                <p className="text-sm text-slate-400">No coverage data available.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* PERFORMANCE TAB */}
                {activeTab === 'performance' && getResult('Performance Testing') && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Performance Results</h3>
                        {(() => {
                            const result = getResult('Performance Testing');
                            const details = JSON.parse(result.details);
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Avg Response Time</p>
                                        <div className="flex items-end gap-2"><h3 className="text-3xl font-black text-cyan-400">{details.avgResponseTime}</h3><span className="text-slate-500 font-bold mb-1">ms</span></div>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                                        <p className="text-xs font-black text-emerald-500/70 uppercase tracking-widest mb-2">Passed Requests</p>
                                        <h3 className="text-3xl font-black text-emerald-400">{details.passed}</h3>
                                    </div>
                                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                                        <p className="text-xs font-black text-rose-500/70 uppercase tracking-widest mb-2">Failed Requests</p>
                                        <h3 className="text-3xl font-black text-rose-400">{details.failed}</h3>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* INTEGRATION TAB */}
                {activeTab === 'integration' && getResult('Integration Testing') && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Integration Results</h3>
                        {(() => {
                            const result = getResult('Integration Testing');
                            const details = JSON.parse(result.details);
                            return (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                                    <p className="text-slate-300">Total Integrations Tested: <span className="text-white font-bold">{details.total}</span></p>
                                    <div className="flex gap-4">
                                        <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">Passed: {details.passed}</span>
                                        <span className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm">Failed: {details.failed}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* REGRESSION TAB */}
                {activeTab === 'regression' && getResult('Regression Testing') && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Regression Results</h3>
                        {(() => {
                            const result = getResult('Regression Testing');
                            const details = JSON.parse(result.details);
                            return (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">New Regressions</p>
                                            <h3 className={`text-3xl font-black ${details.totalRegressions > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{details.totalRegressions}</h3>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Improvements</p>
                                            <h3 className="text-3xl font-black text-cyan-400">{details.totalImprovements}</h3>
                                        </div>
                                    </div>
                                    {details.comparedWithRun && (
                                        <p className="text-sm text-slate-500 bg-[#0D1424] px-4 py-2 border border-white/5 rounded-xl w-fit">
                                            Compared against baseline run: <strong className="text-white">#{details.comparedWithRun}</strong>
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* DEFECTS TAB */}
                {activeTab === 'defects' && (
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6">Auto-Created Defects</h3>
                        {defects.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                                <Bug className="w-8 h-8 text-emerald-500/50 mb-3" />
                                <p className="text-sm text-emerald-400/70">No defects created for this run.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3">ID</th>
                                            <th className="px-4 py-3">Title</th>
                                            <th className="px-4 py-3">Severity</th>
                                            <th className="px-4 py-3">Priority</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {defects.map((defect) => (
                                            <tr key={defect.defect_id} className="hover:bg-white/5 transition-colors text-slate-400">
                                                <td className="px-4 py-3 font-mono text-cyan-400">#{defect.defect_id}</td>
                                                <td className="px-4 py-3 text-white font-medium">{defect.title}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${defect.severity === 'High' || defect.severity === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                        {defect.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{defect.priority}</td>
                                                <td className="px-4 py-3">{defect.status}</td>
                                                <td className="px-4 py-3 text-xs">{new Date(defect.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default RunDetails;
