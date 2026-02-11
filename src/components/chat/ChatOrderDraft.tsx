
import { OrderItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, X, AlertCircle } from 'lucide-react';

interface ChatOrderDraftProps {
    items: OrderItem[];
    totalEstimate: number;
    onConfirm: () => void;
    onReject: () => void;
}

export function ChatOrderDraft({ items, totalEstimate, onConfirm, onReject }: ChatOrderDraftProps) {
    return (
        <Card className="w-full max-w-sm border-2 border-primary/20 shadow-md">
            <CardHeader className="pb-3 bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-primary">
                    <ShoppingCart className="w-4 h-4" />
                    Proposed Order
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    I've analyzed your request. Please confirm these items:
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-60 overflow-y-auto px-4 py-3 space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-start justify-between group">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="bg-muted px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                                    {item.description && <span>{item.description}</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">₹{item.totalPrice.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">₹{item.unitPrice}/unit</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 py-3 bg-muted/20 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-medium">Estimated Total</span>
                    <span className="text-base font-bold text-primary">₹{totalEstimate.toLocaleString()}</span>
                </div>

                <div className="px-4 py-2 bg-primary/5 text-primary text-[10px] flex items-center gap-2 border-t border-primary/10">
                    <AlertCircle className="w-3 h-3" />
                    Checking stock availability...
                </div>
            </CardContent>
            <CardFooter className="p-3 gap-3 bg-card rounded-b-lg">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={onReject}
                >
                    <X className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={onConfirm}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Order
                </Button>
            </CardFooter>
        </Card>
    );
}
