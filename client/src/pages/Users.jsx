import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (user?.role?.toLowerCase() !== 'admin') {
        return <div style={{ textAlign: 'center', marginTop: '4rem' }}><h2>Access Denied</h2><p>Only Admins can view this page.</p></div>;
    }

    return (
        <div>
            <h1>User Management</h1>
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.user_id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td><span className="badge badge-blue">{u.role}</span></td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    {u.user_id !== user.userId && (
                                        <button className="btn badge-danger" onClick={() => handleDelete(u.user_id)}>Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
