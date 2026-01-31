import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Gauge, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Hero Image */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1619505372149-07875c35b313?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxtZWNoYW5pYyUyMHdvcmtpbmclMjBnYXJhZ2V8ZW58MHx8fHwxNzY5ODk0Njg4fDA&ixlib=rb-4.1.0&q=85)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
            Join the Team
          </p>
          <h3 className="text-3xl tracking-tight uppercase text-foreground">
            Precision Parts.<br />Peak Performance.
          </h3>
        </div>
      </div>

      {/* Right side - Form */}
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
              Create Account
            </h2>
            <p className="text-muted-foreground">
              Start managing your inventory today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="form-label">Team Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Rally Team Alpha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-card border-border focus:border-primary h-12"
                data-testid="register-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="form-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@rally.team"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border focus:border-primary h-12"
                data-testid="register-email-input"
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
                data-testid="register-password-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-card border-border focus:border-primary h-12"
                data-testid="register-confirm-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider btn-primary"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-primary hover:underline font-medium"
              data-testid="login-link"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
