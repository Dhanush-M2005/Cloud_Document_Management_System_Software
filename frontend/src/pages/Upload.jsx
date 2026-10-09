import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [customFileName, setCustomFileName] = useState('');
    const [visibility, setVisibility] = useState('ALL'); // ALL, EDITOR_ADMIN, ADMIN_ONLY
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);

    const MAX_SIZE_MB = import.meta.env.VITE_MAX_FILE_SIZE_MB || 100;
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
        setCustomFileName(selectedFile.name);
    };

    const handleUpload = async () => {
        if (!file) return;
        if (!customFileName.trim()) {
            setError("Please provide a valid file name.");
            return;
        }
        try {
            setUploading(true);
            setError('');
            setSuccess(false);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';
            const finalFileName = customFileName.trim();

            const res = await fetch(`${apiUrl}/documents/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ fileName: finalFileName, fileType: file.type, fileSize: file.size })
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
                    fileName: finalFileName,
                    fileType: file.type,
                    fileSize: file.size,
                    s3Key,
                    visibility
                })
            });

            if (!metadataRes.ok) throw new Error("Failed to index AWS metadata coordinates.");
            const finalJson = await metadataRes.json().catch(() => ({}));
            if (finalJson.success === false) throw new Error(finalJson.message);

            setSuccess(true);
            addToast("Node injected into AWS matrices successfully.", "success");
            setFile(null);
            setCustomFileName('');
            setVisibility('ALL');
            if (fileInputRef.current) fileInputRef.current.value = "";
            
            // Auto close the upload card
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            console.error(err);
            addToast(err.message, 'error');
            setError(err.message || 'Fatal error during stream.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: '1rem', overflowY: 'auto' }} onClick={() => navigate('/dashboard')}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', animation: 'fadeUp 0.4s ease', position: 'relative', marginTop: 'auto', marginBottom: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button type="button" onClick={() => navigate('/dashboard')} className="icon-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div style={{ width: '38px', height: '38px' }}></div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '-2rem' }}>
                    <h2 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>Upload File</h2>
                    {error && <div style={{ color: 'var(--error)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.9rem' }}>{error}</div>}

                    {!file ? (
                        <div
                            style={{
                                border: `2px dashed ${isHovered ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 'var(--radius-lg)',
                                padding: '3rem 2rem',
                                textAlign: 'center',
                                backgroundColor: isHovered ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0,0,0,0.3)',
                                cursor: 'pointer',
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
                            <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} className="btn btn-ghost" style={{ position: 'relative', zIndex: 1, padding: '0.6rem 2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>Browse Files...</button>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeUp 0.4s ease', textAlign: 'left' }}>
                            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', color: 'var(--primary-accent)' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-pure)', marginBottom: '0.3rem', fontSize: '1rem', letterSpacing: '0.5px', wordBreak: 'break-all' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setFile(null)} className="icon-btn danger" style={{ border: 'none', background: 'transparent' }} title="Change file">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Document Name</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={customFileName} 
                                    onChange={e => setCustomFileName(e.target.value)} 
                                    placeholder="Enter document name"
                                    style={{ width: '100%', fontSize: '1rem' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>This name will be displayed across all dashboards.</p>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Visibility Access Level</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {[
                                        { id: 'ALL', label: 'All Roles', desc: 'Viewers, Editors, and Admins can see this document.' },
                                        { id: 'EDITOR_ADMIN', label: 'Editors & Admins', desc: 'Only Editors and Admins can see this document.' },
                                        { id: 'ADMIN_ONLY', label: 'Admins Only', desc: 'Strictly visible only to Administrators.' }
                                    ].map(option => (
                                        <div 
                                            key={option.id}
                                            onClick={() => setVisibility(option.id)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: `1px solid ${visibility === option.id ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'}`,
                                                background: visibility === option.id ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0,0,0,0.2)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                transition: 'all 0.2s ease',
                                                boxShadow: visibility === option.id ? '0 0 15px rgba(6, 182, 212, 0.1)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%', 
                                                border: `2px solid ${visibility === option.id ? 'var(--primary-accent)' : 'rgba(255,255,255,0.3)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {visibility === option.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-accent)' }}></div>}
                                            </div>
                                            <div>
                                                <div style={{ color: visibility === option.id ? 'var(--primary-accent)' : 'var(--text-pure)', fontWeight: '600', fontSize: '1rem', marginBottom: '0.2rem' }}>{option.label}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{option.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" />

                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="btn btn-primary"
                            style={{
                                width: '100%', padding: '1.25rem', fontSize: '1.1rem', letterSpacing: '0.1em',
                                textTransform: 'uppercase', borderRadius: 'var(--radius-md)',
                                opacity: uploading ? 0.7 : 1,
                                background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            {uploading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                                    Encrypting & Uploading...
                                </div>
                            ) : 'Upload Document'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upload;
