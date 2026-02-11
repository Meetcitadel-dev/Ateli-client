import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useOrders } from '@/contexts/OrderContext';
import { useChat } from '@/contexts/ChatContext';
import { useView } from '@/contexts/ViewContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, Order, OrderStatus } from '@/types';
import {
  Send,
  Mic,
  Paperclip,
  MoreVertical,
  Search,
  Smile,
  Bot,
  Loader2,
  PlusCircle,
  ShoppingCart,
  MapPin,
  FileText,
  CreditCard,
  Users,
  Target,
  ChevronRight,
  Info
} from 'lucide-react';
import { currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChatOrderDraft } from './ChatOrderDraft';
import { VoiceMessage } from './VoiceMessage';
import { LocationMessage } from './LocationMessage';
import { db } from '@/services/db';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AdminOrderForm } from './AdminOrderForm';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, StopCircle, Forward, Reply, Share2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function ChatPanel() {
  const { currentProject } = useProject();
  const { addOrder } = useOrders();
  const { messages, addMessage, conversations, activeUserId, setActiveUserId, sendMessage, forwardMessage } = useChat();
  const { isAdmin } = useView();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Forwarding State
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');

  // Mobile state for admin to toggle between list and chat
  // If admin, default to list view on mobile if no user selected
  const [showAdminChatMobile, setShowAdminChatMobile] = useState(false);

  useEffect(() => {
    if (activeUserId) {
      setShowAdminChatMobile(true);
    }
  }, [activeUserId]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Handle key down for Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollableNode = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableNode) {
        scrollableNode.scrollTop = scrollableNode.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !currentProject) return;

    // Check if admin has selected a user
    if (isAdmin && !activeUserId) {
      toast.error("Please select a user to chat with.");
      return;
    }

    // Pass isFromAteli based on the current View Toggle (isAdmin)
    // This allows simulating Admin messages even if the logged-in user isn't an actual admin
    await sendMessage(inputValue, 'text', { isFromAteli: isAdmin });
    setInputValue('');
  };

  const handleCreateOrder = (items: any[]) => {
    if (!currentProject) return;

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      projectId: currentProject.id,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      items: items.map(item => ({
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        isConfirmed: true,
        confirmedBy: currentUser.id, // In a real app, this would be the admin's ID
        confirmedAt: new Date()
      })),
      totalAmount: totalAmount,
      status: 'pending_confirmation',
      approvals: [{
        userId: 'admin-user',
        userName: 'Ateli Admin',
        action: 'approved',
        timestamp: new Date(),
        comment: 'Created manually by Admin'
      }],
      createdBy: 'admin-user',
      initiatedBy: 'admin-user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addOrder(newOrder);

    // Notify in chat
    // Note: We need manually construct this system message or use sendMessage
    const confirmText = `Order #${newOrder.orderNumber} has been created by Admin.`;
    // Explicitly set isFromAteli: true for system messages generated in Admin view
    sendMessage(confirmText, 'text', { isFromAteli: true });

    setIsOrderFormOpen(false);
    toast.success("Order created successfully!");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const isCancelled = audioChunksRef.current.length === 0;

        if (!isCancelled) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          try {
            const url = await db.uploadFile(audioBlob);
            await sendMessage('Voice Message', 'voice', { mediaUrl: url });
          } catch (err) {
            toast.error("Failed to upload voice message");
          }
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.info("Recording cancelled");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleForwardClick = (message: ChatMessage) => {
    setMessageToForward(message);
    setIsForwardDialogOpen(true);
  };

  const confirmForward = async (targetUserId: string) => {
    if (!messageToForward) return;

    await forwardMessage(messageToForward, targetUserId);
    setIsForwardDialogOpen(false);
    setMessageToForward(null);
    toast.success("Message forwarded");
  };

  const sendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.loading("Getting your location...", { id: 'location-loading' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await sendMessage(`Shared a location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'location', {
            locationData: {
              latitude,
              longitude,
              address: "Current Location" // In a real app, we'd reverse geocode this
            }
          });
          toast.success("Location shared", { id: 'location-loading' });
        } catch (err) {
          toast.error("Failed to send location", { id: 'location-loading' });
        }
      },
      (error) => {
        toast.error(`Error getting location: ${error.message}`, { id: 'location-loading' });
      }
    );
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center">
        <Bot className="w-16 h-16 text-primary/20 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Project Selected</h3>
        <p className="text-muted-foreground max-w-sm">
          Please select a project from the sidebar to manage orders.
        </p>
      </div>
    );
  }

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUser = conversations.find(c => c.id === activeUserId);

  return (
    <div className="flex-1 flex h-full bg-background relative overflow-hidden">

      {/* Admin Sidebar - User List */}
      {isAdmin && (
        <div className={cn(
          "w-full md:w-64 flex-col border-r bg-muted/10 h-full transition-all",
          showAdminChatMobile ? "hidden md:flex" : "flex"
        )}>
          <div className="p-3 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <h3 className="font-semibold px-2 mb-2 text-sm">Messages</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredConversations.map(user => (
                <button
                  key={user.id}
                  onClick={() => setActiveUserId(user.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                    activeUserId === user.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted"
                  )}
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={cn("font-medium text-sm", activeUserId === user.id && "text-primary")}>
                        {user.name}
                      </span>
                      {user.lastMessage && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(user.lastMessage.timestamp), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No users found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex-col h-full bg-background relative",
        isAdmin && !showAdminChatMobile ? "hidden md:flex" : "flex"
      )}>
        {isAdmin && !activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-medium text-lg mb-1">Select a user</h3>
            <p className="text-sm max-w-xs text-center">Choose a team member from the sidebar to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex px-4 py-3 md:px-6 md:py-4 bg-card border-b border-border items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button for mobile admin */}
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setShowAdminChatMobile(false)}>
                    <div className="flex items-center">
                      <span className="sr-only">Back</span>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </Button>
                )}

                <Sheet open={isProjectDetailsOpen} onOpenChange={setIsProjectDetailsOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-3 text-left hover:bg-muted/50 p-1.5 rounded-xl transition-colors group">
                      <Avatar className="w-10 h-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <AvatarFallback className="bg-primary text-primary-foreground uppercase font-bold text-xs">
                          {isAdmin && activeUser ? activeUser.name.substring(0, 2) : currentProject.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1">
                          <h2 className="font-semibold text-foreground leading-none truncate max-w-[150px] md:max-w-[250px]">
                            {isAdmin && activeUser ? activeUser.name : currentProject.name}
                          </h2>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -ml-1" />
                        </div>
                        {isAdmin ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-1">
                            {activeUser?.role || 'Member'} • {currentProject.name}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium mt-1">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Ateli Support Online
                          </div>
                        )}
                      </div>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden border-l flex flex-col">
                    <div className="h-32 bg-primary relative shrink-0">
                      <div className="absolute -bottom-10 left-6">
                        <Avatar className="w-20 h-20 ring-4 ring-background shadow-xl">
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                            {currentProject.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 px-6 pt-14 pb-8">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{currentProject.name}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {currentProject.siteAddress}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Project Information
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Description</p>
                                <p className="text-sm font-medium leading-relaxed">{currentProject.description || "No description provided."}</p>
                              </div>
                              <div className="pt-2 flex flex-wrap gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Budget</p>
                                  <p className="text-sm font-bold text-primary">₹{(currentProject.budget || 0).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">GST Configuration</p>
                                  <Badge variant={currentProject.gstConfig.enabled ? "default" : "secondary"} className="text-[10px] font-bold">
                                    {currentProject.gstConfig.enabled ? "Enabled" : "Disabled"}
                                  </Badge>
                                </div>
                              </div>

                              {currentProject.gstConfig.enabled && (
                                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                                  {currentProject.gstConfig.companyName && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Company Name</p>
                                      <p className="text-sm font-semibold">{currentProject.gstConfig.companyName}</p>
                                    </div>
                                  )}
                                  {currentProject.gstConfig.gstin && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">GSTIN</p>
                                      <p className="text-sm font-mono font-bold text-primary">{currentProject.gstConfig.gstin}</p>
                                    </div>
                                  )}
                                  {currentProject.gstConfig.companyAddress && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Biling Address</p>
                                      <p className="text-sm text-muted-foreground leading-snug">{currentProject.gstConfig.companyAddress}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Project Team ({currentProject.members.length})
                          </h4>
                          <div className="space-y-3">
                            {currentProject.members.map((member, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-9 h-9 border">
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                      {member.user?.name?.substring(0, 2).toUpperCase() || "MB"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-bold leading-none">{member.user?.name || "Team Member"}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{member.role.replace('_', ' ')}</p>
                                  </div>
                                </div>
                                {member.role === 'owner' && <Badge className="bg-primary/10 text-primary text-[9px] uppercase font-bold border-primary/20">Owner</Badge>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="p-6 border-t bg-muted/5 mt-auto">
                      <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-xs h-11" onClick={() => setIsProjectDetailsOpen(false)}>
                        Close Details
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <Sheet open={isOrderFormOpen} onOpenChange={setIsOrderFormOpen} modal={false}>
                  <SheetTrigger asChild>
                    <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
                      <PlusCircle className="w-4 h-4" />
                      Create Order
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-2xl p-0 h-full border-l">
                    <AdminOrderForm
                      onSubmit={handleCreateOrder}
                      onCancel={() => setIsOrderFormOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4 max-w-3xl mx-auto pb-4">
                <div className="flex justify-center mb-6">
                  <span className="bg-muted text-muted-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-border">
                    End-to-End Encrypted Secure Ordering
                  </span>
                </div>

                {messages.map((msg) => {
                  const isMe = isAdmin ? msg.isFromAteli : !msg.isFromAteli;

                  // Strict check for alignment purely based on origin
                  // If message is from Ateli (Admin/System), it goes Left for User, Right for Admin.
                  // If message is from User, it goes Right for User, Left for Admin.

                  // The logic `isMe` handles this correctly:
                  // User view: FromAteli=T -> isMe=F (Left). FromAteli=F -> isMe=T (Right).
                  // Admin view: FromAteli=T -> isMe=T (Right). FromAteli=F -> isMe=F (Left).

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full mb-1 group relative items-center gap-2",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm relative transition-all duration-200",
                          !isMe
                            ? "bg-card text-foreground rounded-tl-none border border-border"
                            : "bg-primary text-primary-foreground rounded-tr-none",
                          msg.type === 'order_draft' ? "bg-transparent shadow-none p-0 max-w-sm border-none ring-0" : ""
                        )}
                      >
                        {msg.isForwarded && (
                          <div className={cn(
                            "flex items-center gap-1 mb-1 opacity-60 italic text-[10px]",
                            !isMe ? "text-muted-foreground" : "text-primary-foreground/80"
                          )}>
                            <Forward className="w-3 h-3" />
                            <span>Forwarded from {msg.originalSenderName}</span>
                          </div>
                        )}
                        {/* Regular Text Message */}
                        {msg.type === 'text' && (
                          <div>
                            {isAdmin && msg.senderName && !msg.isForwarded && (
                              <p className={cn(
                                "text-[10px] opacity-70 mb-0.5 font-bold",
                                !isMe ? "text-muted-foreground" : "text-primary-foreground/80"
                              )}>{msg.senderName}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">
                              {msg.content}
                            </p>
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1 opacity-60",
                              !isMe ? "text-muted-foreground" : "text-primary-foreground/70"
                            )}>
                              <span className="text-[9px]">
                                {format(new Date(msg.timestamp), 'h:mm a')}
                              </span>
                              {isMe && (
                                <div className="flex">
                                  <Send className="w-2.5 h-2.5" />
                                  <Send className="w-2.5 h-2.5 -ml-1.5" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Draft Cards */}
                        {msg.type === 'order_draft' && msg.draftOrder && (
                          <div className="animate-in slide-in-from-left-2 duration-300">
                            <ChatOrderDraft
                              items={msg.draftOrder.items}
                              totalEstimate={msg.draftOrder.totalEstimate}
                              onConfirm={() => toast.info("Active confirmation disabled.")}
                              onReject={() => toast.info("Editing disabled.")}
                            />
                          </div>
                        )}

                        {/* Voice Message */}
                        {msg.type === 'voice' && msg.mediaUrl && (
                          <VoiceMessage
                            url={msg.mediaUrl}
                            isMe={isMe}
                            timestamp={new Date(msg.timestamp)}
                          />
                        )}

                        {/* Location Message */}
                        {msg.type === 'location' && msg.locationData && (
                          <LocationMessage
                            latitude={msg.locationData.latitude}
                            longitude={msg.locationData.longitude}
                            address={msg.locationData.address}
                            isMe={isMe}
                          />
                        )}
                      </div>

                      {/* Forward Button - Visible on Hover */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-all h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm border shadow-sm shrink-0",
                          isMe ? "hover:bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => handleForwardClick(msg)}
                      >
                        <Forward className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start w-full animate-in fade-in duration-300">
                    <div className="bg-card border border-border px-3 py-2 rounded-2xl rounded-tl-none text-xs text-muted-foreground flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-muted/30 border-t border-border mt-auto">
              {isRecording ? (
                <div className="max-w-4xl mx-auto flex items-center gap-4 bg-primary/5 p-2 rounded-2xl border border-primary/20 animate-in slide-in-from-bottom-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={cancelRecording}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>

                  <div className="flex-1 flex items-center gap-3 px-2">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-bold tabular-nums">{formatDuration(recordingDuration)}</span>
                    <div className="flex-1 h-1 bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-pulse w-full origin-left" />
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 rounded-xl font-bold gap-2"
                    onClick={stopRecording}
                  >
                    <StopCircle className="w-4 h-4" /> Stop & Send
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="max-w-4xl mx-auto flex items-end gap-3"
                >
                  <div className="flex-1 bg-card rounded-2xl flex items-center px-4 md:px-6 py-3 md:py-4 shadow-sm border border-border focus-within:ring-1 focus-within:ring-primary/40 transition-all gap-2">
                    <Textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isAdmin ? `Message ${activeUser?.name || 'user'}...` : "Message Ateli Support..."}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground h-full w-full text-base text-foreground leading-normal min-h-0 resize-none overflow-hidden"
                      rows={1}
                    />
                    {!inputValue.trim() && (
                      <div className="flex items-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-muted-foreground hover:bg-muted rounded-xl transition-colors shrink-0"
                          onClick={sendLocation}
                          title="Share Location"
                        >
                          <MapPin className="w-5 h-5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-muted-foreground hover:bg-muted rounded-xl transition-colors shrink-0"
                          onClick={startRecording}
                          title="Voice Message"
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {inputValue.trim() && (
                    <div className="pb-0.5">
                      <Button type="submit" size="icon" className="h-11 w-11 rounded-2xl shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center justify-center">
                        <Send className="w-5 h-5 ml-0.5" />
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </>
        )}
      </div>
      {/* Forward Message Dialog */}
      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Forward className="w-5 h-5 text-primary" />
              Forward Message
            </DialogTitle>
            <DialogDescription>
              Select a conversation to forward this message to.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                className="pl-9 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-within:ring-primary/40"
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-6 py-2">
            <div className="space-y-1 pb-4">
              {conversations
                .filter(u => u.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()))
                .map((u) => (
                  <button
                    key={u.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group text-left"
                    onClick={() => confirmForward(u.id)}
                  >
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {u.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm truncate">{u.name}</p>
                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{u.role.replace('_', ' ')}</p>
                    </div>
                  </button>
                ))}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-2 bg-muted/5 border-t">
            <Button variant="ghost" onClick={() => setIsForwardDialogOpen(false)} className="font-bold uppercase tracking-widest text-[10px]">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
