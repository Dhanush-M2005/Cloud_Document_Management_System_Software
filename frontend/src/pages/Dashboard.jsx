import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            background: currentPage === i ? 'var(--primary-accent)' : 'rgba(255,255,255,0.05)',
                            color: currentPage === i ? '#000' : 'var(--text-pure)',
                            border: '1px solid ' + (currentPage === i ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'),
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: currentPage === i ? '700' : '500',
                            transition: 'all 0.2s ease',
                            boxShadow: currentPage === i ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none'
                        }}
                    >
                        {i}
                    </button>
                );
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                pages.push(<span key={`dots-${i}`} style={{ color: 'var(--text-muted)', padding: '0.4rem' }}>...</span>);
            }
        }
        return pages.filter((item, index, array) => {
            if (item.type === 'span' && array[index - 1]?.type === 'span') return false;
            return true;
        });
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            <button 
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                    padding: '0.4rem 0.8rem', background: 'transparent', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-pure)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1, transition: 'all 0.2s ease', fontWeight: '500'
                }}
            >
                Prev
            </button>
            
            {renderPageNumbers()}

            <button 
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                    padding: '0.4rem 0.8rem', background: 'transparent', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-pure)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1, transition: 'all 0.2s ease', fontWeight: '500'
                }}
            >
                Next
            </button>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingDoc, setEditingDoc] = useState(null);
    const [newName, setNewName] = useState('');
    const [activeSharesCount, setActiveSharesCount] = useState(0);
    
    // Pagination
    const [docPage, setDocPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

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

    const [visibilityConfig, setVisibilityConfig] = useState(null);
    const [newVisibility, setNewVisibility] = useState('ALL');
    const [isChangingVisibility, setIsChangingVisibility] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // Secure Viewer State
    const [secureViewerConfig, setSecureViewerConfig] = useState(null);
    const [loadingSecureView, setLoadingSecureView] = useState(null);
    const [isFocused, setIsFocused] = useState(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => { setDocPage(1); }, [searchQuery]);

    // Global security overrides for Secure Viewer mode
    useEffect(() => {
        if (secureViewerConfig) {
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
    }, [secureViewerConfig]);

    useEffect(() => {
        fetchDocuments(); // Initial fetch
        const interval = setInterval(() => {
            fetchDocuments(true);
        }, 15000); // 15s background auto-sync
        return () => clearInterval(interval);
    }, [user?.token]);

    const fetchDocuments = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
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
            if (!isBackground) {
                setError(err.message);
                addToast(err.message, 'error');
            }
        } finally {
            if (!isBackground) setLoading(false);
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

    const executeChangeVisibility = async () => {
        if (!visibilityConfig) return;
        setIsChangingVisibility(true);
        try {
            const res = await fetch(`${apiUrl}/documents/${visibilityConfig.documentId}/visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
                body: JSON.stringify({ visibility: newVisibility })
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to update visibility matrix");

            setDocuments(docs => docs.map(d => d.documentId === visibilityConfig.documentId ? { ...d, visibility: newVisibility } : d));
            addToast("Security constraints updated successfully", "success");
            setVisibilityConfig(null);
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsChangingVisibility(false);
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

    const handleSecureView = async (doc) => {
        try {
            setLoadingSecureView(doc.documentId);
            const res = await fetch(`${apiUrl}/documents/${doc.documentId}/download?action=view`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const resJson = await res.json().catch(() => ({}));
            if (!resJson.success) throw new Error(resJson.message || "Failed to get secure link");
            const { downloadUrl } = resJson.data;

            setSecureViewerConfig({
                documentId: doc.documentId,
                fileName: doc.fileName,
                url: downloadUrl
            });
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setLoadingSecureView(null);
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

    const filteredDocuments = documents.filter(doc => 
        (doc.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    {(user?.role === 'ADMIN' || user?.groups?.includes('ADMIN')) ? (
                        <>
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
                        </>
                    ) : (user?.role === 'EDITOR' || user?.groups?.includes('EDITOR')) ? (
                        <>
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Upload Access</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                    Granted
                                </div>
                            </div>
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Security Protocol</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-pure)' }}>
                                    AES-256
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Secure Viewer</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>
                                    Enabled
                                </div>
                            </div>
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Data Integrity</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-pure)' }}>
                                    100%
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>Document Vault</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                        <div style={{ position: 'relative', maxWidth: '350px', width: '100%' }}>
                            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: searchFocused ? 'var(--primary-accent)' : 'var(--text-muted)', transition: 'color 0.3s' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                type="text"
                                placeholder="Search documents by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 1rem 0.6rem 2.4rem',
                                    borderRadius: '20px',
                                    border: `1px solid ${searchFocused ? 'rgba(6, 182, 212, 0.6)' : 'rgba(255,255,255,0.1)'}`,
                                    background: searchFocused ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                                    color: 'var(--text-pure)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: searchFocused ? '0 0 15px rgba(6, 182, 212, 0.2)' : 'none'
                                }}
                            />
                        </div>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }} onClick={() => fetchDocuments(false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                            Force Sync
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loader-overlay">
                        <div className="spinner"></div>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'grayscale(1) opacity(0.3)' }}>{documents.length > 0 ? '🔍' : '🗂️'}</div>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-pure)' }}>{documents.length > 0 ? 'No Matching Documents' : 'No Documents Found'}</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{documents.length > 0 ? `We couldn't find anything matching "${searchQuery}"` : "You haven't uploaded any files to the cloud yet."}</p>
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
                                    <th>Access</th>
                                    <th>Size</th>
                                    <th>Date Uploaded</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const paginatedDocs = filteredDocuments.slice((docPage - 1) * ITEMS_PER_PAGE, docPage * ITEMS_PER_PAGE);
                                    return paginatedDocs.map(doc => (
                                        <tr key={doc.documentId} style={{ animation: 'fadeIn 0.3s ease' }}>
                                            <td style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => handleSecureView(doc)}>
                                            {loadingSecureView === doc.documentId ? (
                                                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-accent)' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            )}
                                            <div style={{ transition: 'color 0.2s', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '280px', lineHeight: '1.4' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary-accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-pure)'}>
                                                {doc.fileName}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '20px', 
                                                background: doc.visibility === 'ADMIN_ONLY' ? 'rgba(244, 63, 94, 0.1)' : doc.visibility === 'EDITOR_ADMIN' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                                                color: doc.visibility === 'ADMIN_ONLY' ? 'var(--error)' : doc.visibility === 'EDITOR_ADMIN' ? '#eab308' : 'var(--primary-accent)',
                                                border: `1px solid ${doc.visibility === 'ADMIN_ONLY' ? 'rgba(244, 63, 94, 0.2)' : doc.visibility === 'EDITOR_ADMIN' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`,
                                                fontWeight: '600',
                                                letterSpacing: '0.05em',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {doc.visibility === 'ADMIN_ONLY' ? 'ADMINS ONLY' : doc.visibility === 'EDITOR_ADMIN' ? 'EDITORS & ADMINS' : 'ALL ROLES'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end' }}>
                                                <button className="icon-btn" title="Secure Document Viewer" onClick={() => handleSecureView(doc)}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </button>
                                                {(user?.role === 'ADMIN' || user?.groups?.includes('ADMIN')) && (
                                                    <button className="icon-btn" title="View Active Sharing Links" onClick={() => openManageShares(doc)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="icon-btn success" title="Create New Share Link" onClick={() => { setShareConfig({ documentId: doc.documentId, fileName: doc.fileName }); setShareResult(null); setShareExpiryNum(1); setShareExpiryUnit(1440); setSharePermission('VIEW'); }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="icon-btn" title="Download Document" onClick={() => handleDownload(doc.documentId)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                    </button>
                                                )}
                                                {(user?.role === 'ADMIN' || user?.groups?.includes('ADMIN')) && (
                                                    <button className="icon-btn" title="Rename Document" onClick={() => { setEditingDoc(doc); setNewName(doc.fileName); }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                    </button>
                                                )}
                                                {(user?.role === 'ADMIN' || user?.groups?.includes('ADMIN')) && (
                                                    <button className="icon-btn" title="Change Visibility" onClick={() => { setVisibilityConfig(doc); setNewVisibility(doc.visibility || 'ALL'); }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                                    </button>
                                                )}
                                                {(user?.role === 'ADMIN' || user?.groups?.includes('ADMIN')) && (
                                                    <button className="icon-btn danger" title="Delete Document" onClick={() => setDeleteConfig({ documentId: doc.documentId, fileName: doc.fileName })}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                        {Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE) > 1 && (
                            <Pagination 
                                currentPage={docPage} 
                                totalPages={Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE)} 
                                onPageChange={setDocPage} 
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Manage Shares Modal */}
            {
                managingSharesFor && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }} onClick={() => setManagingSharesFor(null)}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '85vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <h3 className="text-gradient" style={{ margin: 0 }}>Active Share Links</h3>
                                    <button type="button" onClick={() => setManagingSharesFor(null)} className="icon-btn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Managing currently active share URLs for <strong style={{ color: 'var(--text-pure)' }}>{managingSharesFor.fileName}</strong>.</p>
                            </div>

                            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                                {isFetchingShares ? (
                                    <div className="loader-overlay" style={{ minHeight: '100px', background: 'transparent' }}><div className="spinner"></div></div>
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
                                            <div key={s.shareToken} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${statusColor}`, borderRight: '1px solid var(--glass-border)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-pure)', fontFamily: 'monospace', letterSpacing: '1px', background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>{s.shareToken.substring(0, 8)}...</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.7rem', borderRadius: '20px', background: `rgba(${statusLabel === 'REVOKED' ? '244,63,94' : statusLabel === 'EXPIRED' ? '245,158,11' : '16,185,129'}, 0.15)`, color: statusColor, fontWeight: 'bold', letterSpacing: '0.05em', border: `1px solid ${statusColor}40` }}>{statusLabel}</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.7rem', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary-accent)', fontWeight: 'bold', letterSpacing: '0.05em', border: '1px solid rgba(6, 182, 212, 0.4)' }}>{s.permission === 'VIEW' ? 'VIEW ONLY' : 'DOWNLOAD ALLOWED'}</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.7rem', borderRadius: '20px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: 'bold', letterSpacing: '0.05em', border: '1px solid rgba(168, 85, 247, 0.4)' }}>{s.accessLevel === 'PUBLIC' ? 'PUBLIC LINK' : 'AUTHORIZED USERS'}</span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem', fontSize: '0.85rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created By</span>
                                                            </div>
                                                            <span style={{ color: 'var(--text-pure)', fontWeight: '500', wordBreak: 'break-all' }}>{s.ownerId || 'Unknown'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created At</span>
                                                            </div>
                                                            <span style={{ color: 'var(--text-pure)', fontWeight: '500' }}>{new Date(s.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-10h4"></path></svg>
                                                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires At</span>
                                                            </div>
                                                            <span style={{ color: 'var(--text-pure)', fontWeight: '500' }}>{new Date(s.expiresAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {(!isRevoked && !isExpired) && (
                                                    <div style={{ marginLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
                                                        <button onClick={() => revokeShare(s.shareToken)} className="btn btn-ghost" style={{ border: '1px solid rgba(244,63,94,0.4)', color: 'var(--error)', padding: '0.6rem 1.25rem', borderRadius: '20px', fontSize: '0.8rem', background: 'rgba(244,63,94,0.05)' }}>
                                                            Revoke
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Rename Modal Overlay */}
            {
                editingDoc && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }} onClick={() => setEditingDoc(null)}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <button type="button" onClick={() => setEditingDoc(null)} className="icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                </button>
                                <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.4rem' }}>Rename File</h3>
                                <div style={{ width: '38px' }}></div>
                            </div>
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
                                    <button type="button" onClick={() => setEditingDoc(null)} className="btn btn-ghost">Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary-accent)' }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Share Configuration Modal */}
            {
                shareConfig && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '1rem' }} onClick={() => { setShareConfig(null); setShareResult(null); }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <button type="button" onClick={() => { setShareConfig(null); setShareResult(null); }} className="icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                </button>
                                <div style={{ width: '38px', height: '38px' }}></div>
                            </div>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'fadeUp 0.6s ease', marginTop: '-3rem' }}>🔗</div>
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
                                                    Public
                                                </div>
                                                <div
                                                    onClick={() => setAccessLevel('INTERNAL')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: accessLevel === 'INTERNAL' ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))' : 'rgba(255,255,255,0.03)', color: accessLevel === 'INTERNAL' ? 'var(--secondary-accent)' : 'var(--text-muted)', border: `1px solid ${accessLevel === 'INTERNAL' ? 'var(--secondary-accent)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    Internal Users Only
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permissions</label>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <div
                                                    onClick={() => setSharePermission('VIEW')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: sharePermission === 'VIEW' ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))' : 'rgba(255,255,255,0.03)', color: sharePermission === 'VIEW' ? 'var(--success)' : 'var(--text-muted)', border: `1px solid ${sharePermission === 'VIEW' ? 'var(--success)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    View Only
                                                </div>
                                                <div
                                                    onClick={() => setSharePermission('DOWNLOAD')}
                                                    style={{ flex: 1, textAlign: 'center', padding: '0.75rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: sharePermission === 'DOWNLOAD' ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))' : 'rgba(255,255,255,0.03)', color: sharePermission === 'DOWNLOAD' ? 'var(--error)' : 'var(--text-muted)', border: `1px solid ${sharePermission === 'DOWNLOAD' ? 'var(--error)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s ease', fontSize: '0.85rem' }}
                                                >
                                                    Can Download
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link Expiration</label>
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
                                            <button type="button" onClick={() => { setShareConfig(null); setShareResult(null); }} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                                            <button type="submit" className="btn btn-primary" disabled={isSharing} style={{ flex: 1 }}>{isSharing ? 'Generating...' : 'Generate Link'}</button>
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
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(12px)', padding: '1rem' }} onClick={() => setDeleteConfig(null)}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '2.5rem', border: '1px solid rgba(244,63,94,0.3)', boxShadow: '0 0 40px rgba(244,63,94,0.1)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <button type="button" onClick={() => setDeleteConfig(null)} className="icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                </button>
                                <div style={{ width: '38px' }}></div>
                            </div>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'fadeUp 0.4s ease' }}>⚠️</div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Purge Cryptographic Block?</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>Execution destroys the node <strong>{deleteConfig.fileName}</strong> permanently alongside all existing Share Tokens.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button type="button" onClick={executeDelete} disabled={isDeleting} className="btn" style={{ background: 'var(--error)', color: '#fff', fontSize: '1.05rem', padding: '1rem' }}>
                                    {isDeleting ? 'Encrypting Oblivion...' : 'Execute Force Purge'}
                                </button>
                                <button type="button" onClick={() => setDeleteConfig(null)} className="btn btn-ghost">Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Secure Viewer Modal */}
            {secureViewerConfig && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(10px)' }} onClick={() => setSecureViewerConfig(null)}>
                    
                    {/* Watermark Overlay to deter screenshots */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 100px)', zIndex: 10001, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', opacity: 0.4 }}>
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} style={{ padding: '4rem', transform: 'rotate(-45deg)', color: 'rgba(255,255,255,0.1)', fontSize: '1.5rem', fontWeight: 'bold', whiteSpace: 'nowrap', userSelect: 'none' }}>
                                CONFIDENTIAL • {user?.email} • {new Date().toISOString().split('T')[0]}
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel" style={{ width: '95%', height: '95%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10000, border: '1px solid rgba(6, 182, 212, 0.3)', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-accent)' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-pure)' }}>Secure View: {secureViewerConfig.fileName}</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End-to-End Encrypted Tunnel Active</span>
                                </div>
                            </div>
                            <button type="button" onClick={() => setSecureViewerConfig(null)} className="icon-btn danger" title="Terminate Secure Tunnel">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, position: 'relative', background: '#333333', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
                            
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

                            {/* Google Docs Viewer completely replaces the native PDF viewer. 
                                It allows mouse-wheel scrolling naturally while preventing native 'Save As PDF' right-clicks. 
                                We add a small block over the top right corner to hide the 'Pop-out' button. */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '50px', height: '50px', background: '#333333', zIndex: 10 }}></div>
                            
                            <iframe 
                                id="secure-iframe"
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(secureViewerConfig.url)}&embedded=true`} 
                                style={{ width: '100%', height: '100%', border: 'none' }} 
                                title={secureViewerConfig.fileName}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Change Visibility Modal */}
            {visibilityConfig && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: '1rem' }} onClick={() => setVisibilityConfig(null)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', animation: 'fadeUp 0.3s ease', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setVisibilityConfig(null)} className="icon-btn" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', color: 'var(--primary-accent)', marginBottom: '1rem' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </div>
                            <h3 className="text-gradient" style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Modify Access Matrix</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, wordBreak: 'break-all' }}>{visibilityConfig.fileName}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                            {[
                                { id: 'ALL', label: 'All Roles', desc: 'Viewers, Editors, and Admins can see this document.' },
                                { id: 'EDITOR_ADMIN', label: 'Editors & Admins', desc: 'Only Editors and Admins can see this document.' },
                                { id: 'ADMIN_ONLY', label: 'Admins Only', desc: 'Strictly visible only to Administrators.' }
                            ].map(option => (
                                <div 
                                    key={option.id}
                                    onClick={() => setNewVisibility(option.id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: `1px solid ${newVisibility === option.id ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'}`,
                                        background: newVisibility === option.id ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0,0,0,0.2)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: newVisibility === option.id ? '0 0 15px rgba(6, 182, 212, 0.1)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%', 
                                        border: `2px solid ${newVisibility === option.id ? 'var(--primary-accent)' : 'rgba(255,255,255,0.3)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {newVisibility === option.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-accent)' }}></div>}
                                    </div>
                                    <div>
                                        <div style={{ color: newVisibility === option.id ? 'var(--primary-accent)' : 'var(--text-pure)', fontWeight: '600', fontSize: '1rem', marginBottom: '0.2rem' }}>{option.label}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{option.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={() => setVisibilityConfig(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                            <button type="button" onClick={executeChangeVisibility} disabled={isChangingVisibility} className="btn btn-primary" style={{ flex: 1 }}>
                                {isChangingVisibility ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;
