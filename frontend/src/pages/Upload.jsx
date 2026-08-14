import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const Upload = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);

    const MAX_SIZE_MB = import.meta.env.VITE_MAX_FILE_SIZE_MB || 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    const handleFileChange = (e) => {
        setError('');
        setSuccess(false);
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (selectedFile.size > MAX_SIZE_BYTES) {
            setError(`Data mass exceeds ${MAX_SIZE_MB}MB AWS proxy limits.`);
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            setError('');
            setSuccess(false);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';
            const res = await fetch(`${apiUrl}/documents/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size })
            });

            if (!res.ok) throw new Error("AWS Proxy sync failed. Check system infrastructure.");
            const getUrlJson = await res.json();
            if (!getUrlJson.success) throw new Error(getUrlJson.message || "Network rejected data package.");
            const { uploadUrl, documentId, s3Key } = getUrlJson.data;

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file
            });

            if (!uploadRes.ok) throw new Error("S3 Block Storage transmission failed.");

            const metadataRes = await fetch(`${apiUrl}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    documentId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    s3Key
                })
            });

            if (!metadataRes.ok) throw new Error("Failed to index AWS metadata coordinates.");
            const finalJson = await metadataRes.json().catch(() => ({}));
            if (finalJson.success === false) throw new Error(finalJson.message);

            setSuccess(true);
            addToast("Node injected into AWS matrices successfully.", "success");
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            console.error(err);
            addToast(err.message, 'error');
            setError(err.message || 'Fatal error during stream.');
        } finally {
            setUploading(false);
        }
    };

    const navigate = useNavigate();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: '1rem' }} onClick={() => navigate('/dashboard')}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem', animation: 'fadeUp 0.4s ease', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button type="button" onClick={() => navigate('/dashboard')} className="icon-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div style={{ width: '38px', height: '38px' }}></div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '-2rem' }}>
                    <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>Upload File</h2>
                    {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.9rem' }}>{error}</div>}

                    <div
                        style={{
                            border: `2px dashed ${isHovered ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            backgroundColor: isHovered ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            marginBottom: '1.5rem',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: isHovered ? '0 0 40px rgba(6, 182, 212, 0.2)' : 'inset 0 4px 20px rgba(0,0,0,0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onClick={() => fileInputRef.current.click()}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {isHovered && <div style={{ position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%)', animation: 'spin 10s linear infinite', pointerEvents: 'none' }}></div>}

                        <div style={{ fontSize: '4rem', marginBottom: '1rem', transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isHovered ? 'translateY(-10px) scale(1.1)' : 'translateY(0) scale(1)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>📤</div>
                        <h3 style={{ color: 'var(--text-pure)', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>Select File to Upload</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>Drag and drop, or browse to select. Max size {MAX_SIZE_MB}MB.</p>

                        <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} className="btn btn-ghost" style={{ position: 'relative', zIndex: 1, padding: '0.6rem 2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            Browse Files...
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                        />
                    </div>

                    {file && (
                        <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                                <div style={{ padding: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', color: 'var(--primary-accent)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-pure)', marginBottom: '0.3rem', fontSize: '1rem', letterSpacing: '0.5px' }}>{file.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Size: {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload</div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setFile(null)} className="icon-btn danger" style={{ border: 'none', background: 'transparent' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={`btn ${file ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            fontSize: '1.1rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            borderRadius: 'var(--radius-md)',
                            opacity: (!file || uploading) ? 0.7 : 1,
                            background: file ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' : 'rgba(255,255,255,0.05)',
                            border: file ? '1px solid rgba(255,255,255,0.2)' : '1px dashed rgba(255,255,255,0.1)'
                        }}
                    >
                        {uploading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                                Uploading...
                            </div>
                        ) : (file ? 'Upload File' : 'Choose a file first')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Upload;
