import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const ExecuteRun = () => {
    const { id } = useParams();
    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);

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
            await api.post(`/runs/${id}/results`, {
                test_case_id: testCaseId,
                status,
                actual_result: status === 'Pass' ? 'As expected' : 'Failed',
                comments: ''
            });
            fetchRun();
        } catch (err) {
            alert('Failed to update status');
        }
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

            // Also mark test as Fail if not already
            await handleStatusUpdate(currentTestCase.test_case_id, 'Fail');

            setShowDefectModal(false);
            setFile(null);
            alert('Defect logged successfully');
        } catch (err) {
            alert('Failed to log defect');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!run) return <div>Run not found</div>;

    return (
        <div>
            <h1>{run.name}</h1>
            <p className="card">Suite: {run.suite_name}</p>

            <div style={{ marginTop: '2rem' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Test Case</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {run.results && run.results.map(r => (
                            <tr key={r.test_case_id}>
                                <td>{r.title}</td>
                                <td><span className="badge">{r.priority}</span></td>
                                <td>
                                    <span className={`badge badge-${r.status === 'Pass' ? 'success' : r.status === 'Fail' ? 'danger' : 'warning'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn badge-success" onClick={() => handleStatusUpdate(r.test_case_id, 'Pass')}>Pass</button>
                                        <button className="btn badge-danger" onClick={() => handleStatusUpdate(r.test_case_id, 'Fail')}>Fail</button>
                                        <button className="btn badge-warning" onClick={() => handleStatusUpdate(r.test_case_id, 'Blocked')}>Block</button>
                                        <button className="btn" onClick={() => openDefectModal(r)} style={{ fontSize: '0.8rem' }}>Log Defect</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showDefectModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Log Defect</h3>
                        <form onSubmit={handleLogDefect}>
                            <input className="input" value={defectTitle} onChange={e => setDefectTitle(e.target.value)} placeholder="Defect Title" required />
                            <textarea className="input" value={defectDesc} onChange={e => setDefectDesc(e.target.value)} placeholder="Description" rows={4} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Severity</label>
                                    <select className="input" value={severity} onChange={e => setSeverity(e.target.value)} style={{ marginBottom: 0 }}>
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priority</label>
                                    <select className="input" value={priority} onChange={e => setPriority(e.target.value)} style={{ marginBottom: 0 }}>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Screenshot (Optional):</label>
                                <input type="file" className="input" onChange={e => setFile(e.target.files[0])} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowDefectModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Log Defect</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecuteRun;
