import { useState, useEffect, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Package, Upload, X, Car } from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const categories = [
  { value: 'parts', label: 'Parts' },
  { value: 'tools', label: 'Tools' },
  { value: 'fluids', label: 'Fluids' },
];

const partSubcategories = [
  { value: '', label: 'Select Subcategory' },
  { value: 'panel', label: 'Panel' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'driveline', label: 'Driveline' },
  { value: 'powertrain', label: 'Powertrain' },
  { value: 'other', label: 'Other' },
];

const partConditions = [
  { value: 'new', label: 'New' },
  { value: 'used-good', label: 'Used - Good' },
  { value: 'used-fair', label: 'Used - Fair' },
  { value: 'poor-damaged', label: 'Poor/Damaged' },
];

export const ItemFormDialog = ({ open, onClose, onSaved, item }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'parts',
    subcategory: '',
    condition: '',
    quantity: 0,
    location: '',
    part_number: '',
    supplier: '',
    supplier_url: '',
    price: 0,
    min_stock: 1,
    notes: '',
    photos: [],
    vehicle_ids: []
  });

  useEffect(() => {
    if (open) {
      fetchVehicles();
    }
  }, [open]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'parts',
        subcategory: item.subcategory || '',
        condition: item.condition || '',
        quantity: item.quantity || 0,
        location: item.location || '',
        part_number: item.part_number || '',
        supplier: item.supplier || '',
        supplier_url: item.supplier_url || '',
        price: item.price || 0,
        min_stock: item.min_stock || 1,
        notes: item.notes || '',
        photos: item.photos || [],
        vehicle_ids: item.vehicle_ids || []
      });
    } else {
      setFormData({
        name: '',
        category: 'parts',
        subcategory: '',
        condition: '',
        quantity: 0,
        location: '',
        part_number: '',
        supplier: '',
        supplier_url: '',
        price: 0,
        min_stock: 1,
        notes: '',
        photos: [],
        vehicle_ids: []
      });
    }
  }, [item, open]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`, {
        headers: getAuthHeader()
      });
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleToggle = (vehicleId) => {
    setFormData(prev => {
      const newIds = prev.vehicle_ids.includes(vehicleId)
        ? prev.vehicle_ids.filter(id => id !== vehicleId)
        : [...prev.vehicle_ids, vehicleId];
      return { ...prev, vehicle_ids: newIds };
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 3) {
      toast.error('Maximum 3 photos allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per photo.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, event.target.result].slice(0, 3)
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
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
        await axios.put(`${API}/inventory/${item.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Item updated successfully');
      } else {
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
      <DialogContent className="sm:max-w-[550px] bg-card border-border max-h-[90vh] overflow-y-auto" data-testid="item-form-dialog">
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
                onValueChange={(value) => {
                  handleChange('category', value);
                  // Clear subcategory when changing away from parts
                  if (value !== 'parts') {
                    handleChange('subcategory', '');
                  }
                }}
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

            {/* Subcategory - Only shown for parts */}
            {formData.category === 'parts' && (
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="form-label">Part Type</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => handleChange('subcategory', value)}
                >
                  <SelectTrigger className="bg-secondary border-border" data-testid="item-subcategory-select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {partSubcategories.filter(s => s.value !== '').map((sub) => (
                      <SelectItem key={sub.value} value={sub.value}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            {/* Supplier URL */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="supplier_url" className="form-label">Supplier Website</Label>
              <Input
                id="supplier_url"
                type="url"
                value={formData.supplier_url}
                onChange={(e) => handleChange('supplier_url', e.target.value)}
                placeholder="e.g., https://www.supplier.com/product"
                className="bg-secondary border-border focus:border-primary"
                data-testid="item-supplier-url-input"
              />
            </div>

            {/* Price */}
            <div className="col-span-2 space-y-2">
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

            {/* Applicable Vehicles */}
            {vehicles.length > 0 && (
              <div className="col-span-2 space-y-2">
                <Label className="form-label flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Applicable Vehicles
                </Label>
                <div className="space-y-2 p-3 bg-secondary/30 border border-border/50 rounded-sm">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`vehicle-${vehicle.id}`}
                        checked={formData.vehicle_ids.includes(vehicle.id)}
                        onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                        data-testid={`vehicle-checkbox-${vehicle.id}`}
                      />
                      <label
                        htmlFor={`vehicle-${vehicle.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {vehicle.make} {vehicle.model}
                        {vehicle.registration && (
                          <span className="text-muted-foreground ml-2 font-mono text-xs">
                            ({vehicle.registration})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which vehicles this part is applicable for
                </p>
              </div>
            )}

            {/* Photos */}
            <div className="col-span-2 space-y-2">
              <Label className="form-label">Photos (Max 3)</Label>
              <div className="space-y-3">
                {formData.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {formData.photos.map((photo, index) => (
                      <div 
                        key={index}
                        className="relative w-20 h-20 rounded-sm overflow-hidden border border-border group"
                      >
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-photo-${index}`}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.photos.length < 3 && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      data-testid="photo-upload-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-dashed"
                      data-testid="upload-photo-btn"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos ({formData.photos.length}/3)
                    </Button>
                  </div>
                )}
              </div>
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
