
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LocationMessageProps {
    latitude: number;
    longitude: number;
    address?: string;
    isMe: boolean;
}

export function LocationMessage({ latitude, longitude, address, isMe }: LocationMessageProps) {
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // A simple static map placeholder (using standard maps API styling colors)
    return (
        <div className="flex flex-col gap-2 min-w-[200px] max-w-[260px]">
            <div className={cn(
                "rounded-xl overflow-hidden border relative group",
                isMe ? "border-white/20" : "border-border"
            )}>
                <div className="h-32 bg-muted flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                    {/* Faux map background pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="relative z-10 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center animate-bounce">
                        <MapPin className="w-6 h-6 text-primary fill-primary/20" />
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="relative z-10 font-bold uppercase tracking-widest text-[10px] scale-90 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        asChild
                    >
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                            Open in Maps <ExternalLink className="w-3 h-3 ml-1.5" />
                        </a>
                    </Button>
                </div>

                <div className={cn(
                    "p-3 text-xs leading-relaxed",
                    isMe ? "bg-white/10" : "bg-muted/30"
                )}>
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3 h-3" /> Shared Location
                    </p>
                    <p className="opacity-80 line-clamp-2">
                        {address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                    </p>
                </div>
            </div>

            <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "text-[10px] font-bold uppercase tracking-widest text-center py-2.5 rounded-xl transition-all shadow-sm",
                    "bg-black text-white hover:bg-black/80"
                )}
            >
                View Directions
            </a>
        </div>
    );
}
