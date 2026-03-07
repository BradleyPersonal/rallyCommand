import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Gauge, LogIn, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    setShowResend(false);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      toast.error(errorMessage);
      
      // Show resend option if email not verified
      if (error.response?.status === 403 && errorMessage.includes('verify')) {
        setShowResend(true);
        setResendEmail(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) return;
    
    setResending(true);
    try {
      await resendVerification(resendEmail);
      toast.success('Verification email sent! Check your inbox.');
      setShowResend(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
              <Gauge className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl tracking-tight uppercase text-foreground">
                RallyCommand
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">
                Inventory Control
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-2 mb-8">
            <h2 className="text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Sign In
            </h2>
            <p className="text-muted-foreground">
              Access your rally car inventory
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="form-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@rally.team"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border focus:border-primary h-12"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="form-label">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border focus:border-primary h-12"
                data-testid="login-password-input"
              />
            </div>

            {/* Resend Verification Email Option */}
            {showResend && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                  Email not verified
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Please check your inbox for the verification link, or click below to resend it.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full"
                  data-testid="resend-verification-btn"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider btn-primary"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-primary hover:underline font-medium"
              data-testid="register-link"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1769348900282-f3b652f7db50?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxyYWxseSUyMGNhciUyMGFjdGlvbiUyMGRpcnR8ZW58MHx8fHwxNzY5ODk0Njg1fDA&ixlib=rb-4.1.0&q=85)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
            Built for Performance
          </p>
          <h3 className="text-3xl tracking-tight uppercase text-foreground">
            Track Every Part.<br />Win Every Stage.
          </h3>
        </div>
      </div>
    </div>
  );
}
