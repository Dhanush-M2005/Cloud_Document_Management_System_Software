import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { sendPasswordReset, confirmPasswordResetCode } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSendCode = async (e) => {
        e.preventDefault();
        try {
            setIsProcessing(true);
            setError('');
            if (!email) throw new Error("Please enter your registered email address.");

            await sendPasswordReset(email);
            setStep(2);
            addToast("Quantum recovery payload explicitly sent to your email", "success");
        } catch (err) {
            setError(err.message || "Failed to send reset code. Please ensure your email is correct.");
            addToast(err.message || "Failed to initiate recovery.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            setIsProcessing(true);
            setError('');
            if (!otp || !password || !confirmPassword) throw new Error("Please fill in all recovery parameters.");
            if (password !== confirmPassword) throw new Error("Passwords must match identically.");

            const strictRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!strictRegex.test(password)) {
                throw new Error("Password requires 8+ bounds: Uppercase, Lowercase, Number & Symbol.");
            }

            await confirmPasswordResetCode(email, otp, password);
            addToast("Identity securely recovered! You may now re-authenticate.", "success");
            navigate('/login');
        } catch (err) {
            setError(err.message || "Failed to verify code or reset password.");
            addToast(err.message || "Recovery failure.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container glass-panel" style={{ maxWidth: '420px', marginTop: '6rem' }}>
            <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.2rem' }}>Identity Recovery</h2>

            {step === 1 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    Provide your system identity hash. A unique temporal OTP token will be generated via AWS SNS.
                </p>
            )}

            {step === 2 && (
                <p style={{ color: 'var(--warning)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    Enter the temporal recovery matrix received via email alongside your new physical cryptography credentials.
                </p>
            )}

            {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

            {step === 1 && (
                <form onSubmit={handleSendCode}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email address" disabled={isProcessing} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginBottom: '2rem', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.05em' }}>
                        {isProcessing ? 'Broadcasting to Edge...' : 'Dispatch Auth Token'}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bypass Recovery? </span>
                        <Link to="/login" style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>Return to Login</Link>
                    </div>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleResetPassword}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Code (OTP)</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="6-digit code" style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.3rem', fontWeight: 'bold' }} disabled={isProcessing} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                        <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.6rem' }}>
                            [ 8+ Bounds, 1 Upper, 1 Lower, 1 Number, 1 Symbol ]
                        </div>
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
                            <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm your new password" disabled={isProcessing} style={{ paddingRight: '2.5rem' }} />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} title={showConfirmPassword ? "Hide Password" : "Show Password"}>
                                {showConfirmPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginBottom: '1.5rem', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.05em', background: 'linear-gradient(135deg, var(--success), #059669)' }}>
                        {isProcessing ? 'Overwriting Matrix Key...' : 'Force Cryptographic Reset'}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                        <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ padding: '0.5rem 1rem', border: 'none' }}>
                            Resend Token Override
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ForgotPassword;
