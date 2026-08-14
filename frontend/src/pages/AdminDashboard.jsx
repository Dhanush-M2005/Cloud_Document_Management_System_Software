import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [metrics, setMetrics] = useState({ totalDocuments: 0, totalStorageMB: "0.00", totalEvents: 0 });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('USERS');
    const [loading, setLoading] = useState(true);

    const [statusConfig, setStatusConfig] = useState(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);

    if (user?.role === 'VIEWER') {
        return <Navigate to="/dashboard" replace />;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [metricsRes, usersRes, logsRes] = await Promise.all([
                fetch(`${apiUrl}/admin/metrics`, { headers: { 'Authorization': `Bearer ${user?.token}` } }),
                fetch(`${apiUrl}/admin/users`, { headers: { 'Authorization': `Bearer ${user?.token}` } }),
                fetch(`${apiUrl}/admin/audit-logs`, { headers: { 'Authorization': `Bearer ${user?.token}` } })
            ]);

            if (metricsRes.ok) {
                const resJson = await metricsRes.json().catch(() => ({}));
                if (resJson.success) setMetrics(resJson.data);
            }
            if (usersRes.ok) {
                const resJson = await usersRes.json().catch(() => ({}));
                if (resJson.success) {
                    setUsers(resJson.data.filter(u => u.email !== user?.email));
                }
            }
            if (logsRes.ok) {
                const resJson = await logsRes.json().catch(() => ({}));
                if (resJson.success) setLogs(resJson.data);
            }
        } catch (err) {
            console.error("Admin fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const promptStatusToggle = (username, currentStatus) => {
        const action = currentStatus ? 'DISABLE' : 'ENABLE';
        setStatusConfig({ username, action, isDeactivating: currentStatus });
    };

    const executeStatusToggle = async () => {
        if (!statusConfig) return;
        setIsStatusUpdating(true);
        try {
            const res = await fetch(`${apiUrl}/admin/users/${statusConfig.username}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ action: statusConfig.action })
            });
            const resJson = await res.json().catch(() => ({}));
            if (res.ok && resJson.success) {
                addToast(`Identity ${statusConfig.action === 'DISABLE' ? 'Terminated' : 'Restored'} securely`, 'success');
                if (statusConfig.action === 'DISABLE') {
                    setUsers(prev => prev.filter(u => u.Username !== statusConfig.username));
                } else {
                    setUsers(prev => prev.map(u => u.Username === statusConfig.username ? { ...u, Enabled: true } : u));
                }
                setStatusConfig(null);
            } else {
                addToast(resJson.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const handleRoleChange = async (username, newRole) => {
        try {
            const res = await fetch(`${apiUrl}/admin/users/${username}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ group: newRole })
            });
            const resJson = await res.json().catch(() => ({}));
            if (res.ok && resJson.success) {
                addToast(`Authority escalated to ${newRole}`, 'success');
                setUsers(prev => prev.map(u => u.Username === username ? { ...u, group: newRole } : u));
            } else {
                addToast(resJson.message || 'Failed to update role', 'error');
            }
        } catch (err) {
            addToast('Error safely communicating with system', 'error');
        }
    };

    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', animation: 'fadeUp 0.6s ease' }}>
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <h2 className="text-gradient" style={{ marginBottom: '0.2rem', fontSize: '2rem' }}>Admin Dashboard</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Global system metrics and user management.</p>

                {loading ? (
                    <div className="loader-overlay" style={{ minHeight: '150px' }}><div className="spinner"></div></div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Storage</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-pure)' }}>{metrics.totalStorageMB} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>MB</span></div>
                            </div>
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Documents</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-pure)' }}>{metrics.totalDocuments}</div>
                            </div>
                            <div className="stat-card">
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Audit Logs</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{metrics.totalEvents}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                            <button onClick={() => setActiveTab('USERS')} className={`btn ${activeTab === 'USERS' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: '30px', padding: '0.6rem 2rem' }}>User Roles</button>
                            <button onClick={() => setActiveTab('AUDIT')} className={`btn ${activeTab === 'AUDIT' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: '30px', padding: '0.6rem 2rem' }}>Activity Logs</button>
                        </div>
                    </>
                )}
            </div>

            {!loading && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    {activeTab === 'USERS' && (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Email Address</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.Username}>
                                            <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '1px', opacity: 0.8 }}>{u.Username}</td>
                                            <td style={{ fontWeight: '500' }}>{u.email}</td>
                                            <td>
                                                <select
                                                    value={u.group || 'VIEWER'}
                                                    onChange={(e) => handleRoleChange(u.Username, e.target.value)}
                                                    style={{ padding: '0.4rem', fontSize: '0.85rem', width: '120px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-pure)', border: '1px solid var(--glass-border)' }}
                                                >
                                                    <option value="VIEWER" style={{ background: '#050505', color: '#fff' }}>VIEWER</option>
                                                    <option value="EDITOR" style={{ background: '#050505', color: '#fff' }}>EDITOR</option>
                                                    <option value="ADMIN" style={{ background: '#050505', color: '#fff' }}>ADMIN</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.Enabled ? 'badge-green' : 'badge-red'}`}>
                                                    {u.Enabled ? 'ACTIVE' : 'QUARANTINED'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {u.Enabled ? (
                                                    <button className="icon-btn danger" title="Quarantine User" onClick={() => promptStatusToggle(u.Username, u.Enabled)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                ) : (
                                                    <button className="icon-btn success" title="Activate User" onClick={() => promptStatusToggle(u.Username, u.Enabled)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'AUDIT' && (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date &amp; Time</th>
                                        <th>User ID</th>
                                        <th>Action</th>
                                        <th>Document ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.auditId}>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                            <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', letterSpacing: '1px', opacity: 0.7 }}>{log.userId.substring(0, 18)}...</td>
                                            <td style={{ fontWeight: 'bold', color: 'var(--text-pure)' }}>{log.action}</td>
                                            <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{log.documentId.substring(0, 12)}</td>
                                            <td>
                                                <span className={`badge ${log.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Status Toggle Modal Overlay */}
            {
                statusConfig && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: '1rem' }} onClick={() => setStatusConfig(null)}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '2.5rem', border: `1px solid ${statusConfig.isDeactivating ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, boxShadow: `0 0 40px ${statusConfig.isDeactivating ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)'}` }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <button type="button" onClick={() => setStatusConfig(null)} className="icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                </button>
                                <div style={{ width: '38px' }}></div>
                            </div>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'fadeUp 0.4s ease', marginTop: '-3rem' }}>
                                {statusConfig.isDeactivating ? '⚠️' : '🛡️'}
                            </div>
                            <h3 style={{ marginBottom: '1rem', color: statusConfig.isDeactivating ? 'var(--error)' : 'var(--success)' }}>
                                {statusConfig.isDeactivating ? 'Quarantine User?' : 'Activate User?'}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                Are you sure you want to {statusConfig.action === 'DISABLE' ? 'quarantine' : 'activate'} the account <br /><strong style={{ fontFamily: 'monospace', color: 'var(--text-pure)', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', letterSpacing: '1px' }}>{statusConfig.username}</strong>?<br /><br />
                                {statusConfig.isDeactivating
                                    ? "This action will disable the user's access to the system."
                                    : "The user will instantly inherit permissions associated with their role."}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button type="button" onClick={executeStatusToggle} disabled={isStatusUpdating} className="btn" style={{ flex: 1, background: statusConfig.isDeactivating ? 'var(--error)' : 'var(--success)', color: '#fff', fontSize: '1rem' }}>
                                    {isStatusUpdating ? 'Executing...' : `Confirm`}
                                </button>
                                <button type="button" onClick={() => setStatusConfig(null)} disabled={isStatusUpdating} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AdminDashboard;
