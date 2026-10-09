import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
    const canvasRef = useRef(null);

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
            ctx.beginPath();
            ctx.moveTo(s / 2 - fold, -s * 0.7);
            ctx.lineTo(s / 2 - fold, -s * 0.7 + fold);
            ctx.lineTo(s / 2, -s * 0.7 + fold);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
            ctx.stroke();
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

        const drawLock = (x, y, s, opacity, rotation) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * 0.3);
            ctx.globalAlpha = opacity;
            const bw = s * 0.6, bh = s * 0.5;
            ctx.beginPath();
            ctx.roundRect(-bw / 2, 0, bw, bh, 2);
            ctx.strokeStyle = 'rgba(139, 92, 246, 1)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, bw * 0.35, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, bh * 0.35, s * 0.06, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
            ctx.fill();
            ctx.restore();
        };

        const drawCloud = (x, y, s, opacity) => {
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
                item.y -= item.speed;
                item.x += item.drift;
                item.rotation += item.rotSpeed;
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
        <>
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
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: '350px', height: '350px', background: 'rgba(6, 182, 212, 0.06)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: '350px', height: '350px', background: 'rgba(139, 92, 246, 0.06)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>
        </>
    );
};

export default AnimatedBackground;
