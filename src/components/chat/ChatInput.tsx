import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Mic, Image, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'voice') => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className={cn(
      "p-4 border-t border-border bg-card transition-shadow",
      isFocused && "shadow-soft"
    )}>
      <div className={cn(
        "flex items-end gap-2 p-2 rounded-2xl border border-border bg-background transition-all",
        isFocused && "border-accent ring-2 ring-accent/20"
      )}>
        {/* Attachment buttons */}
        <div className="flex items-center gap-1 pb-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Image className="w-5 h-5" />
          </Button>
        </div>

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-2"
          rows={1}
        />

        {/* Emoji and action buttons */}
        <div className="flex items-center gap-1 pb-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          {message.trim() ? (
            <Button 
              size="icon" 
              onClick={handleSend}
              className="w-9 h-9 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
