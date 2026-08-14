import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { register, verifyOtp } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            setIsProcessing(true);
            setError('');
            if (!name || !email || !password || !confirmPassword) throw new Error("Please fill in all physical bounds.");
            if (password !== confirmPassword) throw new Error("Cryptographic keys must match identically.");

            const strictRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!strictRegex.test(password)) {
                throw new Error("Password must be 8+ bounds, including Uppercase, Lowercase, Number & Symbol.");
            }

            await register(name, email, password);
            setStep(2);
            addToast("Validation payload dispatched to AWS Origin", "success");
        } catch (err) {
            setError(err.message || "Failed to initialize identity.");
            addToast(err.message || "Initialization failure.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            setIsProcessing(true);
            setError('');
            if (!otp) throw new Error("Please enter origin verification matrix.");

            await verifyOtp(email, otp);
            addToast("Identity Confirmed! Entering Quarantine State.", "success");

            setTimeout(() => { navigate('/login'); }, 3000);
            setStep(3);
        } catch (err) {
            setError(err.message || "Failed to verify origin layer.");
            addToast(err.message || "Verification rejection.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container glass-panel" style={{ maxWidth: '420px', marginTop: '6rem' }}>
            <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2.2rem' }}>Provision Identity</h2>

            {step === 1 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Secure authorization requested. Approval mandatory.</p>}
            {step === 2 && <p style={{ color: 'var(--warning)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Scan your physical inbox for the validation key.</p>}

            {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

            {step === 1 && (
                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity Designation</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter full designation" disabled={isProcessing} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Routing Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Secure email origin" disabled={isProcessing} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cryptographic Key</label>
                        <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.6rem' }}>[ 8+ Bounds, 1 Upper, 1 Lower, 1 Number, 1 Symbol ]</div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Establish secure bounds" disabled={isProcessing} />
                    </div>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Verification</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Echo physical cryptography" disabled={isProcessing} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginBottom: '2rem', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.05em' }}>
                        {isProcessing ? 'Generating Mesh...' : 'Request Provisioning'}
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Authority granted? </span>
                        <Link to="/login" style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>Access Layer</Link>
                    </div>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerify}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temporal Matrix (OTP)</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="6-digit code" style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.3rem', fontWeight: 'bold' }} disabled={isProcessing} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginBottom: '1.5rem', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.05em', background: 'linear-gradient(135deg, var(--warning), #d97706)' }}>
                        {isProcessing ? 'Computing...' : 'Validate Origin'}
                    </button>
                </form>
            )}

            {step === 3 && (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', animation: 'fadeUp 0.8s ease' }}>🛡️</div>
                    <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Identity Quarantined</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>Origin strictly verified. Active status mechanically locked into <strong style={{ color: 'var(--error)' }}>DISABLED</strong> matrix architecture.</p>
                    <p style={{ color: 'var(--warning)', fontSize: '0.95rem', marginBottom: '2.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.05)' }}>Await elevated command-level override manually executed by System Administrators prior to Authentication.</p>

                    <button onClick={() => navigate('/login')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                        Disconnect & Return
                    </button>
                </div>
            )}
        </div>
    );
};

export default Register;
