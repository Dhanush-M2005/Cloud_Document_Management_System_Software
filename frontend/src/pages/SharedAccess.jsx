import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SharedAccess = () => {
    const { token } = useParams();
    const { user } = useAuth();
    const [fileData, setFileData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFocused, setIsFocused] = useState(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const res = await fetch(`${apiUrl}/share/${token}`, {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const resJson = await res.json().catch(() => ({}));

                if (!resJson.success) {
                    throw new Error(resJson.message || "Link invalid or expired.");
                }
                setFileData(resJson.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [token, apiUrl]);

    useEffect(() => {
        if (!fileData || !fileData.expiresAt) return;

        const checkExpiry = () => {
            if (Date.now() > new Date(fileData.expiresAt).getTime()) {
                setFileData(null);
                setError("Share link has expired or been revoked.");
            }
        };

        checkExpiry();
        const interval = setInterval(checkExpiry, 1000);

        return () => clearInterval(interval);
    }, [fileData]);

    // Global security overrides for view-only mode
    useEffect(() => {
        if (fileData && fileData.permission === 'VIEW') {
            const handleContextMenu = (e) => e.preventDefault();
            const handleKeyDown = (e) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
                    e.preventDefault();
                }
            };
            const handleDragStart = (e) => e.preventDefault();
            
            const handleBlur = () => {
                setTimeout(() => {
                    if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                        return;
                    }
                    setIsFocused(false);
                }, 50);
            };
            const handleFocus = () => setIsFocused(true);
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    setIsFocused(false);
                } else if (document.visibilityState === 'visible') {
                    setIsFocused(true);
                }
            };
            const handleKeyUp = (e) => {
                if (e.key === 'PrintScreen') {
                    navigator.clipboard.writeText('Security violation: Screenshots are strictly prohibited.');
                    setIsFocused(false);
                    setTimeout(() => setIsFocused(true), 3000);
                }
            };

            window.addEventListener('contextmenu', handleContextMenu);
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('dragstart', handleDragStart);
            window.addEventListener('blur', handleBlur);
            window.addEventListener('focus', handleFocus);
            window.addEventListener('keyup', handleKeyUp);
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // Hack: Constantly steal focus from the iframe so the main window can always detect Snipping Tool
            const focusStealer = setInterval(() => {
                if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                    document.activeElement.blur();
                    window.focus();
                }
            }, 100);

            return () => {
                window.removeEventListener('contextmenu', handleContextMenu);
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('dragstart', handleDragStart);
                window.removeEventListener('blur', handleBlur);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('keyup', handleKeyUp);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                clearInterval(focusStealer);
            };
        }
    }, [fileData]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.6s ease', marginTop: '2rem' }}>
            <style>{`
                @media print {
                    html, body { display: none !important; }
                }
            `}</style>

            {loading ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div className="loader-overlay" style={{ minHeight: '80px' }}><div className="spinner"></div></div>
                    <p style={{ color: 'var(--text-muted)' }}>Loading file...</p>
                </div>
            ) : error ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid rgba(244,63,94,0.3)', boxShadow: '0 0 40px rgba(244,63,94,0.1)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'grayscale(1) opacity(0.3)' }}>🚫</div>
                    <h2 className="text-gradient" style={{ color: 'var(--error)' }}>Access Denied</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>{error}</p>
                </div>
            ) : (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <div>
                        <div style={{ fontSize: '3.5rem', margin: '0 auto 1.5rem', opacity: 0.9 }}>📄</div>
                        <h2 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{fileData.fileName}</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            Size: {(fileData.fileSize / 1024 / 1024).toFixed(2)} MB &bull; Type: {fileData.fileType.split('/')[1] || fileData.fileType}
                        </p>

                        <div style={{ margin: '2rem 0', padding: '2rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: fileData.permission === 'VIEW' ? 'var(--warning)' : 'var(--text-pure)' }}>
                                Permissions: <strong style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{fileData.permission}</strong>
                            </p>

                            {fileData.permission === 'DOWNLOAD' ? (
                                <a href={fileData.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                    <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--success), #059669)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                        Download File
                                    </button>
                                </a>
                            ) : (
                                <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', background: '#333333', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', height: '700px' }} onContextMenu={e => e.preventDefault()}>
                                    
                                    {!isFocused && (
                                        <div 
                                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer' }}
                                            onClick={() => {
                                                window.focus();
                                                setIsFocused(true);
                                            }}
                                        >
                                            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'fadeUp 0.3s ease' }}>🛡️</div>
                                            <h3 style={{ color: 'var(--error)', margin: '0 0 0.5rem 0', letterSpacing: '0.1em' }}>SECURITY PROTOCOL ACTIVATED</h3>
                                            <p style={{ color: 'var(--text-muted)' }}>Screen capture, sharing, and background viewing are strictly prohibited.</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem', opacity: 0.5, border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '20px' }}>Click anywhere to resume secure viewing</p>
                                        </div>
                                    )}

                                    {/* Watermark Overlay */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 100px)', zIndex: 10001, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', opacity: 0.3 }}>
                                        {Array.from({ length: 30 }).map((_, i) => (
                                            <div key={i} style={{ padding: '4rem', transform: 'rotate(-45deg)', color: 'rgba(255,255,255,0.1)', fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'nowrap', userSelect: 'none' }}>
                                                CONFIDENTIAL • VIEW ONLY • {new Date().toISOString().split('T')[0]}
                                            </div>
                                        ))}
                                    </div>
                                    {fileData.fileType.startsWith('image/') ? (
                                        <img src={fileData.downloadUrl} alt="Secure Visual" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', display: 'block' }} />
                                    ) : (
                                        <>
                                            {/* Google Docs Viewer completely replaces the native PDF viewer. 
                                                It allows mouse-wheel scrolling naturally while preventing native 'Save As PDF' right-clicks. 
                                                We add a small block over the top right corner to hide the 'Pop-out' button. */}
                                            <div style={{ position: 'absolute', top: 0, right: 0, width: '50px', height: '50px', background: '#333333', zIndex: 10 }}></div>
                                            
                                            <iframe 
                                                id="secure-iframe"
                                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileData.downloadUrl)}&embedded=true`} 
                                                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
                                                title="Secure Document Matrix" 
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="badge badge-blue" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                            Link expires on: {new Date(fileData.expiresAt).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedAccess;
