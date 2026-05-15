import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        let stars = [];
        const starCount = 200;

        class Star {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.z = Math.random() * width; // Depth
                this.size = 0.5 + Math.random();
            }

            update() {
                this.z -= 0.5; // Speed
                if (this.z <= 0) {
                    this.z = width;
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                }
            }

            draw() {
                const x = (this.x - width / 2) * (width / this.z);
                const y = (this.y - height / 2) * (width / this.z);
                const s = this.size * (width / this.z);

                // Origin is center
                const sx = x + width / 2;
                const sy = y + height / 2;

                if (sx > 0 && sx < width && sy > 0 && sy < height) {
                    const alpha = 1 - (this.z / width);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, s, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        const init = () => {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push(new Star());
            }
        };

        const animate = () => {
            ctx.fillStyle = '#000000'; // Deep black background
            ctx.fillRect(0, 0, width, height);

            stars.forEach(star => {
                star.update();
                star.draw();
            });

            requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                background: '#000000'
            }}
        />
    );
};

export default AnimatedBackground;
