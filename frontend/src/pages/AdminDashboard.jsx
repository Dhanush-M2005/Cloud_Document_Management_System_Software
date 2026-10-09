import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const FilterDropdown = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (opt) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(item => item !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const isAllSelected = selected.length === 0 || selected.length === options.length;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem',
                    background: isOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', 
                    border: `1px solid ${isOpen ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    padding: '0.75rem 1.2rem', borderRadius: '12px', cursor: 'pointer',
                    minWidth: '220px', color: 'var(--text-pure)', fontSize: '0.85rem',
                    boxShadow: isOpen ? '0 0 20px rgba(6, 182, 212, 0.2)' : '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={e => { if(!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if(!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>{label}:</span>
                    <span style={{ fontWeight: '700', letterSpacing: '0.02em', color: isOpen ? 'var(--primary-accent)' : 'var(--text-pure)' }}>{isAllSelected ? 'All' : `${selected.length} Selected`}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', color: isOpen ? 'var(--primary-accent)' : 'var(--text-muted)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem',
                    background: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '0.5rem', zIndex: 50,
                    minWidth: '220px', backdropFilter: 'blur(16px)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                    animation: 'fadeDown 0.2s ease', display: 'flex', flexDirection: 'column', gap: '0.2rem'
                }}>
                    {options.map(opt => {
                        const isChecked = selected.includes(opt);
                        return (
                            <div 
                                key={opt} 
                                onClick={() => toggleOption(opt)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                                    padding: '0.6rem 1rem', borderRadius: '8px',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                    background: isChecked ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                                    color: isChecked ? 'var(--primary-accent)' : 'var(--text-pure)',
                                    fontSize: '0.85rem', fontWeight: isChecked ? '600' : '500'
                                }}
                                onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = 'transparent' }}
                            >
                                <div style={{
                                    width: '18px', height: '18px', borderRadius: '4px',
                                    border: `1px solid ${isChecked ? 'var(--primary-accent)' : 'var(--text-muted)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isChecked ? 'var(--primary-accent)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {isChecked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                {opt}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

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

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [metrics, setMetrics] = useState({ totalDocuments: 0, totalStorageMB: "0.00", totalEvents: 0 });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('USERS');
    const [loading, setLoading] = useState(true);

    const [statusConfig, setStatusConfig] = useState(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [expandedUserId, setExpandedUserId] = useState(null);
    
    // Filters
    const [roleFilter, setRoleFilter] = useState([]);
    const [statusFilter, setStatusFilter] = useState([]);
    const [actionFilter, setActionFilter] = useState([]);
    const [logRoleFilter, setLogRoleFilter] = useState([]);
    
    // Pagination
    const [userPage, setUserPage] = useState(1);
    const [logPage, setLogPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => { setUserPage(1); }, [roleFilter, statusFilter]);
    useEffect(() => { setLogPage(1); }, [actionFilter, logRoleFilter]);

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

    const promptAction = (username, action) => {
        setStatusConfig({ username, action });
    };

    const executeAction = async () => {
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
                addToast(resJson.message || `Action ${statusConfig.action} completed successfully`, 'success');
                if (statusConfig.action === 'DELETE') {
                    setUsers(prev => prev.filter(u => u.Username !== statusConfig.username));
                } else if (statusConfig.action === 'DISABLE') {
                    setUsers(prev => prev.map(u => u.Username === statusConfig.username ? { ...u, Enabled: false } : u));
                } else if (statusConfig.action === 'ENABLE') {
                    setUsers(prev => prev.map(u => u.Username === statusConfig.username ? { ...u, Enabled: true } : u));
                }
                setStatusConfig(null);
            } else {
                addToast(resJson.message || 'Failed to update user', 'error');
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

    const filteredUsers = users.filter(u => {
        const group = u.group || 'VIEWER';
        if (roleFilter.length > 0 && !roleFilter.includes(group)) return false;
        const status = u.Enabled ? 'ACTIVE' : 'QUARANTINED';
        if (statusFilter.length > 0 && !statusFilter.includes(status)) return false;
        return true;
    });

    const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
    
    const filteredLogs = logs.filter(l => {
        if (actionFilter.length > 0 && !actionFilter.includes(l.action)) return false;
        
        if (logRoleFilter.length > 0) {
            const actionUser = users.find(u => u.Username === l.userId || u.email === l.userId);
            const role = actionUser ? (actionUser.group || 'VIEWER') : 'UNKNOWN';
            if (!logRoleFilter.includes(role)) return false;
        }

        return true;
    });

    const paginatedUsers = filteredUsers.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);
    const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const paginatedLogs = filteredLogs.slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE);
    const totalLogPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

    const hasUserFilters = roleFilter.length > 0 || statusFilter.length > 0;
    const hasAuditFilters = logRoleFilter.length > 0 || actionFilter.length > 0;

    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', animation: 'fadeUp 0.6s ease' }}>
            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 className="text-gradient" style={{ marginBottom: '0.2rem', fontSize: '2rem' }}>Admin Dashboard</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Global system metrics and user management.</p>
                    </div>
                    <button onClick={logout} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                    </button>
                </div>

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
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                                <FilterDropdown 
                                    label="Role Level" 
                                    options={['ADMIN', 'EDITOR', 'VIEWER']} 
                                    selected={roleFilter} 
                                    onChange={setRoleFilter} 
                                />
                                <FilterDropdown 
                                    label="Account Status" 
                                    options={['ACTIVE', 'QUARANTINED']} 
                                    selected={statusFilter} 
                                    onChange={setStatusFilter} 
                                />
                                {hasUserFilters && (
                                    <button 
                                        onClick={() => { setRoleFilter([]); setStatusFilter([]); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.6rem 1.2rem', background: 'transparent',
                                            border: '1px solid var(--error)', color: 'var(--error)',
                                            borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                            cursor: 'pointer', transition: 'all 0.3s ease',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                            boxShadow: '0 0 10px rgba(244, 63, 94, 0.1)',
                                            marginLeft: 'auto'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(244, 63, 94, 0.3)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = '0 0 10px rgba(244, 63, 94, 0.1)'; }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>User Name</th>
                                        <th>Email Address</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🔍</div>
                                                No users found matching current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedUsers.map(u => (
                                        <React.Fragment key={u.Username}>
                                            <tr style={{ cursor: 'pointer', transition: 'background 0.2s ease', background: expandedUserId === u.Username ? 'rgba(255,255,255,0.03)' : '' }} onClick={() => setExpandedUserId(expandedUserId === u.Username ? null : u.Username)}>
                                                <td style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--primary-accent)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedUserId === u.Username ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                        {u.name !== 'Unknown User' && u.name ? u.name : 'Unknown User'}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: '500' }}>{u.email}</td>
                                                <td onClick={e => e.stopPropagation()}>
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
                                                <td onClick={e => e.stopPropagation()}>
                                                    <span className={`badge ${u.Enabled ? 'badge-green' : 'badge-red'}`}>
                                                        {u.Enabled ? 'ACTIVE' : 'QUARANTINED'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        {u.Enabled ? (
                                                            <button className="icon-btn warning" title="Quarantine User" onClick={() => promptAction(u.Username, 'DISABLE')}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                            </button>
                                                        ) : (
                                                            <button className="icon-btn success" title="Activate User" onClick={() => promptAction(u.Username, 'ENABLE')}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                            </button>
                                                        )}
                                                        <button className="icon-btn danger" title="Delete User" onClick={() => promptAction(u.Username, 'DELETE')}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedUserId === u.Username && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: 0, border: 'none' }}>
                                                        <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)', animation: 'fadeDown 0.3s ease', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.2)' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>User Identity ID</div>
                                                                    <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--primary-accent)', letterSpacing: '1px' }}>{u.Username}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Current Access Level</div>
                                                                    <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--warning)', letterSpacing: '1px' }}>{u.group || 'VIEWER'}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )))}
                                </tbody>
                            </table>
                            {totalUserPages > 1 && (
                                <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} />
                            )}
                        </div>
                    )}

                    {activeTab === 'AUDIT' && (
                        <div className="table-container">
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                                <FilterDropdown 
                                    label="Role Level" 
                                    options={['ADMIN', 'EDITOR', 'VIEWER', 'UNKNOWN']} 
                                    selected={logRoleFilter} 
                                    onChange={setLogRoleFilter} 
                                />
                                <FilterDropdown 
                                    label="Audit Action Type" 
                                    options={uniqueActions} 
                                    selected={actionFilter} 
                                    onChange={setActionFilter} 
                                />
                                {hasAuditFilters && (
                                    <button 
                                        onClick={() => { setLogRoleFilter([]); setActionFilter([]); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.6rem 1.2rem', background: 'transparent',
                                            border: '1px solid var(--error)', color: 'var(--error)',
                                            borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                                            cursor: 'pointer', transition: 'all 0.3s ease',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                            boxShadow: '0 0 10px rgba(244, 63, 94, 0.1)',
                                            marginLeft: 'auto'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(244, 63, 94, 0.3)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = '0 0 10px rgba(244, 63, 94, 0.1)'; }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date &amp; Time</th>
                                        <th>Email ID</th>
                                        <th>Action</th>
                                        <th>Document ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🔍</div>
                                                No logs found matching current filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedLogs.map(log => (
                                        <React.Fragment key={log.auditId}>
                                            <tr onClick={() => setExpandedLogId(expandedLogId === log.auditId ? null : log.auditId)} style={{ cursor: 'pointer', transition: 'background 0.2s ease', background: expandedLogId === log.auditId ? 'rgba(255,255,255,0.03)' : '' }}>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedLogId === log.auditId ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--primary-accent)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                                    {(() => {
                                                        const actionUser = users.find(u => u.Username === log.userId || u.email === log.userId);
                                                        return actionUser ? actionUser.email : log.userId;
                                                    })()}
                                                </td>
                                                <td style={{ fontWeight: 'bold', color: 'var(--text-pure)' }}>{log.action}</td>
                                                <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{log.documentId.substring(0, 12)}</td>
                                                <td>
                                                    <span className={`badge ${log.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            {expandedLogId === log.auditId && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: 0, border: 'none' }}>
                                                        <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)', animation: 'fadeUp 0.3s ease', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.2)' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Audit Reference ID</div>
                                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary-accent)' }}>{log.auditId}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>User Name</div>
                                                                    <div style={{ fontSize: '0.95rem', color: 'var(--text-pure)', fontWeight: '600' }}>
                                                                        {(() => {
                                                                            const actionUser = users.find(u => u.Username === log.userId || u.email === log.userId);
                                                                            return actionUser ? (actionUser.name || 'Unknown') : 'Unknown';
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Identity Role</div>
                                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary-accent)' }}>
                                                                        {(() => {
                                                                            const actionUser = users.find(u => u.Username === log.userId || u.email === log.userId);
                                                                            return actionUser ? (actionUser.group || 'VIEWER') : 'UNKNOWN';
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Target Node</div>
                                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-pure)' }}>{log.documentId}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Exact Timestamp (UTC)</div>
                                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--warning)' }}>{log.timestamp}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )))}
                                </tbody>
                            </table>
                            {totalLogPages > 1 && (
                                <Pagination currentPage={logPage} totalPages={totalLogPages} onPageChange={setLogPage} />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Status Toggle Modal Overlay */}
            {
                statusConfig && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: '1rem' }} onClick={() => setStatusConfig(null)}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '2.5rem', border: `1px solid ${statusConfig.action === 'DELETE' ? 'rgba(244,63,94,0.5)' : (statusConfig.action === 'DISABLE' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)')}`, boxShadow: `0 0 40px ${statusConfig.action === 'DELETE' ? 'rgba(244,63,94,0.2)' : (statusConfig.action === 'DISABLE' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)')}` }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <button type="button" onClick={() => setStatusConfig(null)} className="icon-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                </button>
                                <div style={{ width: '38px' }}></div>
                            </div>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'fadeUp 0.4s ease', marginTop: '-3rem' }}>
                                {statusConfig.action === 'DELETE' ? '💀' : (statusConfig.action === 'DISABLE' ? '⚠️' : '🛡️')}
                            </div>
                            <h3 style={{ marginBottom: '1rem', color: statusConfig.action === 'DELETE' ? 'var(--error)' : (statusConfig.action === 'DISABLE' ? 'var(--warning)' : 'var(--success)') }}>
                                {statusConfig.action === 'DELETE' ? 'Permanently Delete User?' : (statusConfig.action === 'DISABLE' ? 'Quarantine User?' : 'Activate User?')}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                Are you sure you want to {statusConfig.action === 'DELETE' ? 'permanently delete' : (statusConfig.action === 'DISABLE' ? 'quarantine' : 'activate')} the account <br /><strong style={{ fontFamily: 'monospace', color: 'var(--text-pure)', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', letterSpacing: '1px' }}>{statusConfig.username}</strong>?<br /><br />
                                {statusConfig.action === 'DELETE'
                                    ? "This action is irreversible and the user's data will be wiped out completely from the matrix."
                                    : (statusConfig.action === 'DISABLE' ? "This action will temporarily disable the user's access to the system." : "The user will instantly inherit permissions associated with their role.")}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button type="button" onClick={executeAction} disabled={isStatusUpdating} className="btn" style={{ flex: 1, background: statusConfig.action === 'DELETE' ? 'var(--error)' : (statusConfig.action === 'DISABLE' ? 'var(--warning)' : 'var(--success)'), color: '#fff', fontSize: '1rem' }}>
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
