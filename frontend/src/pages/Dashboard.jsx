import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingDoc, setEditingDoc] = useState(null);
    const [newName, setNewName] = useState('');
    const [activeSharesCount, setActiveSharesCount] = useState(0);

    const canEdit = user?.groups?.includes('EDITOR') || user?.groups?.includes('ADMIN') || user?.role === 'ADMIN' || false;

    // Share Generation States
    const [shareConfig, setShareConfig] = useState(null);
    const [shareResult, setShareResult] = useState(null);
    const [shareExpiryNum, setShareExpiryNum] = useState(1);
    const [shareExpiryUnit, setShareExpiryUnit] = useState(1440); // Default Days
    const [sharePermission, setSharePermission] = useState('VIEW');
    const [accessLevel, setAccessLevel] = useState('PUBLIC');
    const [isSharing, setIsSharing] = useState(false);

    // Manage Shares State
    const [managingSharesFor, setManagingSharesFor] = useState(null);
    const [fetchedShares, setFetchedShares] = useState([]);
    const [isFetchingShares, setIsFetchingShares] = useState(false);

    const [deleteConfig, setDeleteConfig] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const [docsRes, sharesRes] = await Promise.all([
                fetch(`${apiUrl}/documents`, { headers: { 'Authorization': `Bearer ${user?.token}` } }),
                fetch(`${apiUrl}/shares/me`, { headers: { 'Authorization': `Bearer ${user?.token}` } })
            ]);

            const docsJson = await docsRes.json().catch(() => ({}));
            const sharesJson = await sharesRes.json().catch(() => ({}));

            if (!docsJson.success) throw new Error(docsJson.message || "Failed to sync cloud matrices");

            setDocuments(docsJson.data || []);
            setActiveSharesCount(sharesJson.data ? sharesJson.data.length : 0);
        } catch (err) {
            setError(err.message);
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareResult);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = shareResult;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (e) {
                    throw new Error("Copy override failed");
                }
                document.body.removeChild(textArea);
            }
            addToast("Secure link physically copied to clipboard!", "success");
        } catch (err) {
            console.error(err);
            addToast("Clipboard permission denied.", "error");
        }
    };

    const executeDelete = async () => {
        if (!deleteConfig) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${apiUrl}/documents/${deleteConfig.documentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to purge sequence");

            setDocuments(docs => docs.filter(d => d.documentId !== deleteConfig.documentId));
            addToast("Data purged from AWS matrix securely.", "success");
            setDeleteConfig(null);
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = async (documentId) => {
        try {
            const res = await fetch(`${apiUrl}/documents/${documentId}/download`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to get secure link");
            const { downloadUrl } = resJson.data;

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            addToast("Temporal vault opened for transfer.", "success");
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const executeShare = async (e) => {
        e.preventDefault();
        try {
            setIsSharing(true);
            const res = await fetch(`${apiUrl}/documents/${shareConfig.documentId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ permission: sharePermission, expirationMinutes: parseInt(shareExpiryNum, 10) * parseInt(shareExpiryUnit, 10), accessLevel })
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to compile token");
            const { url } = resJson.data;

            setShareResult(window.location.origin + url);
            setActiveSharesCount(prev => prev + 1);
            addToast("Cryptographic tunnel compiled", "success");
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsSharing(false);
        }
    };

    const openManageShares = async (doc) => {
        setManagingSharesFor(doc);
        setIsFetchingShares(true);
        try {
            const res = await fetch(`${apiUrl}/documents/${doc.documentId}/shares`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to query active links");

            const data = resJson.data;
            if (data) data.sort((a, b) => (a.status === 'ACTIVE' ? -1 : 1));
            setFetchedShares(data || []);
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsFetchingShares(false);
        }
    };

    const revokeShare = async (shareToken) => {
        try {
            const res = await fetch(`${apiUrl}/shares/${shareToken}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to revoke token");

            setFetchedShares(prev => prev.map(s => s.shareToken === shareToken ? { ...s, status: 'REVOKED' } : s));
            addToast("Tunnel severed mechanically.", "success");
            setActiveSharesCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const submitRename = async (e) => {
        e.preventDefault();
        if (!newName || !editingDoc) return;
        try {
            const res = await fetch(`${apiUrl}/documents/${editingDoc.documentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ newName })
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to rename");

            setDocuments(docs => docs.map(d => d.documentId === editingDoc.documentId ? { ...d, fileName: newName } : d));
            setEditingDoc(null);
            setNewName('');
            addToast("Naming parameters rewritten.", "success");
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', animation: 'fadeUp 0.6s ease' }}>
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 className="text-gradient" style={{ marginBottom: '0.2rem', fontSize: '2rem' }}>Dashboard</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Welcome, <strong style={{ color: 'var(--primary-accent)', letterSpacing: '0.05em' }}>{user?.name || user?.email?.split('@')[0]}</strong> • Role: <span className="badge badge-green">{user?.role || 'VIEWER'}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {canEdit && (
                            <Link to="/upload">
                                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    Upload Files
                                </button>
                            </Link>
                        )}
                        <button onClick={logout} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Files</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-pure)' }}>
                            {documents.length}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Storage</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-pure)' }}>
                            {documents.length > 0 ? (documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0) / 1024 / 1024).toFixed(2) : '0.00'} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>MB</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Active Shares</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>
                            {activeSharesCount}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>My Documents</h3>

                {loading ? (
                    <div className="loader-overlay">
                        <div className="spinner"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'grayscale(1) opacity(0.3)' }}>🗂️</div>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-pure)' }}>No Documents Found</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You haven't uploaded any files to the cloud yet.</p>
                        {canEdit && (
                            <Link to="/upload">
                                <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Upload File</button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th>Resolution</th>
                                    <th>Date Uploaded</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc.documentId}>
                                        <td style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-accent)' }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                            {doc.fileName.length > 35 ? doc.fileName.substring(0, 35) + '...' : doc.fileName}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {canEdit && (
                                                    <button className="icon-btn" title="View Active Sharing Links" onClick={() => openManageShares(doc)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="icon-btn success" title="Create New Share Link" onClick={() => { setShareConfig({ documentId: doc.documentId, fileName: doc.fileName }); setShareResult(null); setShareExpiryNum(1); setShareExpiryUnit(1440); setSharePermission('VIEW'); }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                                    </button>
                                                )}
                                                <button className="icon-btn" title="Download Document" onClick={() => handleDownload(doc.documentId)}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                </button>
                                                {canEdit && (
                                                    <button className="icon-btn" title="Rename Document" onClick={() => { setEditingDoc(doc); setNewName(doc.fileName); }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="icon-btn danger" title="Delete Document" onClick={() => setDeleteConfig({ documentId: doc.documentId, fileName: doc.fileName })}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manage Shares Modal */}
            {
                managingSharesFor && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 className="text-gradient" style={{ margin: 0 }}>Active Share Links</h3>
                                <button type="button" onClick={() => setManagingSharesFor(null)} className="icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Managing currently active share URLs for <strong>{managingSharesFor.fileName}</strong>.</p>

                            {isFetchingShares ? (
                                <div className="loader-overlay" style={{ minHeight: '100px' }}><div className="spinner"></div></div>
                            ) : fetchedShares.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)' }}>
                                    No active share links found for this file.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {fetchedShares.map(s => {
                                        const isExpired = new Date(s.expiresAt) < new Date();
                                        const isRevoked = s.status !== 'ACTIVE';
                                        const statusLabel = isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE';
                                        const statusColor = isRevoked ? 'var(--error)' : isExpired ? 'var(--warning)' : 'var(--success)';

                                        return (
                                            <div key={s.shareToken} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${statusColor}`, borderTop: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-pure)', fontFamily: 'monospace', letterSpacing: '2px' }}>...{s.shareToken.substring(s.shareToken.length - 8)}</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: `rgba(${statusLabel === 'REVOKED' ? '244,63,94' : statusLabel === 'EXPIRED' ? '245,158,11' : '16,185,129'}, 0.2)`, color: statusColor, fontWeight: 'bold' }}>{statusLabel}</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>{s.permission}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created <span style={{ color: '#fff' }}>{new Date(s.createdAt).toLocaleDateString()}</span> • Expires <span style={{ color: '#fff' }}>{new Date(s.expiresAt).toLocaleDateString()}</span></div>
                                                </div>
                                                {(!isRevoked && !isExpired) && (
                                                    <button onClick={() => revokeShare(s.shareToken)} className="btn btn-ghost" style={{ border: '1px solid var(--error)', color: 'var(--error)', padding: '0.4rem 1rem' }}>Revoke Access</button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Rename Modal Overlay */}
            {
                editingDoc && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
                            <h3 className="text-gradient" style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Rewire Data Tag</h3>
                            <form onSubmit={submitRename}>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    autoFocus
                                    style={{ marginBottom: '2rem', padding: '1rem' }}
                                    required
                                />
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setEditingDoc(null)} className="btn btn-ghost">Abort</button>
                                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary-accent)' }}>Save Tag</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Share Configuration Modal */}
            {
                shareConfig && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'fadeUp 0.6s ease' }}>🔗</div>
                            {!shareResult ? (
                                <>
                                    <h3 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Create Share Link</h3>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Configure link sharing parameters for <strong style={{ color: '#fff' }}>{shareConfig.fileName}</strong>.</p>

                                    <form onSubmit={executeShare}>
                                        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience Status</label>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <div
                                                    onClick={() => setAccessLevel('PUBLIC')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: accessLevel === 'PUBLIC' ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.1))' : 'rgba(255,255,255,0.03)', color: accessLevel === 'PUBLIC' ? 'var(--primary-accent)' : 'var(--text-muted)', border: `1px solid ${accessLevel === 'PUBLIC' ? 'var(--primary-accent)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    Public Domain
                                                </div>
                                                <div
                                                    onClick={() => setAccessLevel('INTERNAL')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: accessLevel === 'INTERNAL' ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))' : 'rgba(255,255,255,0.03)', color: accessLevel === 'INTERNAL' ? 'var(--secondary-accent)' : 'var(--text-muted)', border: `1px solid ${accessLevel === 'INTERNAL' ? 'var(--secondary-accent)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    Secure Internal
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Authority</label>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <div
                                                    onClick={() => setSharePermission('VIEW')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: sharePermission === 'VIEW' ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))' : 'rgba(255,255,255,0.03)', color: sharePermission === 'VIEW' ? 'var(--success)' : 'var(--text-muted)', border: `1px solid ${sharePermission === 'VIEW' ? 'var(--success)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    View Layer
                                                </div>
                                                <div
                                                    onClick={() => setSharePermission('DOWNLOAD')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: sharePermission === 'DOWNLOAD' ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))' : 'rgba(255,255,255,0.03)', color: sharePermission === 'DOWNLOAD' ? 'var(--error)' : 'var(--text-muted)', border: `1px solid ${sharePermission === 'DOWNLOAD' ? 'var(--error)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    Download Rights
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token Expiration Matrix</label>
                                            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                                <input
                                                    type="number"
                                                    value={shareExpiryNum}
                                                    onChange={(e) => setShareExpiryNum(e.target.value)}
                                                    min="1" max="999"
                                                    style={{ flex: '1', padding: '0.75rem', fontSize: '1rem' }}
                                                    required
                                                />
                                                <select style={{ flex: '2', padding: '0.75rem', fontSize: '1rem' }} value={shareExpiryUnit} onChange={(e) => setShareExpiryUnit(e.target.value)}>
                                                    <option value="1">Minutes</option>
                                                    <option value="60">Hours</option>
                                                    <option value="1440">Days</option>
                                                    <option value="43200">Months</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <button type="button" onClick={() => setShareConfig(null)} className="btn btn-ghost" style={{ flex: 1 }}>Abort</button>
                                            <button type="submit" className="btn btn-primary" disabled={isSharing} style={{ flex: 1 }}>{isSharing ? 'Synthesizing...' : 'Generate JWT'}</button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Connection Established</h3>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Tunnel mechanically secured. Copy payload below.</p>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                        <input
                                            type="text"
                                            readOnly
                                            value={shareResult}
                                            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-pure)', cursor: 'text', border: '1px solid var(--primary-accent)', letterSpacing: '0.5px' }}
                                            onClick={(e) => e.target.select()}
                                        />
                                        <button type="button" onClick={handleCopyLink} className="btn" style={{ background: 'var(--primary-accent)', color: '#fff' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => { setShareConfig(null); setShareResult(null); }} className="btn btn-ghost" style={{ width: '100%' }}>Destroy Terminal</button>
                                </>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal Overlay */}
            {
                deleteConfig && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(12px)', padding: '1rem' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '2.5rem', border: '1px solid rgba(244,63,94,0.3)', boxShadow: '0 0 40px rgba(244,63,94,0.1)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'fadeUp 0.4s ease' }}>⚠️</div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Purge Cryptographic Block?</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>Execution destroys the node <strong>{deleteConfig.fileName}</strong> permanently alongside all existing Share Tokens.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button type="button" onClick={executeDelete} disabled={isDeleting} className="btn" style={{ background: 'var(--error)', color: '#fff', fontSize: '1.05rem', padding: '1rem' }}>
                                    {isDeleting ? 'Encrypting Oblivion...' : 'Execute Force Purge'}
                                </button>
                                <button type="button" onClick={() => setDeleteConfig(null)} className="btn btn-ghost">Cancel Sequence</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
