import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Search, Filter, Bug, Activity, CheckCircle, XCircle, Download } from 'lucide-react';
import api from '../api';

const RTM = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [rtmData, setRtmData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data);
            if (res.data.length > 0) setSelectedProject(res.data[0].project_id);
        });
    }, []);

    useEffect(() => {
        if (selectedProject) fetchRTM();
    }, [selectedProject]);

    const fetchRTM = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/requirements/rtm/${selectedProject}`);
            setRtmData(res.data);
        } catch (err) {
            console.error('Failed to fetch RTM:', err);
        }
        setLoading(false);
    };

    const filteredData = rtmData.filter(r => 
        r.title.toLowerCase().includes(search.toLowerCase()) || 
        r.req_identifier.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'Passed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Failed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'Blocked': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const handleExportCSV = () => {
        if (!filteredData.length) return alert('No data to export.');
        
        let csv = 'Requirement ID,Requirement Title,Test Case ID,Test Case Title,Test Case Status,Defect ID,Defect Title,Defect Status\n';
        
        filteredData.forEach(req => {
            if (req.test_cases.length === 0) {
                csv += `"${req.req_identifier}","${req.title}","","","","","",""\n`;
            } else {
                req.test_cases.forEach(tc => {
                    const defects = tc.defects;
                    if (defects.length === 0) {
                        csv += `"${req.req_identifier}","${req.title}","${tc.test_case_id}","${tc.title}","${tc.status}","","",""\n`;
                    } else {
                        defects.forEach(def => {
                            csv += `"${req.req_identifier}","${req.title}","${tc.test_case_id}","${tc.title}","${tc.status}","${def.defect_id}","${def.title}","${def.status}"\n`;
                        });
                    }
                });
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RTM_Export_${selectedProject || 'All'}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                        <Network className="w-8 h-8 text-indigo-400" />
                        Traceability Matrix
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">End-to-end traceability from Requirements to Defects</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[200px]">
                        <option value="" disabled>Select Project</option>
                        {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search requirements..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-[#0D1424] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading matrix...</div>
                ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No requirements found.</div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest w-1/3">Requirement</th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest w-1/3 border-l border-white/5">Linked Test Cases</th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest w-1/3 border-l border-white/5">Linked Defects</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                                {filteredData.map(req => (
                                    <tr key={req.requirement_id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-white mb-1 flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{req.req_identifier}</span>
                                                {req.title}
                                            </div>
                                            <div className="text-xs text-slate-500 line-clamp-2">{req.description}</div>
                                            {req.test_cases.length === 0 && (
                                                <div className="mt-2 text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                                                    <XCircle className="w-3.5 h-3.5" /> Untested (No test cases)
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-top border-l border-white/5">
                                            {req.test_cases.length > 0 ? (
                                                <div className="space-y-2">
                                                    {req.test_cases.map(tc => (
                                                        <div key={tc._id} className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                                <span className="text-xs truncate" title={tc.title}>{tc.title}</span>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getStatusColor(tc.status)}`}>
                                                                {tc.status || 'Not Run'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600 italic">None</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-top border-l border-white/5">
                                            <div className="space-y-2">
                                                {req.test_cases.flatMap(tc => tc.defects).length > 0 ? (
                                                    req.test_cases.flatMap(tc => tc.defects).map(defect => (
                                                        <div key={defect.defect_id} className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                                                <span className="text-xs text-rose-300 truncate" title={defect.title}>{defect.title}</span>
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20 shrink-0">
                                                                {defect.status}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">No defects found</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RTM;
