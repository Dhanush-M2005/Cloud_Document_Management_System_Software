import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import SharedAccess from './pages/SharedAccess';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '100px', marginTop: '2rem', marginBottom: '3rem', position: 'sticky', top: '1rem', zIndex: 50, border: '1px solid rgba(255,255,255,0.08)' }}>
      <Link to="/dashboard" style={{ fontSize: '1.3rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-pure)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '2px' }}>
        <img src="/cdms_branding.svg" alt="CDMS Logo" style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' }} />
        CDMS
      </Link>
      {user?.role === 'ADMIN' && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/dashboard">
            <button className={`btn ${currentPath !== '/admin' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
              📂 Dashboard
            </button>
          </Link>
          <Link to="/admin">
            <button className={`btn ${currentPath === '/admin' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', background: currentPath === '/admin' ? 'linear-gradient(135deg, #be123c, #9f1239)' : '', border: currentPath === '/admin' ? 'none' : '', boxShadow: currentPath === '/admin' ? '0 4px 15px rgba(225, 29, 72, 0.4)' : 'none' }}>
              ⚙️ Admin Hub
            </button>
          </Link>
        </div>
      )}
    </header>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <Header />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/share/:token" element={<ProtectedRoute><SharedAccess /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
