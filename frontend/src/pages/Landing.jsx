import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    const canvasRef = useRef(null);
    const [hoverBtn, setHoverBtn] = useState(null);

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

        // --- Floating elements themed to CDMS ---
        const items = [];
        const ITEM_COUNT = 40;

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

        // Draw a document icon
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
            // fold triangle
            ctx.beginPath();
            ctx.moveTo(s / 2 - fold, -s * 0.7);
            ctx.lineTo(s / 2 - fold, -s * 0.7 + fold);
            ctx.lineTo(s / 2, -s * 0.7 + fold);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
            ctx.stroke();
            // text lines
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

        // Draw a lock icon
        const drawLock = (x, y, s, opacity, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * 0.3); // subtle rotation only
            ctx.globalAlpha = opacity;
            // Body
            const bw = s * 0.6, bh = s * 0.5;
            ctx.beginPath();
            ctx.roundRect(- bw / 2, 0, bw, bh, 2);
            ctx.strokeStyle = 'rgba(139, 92, 246, 1)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // Shackle
            ctx.beginPath();
            ctx.arc(0, 0, bw * 0.35, Math.PI, 0);
            ctx.stroke();
            // Keyhole
            ctx.beginPath();
            ctx.arc(0, bh * 0.35, s * 0.06, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
            ctx.fill();
            ctx.restore();
        };

        // Draw a cloud icon
        const drawCloud = (x, y, s, opacity, rotation) => {
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
            // Upload arrow inside
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

        // Draw a shield icon
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
            // Checkmark inside
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

                // Float upward (like uploading)
                item.y -= item.speed;
                item.x += item.drift;
                item.rotation += item.rotSpeed;

                // Reset when off screen — respawn from bottom
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', padding: '2rem 1rem' }}>

            {/* Animated Canvas Background */}
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

            {/* Main Content */}
            <div style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <img src="/cdms_branding.svg" alt="CDMS Logo" style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))' }} />
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-pure, #ffffff)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '3px' }}>
                        CDMS
                    </span>
                </div>

                <h1 className="text-gradient" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '700' }}>
                    Zero-Trust Access Control & Cloud Storage
                </h1>

                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', marginBottom: '3rem', maxWidth: '650px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
                    A military-grade cryptographic vault engineered to securely upload, synchronize, and distribute your absolute-zero documents dynamically inside the AWS cloud environment.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login">
                        <button
                            className={`btn ${hoverBtn === 'register' ? 'btn-ghost' : 'btn-primary'}`}
                            onMouseEnter={() => setHoverBtn('login')}
                            onMouseLeave={() => setHoverBtn(null)}
                            style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
                        >
                            Initialize Secure Portal
                            <span style={{ display: 'inline-block', transition: 'opacity 0.3s ease, transform 0.3s ease', opacity: hoverBtn === 'register' ? 0 : 1, transform: hoverBtn === 'register' ? 'translateX(-8px)' : 'translateX(0)' }}>→</span>
                        </button>
                    </Link>
                    <Link to="/register">
                        <button
                            className={`btn ${hoverBtn === 'register' ? 'btn-primary' : 'btn-ghost'}`}
                            onMouseEnter={() => setHoverBtn('register')}
                            onMouseLeave={() => setHoverBtn(null)}
                            style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
                        >
                            Request Authority
                            <span style={{ display: 'inline-block', transition: 'opacity 0.3s ease, transform 0.3s ease', opacity: hoverBtn === 'register' ? 1 : 0, transform: hoverBtn === 'register' ? 'translateX(0)' : 'translateX(-8px)' }}>→</span>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Landing;
