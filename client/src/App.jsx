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
import WebMonitor from './pages/WebMonitor';
import EcommerceAutomation from './pages/EcommerceAutomation';
import PerformanceTesting from './pages/PerformanceTesting';
import SecurityTesting from './pages/SecurityTesting';


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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/test-cases" element={<TestCases />} />
            <Route path="/test-runs" element={<TestRuns />} />
            <Route path="/runs/:id" element={<RunDetails />} />
            <Route path="/execute-run/:id" element={<ExecuteRun />} />
            <Route path="/defects" element={<Defects />} />
            <Route path="/autotest" element={<AutoTest />} />
            <Route path="/ai-testgen" element={<AITestGenerator />} />
            <Route path="/visual-testing" element={<VisualTesting />} />
            <Route path="/visual-run/:projectId" element={<VisualRun />} />
            <Route path="/visual-diffs/:runId" element={<VisualDiffs />} />
            <Route path="/visual-results/:runId" element={<VisualResults />} />
            <Route path="/api-testing" element={<APITesting />} />
            <Route path="/api-collection/:collectionId" element={<APICollection />} />
            <Route path="/selenium" element={<SeleniumDashboard />} />
            <Route path="/selenium/execute" element={<SeleniumExecute />} />
            <Route path="/selenium/job/:id" element={<JobDetails />} />

            {/* Project 9: Web Monitor */}
            <Route path="/monitor" element={<WebMonitor />} />

            {/* Project 10: E-Commerce Automation */}
            <Route path="/ecommerce" element={<EcommerceAutomation key="ecom" initialMode="sauce" />} />


            {/* Performance Testing */}
            <Route path="/performance" element={<PerformanceTesting />} />

            {/* Mobile Testing (Removed) */}

            {/* Project 7: Security Tool */}
            <Route path="/security" element={<SecurityTesting />} />

            <Route path="/requirements" element={<Requirements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
