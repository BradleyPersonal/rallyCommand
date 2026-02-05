import { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  Send,
  Bug,
  Lightbulb,
  CheckCircle
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function FeedbackDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback_type: 'bug',
    message: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error('Please fill in your name and message');
      return;
    }

    // Validate email only if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      // Check for allowed domains
      const email = formData.email.toLowerCase();
      if (!email.endsWith('.com') && !email.endsWith('.co.nz')) {
        toast.error('Email must end with .com or .co.nz');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/feedback`, formData);
      console.log('Feedback response:', response.data);
      setSubmitted(true);
      toast.success('Feedback sent successfully!');
    } catch (error) {
      console.error('Failed to send feedback:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to send feedback. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', feedback_type: 'bug', message: '' });
    setSubmitted(false);
    onClose();
  };

  // Success Screen
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-6">
              Your feedback has been sent successfully. We appreciate you taking the time to help improve RallyCommand.
            </p>
            <Button onClick={handleClose} className="bg-primary text-primary-foreground">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase">
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            Report a bug or suggest a new feature
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">What would you like to do?</Label>
            <RadioGroup
              value={formData.feedback_type}
              onValueChange={(value) => handleChange('feedback_type', value)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="bug"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.feedback_type === 'bug'
                    ? 'bg-red-500/10 border-red-500/50'
                    : 'bg-secondary/30 border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="bug" id="bug" className="sr-only" />
                <Bug className={`w-5 h-5 ${formData.feedback_type === 'bug' ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={formData.feedback_type === 'bug' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  Report Bug
                </span>
              </Label>
              <Label
                htmlFor="feature"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.feedback_type === 'feature'
                    ? 'bg-blue-500/10 border-blue-500/50'
                    : 'bg-secondary/30 border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="feature" id="feature" className="sr-only" />
                <Lightbulb className={`w-5 h-5 ${formData.feedback_type === 'feature' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                <span className={formData.feedback_type === 'feature' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  Suggest Feature
                </span>
              </Label>
            </RadioGroup>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground">Your Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your name"
              className="bg-secondary border-border focus:border-primary"
              data-testid="feedback-name-input"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email Address <span className="text-xs text-muted-foreground/70">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              className="bg-secondary border-border focus:border-primary"
              data-testid="feedback-email-input"
            />
            <p className="text-xs text-muted-foreground">
              If provided, must end with .com or .co.nz
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-muted-foreground">
              {formData.feedback_type === 'bug' ? 'Describe the bug' : 'Describe your idea'}
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder={
                formData.feedback_type === 'bug'
                  ? 'What happened? What did you expect to happen? Steps to reproduce...'
                  : 'Describe the feature you would like to see...'
              }
              className="bg-secondary border-border focus:border-primary resize-none h-32"
              data-testid="feedback-message-input"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="feedback-submit-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
