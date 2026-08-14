import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setIsProcessing(true);
            if (!email || !password) throw new Error("Please fill in all fields.");
            await login(email, password);
            addToast("Authentication secure", "success");
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || "Failed to login.");
            addToast(err.message || "Authentication rejected.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container glass-panel" style={{ maxWidth: '420px', marginTop: '6rem' }}>
            <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.2rem' }}>CDMS Portal</h2>

            {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity Hash</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter professional email" disabled={isProcessing} />
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Key</label>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-accent)', textDecoration: 'none' }}>Recover Access?</Link>
                    </div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter active password" disabled={isProcessing} />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginBottom: '2rem', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.05em' }}>
                    {isProcessing ? 'Decrypting...' : 'Initialize Session'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Security Clearance Required? </span>
                    <Link to="/register" style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>Request Access</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
