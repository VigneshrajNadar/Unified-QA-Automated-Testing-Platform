import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const JobDetails = () => {
    const { id } = useParams();
    const [job, setJob] = useState(null);

    useEffect(() => {
        fetchJob();
        const interval = setInterval(fetchJob, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchJob = async () => {
        try {
            const res = await api.get(`/selenium/job/${id}`);
            setJob(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!job) return <div>Loading...</div>;

    return (
        <div className="job-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link to="/selenium" className="btn btn-secondary">← Back</Link>
                <h1>Job #{job.job_id} Details</h1>
                <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
            </div>

            <div className="executions-list">
                {job.executions.map(exec => (
                    <div key={exec.execution_id} className="card execution-card">
                        <div className="header">
                            <h3>{exec.browser.toUpperCase()}</h3>
                            <span className={`badge ${exec.status.toLowerCase()}`}>{exec.status}</span>
                        </div>

                        <div className="details">
                            <p><strong>Session ID:</strong> {exec.session_id || 'N/A'}</p>
                            <p><strong>Duration:</strong> {exec.start_time && exec.end_time ?
                                ((new Date(exec.end_time) - new Date(exec.start_time)) / 1000) + 's' : 'Running...'}
                            </p>
                            {exec.error_message && (
                                <div className="error-box">
                                    <strong>Error:</strong> {exec.error_message}
                                </div>
                            )}
                        </div>

                        <div className="artifacts">
                            <h4>Artifacts</h4>
                            {exec.video_path ? (
                                <div className="artifact-links">
                                    {/* Video path in DB might be local path or URL. We stored screenshot path in video_path in catch block temporarily or null. 
                                        Let's assume backend serves uploads at /uploads 
                                    */}
                                    {exec.video_path.endsWith('.png') ? (
                                        <a href={`http://localhost:5000${exec.video_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm">📸 View Screenshot</a>
                                    ) : (
                                        <a href={`http://localhost:5000${exec.video_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm">🎥 View Video</a>
                                    )}
                                </div>
                            ) : (
                                <div className="no-artifacts">No artifacts yet</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .execution-card { margin-bottom: 1rem; }
                .header { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
                .error-box { background: #ffebeb; color: #d32f2f; padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; }
            `}</style>
        </div>
    );
};

export default JobDetails;
