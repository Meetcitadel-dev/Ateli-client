import { useState } from 'react';
import { WalletTransaction } from '@/types';
import { currentUser, mockWalletTransactions } from '@/data/mockData';
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
  const [transactions] = useState<WalletTransaction[]>(mockWalletTransactions);
  const [topUpAmount, setTopUpAmount] = useState('');

  const handleTopUp = () => {
    if (!topUpAmount || isNaN(Number(topUpAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    toast.success(`Top-up of ₹${topUpAmount} initiated`);
    setTopUpAmount('');
  };

  const quickAmounts = [1000, 5000, 10000, 25000];

  return (
    <div className="space-y-6 p-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-3xl font-bold">₹{currentUser.walletBalance.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setTopUpAmount(amount.toString())}
                className={cn(
                  topUpAmount === amount.toString() && "border-primary bg-primary/10"
                )}
              >
                ₹{amount.toLocaleString()}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTopUp} className="gap-2">
              <CreditCard className="w-4 h-4" />
              Add Money
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div 
                key={txn.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  txn.type === 'credit' ? "bg-success/20" : "bg-destructive/20"
                )}>
                  {txn.type === 'credit' ? (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(txn.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className={cn(
                  "font-semibold",
                  txn.type === 'credit' ? "text-success" : "text-destructive"
                )}>
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
