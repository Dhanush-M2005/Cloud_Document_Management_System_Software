import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div style={{ textAlign: 'center', padding: '8rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', position: 'relative' }}>
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'var(--primary-accent)', filter: 'blur(150px)', opacity: '0.15', zIndex: -1 }}></div>
            <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'var(--secondary-accent)', filter: 'blur(150px)', opacity: '0.15', zIndex: -1 }}></div>

            <div style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '800px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></span>
                    System Infrastructure Online
                </div>

                <h1 className="text-gradient" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '700' }}>
                    Zero-Trust Access Control & Cloud Storage
                </h1>

                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginBottom: '3rem', maxWidth: '650px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
                    A military-grade cryptographic vault engineered to securely upload, synchronize, and distribute your absolute-zero documents dynamically inside the AWS cloud environment.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login">
                        <button className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '30px' }}>
                            Initialize Secure Portal
                        </button>
                    </Link>
                    <Link to="/register">
                        <button className="btn btn-ghost" style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '30px' }}>
                            Request Authority
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Landing;
