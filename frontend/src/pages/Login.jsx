import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" disabled={isProcessing} />
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-accent)', textDecoration: 'none' }}>Forgot Password?</Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" disabled={isProcessing} style={{ paddingRight: '2.5rem' }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} title={showPassword ? "Hide Password" : "Show Password"}>
                            {showPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                        </button>
                    </div>
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
