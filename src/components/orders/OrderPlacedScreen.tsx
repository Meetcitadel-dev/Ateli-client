import { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderPlacedScreenProps {
    orderNumber: string;
    totalAmount: number;
    onComplete: () => void;
    delayMs?: number;
}

export function OrderPlacedScreen({ orderNumber, totalAmount, onComplete, delayMs = 3000 }: OrderPlacedScreenProps) {
    const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');

    useEffect(() => {
        const enterTimer = setTimeout(() => setPhase('visible'), 100);
        const exitTimer = setTimeout(() => setPhase('exiting'), delayMs - 500);
        const completeTimer = setTimeout(() => onComplete(), delayMs);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [delayMs, onComplete]);

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-500 via-green-500 to-emerald-600 transition-opacity duration-500",
            phase === 'entering' && "opacity-0",
            phase === 'visible' && "opacity-100",
            phase === 'exiting' && "opacity-0"
        )}>
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-white/30 animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Confetti burst */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => {
                    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98'];
                    const color = colors[i % colors.length];
                    const rotation = Math.random() * 360;
                    const x = (Math.random() - 0.5) * 400;
                    const y = -(Math.random() * 600 + 200);

                    return (
                        <div
                            key={`confetti-${i}`}
                            className="absolute left-1/2 top-1/2"
                            style={{
                                width: `${6 + Math.random() * 8}px`,
                                height: `${6 + Math.random() * 8}px`,
                                backgroundColor: color,
                                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                                animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                                opacity: 0,
                            }}
                        />
                    );
                })}
            </div>

            {/* Main content */}
            <div className={cn(
                "flex flex-col items-center text-white transition-all duration-700",
                phase === 'entering' && "scale-50 opacity-0",
                phase === 'visible' && "scale-100 opacity-100",
                phase === 'exiting' && "scale-110 opacity-0"
            )}>
                {/* Animated checkmark */}
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border-4 border-white/40 animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                    {/* Sparkles */}
                    <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-bounce" />
                    <Sparkles className="absolute -bottom-1 -left-3 w-6 h-6 text-yellow-200 animate-bounce delay-300" />
                </div>

                <h1 className="text-3xl font-black tracking-tight mb-2 drop-shadow-md">
                    Order Placed! 🎉
                </h1>
                <p className="text-white/90 text-lg font-medium mb-1">
                    {orderNumber}
                </p>
                <p className="text-white/70 text-sm">
                    ₹{totalAmount.toLocaleString()} • Your order is being processed
                </p>

                {/* Loading dots */}
                <div className="flex gap-1.5 mt-8">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>

            {/* Skip text */}
            <button
                onClick={onComplete}
                className="absolute bottom-12 text-white/50 text-xs font-medium uppercase tracking-widest hover:text-white/80 transition-colors"
            >
                Tap to continue
            </button>
        </div>
    );
}
