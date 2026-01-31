import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Package } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'parts', label: 'Parts' },
  { value: 'tools', label: 'Tools' },
  { value: 'fluids', label: 'Fluids' },
];

export const ItemFormDialog = ({ open, onClose, onSaved, item }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'parts',
    quantity: 0,
    location: '',
    part_number: '',
    supplier: '',
    price: 0,
    min_stock: 1,
    notes: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'parts',
        quantity: item.quantity || 0,
        location: item.location || '',
        part_number: item.part_number || '',
        supplier: item.supplier || '',
        price: item.price || 0,
        min_stock: item.min_stock || 1,
        notes: item.notes || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'parts',
        quantity: 0,
        location: '',
        part_number: '',
        supplier: '',
        price: 0,
        min_stock: 1,
        notes: ''
      });
    }
  }, [item, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    setLoading(true);
    try {
      if (item) {
        // Update existing item
        await axios.put(`${API}/inventory/${item.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Item updated successfully');
      } else {
        // Create new item
        await axios.post(`${API}/inventory`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Item added successfully');
      }
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border" data-testid="item-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {item ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name" className="form-label">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Brake Pads - Front"
                className="bg-secondary border-border focus:border-primary"
                data-testid="item-name-input"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="form-label">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="bg-secondary border-border" data-testid="item-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Part Number */}
            <div className="space-y-2">
              <Label htmlFor="part_number" className="form-label">Part Number</Label>
              <Input
                id="part_number"
                value={formData.part_number}
                onChange={(e) => handleChange('part_number', e.target.value)}
                placeholder="e.g., BP-2024-FRT"
                className="bg-secondary border-border focus:border-primary font-mono"
                data-testid="item-part-number-input"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="form-label">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                className="bg-secondary border-border focus:border-primary font-mono"
                data-testid="item-quantity-input"
              />
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <Label htmlFor="min_stock" className="form-label">Min. Stock Alert</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => handleChange('min_stock', parseInt(e.target.value) || 0)}
                className="bg-secondary border-border focus:border-primary font-mono"
                data-testid="item-min-stock-input"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="form-label">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Shelf A-3"
                className="bg-secondary border-border focus:border-primary"
                data-testid="item-location-input"
              />
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier" className="form-label">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                placeholder="e.g., RallyParts Co."
                className="bg-secondary border-border focus:border-primary"
                data-testid="item-supplier-input"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="form-label">Unit Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                className="bg-secondary border-border focus:border-primary font-mono"
                data-testid="item-price-input"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes" className="form-label">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this item..."
                className="bg-secondary border-border focus:border-primary resize-none h-20"
                data-testid="item-notes-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 relative z-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="item-form-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 relative z-50"
              data-testid="item-form-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {item ? 'Update Item' : 'Add Item'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemFormDialog;
