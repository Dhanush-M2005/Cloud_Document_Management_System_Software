import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const canvasRef = useRef(null);


    const navigate = useNavigate();
    const { addToast } = useToast();

    // Canvas background animation — same as Landing page
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const items = [];
        const ITEM_COUNT = 30;

        const createItem = (spreadY = false, index = 0) => ({
            x: Math.random() * canvas.width,
            y: spreadY ? (index / ITEM_COUNT) * (canvas.height + 100) - 50 : Math.random() * canvas.height,
            speed: Math.random() * 0.4 + 0.15,
            size: Math.random() * 14 + 10,
            opacity: Math.random() * 0.3 + 0.15,
            drift: (Math.random() - 0.5) * 0.3,
            type: ['doc', 'lock', 'cloud', 'shield'][Math.floor(Math.random() * 4)],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.005,
        });

        for (let i = 0; i < ITEM_COUNT; i++) {
            items.push(createItem(true, i));
        }

        const drawDoc = (x, y, s, opacity, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.globalAlpha = opacity;
            const fold = s * 0.3;
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s * 0.7);
            ctx.lineTo(s / 2 - fold, -s * 0.7);
            ctx.lineTo(s / 2, -s * 0.7 + fold);
            ctx.lineTo(s / 2, s * 0.7);
            ctx.lineTo(-s / 2, s * 0.7);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(6, 182, 212, 1)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s / 2 - fold, -s * 0.7);
            ctx.lineTo(s / 2 - fold, -s * 0.7 + fold);
            ctx.lineTo(s / 2, -s * 0.7 + fold);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const ly = -s * 0.25 + i * s * 0.25;
                const lw = s * 0.5 - i * s * 0.08;
                ctx.beginPath();
                ctx.moveTo(-s * 0.3, ly);
                ctx.lineTo(-s * 0.3 + lw, ly);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        };

        const drawLock = (x, y, s, opacity, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * 0.3);
            ctx.globalAlpha = opacity;
            const bw = s * 0.6, bh = s * 0.5;
            ctx.beginPath();
            ctx.roundRect(-bw / 2, 0, bw, bh, 2);
            ctx.strokeStyle = 'rgba(139, 92, 246, 1)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, bw * 0.35, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, bh * 0.35, s * 0.06, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
            ctx.fill();
            ctx.restore();
        };

        const drawCloud = (x, y, s, opacity) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(-s * 0.2, 0, s * 0.3, Math.PI * 0.5, Math.PI * 1.5);
            ctx.arc(0, -s * 0.25, s * 0.35, Math.PI, 0);
            ctx.arc(s * 0.25, 0, s * 0.25, Math.PI * 1.5, Math.PI * 0.5);
            ctx.lineTo(-s * 0.2, s * 0.3);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, s * 0.15);
            ctx.lineTo(0, -s * 0.05);
            ctx.moveTo(-s * 0.1, s * 0.05);
            ctx.lineTo(0, -s * 0.05);
            ctx.lineTo(s * 0.1, s * 0.05);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        };

        const drawShield = (x, y, s, opacity, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * 0.2);
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.6);
            ctx.quadraticCurveTo(s * 0.5, -s * 0.45, s * 0.45, -s * 0.1);
            ctx.quadraticCurveTo(s * 0.4, s * 0.35, 0, s * 0.6);
            ctx.quadraticCurveTo(-s * 0.4, s * 0.35, -s * 0.45, -s * 0.1);
            ctx.quadraticCurveTo(-s * 0.5, -s * 0.45, 0, -s * 0.6);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s * 0.12, s * 0.05);
            ctx.lineTo(-s * 0.02, s * 0.18);
            ctx.lineTo(s * 0.15, -s * 0.1);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        };

        const drawFns = { doc: drawDoc, lock: drawLock, cloud: drawCloud, shield: drawShield };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const item of items) {
                drawFns[item.type](item.x, item.y, item.size, item.opacity, item.rotation);
                item.y -= item.speed;
                item.x += item.drift;
                item.rotation += item.rotSpeed;
                if (item.y < -50) {
                    item.y = canvas.height + Math.random() * 80 + 20;
                    item.x = Math.random() * canvas.width;
                    item.opacity = Math.random() * 0.3 + 0.15;
                    item.speed = Math.random() * 0.4 + 0.15;
                    item.drift = (Math.random() - 0.5) * 0.3;
                    item.size = Math.random() * 14 + 10;
                    item.type = ['doc', 'lock', 'cloud', 'shield'][Math.floor(Math.random() * 4)];
                }
            }
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    const { login, confirmNewPassword } = useAuth();
    const [newPasswordRequired, setNewPasswordRequired] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isQuarantined, setIsQuarantined] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setIsProcessing(true);
            setError('');
            
            if (newPasswordRequired) {
                if (!newPassword) throw new Error("Please enter a new password.");
                const strictRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                if (!strictRegex.test(newPassword)) {
                    throw new Error("Password requires 8+ bounds: Uppercase, Lowercase, Number & Symbol.");
                }
                
                await confirmNewPassword(newPassword);
                addToast("Authentication secure. Password updated.", "success");
                navigate('/dashboard');
                return;
            }

            if (!email || !password) throw new Error("Please fill in all fields.");
            const result = await login(email, password);
            
            if (result?.isNewPasswordRequired) {
                setNewPasswordRequired(true);
                addToast("Admin temporary password detected. Force password change required.", "warning");
                return;
            }
            
            addToast("Authentication secure", "success");
            navigate('/dashboard');
        } catch (err) {
            let errorMsg = err.message || "Failed to login.";
            
            if (errorMsg.includes('User does not exist')) {
                errorMsg = "User not found. Please ensure the email is correct or register a new account.";
            } else if (errorMsg.includes('Incorrect username or password')) {
                errorMsg = "Incorrect email or password.";
            } else if (errorMsg.includes('User is disabled')) {
                setIsQuarantined(true);
                return; // Prevent showing red error toast, UI handles it now
            }

            setError(errorMsg);
            addToast("Authentication rejected.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', padding: '2rem 1rem' }}>

            <Link to="/" className="btn-back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                <span style={{ fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.1em' }}>RETURN</span>
            </Link>

            {/* Canvas Background */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '100vw', height: '100vh',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            {/* Subtle ambient glow */}
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: '350px', height: '350px', background: 'rgba(6, 182, 212, 0.06)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '350px', height: '350px', background: 'rgba(139, 92, 246, 0.06)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>

            {/* Logo + CDMS Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <img src="/cdms_branding.svg" alt="CDMS Logo" style={{ width: '56px', height: '56px', filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))' }} />
                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-pure, #ffffff)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '3px' }}>
                    CDMS
                </span>
            </div>

            {/* Login Form */}
            <div className="container glass-panel" style={{ maxWidth: '420px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
                
                {isQuarantined ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', animation: 'fadeUp 0.8s ease' }}>🛡️</div>
                        <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Identity Quarantined</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>Origin strictly verified. Active status mechanically locked into <strong style={{ color: 'var(--error)' }}>DISABLED</strong> matrix architecture.</p>
                        <p style={{ color: 'var(--warning)', fontSize: '0.95rem', marginBottom: '2.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.05)' }}>Await elevated command-level override manually executed by System Administrators prior to Authentication.</p>

                        <button onClick={() => { setIsQuarantined(false); setEmail(''); setPassword(''); }} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                            Disconnect & Return
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.2rem' }}>CDMS Portal</h2>

                        {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                        <form onSubmit={handleLogin}>
                            {newPasswordRequired ? (
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password (Required by Admin)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Enter a new permanent password" disabled={isProcessing} style={{ paddingRight: '2.5rem' }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} title={showPassword ? "Hide Password" : "Show Password"}>
                                            {showPassword ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={isProcessing} style={{ width: '100%', marginBottom: '2rem', padding: '0.85rem', fontSize: '1rem', letterSpacing: '0.05em' }}>
                                {isProcessing ? 'Decrypting...' : (newPasswordRequired ? 'Confirm New Password' : 'Initialize Session')}
                            </button>

                            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Security Clearance Required? </span>
                                <Link to="/register" style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>Request Access</Link>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
