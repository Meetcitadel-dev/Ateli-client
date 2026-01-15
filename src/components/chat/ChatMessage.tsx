import { ChatMessage as ChatMessageType } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { ateliAdmin } from '@/data/mockData';

interface ChatMessageProps {
  message: ChatMessageType;
  showAvatar?: boolean;
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const isFromAteli = message.isFromAteli;
  const avatar = isFromAteli ? ateliAdmin.avatar : message.senderAvatar;
  const initials = message.senderName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className={cn(
      "flex gap-3 px-4 animate-slide-up-fade",
      isFromAteli ? "flex-row" : "flex-row-reverse"
    )}>
      {showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
          <AvatarImage src={avatar} alt={message.senderName} />
          <AvatarFallback className={cn(
            "text-xs font-medium",
            isFromAteli ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isFromAteli ? "items-start" : "items-end"
      )}>
        <div className={cn(
          "px-4 py-2.5 rounded-2xl",
          isFromAteli 
            ? "bg-chat-received text-chat-received-foreground rounded-tl-sm" 
            : "bg-chat-sent text-chat-sent-foreground rounded-tr-sm"
        )}>
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
          {message.type === 'image' && message.mediaUrl && (
            <img 
              src={message.mediaUrl} 
              alt="Shared image" 
              className="rounded-lg max-w-full"
            />
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 mt-1 px-1",
          isFromAteli ? "flex-row" : "flex-row-reverse"
        )}>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {!isFromAteli && (
            <CheckCheck className="w-3.5 h-3.5 text-accent" />
          )}
        </div>
      </div>
    </div>
  );
}
