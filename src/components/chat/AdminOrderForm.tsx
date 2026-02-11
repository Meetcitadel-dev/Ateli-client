import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, ShoppingCart, Check, ChevronsUpDown } from 'lucide-react';
import { STANDARDIZED_PRODUCTS } from '@/data/inventory';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface AdminOrderFormProps {
    onSubmit: (items: any[]) => void;
    onCancel: () => void;
}

export function AdminOrderForm({ onSubmit, onCancel }: AdminOrderFormProps) {
    const [selectedItems, setSelectedItems] = useState<{ name: string; quantity: number; price: number; id: string }[]>([]);

    // Config state
    const [selectedProductName, setSelectedProductName] = useState("");
    const [open, setOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [customName, setCustomName] = useState("");

    // Mobile View State
    const [showMobileCart, setShowMobileCart] = useState(false);

    const handleAddItem = () => {
        const name = isCustom ? customName : selectedProductName;
        if (!name) return;

        setSelectedItems(prev => [
            ...prev,
            {
                id: `item-${Date.now()}`,
                name,
                quantity,
                price: Number(price) || 0
            }
        ]);

        // Reset config
        setSelectedProductName("");
        setCustomName("");
        setIsCustom(false);
        setPrice("");
        setQuantity(1);
    };

    const handleRemoveItem = (id: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleQuantityUpdate = (id: string, newQty: number) => {
        if (newQty < 1) return;
        setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    };

    const handleSubmit = () => {
        const formattedItems = selectedItems.map(item => ({
            name: item.name,
            description: 'Manual Order Item',
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            id: item.id
        }));
        onSubmit(formattedItems);
    };

    const totalEstimate = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <Card className="w-full h-full flex flex-col border-none shadow-none bg-background">
            <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between pr-14">
                <CardTitle className="text-xl font-bold tracking-tight">
                    {showMobileCart ? 'Current Order' : 'Create Order'}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {selectedItems.length > 0 && !showMobileCart && (
                        <Button size="sm" variant="secondary" onClick={() => setShowMobileCart(true)} className="md:hidden font-bold">
                            <ShoppingCart className="w-4 h-4 mr-2" /> {selectedItems.length}
                        </Button>
                    )}
                    {showMobileCart && (
                        <Button size="sm" variant="ghost" onClick={() => setShowMobileCart(false)} className="md:hidden font-bold">
                            Back
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col md:flex-row bg-background">
                {/* Configuration Panel (Left Side on Desktop) */}
                <div className={cn(
                    "flex-1 flex flex-col border-r border-border h-full p-6 space-y-8 overflow-y-auto",
                    showMobileCart ? "hidden md:flex" : "flex"
                )}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Select Product</Label>
                            <Button variant="link" size="sm" className="h-auto p-0 text-primary hover:text-primary/80 font-bold text-[11px] uppercase tracking-wider" onClick={() => {
                                setIsCustom(!isCustom);
                                setSelectedProductName("");
                                setCustomName("");
                            }}>
                                {isCustom ? "Select from List" : "+ Create Custom Product"}
                            </Button>
                        </div>

                        {isCustom ? (
                            <div className="space-y-2 animate-in fadeIn slide-in-from-top-1 duration-200">
                                <Input
                                    placeholder="Enter product name..."
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="h-11 text-base focus-visible:ring-primary/50"
                                />
                            </div>
                        ) : (
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between h-11 text-left font-normal border-border/60 hover:border-primary/50 transition-all bg-card/50"
                                    >
                                        <div className="truncate flex-1 pr-2">
                                            {selectedProductName || "Search 6,000+ items..."}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-primary/20" align="start">
                                    <Command className="w-full">
                                        <CommandInput placeholder="Search inventory..." className="h-11" />
                                        <CommandList className="max-h-[350px]">
                                            <CommandEmpty>No product found.</CommandEmpty>
                                            <CommandGroup>
                                                {STANDARDIZED_PRODUCTS.slice(0, 500).map((product) => (
                                                    <CommandItem
                                                        key={product}
                                                        value={product}
                                                        onSelect={(currentValue) => {
                                                            setSelectedProductName(currentValue);
                                                            setOpen(false);
                                                        }}
                                                        className="text-xs py-2.5 cursor-pointer hover:bg-primary/10"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 text-primary",
                                                                selectedProductName === product ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {product}
                                                    </CommandItem>
                                                ))}
                                                {STANDARDIZED_PRODUCTS.length > 500 && (
                                                    <div className="p-3 text-[10px] text-center text-muted-foreground border-t bg-muted/20">
                                                        Showing first 500 of {STANDARDIZED_PRODUCTS.length} items. Keep typing...
                                                    </div>
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Unit Price (₹)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="h-11 bg-card/50 focus-visible:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Quantity</Label>
                            <div className="flex items-center gap-1.5 bg-card/50 border rounded-md p-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-background/80" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                                    className="h-9 border-0 bg-transparent text-center text-sm font-bold focus-visible:ring-0 p-0"
                                />
                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-background/80" onClick={() => setQuantity(q => q + 1)}>+</Button>
                            </div>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full h-12 text-base font-bold shadow-md hover:shadow-primary/20 transition-all bg-primary text-primary-foreground"
                        disabled={!(isCustom ? customName : selectedProductName)}
                        onClick={handleAddItem}
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add to Order
                    </Button>
                </div>

                {/* Cart Panel (Right Side on Desktop) */}
                <div className={cn(
                    "w-full md:w-[320px] flex flex-col bg-muted/5 h-full border-l border-border",
                    !showMobileCart ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b bg-muted/10 flex justify-between items-center h-[61px]">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Order Items ({selectedItems.length})</h4>
                        {showMobileCart && (
                            <Button variant="ghost" size="sm" onClick={() => setShowMobileCart(false)} className="md:hidden text-[10px] font-bold uppercase tracking-widest h-8">
                                <Plus className="w-3 h-3 mr-1" /> Add Items
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {selectedItems.map((item) => (
                                <div key={item.id} className="flex flex-col gap-3 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm tracking-tight leading-snug">{item.name}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-dashed">
                                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}>-</Button>
                                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}>+</Button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</p>
                                            <p className="font-bold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedItems.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 text-center">
                                    <div className="bg-muted/30 p-6 rounded-full mb-4">
                                        <ShoppingCart className="w-10 h-10" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest">No items added</p>
                                    <p className="text-xs mt-1">Configure items on the left side</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-6 border-t bg-card mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Total Estimate</p>
                                <p className="text-2xl font-black text-primary tracking-tighter">₹{totalEstimate.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={onCancel} className="h-11 font-bold uppercase tracking-widest text-[10px] border-2">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={selectedItems.length === 0} className="h-11 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Create Order</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
