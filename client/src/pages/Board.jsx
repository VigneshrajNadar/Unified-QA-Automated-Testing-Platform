import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KanbanSquare, Plus, MoreVertical, Bug, Calendar, Flag, FileText, X, Edit2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../api';

const Board = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [sprints, setSprints] = useState([]);
    const [selectedSprint, setSelectedSprint] = useState('');
    
    // Columns are our issue statuses
    const [columns, setColumns] = useState({
        'Open': { name: 'To Do', items: [] },
        'In Progress': { name: 'In Progress', items: [] },
        'Retest': { name: 'In Review / Retest', items: [] },
        'Closed': { name: 'Done', items: [] }
    });

    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [assignableUsers, setAssignableUsers] = useState([]);
    
    // Create Modals state
    const [showSprintModal, setShowSprintModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [newSprintName, setNewSprintName] = useState('');
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newIssueType, setNewIssueType] = useState('Bug');

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/assignable');
            setAssignableUsers(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (selectedProject) {
            fetchSprints(selectedProject);
            fetchBoardData(selectedProject, selectedSprint);
        } else {
            setColumns({
                'Open': { name: 'To Do', items: [] },
                'In Progress': { name: 'In Progress', items: [] },
                'Retest': { name: 'In Review / Retest', items: [] },
                'Closed': { name: 'Done', items: [] }
            });
        }
    }, [selectedProject, selectedSprint]);

    const fetchProjects = async () => {
        const res = await api.get('/projects');
        setProjects(res.data);
        if (res.data.length > 0) setSelectedProject(res.data[0].project_id);
    };

    const fetchSprints = async (projectId) => {
        const res = await api.get(`/sprints/${projectId}`);
        setSprints(res.data);
    };

    const fetchBoardData = async (projectId, sprintId) => {
        setLoading(true);
        try {
            const url = sprintId ? `/sprints/board/${projectId}/${sprintId}` : `/sprints/board/${projectId}`;
            const res = await api.get(url);
            
            const issues = res.data.issues;
            
            // Organize into columns
            const newCols = {
                'Open': { name: 'To Do', items: [] },
                'In Progress': { name: 'In Progress', items: [] },
                'Retest': { name: 'In Review / Retest', items: [] },
                'Closed': { name: 'Done', items: [] }
            };

            issues.forEach(issue => {
                if (newCols[issue.status]) {
                    newCols[issue.status].items.push(issue);
                } else {
                    // Fallback for weird statuses
                    newCols['Open'].items.push(issue);
                }
            });

            setColumns(newCols);
            if (res.data.sprintId && !sprintId) setSelectedSprint(res.data.sprintId);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result, columns, setColumns) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [removed] = sourceItems.splice(source.index, 1);
            
            // Update local state
            destItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: sourceItems },
                [destination.droppableId]: { ...destColumn, items: destItems }
            });

            // Update backend status
            try {
                const endpoint = removed.itemModel === 'TestCase' ? `/testcases/${removed._id}` : `/defects/${removed._id}`;
                await api.put(endpoint, { status: destination.droppableId });
            } catch (err) {
                alert('Failed to update issue status');
                // Could revert state here on failure
            }

        } else {
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: { ...column, items: copiedItems }
            });
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <KanbanSquare className="w-8 h-8 text-indigo-400" /> Active Sprint Board
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Drag and drop issues to update progress. Click to quick-edit.</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    <button 
                        onClick={() => setShowSprintModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-all border border-white/10"
                    >
                        <Calendar className="w-4 h-4 text-indigo-400" /> New Sprint
                    </button>
                    <button 
                        onClick={() => setShowIssueModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                    >
                        <Plus className="w-4 h-4" /> Create Issue
                    </button>
                    
                    <select 
                        value={selectedProject} 
                        onChange={(e) => { setSelectedProject(e.target.value); setSelectedSprint(''); }}
                        className="px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[200px]"
                    >
                        <option value="" disabled>Select Project</option>
                        {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                    </select>

                    <select 
                        value={selectedSprint} 
                        onChange={(e) => setSelectedSprint(e.target.value)}
                        className="px-4 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[200px]"
                    >
                        <option value="">All Active Issues</option>
                        {sprints.map(s => <option key={s._id} value={s._id}>{s.name} ({s.status})</option>)}
                    </select>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center flex-1">
                    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto custom-scrollbar pb-4">
                    <DragDropContext onDragEnd={result => onDragEnd(result, columns, setColumns)}>
                        <div className="flex gap-6 h-full min-h-[500px]">
                            {Object.entries(columns).map(([columnId, column]) => {
                                return (
                                    <div className="flex flex-col flex-1 min-w-[300px] max-w-[350px] bg-[#0B0F19]/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden" key={columnId}>
                                        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center shrink-0">
                                            <h2 className="font-bold text-white tracking-wide text-sm">{column.name}</h2>
                                            <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full">
                                                {column.items.length}
                                            </span>
                                        </div>
                                        
                                        <Droppable droppableId={columnId} key={columnId}>
                                            {(provided, snapshot) => {
                                                return (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={`flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar transition-colors ${
                                                            snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''
                                                        }`}
                                                    >
                                                        {column.items.map((item, index) => {
                                                            return (
                                                                <Draggable
                                                                    key={item.id}
                                                                    draggableId={item.id}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => {
                                                                        return (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                onClick={() => setEditingItem(item)}
                                                                                className={`bg-[#131A2B] p-4 rounded-xl shadow-lg border transition-all cursor-pointer ${
                                                                                    snapshot.isDragging ? 'border-indigo-500 shadow-indigo-500/20 rotate-2' : 'border-white/5 hover:border-white/20'
                                                                                }`}
                                                                            >
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <div className="flex gap-2 items-center">
                                                                                        {item.issue_type === 'Bug' ? <Bug className="w-3.5 h-3.5 text-rose-400" /> : 
                                                                                         item.issue_type === 'Test Case' ? <FileText className="w-3.5 h-3.5 text-emerald-400" /> : 
                                                                                         <Flag className="w-3.5 h-3.5 text-blue-400" />}
                                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                                            {item.id.slice(-6)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${getPriorityColor(item.priority)}`}>
                                                                                        {item.priority}
                                                                                    </span>
                                                                                </div>
                                                                                <h3 className="text-sm font-bold text-slate-200 mb-3 line-clamp-2 leading-tight">
                                                                                    {item.title}
                                                                                </h3>
                                                                                <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                                                                                            {item.assignee_name !== 'Unassigned' ? item.assignee_name.charAt(0) : '?'}
                                                                                        </div>
                                                                                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[100px]">{item.assignee_name}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                );
                                            }}
                                        </Droppable>
                                    </div>
                                );
                            })}
                        </div>
                    </DragDropContext>
                </div>
            )}

            {/* Quick Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
                    <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-indigo-400" />
                                Quick Edit {editingItem.itemModel}
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm">{editingItem.title}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</label>
                                <select 
                                    value={editingItem.assignee_id || editingItem.assigned_to || ''} 
                                    onChange={async (e) => {
                                        const newAssignee = e.target.value;
                                        try {
                                            const endpoint = editingItem.itemModel === 'TestCase' ? `/testcases/${editingItem._id}` : `/defects/${editingItem._id}`;
                                            const field = editingItem.itemModel === 'TestCase' ? 'created_by' : 'assignee_id';
                                            await api.put(endpoint, { [field]: newAssignee });
                                            fetchBoardData(selectedProject, selectedSprint);
                                            setEditingItem(null);
                                        } catch(err) {
                                            alert('Failed to reassign');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {assignableUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                <select 
                                    value={editingItem.priority || 'Medium'} 
                                    onChange={async (e) => {
                                        try {
                                            const endpoint = editingItem.itemModel === 'TestCase' ? `/testcases/${editingItem._id}` : `/defects/${editingItem._id}`;
                                            await api.put(endpoint, { priority: e.target.value });
                                            fetchBoardData(selectedProject, selectedSprint);
                                            setEditingItem(null);
                                        } catch(err) {
                                            alert('Failed to update priority');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Sprint Modal */}
            {showSprintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSprintModal(false)} />
                    <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" /> Create Sprint
                            </h3>
                            <button onClick={() => setShowSprintModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sprint Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Sprint 12 - Hotfixes"
                                    value={newSprintName}
                                    onChange={(e) => setNewSprintName(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" 
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    if (!selectedProject || !newSprintName) return alert('Select project and enter name');
                                    try {
                                        await api.post('/sprints', {
                                            project_id: selectedProject,
                                            name: newSprintName,
                                            start_date: new Date(),
                                            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                                        });
                                        fetchSprints(selectedProject);
                                        setShowSprintModal(false);
                                        setNewSprintName('');
                                    } catch(err) {
                                        alert('Failed to create sprint');
                                    }
                                }}
                                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition-colors"
                            >
                                Create Sprint
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIssueModal(false)} />
                    <div className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-400" /> Create Issue
                            </h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                <select 
                                    value={newIssueType}
                                    onChange={(e) => setNewIssueType(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
                                >
                                    <option value="Bug">Bug (Defect)</option>
                                    <option value="Task">Task (Defect)</option>
                                    <option value="Test Case">Test Case</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <input 
                                    type="text" 
                                    placeholder="Issue title..."
                                    value={newIssueTitle}
                                    onChange={(e) => setNewIssueTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" 
                                />
                            </div>
                            <button 
                                onClick={async () => {
                                    if (!selectedProject || !newIssueTitle) return alert('Select project and enter title');
                                    try {
                                        if (newIssueType === 'Test Case') {
                                            await api.post('/testcases', {
                                                project_id: selectedProject,
                                                sprint_id: selectedSprint || null,
                                                title: newIssueTitle,
                                                status: 'Open'
                                            });
                                        } else {
                                            await api.post('/defects', {
                                                project_id: selectedProject,
                                                sprint_id: selectedSprint || null,
                                                title: newIssueTitle,
                                                issue_type: newIssueType,
                                                status: 'Open',
                                                severity: 'Medium',
                                                priority: 'Medium'
                                            });
                                        }
                                        fetchBoardData(selectedProject, selectedSprint);
                                        setShowIssueModal(false);
                                        setNewIssueTitle('');
                                    } catch(err) {
                                        alert('Failed to create issue');
                                    }
                                }}
                                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-xl font-bold transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Board;
