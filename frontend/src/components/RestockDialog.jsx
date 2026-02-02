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
import { Plus, Package } from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const RestockDialog = ({ open, onClose, onRestocked, item }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    notes: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const newQuantity = item.quantity + formData.quantity;
      const updatedNotes = formData.notes 
        ? `${item.notes ? item.notes + '\n\n' : ''}[Restocked +${formData.quantity}] ${formData.notes}`
        : item.notes;

      await axios.put(`${API}/inventory/${item.id}`, {
        quantity: newQuantity,
        notes: updatedNotes
      }, {
        headers: getAuthHeader()
      });
      
      toast.success(`Restocked ${formData.quantity} units successfully`);
      setFormData({ quantity: 1, notes: '' });
      onRestocked();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to restock item');
    } finally {
      setLoading(false);
    }
  };

  const newQuantity = item ? item.quantity + formData.quantity : 0;
  const willBeAboveMin = item && newQuantity > item.min_stock;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border" data-testid="restock-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
            <Plus className="w-6 h-6 text-green-500" />
            Restock Item
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
                <p className="text-xs text-muted-foreground tracking-widest uppercase">After Restock</p>
                <p className={`text-2xl font-mono font-bold ${willBeAboveMin ? 'text-green-500' : 'text-accent'}`}>
                  {newQuantity}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Status */}
          {willBeAboveMin && item?.quantity <= item?.min_stock && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-sm text-green-500">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">This will restore stock above minimum level</span>
            </div>
          )}

          {/* Quantity to Add */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="form-label">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              className="bg-secondary border-border focus:border-primary font-mono text-lg"
              data-testid="restock-quantity-input"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="form-label">Restock Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="e.g., Ordered from supplier, received shipment..."
              className="bg-secondary border-border focus:border-primary resize-none h-20"
              data-testid="restock-notes-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="restock-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.quantity <= 0}
              className="bg-green-600 text-white hover:bg-green-700"
              data-testid="restock-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Restock +{formData.quantity}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RestockDialog;
