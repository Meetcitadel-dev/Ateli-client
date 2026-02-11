
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessageProps {
    url: string;
    isMe: boolean;
    timestamp: Date;
}

export function VoiceMessage({ url, isMe, timestamp }: VoiceMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoadedMetadata = () => setDuration(audio.duration);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn(
            "flex flex-col gap-1 min-w-[200px]",
            isMe ? "text-primary-foreground" : "text-foreground"
        )}>
            <div className="flex items-center gap-3">
                <button
                    onClick={togglePlay}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isMe ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>

                <div className="flex-1 space-y-1.5">
                    {/* Progress bar */}
                    <div className={cn(
                        "h-1.5 w-full rounded-full overflow-hidden",
                        isMe ? "bg-white/20" : "bg-muted"
                    )}>
                        <div
                            className={cn(
                                "h-full transition-all duration-100",
                                isMe ? "bg-white" : "bg-primary"
                            )}
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] opacity-70 font-bold tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            <audio ref={audioRef} src={url} className="hidden" preload="metadata" />
        </div>
    );
}
