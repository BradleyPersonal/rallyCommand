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
import { toast } from 'sonner';
import { Save, Car, Upload, X } from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const VehicleFormDialog = ({ open, onClose, onSaved, vehicle }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    registration: '',
    vin: '',
    photo: ''
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        registration: vehicle.registration || '',
        vin: vehicle.vin || '',
        photo: vehicle.photo || ''
      });
    } else {
      setFormData({
        make: '',
        model: '',
        registration: '',
        vin: '',
        photo: ''
      });
    }
  }, [vehicle, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo is too large. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        photo: event.target.result
      }));
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.make.trim() || !formData.model.trim()) {
      toast.error('Make and Model are required');
      return;
    }

    setLoading(true);
    try {
      if (vehicle) {
        await axios.put(`${API}/vehicles/${vehicle.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Vehicle updated successfully');
      } else {
        await axios.post(`${API}/vehicles`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Vehicle added successfully');
      }
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border" data-testid="vehicle-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
            <Car className="w-6 h-6 text-primary" />
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Photo */}
          <div className="space-y-2">
            <Label className="form-label">Vehicle Photo</Label>
            {formData.photo ? (
              <div className="relative w-full h-40 rounded-sm overflow-hidden border border-border group">
                <img 
                  src={formData.photo} 
                  alt="Vehicle"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="remove-vehicle-photo"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="vehicle-photo-upload"
                  data-testid="vehicle-photo-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-dashed flex flex-col gap-2"
                  data-testid="upload-vehicle-photo-btn"
                >
                  <Upload className="w-6 h-6" />
                  <span>Upload Photo</span>
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Make */}
            <div className="space-y-2">
              <Label htmlFor="make" className="form-label">Make *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="e.g., Subaru"
                className="bg-secondary border-border focus:border-primary"
                data-testid="vehicle-make-input"
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model" className="form-label">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="e.g., Impreza WRX"
                className="bg-secondary border-border focus:border-primary"
                data-testid="vehicle-model-input"
              />
            </div>

            {/* Registration */}
            <div className="space-y-2">
              <Label htmlFor="registration" className="form-label">Registration</Label>
              <Input
                id="registration"
                value={formData.registration}
                onChange={(e) => handleChange('registration', e.target.value.toUpperCase())}
                placeholder="e.g., ABC 123"
                className="bg-secondary border-border focus:border-primary font-mono"
                data-testid="vehicle-registration-input"
              />
            </div>

            {/* VIN */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="vin" className="form-label">VIN Number</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                placeholder="e.g., JF1GD70653G803421"
                className="bg-secondary border-border focus:border-primary font-mono text-xs"
                data-testid="vehicle-vin-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="vehicle-form-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="vehicle-form-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {vehicle ? 'Update' : 'Add Vehicle'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFormDialog;
