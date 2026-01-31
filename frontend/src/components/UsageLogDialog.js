import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
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
import { toast } from 'sonner';
import { Minus, AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const UsageLogDialog = ({ open, onClose, onLogged, item }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity_used: 1,
    reason: '',
    event_name: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.quantity_used <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (formData.quantity_used > item.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/usage`, {
        item_id: item.id,
        ...formData
      }, {
        headers: getAuthHeader()
      });
      toast.success('Usage logged successfully');
      setFormData({ quantity_used: 1, reason: '', event_name: '' });
      onLogged();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to log usage');
    } finally {
      setLoading(false);
    }
  };

  const newQuantity = item ? item.quantity - formData.quantity_used : 0;
  const willBeLowStock = item && newQuantity <= item.min_stock;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border" data-testid="usage-log-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
            <Minus className="w-6 h-6 text-primary" />
            Log Usage
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {item?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Current Stock Display */}
          <div className="p-4 bg-secondary/30 border border-border/50 rounded-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">Current Stock</p>
                <p className="text-2xl font-mono font-bold text-foreground">{item?.quantity || 0}</p>
              </div>
              <div className="text-3xl font-mono text-muted-foreground">→</div>
              <div>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">After Usage</p>
                <p className={`text-2xl font-mono font-bold ${willBeLowStock ? 'text-accent' : 'text-foreground'}`}>
                  {newQuantity}
                </p>
              </div>
            </div>
          </div>

          {/* Low Stock Warning */}
          {willBeLowStock && newQuantity >= 0 && (
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-sm text-accent">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">This will put the item below minimum stock level</span>
            </div>
          )}

          {/* Quantity Used */}
          <div className="space-y-2">
            <Label htmlFor="quantity_used" className="form-label">Quantity Used *</Label>
            <Input
              id="quantity_used"
              type="number"
              min="1"
              max={item?.quantity || 1}
              value={formData.quantity_used}
              onChange={(e) => handleChange('quantity_used', parseInt(e.target.value) || 0)}
              className="bg-secondary border-border focus:border-primary font-mono text-lg"
              data-testid="usage-quantity-input"
            />
          </div>

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event_name" className="form-label">Event / Rally Name</Label>
            <Input
              id="event_name"
              value={formData.event_name}
              onChange={(e) => handleChange('event_name', e.target.value)}
              placeholder="e.g., Monte Carlo Rally 2024"
              className="bg-secondary border-border focus:border-primary"
              data-testid="usage-event-input"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="form-label">Reason / Notes</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="e.g., Replaced worn brake pads before stage 5"
              className="bg-secondary border-border focus:border-primary resize-none h-20"
              data-testid="usage-reason-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="usage-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.quantity_used > (item?.quantity || 0) || formData.quantity_used <= 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="usage-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Log Usage
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsageLogDialog;
