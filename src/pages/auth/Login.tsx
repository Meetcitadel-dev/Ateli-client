
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Phone, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState<'input' | 'otp' | 'onboarding'>('input');
    const [isLoading, setIsLoading] = useState(false);

    const { login, loginWithEmail, verifyOtp, verifyEmailOtp, completeOnboarding, isAuthenticated, needsOnboarding, user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || "/projects";

    // Detect if we should show onboarding step AFTER auth is confirmed
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            if (needsOnboarding) {
                setStep('onboarding');
            } else if (step !== 'onboarding') {
                navigate(from, { replace: true });
            }
        }
    }, [isAuthenticated, authLoading, needsOnboarding, navigate, from, step]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loginType === 'phone') {
            if (phone.length < 10) return;
            setIsLoading(true);
            try {
                await login(phone);
                setStep('otp');
            } catch (error) {
                // Error managed in AuthContext
            } finally {
                setIsLoading(false);
            }
        } else {
            if (!email.endsWith('@ateli.co.in')) {
                toast.error("Admin login requires an @ateli.co.in email");
                return;
            }
            setIsLoading(true);
            try {
                await loginWithEmail(email);
                setStep('otp');
            } catch (error) {
                // Error managed in AuthContext
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleVerifyLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (loginType === 'phone') {
                await verifyOtp(phone, otp);
            } else {
                await verifyEmailOtp(email, otp);
            }
            // useEffect will handle navigation or onboarding step
        } catch (error) {
            // Error managed in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteOnboarding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await completeOnboarding(name);
            navigate(from, { replace: true });
        } catch (error) {
            // Error managed in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-30" />
            </div>

            <Card className="w-full max-w-[400px] shadow-2xl border border-border bg-card/50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="space-y-4 pb-8">
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg transform -rotate-3 transition-transform duration-300">
                            <span className="text-primary-foreground font-black text-2xl">A</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                            {step === 'onboarding' ? "Welcome to Ateli" : "Login to Ateli"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {step === 'input' && (loginType === 'phone' ? "Enter your mobile number to login" : "Admin login using your @ateli.co.in email")}
                            {step === 'otp' && `Verify the code sent to ${loginType === 'phone' ? phone : email}`}
                            {step === 'onboarding' && "Please tell us your name to get started"}
                        </CardDescription>
                    </div>
                </CardHeader>

                {step === 'input' && (
                    <form onSubmit={handleSendOTP}>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="identifier" className="text-foreground/80">
                                    {loginType === 'phone' ? "Mobile Number" : "Email Address"}
                                </Label>
                                <div className="relative">
                                    {loginType === 'phone' ? (
                                        <>
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="identifier"
                                                type="tel"
                                                placeholder="Mobile number (e.g. 9310845435)"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                                className="h-11 pl-10 bg-background/50 border-border focus:ring-primary/20 rounded-xl"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="identifier"
                                                type="email"
                                                placeholder="yourname@ateli.co.in"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-11 pl-10 bg-background/50 border-border focus:ring-primary/20 rounded-xl"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all group"
                                disabled={isLoading || (loginType === 'phone' ? phone.length < 10 : !email)}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Get OTP"}
                                {!isLoading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </CardContent>
                        <CardFooter className="pt-1 pb-8 flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={() => setLoginType(loginType === 'phone' ? 'email' : 'phone')}
                                className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
                            >
                                {loginType === 'phone' ? "Are you an admin? Click here" : "Login with Phone Number"}
                            </button>
                        </CardFooter>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyLogin}>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="text-foreground/80">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    required
                                    autoFocus
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="h-11 text-center tracking-[0.5em] text-lg font-bold bg-background/50 border-border focus:ring-primary/20 rounded-xl"
                                />
                                <div className="flex justify-between items-center px-1">
                                    <button
                                        type="button"
                                        onClick={() => setStep('input')}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        Change {loginType === 'phone' ? "Number" : "Email"}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all"
                                disabled={isLoading || otp.length < 6}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Login"}
                            </Button>
                        </CardContent>
                    </form>
                )}

                {step === 'onboarding' && (
                    <form onSubmit={handleCompleteOnboarding}>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-foreground/80">Full Name</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        required
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11 pl-10 bg-background/50 border-border focus:ring-primary/20 rounded-xl"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all group"
                                disabled={isLoading || !name.trim()}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Start Using Ateli"}
                                {!isLoading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </CardContent>
                    </form>
                )}
            </Card>
        </div>
    );
}
