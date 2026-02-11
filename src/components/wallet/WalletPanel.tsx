
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function WalletPanel() {
  const { user } = useAuth();
  const { transactions, addTransaction } = useUser();
  const [topUpAmount, setTopUpAmount] = useState('');

  if (!user) return null;

  const handleTopUp = () => {
    const amount = Number(topUpAmount);
    if (!topUpAmount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    addTransaction(amount, 'credit', 'Wallet Top-up');
    setTopUpAmount('');
  };

  const quickAmounts = [1000, 5000, 10000, 25000];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <p className="text-[10px] md:text-sm font-medium opacity-80 uppercase tracking-wider">Available Balance</p>
                <p className="text-3xl md:text-4xl font-bold mt-1">₹{user.walletBalance.toLocaleString()}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-none py-1.5 px-3 text-xs">
              Verified Account
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Top Up */}
      <Card className="border-border/50">
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Plus className="w-5 h-5 text-primary" />
            Add Money
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setTopUpAmount(amount.toString())}
                className={cn(
                  "h-10 md:h-12 text-sm md:text-base font-medium transition-all hover:border-primary hover:text-primary",
                  topUpAmount === amount.toString() && "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                )}
              >
                ₹{amount.toLocaleString()}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input
                type="number"
                placeholder="Custom amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="flex-1 h-12 pl-8 text-base md:text-lg bg-muted/30 border-muted-foreground/20 focus:ring-primary/20"
              />
            </div>
            <Button onClick={handleTopUp} className="gap-2 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95 w-full sm:w-auto">
              <CreditCard className="w-5 h-5" />
              Add Money
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Clock className="w-5 h-5 text-primary" />
            History
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 font-medium">View All</Button>
        </CardHeader>
        <CardContent className="p-2 md:p-6 pt-0 md:pt-0">
          <div className="space-y-1">
            {transactions.length > 0 ? (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors group border-b border-border/50 last:border-0"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                    txn.type === 'credit' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {txn.type === 'credit' ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{txn.description}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {format(new Date(txn.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    txn.type === 'credit' ? "text-success" : "text-destructive"
                  )}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground">No recent transactions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
