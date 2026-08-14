import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SharedAccess = () => {
    const { token } = useParams();
    const { user } = useAuth();
    const [fileData, setFileData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

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
                                <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', background: '#fff', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onContextMenu={e => e.preventDefault()}>
                                    {fileData.fileType.startsWith('image/') ? (
                                        <img src={fileData.downloadUrl} alt="Secure Visual" style={{ width: '100%', pointerEvents: 'none', userSelect: 'none', display: 'block' }} />
                                    ) : (
                                        <>
                                            <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(fileData.downloadUrl)}&embedded=true`} width="100%" height="700px" style={{ border: 'none', display: 'block' }} title="Secure Document Matrix" />
                                            <div
                                                style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: '#323639', cursor: 'default', zIndex: 50 }}
                                                onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                                                title="View-only mode restrictions applied."
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
