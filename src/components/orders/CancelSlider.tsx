import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancelSliderProps {
    durationMs?: number;
    onCancel: () => void;
    onExpire: () => void;
}

export function CancelSlider({ durationMs = 5000, onCancel, onExpire }: CancelSliderProps) {
    const [timeLeft, setTimeLeft] = useState(durationMs);
    const [isDragging, setIsDragging] = useState(false);
    const [sliderX, setSliderX] = useState(0);
    const [cancelled, setCancelled] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const animFrameRef = useRef<number>();

    const progress = Math.max(0, (timeLeft / durationMs) * 100);
    const secondsLeft = Math.ceil(timeLeft / 1000);

    // Countdown timer
    useEffect(() => {
        if (cancelled) return;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, durationMs - elapsed);
            setTimeLeft(remaining);
            if (remaining > 0) {
                animFrameRef.current = requestAnimationFrame(tick);
            } else {
                onExpire();
            }
        };
        animFrameRef.current = requestAnimationFrame(tick);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [durationMs, onExpire, cancelled]);

    const getTrackWidth = () => {
        if (!trackRef.current) return 200;
        return trackRef.current.getBoundingClientRect().width - 56; // thumb width
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX - sliderX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const newX = Math.max(0, Math.min(getTrackWidth(), e.touches[0].clientX - startXRef.current));
        setSliderX(newX);

        // If dragged past 80% of track, trigger cancel
        if (newX > getTrackWidth() * 0.8) {
            setCancelled(true);
            setIsDragging(false);
            onCancel();
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        // Snap back if not cancelled
        if (!cancelled) {
            setSliderX(0);
        }
    };

    // Mouse events for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startXRef.current = e.clientX - sliderX;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = Math.max(0, Math.min(getTrackWidth(), e.clientX - startXRef.current));
            setSliderX(newX);
            if (newX > getTrackWidth() * 0.8) {
                setCancelled(true);
                setIsDragging(false);
                onCancel();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (!cancelled) setSliderX(0);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    if (cancelled) return null;

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg mx-4 mb-4">
                {/* Timer text */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Changed your mind?
                    </p>
                    <span className="text-xs font-mono font-bold text-destructive tabular-nums">
                        {secondsLeft}s left
                    </span>
                </div>

                {/* Progress bar background */}
                <div className="h-1 bg-muted rounded-full mb-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-destructive to-destructive/60 rounded-full transition-none"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Slider track */}
                <div
                    ref={trackRef}
                    className="relative h-14 bg-destructive/5 border border-destructive/20 rounded-full overflow-hidden select-none"
                >
                    {/* Shimmer hint */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-2 text-destructive/60">
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">
                                Slide to cancel order
                            </span>
                            <span className="animate-pulse">→</span>
                        </div>
                    </div>

                    {/* Red fill as you drag */}
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-destructive/20 to-destructive/10 rounded-full transition-none"
                        style={{ width: `${sliderX + 56}px` }}
                    />

                    {/* Draggable thumb */}
                    <div
                        className={cn(
                            "absolute top-1 left-1 w-12 h-12 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10",
                            isDragging && "scale-110",
                            "transition-transform duration-150"
                        )}
                        style={{
                            transform: `translateX(${sliderX}px)`,
                            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                    >
                        <X className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
