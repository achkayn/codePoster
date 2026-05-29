import React, { useEffect, useRef, useState } from "react";
import lightningSound from "../../assets/lightning.mp3";
import { useNavigate } from "react-router-dom";

const GlitchCursor = ({
    title = "Glitch Field",
    subtitle = "Corrupting the digital space",
    caption = "Click to fracture reality",
    glitchBlockColor = "rgba(0, 92, 92, 0.7)",
    scanlineColor = "rgba(255, 255, 255, 0.1)",
    titleSize = "text-5xl md:text-7xl lg:text-8xl",
    subtitleSize = "text-xl md:text-2xl",
    captionSize = "text-sm md:text-base",
    className = "",
}) => {
    const canvasRef = useRef(null);
    const animationFrameId = useRef(null);
    const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const glitchBlocks = useRef([]);
    const scanlines = useRef([]);
    const [isLoading, setIsLoading] = useState(false);
    function playSound() {
        const audio = new Audio(lightningSound);
        audio.play().catch(e => console.error("Error playing sound:", e));
    }
   
    class GlitchBlock {
        constructor(x, y, context) {
            this.x = x + (Math.random() - 0.5) * 50;
            this.y = y + (Math.random() - 0.5) * 50;
            this.width = Math.random() * 50 + 10;
            this.height = Math.random() * 30 + 5;
            this.life = 100;
            this.context = context;
            this.color = `hsla(${180 + Math.random() * 60}, 100%, 70%, ${Math.random() * 0.5 + 0.3})`;
        }

        draw() {
            this.context.fillStyle = this.color;
            this.context.fillRect(this.x, this.y, this.width, this.height);
        }

        update() {
            this.life -= 1;
            this.x += (Math.random() - 0.5) * 4;
            this.y += (Math.random() - 0.5) * 4;
        }
    }

    class Scanline {
        constructor(y, height, speed, context, canvasWidth) {
            this.y = y;
            this.height = height;
            this.speed = speed;
            this.life = 15;
            this.context = context;
            this.canvasWidth = canvasWidth;
            this.offsetX = (Math.random() - 0.5) * 100;
        }

        draw() {
            const imageData = this.context.getImageData(0, this.y, this.canvasWidth, this.height);
            this.context.putImageData(imageData, this.offsetX, this.y);
            this.context.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.05)`;
            this.context.fillRect(0, this.y, this.canvasWidth, this.height);
        }

        update() {
            this.life -= 1;
            this.y += this.speed;
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const animate = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            glitchBlocks.current.forEach((block, i) => {
                block.update();
                block.draw();
                if (block.life <= 0) glitchBlocks.current.splice(i, 1);
            });

            scanlines.current.forEach((line, i) => {
                line.update();
                line.draw();
                if (line.life <= 0) scanlines.current.splice(i, 1);
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        const handleMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            if (Math.random() > 0.5) {
                glitchBlocks.current.push(new GlitchBlock(e.clientX, e.clientY, ctx));
            }
        };

        const handleClick = () => {
            playSound();
            for (let i = 0; i < 20; i++) {
                scanlines.current.push(
                    new Scanline(
                        Math.random() * canvas.height,
                        Math.random() * 10 + 1,
                        (Math.random() - 0.5) * 4,
                        ctx,
                        canvas.width
                    )
                );
            }
        };


        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("resize", handleResize);
        window.addEventListener("click", handleClick);

        return () => {
            cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("click", handleClick);
        };
    }, []);
    const navigate = useNavigate();

    const handleNavigate = () => {
        setIsLoading(true);
        playSound();
        
        // Trigger extra glitch effects
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
            const width = canvas.width || window.innerWidth;
            const height = canvas.height || window.innerHeight;
            for (let i = 0; i < 30; i++) {
                scanlines.current.push(
                    new Scanline(
                        Math.random() * height,
                        Math.random() * 15 + 2,
                        (Math.random() - 0.5) * 6,
                        ctx,
                        width
                    )
                );
            }
        }

        setTimeout(() => {
            navigate('/lobby');
        }, 1200);
    };

    return (
        <div className={`relative h-screen w-screen overflow-hidden bg-black font-mono ${className}`}>
            <canvas ref={canvasRef} className="fixed inset-0 block h-full w-full" />
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 select-none text-center p-4">
                <h1
                    className={`m-0 p-0 text-cyan-300 font-bold uppercase tracking-widest leading-none transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'} ${titleSize}`}
                    style={{ textShadow: "2px 2px 0px #6f0006, -2px -2px 0px #00ffff" }}
                >
                    {title}
                </h1>
                
                <h2
                    className={`m-0 p-0 text-gray-300 font-normal leading-none transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'} ${subtitleSize}`}
                    style={{ textShadow: "1px 1px 0px #ff00ff, -1px -1px 0px #00ffff" }}
                >
                    {subtitle}
                </h2>
                <p className={`mt-4 p-0 text-gray-400 font-light leading-none transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'} ${captionSize}`}>
                    {caption}
                </p>
                <button 
                    onClick={handleNavigate} 
                    disabled={isLoading}
                    className={`mt-4 p-0 text-red-700 font-light leading-none cursor-pointer border border-red-700 rounded-md px-4 py-2 hover:bg-red-700 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-wait ${captionSize}`}
                >
                    {isLoading ? 'Loading...' : 'Try me'}
                </button>
            </div>

            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 opacity-100">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-12 w-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                        </div>
                        <p className="text-cyan-300 font-mono text-sm uppercase tracking-widest animate-pulse">
                            Establishing Connection...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlitchCursor;
