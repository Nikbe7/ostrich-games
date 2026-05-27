import React, { useRef, useEffect, useState, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Stroke, Point } from '@/types/draw';

interface CanvasProps {
    lines: Stroke[];
    onDrawEnd?: (stroke: Stroke) => void;
    isDrawer: boolean;
    color: string;
    thickness: number;
    startedAt?: number;
    duration?: number;
}

export default function Canvas({ lines = [], isDrawer, color, thickness, onDrawEnd, startedAt, duration = 180 }: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [localTimeLeft, setLocalTimeLeft] = useState<number | undefined>(undefined);

    // Tick down timer locally every second based on system time
    useEffect(() => {
        if (!startedAt) {
            setLocalTimeLeft(undefined);
            return;
        }
        
        const updateTimer = () => {
            const now = Date.now() / 1000;
            const elapsed = now - startedAt;
            const left = Math.max(0, Math.floor(duration - elapsed));
            setLocalTimeLeft(left);
        };
        
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [startedAt, duration]);

    // Redraw everything when lines change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Make canvas responsive
        const parent = canvas.parentElement;
        if (parent) {
            // Only set once or handle resize, for simplicity fixed size 800x600 in CSS but internal resolution matching
            if (canvas.width !== 800) {
                canvas.width = 800;
                canvas.height = 600;
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const drawStroke = (stroke: Stroke) => {
            if (stroke.points.length === 0) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.thickness;
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        };

        lines.forEach(drawStroke);
        
        if (currentStroke) {
            drawStroke(currentStroke);
        }

    }, [lines, currentStroke]);

    const getCoordinates = (e: ReactMouseEvent | ReactTouchEvent): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        const rect = canvas.getBoundingClientRect();
        // Scale to handle internal canvas size vs CSS size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as ReactMouseEvent).clientX;
            clientY = (e as ReactMouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
        if (!isDrawer || localTimeLeft === 0) return;
        e.preventDefault(); // Prevent scrolling on touch
        
        setIsDrawing(true);
        const point = getCoordinates(e);
        if (!point) return;
        
        const newStroke = {
            points: [point],
            color,
            thickness
        };
        setCurrentStroke(newStroke);
    };

    const draw = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !isDrawer || !currentStroke || localTimeLeft === 0) return;
        e.preventDefault();
        
        const point = getCoordinates(e);
        if (!point) return;

        setCurrentStroke(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                points: [...prev.points, point]
            };
        });
    };

    const stopDrawing = () => {
        if (!isDrawing || !isDrawer || !currentStroke) return;
        
        setIsDrawing(false);
        if (onDrawEnd) {
            onDrawEnd(currentStroke);
        }
        setCurrentStroke(null);
    };

    return (
        <div className="relative w-full max-w-[800px] aspect-[4/3] bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden touch-none">
            <canvas
                ref={canvasRef}
                className={`w-full h-full ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            {!isDrawer && (
                <div className="absolute top-2 right-2 px-3 py-1 bg-black/50 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                    Åskådare
                </div>
            )}
            {isDrawer && (
                <div className="absolute top-2 right-2 px-3 py-1 bg-blue-500/80 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                    Du ritar!
                </div>
            )}
            {isDrawer && localTimeLeft !== undefined && (
                <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-md flex items-center gap-1.5 transition-colors ${
                    localTimeLeft === 0 ? 'bg-red-600 text-white animate-pulse' :
                    localTimeLeft <= 30 ? 'bg-red-500/90 text-white' : 
                    localTimeLeft <= 60 ? 'bg-orange-500/90 text-white' : 
                    'bg-black/60 text-white'
                }`}>
                    {localTimeLeft === 0 ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                            </svg>
                            Tiden är slut
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                            </svg>
                            {Math.floor(localTimeLeft / 60)}:{(localTimeLeft % 60).toString().padStart(2, '0')}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
