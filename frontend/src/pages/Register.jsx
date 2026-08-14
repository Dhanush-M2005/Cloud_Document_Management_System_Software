import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your full name" disabled={isProcessing} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email address" disabled={isProcessing} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                        <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.6rem' }}>[ 8+ Bounds, 1 Upper, 1 Lower, 1 Number, 1 Symbol ]</div>
                        <div style={{ position: 'relative' }}>
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create a strong password" disabled={isProcessing} style={{ paddingRight: '2.5rem' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} title={showPassword ? "Hide Password" : "Show Password"}>
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm your password" disabled={isProcessing} style={{ paddingRight: '2.5rem' }} />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} title={showConfirmPassword ? "Hide Password" : "Show Password"}>
                                {showConfirmPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
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
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Code (OTP)</label>
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
