import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Wrench, Plus, X, Package, ShoppingCart } from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const RepairFormDialog = ({ open, onClose, onSaved, repair, vehicles }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    cause_of_damage: '',
    affected_area: '',
    parts_used: [],
    total_parts_cost: 0,
    repair_details: '',
    technicians: []
  });
  const [newPart, setNewPart] = useState({
    name: '',
    source: 'new',
    inventory_item_id: '',
    quantity: 1,
    cost: 0
  });
  const [newTechnician, setNewTechnician] = useState('');

  useEffect(() => {
    if (open) {
      fetchInventory();
    }
  }, [open]);

  useEffect(() => {
    if (repair) {
      setFormData({
        vehicle_id: repair.vehicle_id || '',
        cause_of_damage: repair.cause_of_damage || '',
        affected_area: repair.affected_area || '',
        parts_used: repair.parts_used || [],
        total_parts_cost: repair.total_parts_cost || 0,
        repair_details: repair.repair_details || '',
        technicians: repair.technicians || []
      });
    } else {
      // For new repairs, auto-select vehicle if only one exists
      const defaultVehicleId = vehicles && vehicles.length === 1 ? vehicles[0].id : '';
      setFormData({
        vehicle_id: defaultVehicleId,
        cause_of_damage: '',
        affected_area: '',
        parts_used: [],
        total_parts_cost: 0,
        repair_details: '',
        technicians: []
      });
    }
  }, [repair, open, vehicles]);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/inventory`, {
        headers: getAuthHeader()
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPart = () => {
    if (!newPart.name.trim()) {
      toast.error('Part name is required');
      return;
    }

    let partToAdd = { ...newPart };
    
    // If from inventory, get the price
    if (newPart.source === 'inventory' && newPart.inventory_item_id) {
      const invItem = inventory.find(i => i.id === newPart.inventory_item_id);
      if (invItem) {
        partToAdd.name = invItem.name;
        partToAdd.cost = invItem.price * newPart.quantity;
      }
    }

    setFormData(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, partToAdd],
      total_parts_cost: prev.total_parts_cost + partToAdd.cost
    }));

    // Reset new part form
    setNewPart({
      name: '',
      source: 'new',
      inventory_item_id: '',
      quantity: 1,
      cost: 0
    });
  };

  const handleRemovePart = (index) => {
    const partToRemove = formData.parts_used[index];
    setFormData(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index),
      total_parts_cost: prev.total_parts_cost - (partToRemove.cost || 0)
    }));
  };

  const handleAddTechnician = () => {
    if (!newTechnician.trim()) return;
    if (formData.technicians.includes(newTechnician.trim())) {
      toast.error('Technician already added');
      return;
    }
    setFormData(prev => ({
      ...prev,
      technicians: [...prev.technicians, newTechnician.trim()]
    }));
    setNewTechnician('');
  };

  const handleRemoveTechnician = (index) => {
    setFormData(prev => ({
      ...prev,
      technicians: prev.technicians.filter((_, i) => i !== index)
    }));
  };

  const handleInventorySelect = (itemId) => {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      setNewPart(prev => ({
        ...prev,
        inventory_item_id: itemId,
        name: item.name,
        cost: item.price * prev.quantity
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!formData.cause_of_damage.trim()) {
      toast.error('Cause of damage is required');
      return;
    }

    setLoading(true);
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        toast.error('Session expired. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('Submitting repair with data:', formData);
      
      if (repair) {
        await axios.put(`${API}/repairs/${repair.id}`, formData, { headers });
        toast.success('Repair log updated successfully');
      } else {
        await axios.post(`${API}/repairs`, formData, { headers });
        toast.success('Repair log created successfully');
      }
      onSaved();
    } catch (error) {
      console.error('Repair save error:', error.response?.data || error);
      const errorMessage = error.response?.data?.detail || 'Failed to save repair log';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto" data-testid="repair-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            {repair ? 'Edit Repair Log' : 'Log Repair'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label className="form-label">Vehicle *</Label>
            <Select
              value={formData.vehicle_id}
              onValueChange={(value) => handleChange('vehicle_id', value)}
              disabled={!!repair}
            >
              <SelectTrigger className="bg-secondary border-border" data-testid="vehicle-select">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} {vehicle.registration && `(${vehicle.registration})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cause of Damage */}
          <div className="space-y-2">
            <Label htmlFor="cause" className="form-label">Cause of Damage *</Label>
            <Input
              id="cause"
              value={formData.cause_of_damage}
              onChange={(e) => handleChange('cause_of_damage', e.target.value)}
              placeholder="e.g., Roll on Stage 5, Impact with barrier"
              className="bg-secondary border-border focus:border-primary"
              data-testid="cause-input"
            />
          </div>

          {/* Affected Area */}
          <div className="space-y-2">
            <Label htmlFor="affected-area" className="form-label">Affected Area of Vehicle</Label>
            <Input
              id="affected-area"
              value={formData.affected_area}
              onChange={(e) => handleChange('affected_area', e.target.value)}
              placeholder="e.g., Front left corner, Rear suspension, Engine bay"
              className="bg-secondary border-border focus:border-primary"
              data-testid="affected-area-input"
            />
          </div>

          <Separator className="bg-border/50" />

          {/* Parts Used */}
          <div className="space-y-4">
            <Label className="form-label">Parts Used</Label>
            
            {/* Existing Parts */}
            {formData.parts_used.length > 0 && (
              <div className="space-y-2">
                {formData.parts_used.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-sm">
                    <div className="flex items-center gap-2">
                      {part.source === 'inventory' ? (
                        <Package className="w-4 h-4 text-primary" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-foreground">{part.name}</span>
                      <Badge variant="outline" className="text-xs">x{part.quantity}</Badge>
                      <span className="text-sm text-accent font-mono">{formatCurrency(part.cost)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePart(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Part */}
            <div className="p-4 border border-border/50 rounded-sm space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newPart.source === 'inventory' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewPart(prev => ({ ...prev, source: 'inventory', name: '', inventory_item_id: '' }))}
                >
                  <Package className="w-4 h-4 mr-1" />
                  From Inventory
                </Button>
                <Button
                  type="button"
                  variant={newPart.source === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewPart(prev => ({ ...prev, source: 'new', inventory_item_id: '' }))}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  New Part
                </Button>
              </div>

              {newPart.source === 'inventory' ? (
                <Select
                  value={newPart.inventory_item_id}
                  onValueChange={handleInventorySelect}
                >
                  <SelectTrigger className="bg-secondary border-border" data-testid="inventory-select">
                    <SelectValue placeholder="Select from inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.filter(i => i.quantity > 0).map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.quantity} available) - {formatCurrency(item.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newPart.name}
                    onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Part name"
                    className="bg-secondary border-border"
                    data-testid="new-part-name"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={newPart.cost}
                    onChange={(e) => setNewPart(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    placeholder="Cost"
                    className="bg-secondary border-border"
                    data-testid="new-part-cost"
                  />
                </div>
              )}

              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  value={newPart.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 1;
                    setNewPart(prev => {
                      const item = inventory.find(i => i.id === prev.inventory_item_id);
                      return {
                        ...prev,
                        quantity: qty,
                        cost: prev.source === 'inventory' && item ? item.price * qty : prev.cost
                      };
                    });
                  }}
                  className="w-24 bg-secondary border-border"
                  data-testid="part-quantity"
                />
                <span className="text-sm text-muted-foreground">Qty</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPart}
                  className="ml-auto"
                  data-testid="add-part-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Part
                </Button>
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-xs text-muted-foreground tracking-widest uppercase">Total Parts Cost</p>
                <p className="text-2xl font-mono text-accent">{formatCurrency(formData.total_parts_cost)}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Repair Details */}
          <div className="space-y-2">
            <Label htmlFor="details" className="form-label">Repair Details</Label>
            <Textarea
              id="details"
              value={formData.repair_details}
              onChange={(e) => handleChange('repair_details', e.target.value)}
              placeholder="Describe the repair work performed..."
              className="bg-secondary border-border focus:border-primary resize-none h-24"
              data-testid="repair-details-input"
            />
          </div>

          <Separator className="bg-border/50" />

          {/* Technicians */}
          <div className="space-y-4">
            <Label className="form-label">Technicians</Label>
            
            {/* Existing Technicians */}
            {formData.technicians.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.technicians.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTechnician(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Technician */}
            <div className="flex gap-2">
              <Input
                value={newTechnician}
                onChange={(e) => setNewTechnician(e.target.value)}
                placeholder="Technician name"
                className="bg-secondary border-border"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnician())}
                data-testid="technician-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTechnician}
                data-testid="add-technician-btn"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="repair-form-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="repair-form-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {repair ? 'Update Repair' : 'Save Repair'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RepairFormDialog;
