import React from 'react';
import { motion } from 'framer-motion';

function AtmosphericBlob({ color, size, top, left, delay }) {
    return (
        <div
            className="absolute pointer-events-none -z-10 blur-[120px] rounded-full opacity-[0.07]"
            style={{
                backgroundColor: color,
                width: size,
                height: size,
                top: top,
                left: left,
                animation: `blobFloat 20s ease-in-out ${delay}s infinite`,
                willChange: 'transform',
            }}
        />
    );
}

function BackgroundParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        borderRadius: '50%',
                    }}
                    initial={{ 
                        x: Math.random() * 100 + "vw", 
                        y: Math.random() * 100 + "vh",
                        opacity: Math.random() * 0.5
                    }}
                    animate={{ 
                        y: [null, Math.random() * -100 - 50 + "vh"],
                        opacity: [0, 0.4, 0]
                    }}
                    transition={{ 
                        duration: Math.random() * 10 + 10, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: Math.random() * 10
                    }}
                />
            ))}
        </div>
    );
}

const AnimatedBackground = () => {
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(to bottom, #0a0c17, #0d101a, #0a0c12)' }}>
            {/* Cyber Grid with Animation */}
            <div className="cyber-grid" />

            {/* Falling Particles */}
            <BackgroundParticles />

            {/* Atmospheric Blobs */}
            <AtmosphericBlob color="#0891b2" size="60vw" top="-10%" left="-10%" delay={0} />
            <AtmosphericBlob color="#4f46e5" size="50vw" top="50%" left="70%" delay={5} />
            <AtmosphericBlob color="#10b981" size="40vw" top="80%" left="-5%" delay={2} />
        </div>
    );
};

export default AnimatedBackground;
