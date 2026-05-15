import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Load role from localStorage
        const savedRole = localStorage.getItem('userRole');
        const savedUser = localStorage.getItem('user');
        if (savedRole) {
            setRole(savedRole);
        }
        if (savedUser) {
            try { setCurrentUser(JSON.parse(savedUser)); } catch(e) {}
        }
        setLoading(false);
    }, []);

    const selectRole = (selectedRole) => {
        localStorage.setItem('userRole', selectedRole);
        // Only set dummy-token if no real JWT token already exists
        const existingToken = localStorage.getItem('token');
        if (!existingToken || existingToken === 'dummy-token') {
            localStorage.setItem('token', 'dummy-token');
        }
        setRole(selectedRole);
    };

    const changeRole = () => {
        localStorage.removeItem('userRole');
        setRole(null);
        window.location.href = '/login';
    };

    const logout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setRole(null);
        window.location.href = '/login';
    };

    // Role-based access control
    const hasAccess = (feature) => {
        const rolePermissions = {
            admin: ['all'],
            tester: ['dashboard', 'projects', 'testcases', 'testruns', 'defects', 'autotest', 'ai-testgen', 'visual', 'api-testing', 'selenium', 'monitor', 'ecommerce', 'performance', 'security'],
            developer: ['dashboard', 'projects', 'requirements', 'defects', 'autotest', 'ai-testgen', 'visual', 'api-testing', 'selenium', 'performance', 'security'],
            viewer: ['dashboard', 'projects', 'testcases', 'testruns', 'defects', 'requirements']
        };

        if (role === 'admin') return true;
        return rolePermissions[role]?.includes(feature) || false;
    };

    const canEdit = () => {
        return role !== 'viewer';
    };

    // Create a user object - prefer real user from localStorage, fall back to mock
    const user = currentUser || (role ? { role, name: role.charAt(0).toUpperCase() + role.slice(1) } : null);

    return (
        <AuthContext.Provider value={{ user, role, selectRole, changeRole, logout, hasAccess, canEdit, loading, currentUser, setCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

