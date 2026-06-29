import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
// import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Board from './pages/Board';
import TestCases from './pages/TestCases';
import TestRuns from './pages/TestRuns';
import ExecuteRun from './pages/ExecuteRun';
import Defects from './pages/Defects';
import Requirements from './pages/Requirements';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Settings from './pages/Settings';
import RunDetails from './pages/RunDetails';
import AutoTest from './pages/AutoTest';
import AITestGenerator from './pages/AITestGenerator';
import VisualTesting from './pages/VisualTesting';
import VisualRun from './pages/VisualRun';
import VisualDiffs from './pages/VisualDiffs';
import VisualResults from './pages/VisualResults';
import APITesting from './pages/APITesting';
import APICollection from './pages/APICollection';
import SeleniumDashboard from './pages/SeleniumDashboard';
import SeleniumExecute from './pages/SeleniumExecute';
import JobDetails from './pages/JobDetails';
import MockServer from './pages/MockServer';
import RTM from './pages/RTM';
import Exploratory from './pages/Exploratory';
import SystemDashboard from './pages/SystemDashboard';

// 9. Web Monitor
import WebMonitor from './pages/WebMonitor';
import EcommerceAutomation from './pages/EcommerceAutomation';
import PerformanceTesting from './pages/PerformanceTesting';
import SecurityTesting from './pages/SecurityTesting';
import AuditLogs from './pages/AuditLogs';
import TIA from './pages/TIA';
import BDDStudio from './pages/BDDStudio';

const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: 'var(--primary)',
    fontSize: '1.5rem',
    background: 'var(--bg-body)'
  }}>
    <div className="floating-icon" style={{ position: 'relative', animation: 'spin 1s linear infinite' }}>⏳</div>
    <span style={{ marginLeft: '1rem' }}>Loading...</span>
  </div>
);

const RoleProtectedRoute = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return role ? children : <Navigate to="/login" />;
};



const FeatureProtectedRoute = ({ children, feature }) => {
  const { hasAccess } = useAuth();
  if (!hasAccess(feature)) return <Navigate to="/dashboard" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* <Route path="/role-selection" element={<RoleSelection />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<RoleProtectedRoute><Layout /></RoleProtectedRoute>}>
            <Route path="/dashboard" element={<FeatureProtectedRoute feature="dashboard"><Dashboard /></FeatureProtectedRoute>} />
            <Route path="/board" element={<FeatureProtectedRoute feature="board"><Board /></FeatureProtectedRoute>} />
            <Route path="/projects" element={<FeatureProtectedRoute feature="projects"><Projects /></FeatureProtectedRoute>} />
            <Route path="/projects/:id" element={<FeatureProtectedRoute feature="projects"><ProjectDetails /></FeatureProtectedRoute>} />
            <Route path="/rtm" element={<FeatureProtectedRoute feature="testcases"><RTM /></FeatureProtectedRoute>} />
            <Route path="/test-cases" element={<FeatureProtectedRoute feature="testcases"><TestCases /></FeatureProtectedRoute>} />
            <Route path="/test-runs" element={<FeatureProtectedRoute feature="testruns"><TestRuns /></FeatureProtectedRoute>} />
            <Route path="/exploratory" element={<FeatureProtectedRoute feature="testruns"><Exploratory /></FeatureProtectedRoute>} />
            <Route path="/runs/:id" element={<FeatureProtectedRoute feature="testruns"><RunDetails /></FeatureProtectedRoute>} />
            <Route path="/execute-run/:id" element={<FeatureProtectedRoute feature="testruns"><ExecuteRun /></FeatureProtectedRoute>} />
            <Route path="/defects" element={<FeatureProtectedRoute feature="defects"><Defects /></FeatureProtectedRoute>} />
            <Route path="/autotest" element={<FeatureProtectedRoute feature="autotest"><AutoTest /></FeatureProtectedRoute>} />
            <Route path="/ai-testgen" element={<FeatureProtectedRoute feature="ai-testgen"><AITestGenerator /></FeatureProtectedRoute>} />
            <Route path="/visual-testing" element={<FeatureProtectedRoute feature="visual"><VisualTesting /></FeatureProtectedRoute>} />
            <Route path="/visual-run/:projectId" element={<FeatureProtectedRoute feature="visual"><VisualRun /></FeatureProtectedRoute>} />
            <Route path="/visual-diffs/:runId" element={<FeatureProtectedRoute feature="visual"><VisualDiffs /></FeatureProtectedRoute>} />
            <Route path="/visual-results/:runId" element={<FeatureProtectedRoute feature="visual"><VisualResults /></FeatureProtectedRoute>} />
            <Route path="/api-testing" element={<FeatureProtectedRoute feature="api-testing"><APITesting /></FeatureProtectedRoute>} />
            <Route path="/api-collection/:collectionId" element={<FeatureProtectedRoute feature="api-testing"><APICollection /></FeatureProtectedRoute>} />
            <Route path="/mock-server" element={<FeatureProtectedRoute feature="api-testing"><MockServer /></FeatureProtectedRoute>} />
            <Route path="/selenium" element={<FeatureProtectedRoute feature="selenium"><SeleniumDashboard /></FeatureProtectedRoute>} />
            <Route path="/selenium/execute" element={<FeatureProtectedRoute feature="selenium"><SeleniumExecute /></FeatureProtectedRoute>} />
            <Route path="/selenium/job/:id" element={<FeatureProtectedRoute feature="selenium"><JobDetails /></FeatureProtectedRoute>} />
            <Route path="/system" element={<FeatureProtectedRoute feature="dashboard"><SystemDashboard /></FeatureProtectedRoute>} />

            {/* Project 9: Web Monitor */}
            <Route path="/monitor" element={<FeatureProtectedRoute feature="monitor"><WebMonitor /></FeatureProtectedRoute>} />

            {/* Project 10: E-Commerce Automation */}
            <Route path="/ecommerce" element={<FeatureProtectedRoute feature="ecommerce"><EcommerceAutomation key="ecom" initialMode="sauce" /></FeatureProtectedRoute>} />


            {/* Performance Testing */}
            <Route path="/performance" element={<FeatureProtectedRoute feature="performance"><PerformanceTesting /></FeatureProtectedRoute>} />

            {/* Project 7: Security Tool */}
            <Route path="/security" element={<FeatureProtectedRoute feature="security"><SecurityTesting /></FeatureProtectedRoute>} />
            <Route path="/tia" element={<FeatureProtectedRoute feature="autotest"><TIA /></FeatureProtectedRoute>} />
            <Route path="/bdd" element={<FeatureProtectedRoute feature="autotest"><BDDStudio /></FeatureProtectedRoute>} />

            <Route path="/requirements" element={<FeatureProtectedRoute feature="requirements"><Requirements /></FeatureProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<FeatureProtectedRoute feature="all"><Users /></FeatureProtectedRoute>} />
            <Route path="/audit-logs" element={<FeatureProtectedRoute feature="all"><AuditLogs /></FeatureProtectedRoute>} />
            <Route path="/settings" element={<FeatureProtectedRoute feature="settings"><Settings /></FeatureProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
