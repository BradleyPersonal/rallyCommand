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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Settings, Star, Cloud, Circle, LayoutList, LayoutGrid } from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const CONDITION_OPTIONS = [
  { value: 'sunny', label: 'Sunny' },
  { value: 'dry', label: 'Dry' },
  { value: 'raining', label: 'Raining' },
  { value: 'wet', label: 'Wet' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'dusty', label: 'Dusty' },
  { value: 'muddy', label: 'Muddy' },
  { value: 'snow', label: 'Snow/Ice' },
];

const TYRE_COMPOUND_OPTIONS = [
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const TYRE_CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'roaded', label: 'Roaded' },
  { value: 'used', label: 'Used' },
  { value: 'worn', label: 'Worn' },
];

export const SetupFormDialog = ({ open, onClose, onSaved, setup, vehicleId, vehicles, preselectedVehicleId }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId || preselectedVehicleId || '');
  const [templateMode, setTemplateMode] = useState('basic'); // 'basic' or 'advanced'
  const isEditing = !!setup; // Only show rating when editing an existing setup
  const showVehicleSelector = !vehicleId && vehicles && vehicles.length > 0;
  const [formData, setFormData] = useState({
    name: '',
    conditions: '',
    tyre_compound: '',
    tyre_type: '',
    tyre_size: '',
    tyre_condition: '',
    tyre_pressure_fl: 0,
    tyre_pressure_fr: 0,
    tyre_pressure_rl: 0,
    tyre_pressure_rr: 0,
    ride_height_fl: 0,
    ride_height_fr: 0,
    ride_height_rl: 0,
    ride_height_rr: 0,
    camber_front: 0,
    camber_rear: 0,
    toe_front: 0,
    toe_rear: 0,
    spring_rate_front: 0,
    spring_rate_rear: 0,
    damper_front: 0,
    damper_rear: 0,
    arb_front: 0,
    arb_rear: 0,
    aero_front: '',
    aero_rear: '',
    event_name: '',
    event_date: '',
    rating: 0,
    notes: ''
  });

  // Check if a setup has any advanced fields populated
  const hasAdvancedFields = (s) => {
    if (!s) return false;
    return (
      s.ride_height_fl > 0 || s.ride_height_fr > 0 || s.ride_height_rl > 0 || s.ride_height_rr > 0 ||
      s.camber_front !== 0 || s.camber_rear !== 0 ||
      s.toe_front !== 0 || s.toe_rear !== 0 ||
      s.spring_rate_front > 0 || s.spring_rate_rear > 0 ||
      s.damper_front > 0 || s.damper_rear > 0 ||
      s.arb_front > 0 || s.arb_rear > 0 ||
      (s.aero_front && s.aero_front !== '') || (s.aero_rear && s.aero_rear !== '')
    );
  };

  useEffect(() => {
    if (setup) {
      setFormData({
        name: setup.name || '',
        conditions: setup.conditions || '',
        tyre_compound: setup.tyre_compound || '',
        tyre_type: setup.tyre_type || '',
        tyre_size: setup.tyre_size || '',
        tyre_condition: setup.tyre_condition || '',
        tyre_pressure_fl: setup.tyre_pressure_fl || 0,
        tyre_pressure_fr: setup.tyre_pressure_fr || 0,
        tyre_pressure_rl: setup.tyre_pressure_rl || 0,
        tyre_pressure_rr: setup.tyre_pressure_rr || 0,
        ride_height_fl: setup.ride_height_fl || 0,
        ride_height_fr: setup.ride_height_fr || 0,
        ride_height_rl: setup.ride_height_rl || 0,
        ride_height_rr: setup.ride_height_rr || 0,
        camber_front: setup.camber_front || 0,
        camber_rear: setup.camber_rear || 0,
        toe_front: setup.toe_front || 0,
        toe_rear: setup.toe_rear || 0,
        spring_rate_front: setup.spring_rate_front || 0,
        spring_rate_rear: setup.spring_rate_rear || 0,
        damper_front: setup.damper_front || 0,
        damper_rear: setup.damper_rear || 0,
        arb_front: setup.arb_front || 0,
        arb_rear: setup.arb_rear || 0,
        aero_front: setup.aero_front || '',
        aero_rear: setup.aero_rear || '',
        event_name: setup.event_name || '',
        event_date: setup.event_date || '',
        rating: setup.rating || 0,
        notes: setup.notes || ''
      });
      setSelectedVehicleId(setup.vehicle_id || vehicleId || preselectedVehicleId || '');
      // Set mode based on whether setup has advanced fields
      setTemplateMode(hasAdvancedFields(setup) ? 'advanced' : 'basic');
    } else {
      setFormData({
        name: '',
        conditions: '',
        tyre_compound: '',
        tyre_type: '',
        tyre_size: '',
        tyre_condition: '',
        tyre_pressure_fl: 0,
        tyre_pressure_fr: 0,
        tyre_pressure_rl: 0,
        tyre_pressure_rr: 0,
        ride_height_fl: 0,
        ride_height_fr: 0,
        ride_height_rl: 0,
        ride_height_rr: 0,
        camber_front: 0,
        camber_rear: 0,
        toe_front: 0,
        toe_rear: 0,
        spring_rate_front: 0,
        spring_rate_rear: 0,
        damper_front: 0,
        damper_rear: 0,
        arb_front: 0,
        arb_rear: 0,
        aero_front: '',
        aero_rear: '',
        event_name: '',
        event_date: '',
        rating: 0,
        notes: ''
      });
      setSelectedVehicleId(vehicleId || preselectedVehicleId || '');
      // Default to basic mode for new setups
      setTemplateMode('basic');
    }
  }, [setup, open, vehicleId, preselectedVehicleId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Setup name is required');
      return;
    }

    // Determine the vehicle ID to use
    const effectiveVehicleId = vehicleId || selectedVehicleId;

    // Validate vehicleId for new setups
    if (!setup && !effectiveVehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    setLoading(true);
    try {
      if (setup) {
        await axios.put(`${API}/setups/${setup.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Setup updated successfully');
      } else {
        // For new setups, don't include rating (user rates after testing)
        const { rating, ...newSetupData } = formData;
        const payload = {
          ...newSetupData,
          rating: 0, // Always start with 0 rating for new setups
          vehicle_id: effectiveVehicleId
        };
        console.log('Creating setup with payload:', payload);
        await axios.post(`${API}/setups`, payload, {
          headers: getAuthHeader()
        });
        toast.success('Setup created successfully');
      }
      onSaved();
    } catch (error) {
      console.error('Setup save error:', error.response?.data || error);
      const errorMessage = error.response?.data?.detail || 'Failed to save setup';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto" data-testid="setup-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            {setup ? 'Edit Setup' : 'New Setup'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Template Mode Toggle */}
          <div className="flex items-center justify-center gap-3 p-2 bg-secondary/30 rounded-xl border border-border/50" data-testid="template-toggle">
            <button
              type="button"
              onClick={() => setTemplateMode('basic')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg text-sm font-medium transition-all border-2 ${
                templateMode === 'basic'
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
              data-testid="template-basic-btn"
            >
              <LayoutList className="w-5 h-5" />
              <span className="font-semibold">Basic</span>
              <span className="text-xs opacity-70">Event, Tyres & Pressures</span>
            </button>
            <div className="h-12 w-px bg-border/50" />
            <button
              type="button"
              onClick={() => setTemplateMode('advanced')}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg text-sm font-medium transition-all border-2 ${
                templateMode === 'advanced'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm'
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
              data-testid="template-advanced-btn"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="font-semibold">Advanced</span>
              <span className="text-xs opacity-70">Full Setup Details</span>
            </button>
          </div>

          {/* Vehicle Selector (only when vehicles prop is provided and no vehicleId) */}
          {showVehicleSelector && (
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="form-label">Vehicle *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger className="bg-secondary border-border" data-testid="setup-vehicle-select">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name" className="form-label">Setup Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Wet Gravel Setup"
                className="bg-secondary border-border focus:border-primary"
                data-testid="setup-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_name" className="form-label">Event / Location</Label>
              <Input
                id="event_name"
                value={formData.event_name}
                onChange={(e) => handleChange('event_name', e.target.value)}
                placeholder="e.g., Wales Rally GB"
                className="bg-secondary border-border focus:border-primary"
                data-testid="setup-event-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date" className="form-label">Date Used</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleChange('event_date', e.target.value)}
                className="bg-secondary border-border focus:border-primary"
                data-testid="setup-date-input"
              />
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label htmlFor="conditions" className="form-label flex items-center gap-2">
                <Cloud className="w-4 h-4 text-primary" />
                Conditions
              </Label>
              <Select
                value={formData.conditions}
                onValueChange={(value) => handleChange('conditions', value)}
              >
                <SelectTrigger className="bg-secondary border-border focus:border-primary" data-testid="setup-conditions-select">
                  <SelectValue placeholder="Select weather/track conditions" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating - Only show when editing an existing setup */}
            {isEditing && (
              <div className="col-span-2 space-y-2">
                <Label className="form-label">Rating</Label>
                <p className="text-xs text-muted-foreground mb-2">Rate this setup after testing it on track</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleChange('rating', formData.rating === star ? 0 : star)}
                      className="p-1 hover:scale-110 transition-transform"
                      data-testid={`rating-star-${star}`}
                    >
                      <Star
                        className={`w-8 h-8 ${star <= formData.rating ? 'fill-accent text-accent' : 'text-muted-foreground hover:text-accent'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/50" />

          {/* Tyre Information */}
          <div>
            <Label className="form-label mb-3 block flex items-center gap-2">
              <Circle className="w-4 h-4 text-primary" />
              Tyre Information
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tyre Compound</Label>
                <Select
                  value={formData.tyre_compound}
                  onValueChange={(value) => handleChange('tyre_compound', value)}
                >
                  <SelectTrigger className="bg-secondary border-border focus:border-primary" data-testid="tyre-compound-select">
                    <SelectValue placeholder="Select compound" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYRE_COMPOUND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tyre Condition</Label>
                <Select
                  value={formData.tyre_condition}
                  onValueChange={(value) => handleChange('tyre_condition', value)}
                >
                  <SelectTrigger className="bg-secondary border-border focus:border-primary" data-testid="tyre-condition-select">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYRE_CONDITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tyre Type</Label>
                <Input
                  value={formData.tyre_type}
                  onChange={(e) => handleChange('tyre_type', e.target.value)}
                  placeholder="e.g., Slick, Wet, Gravel"
                  className="bg-secondary border-border focus:border-primary"
                  data-testid="tyre-type-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tyre Size</Label>
                <Input
                  value={formData.tyre_size}
                  onChange={(e) => handleChange('tyre_size', e.target.value)}
                  placeholder="e.g., 205/65R15"
                  className="bg-secondary border-border focus:border-primary"
                  data-testid="tyre-size-input"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Tyre Pressures */}
          <div>
            <Label className="form-label mb-3 block">Tyre Pressures (psi)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.tyre_pressure_fl}
                  onChange={(e) => handleNumberChange('tyre_pressure_fl', e.target.value)}
                  placeholder="FL"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="tyre-fl-input"
                />
                <p className="text-xs text-muted-foreground text-center">Front Left</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.tyre_pressure_fr}
                  onChange={(e) => handleNumberChange('tyre_pressure_fr', e.target.value)}
                  placeholder="FR"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="tyre-fr-input"
                />
                <p className="text-xs text-muted-foreground text-center">Front Right</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.tyre_pressure_rl}
                  onChange={(e) => handleNumberChange('tyre_pressure_rl', e.target.value)}
                  placeholder="RL"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="tyre-rl-input"
                />
                <p className="text-xs text-muted-foreground text-center">Rear Left</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.tyre_pressure_rr}
                  onChange={(e) => handleNumberChange('tyre_pressure_rr', e.target.value)}
                  placeholder="RR"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="tyre-rr-input"
                />
                <p className="text-xs text-muted-foreground text-center">Rear Right</p>
              </div>
            </div>
          </div>

          {/* Advanced Mode Only Sections */}
          {(templateMode === 'advanced' || isEditing) && (
            <>
              <Separator className="bg-border/50" />

              {/* Ride Height */}
              <div>
            <Label className="form-label mb-3 block">Ride Height (mm)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.5"
                  value={formData.ride_height_fl}
                  onChange={(e) => handleNumberChange('ride_height_fl', e.target.value)}
                  placeholder="FL"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="height-fl-input"
                />
                <p className="text-xs text-muted-foreground text-center">Front Left</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.5"
                  value={formData.ride_height_fr}
                  onChange={(e) => handleNumberChange('ride_height_fr', e.target.value)}
                  placeholder="FR"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="height-fr-input"
                />
                <p className="text-xs text-muted-foreground text-center">Front Right</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.5"
                  value={formData.ride_height_rl}
                  onChange={(e) => handleNumberChange('ride_height_rl', e.target.value)}
                  placeholder="RL"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="height-rl-input"
                />
                <p className="text-xs text-muted-foreground text-center">Rear Left</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.5"
                  value={formData.ride_height_rr}
                  onChange={(e) => handleNumberChange('ride_height_rr', e.target.value)}
                  placeholder="RR"
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="height-rr-input"
                />
                <p className="text-xs text-muted-foreground text-center">Rear Right</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Geometry */}
          <div>
            <Label className="form-label mb-3 block">Geometry (degrees)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Front Camber</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.camber_front}
                  onChange={(e) => handleNumberChange('camber_front', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="camber-front-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rear Camber</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.camber_rear}
                  onChange={(e) => handleNumberChange('camber_rear', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="camber-rear-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Front Toe</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.toe_front}
                  onChange={(e) => handleNumberChange('toe_front', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="toe-front-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rear Toe</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.toe_rear}
                  onChange={(e) => handleNumberChange('toe_rear', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="toe-rear-input"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Suspension */}
          <div>
            <Label className="form-label mb-3 block">Suspension</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Front Spring Rate (N/mm)</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.spring_rate_front}
                  onChange={(e) => handleNumberChange('spring_rate_front', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="spring-front-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rear Spring Rate (N/mm)</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.spring_rate_rear}
                  onChange={(e) => handleNumberChange('spring_rate_rear', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="spring-rear-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Front Damper Setting</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.damper_front}
                  onChange={(e) => handleNumberChange('damper_front', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="damper-front-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rear Damper Setting</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.damper_rear}
                  onChange={(e) => handleNumberChange('damper_rear', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="damper-rear-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Front ARB Setting</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.arb_front}
                  onChange={(e) => handleNumberChange('arb_front', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="arb-front-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rear ARB Setting</Label>
                <Input
                  type="number"
                  step="1"
                  value={formData.arb_rear}
                  onChange={(e) => handleNumberChange('arb_rear', e.target.value)}
                  className="bg-secondary border-border focus:border-primary font-mono"
                  data-testid="arb-rear-input"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Aero */}
          <div>
            <Label className="form-label mb-3 block">Aerodynamics</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Front Aero</Label>
                <Input
                  value={formData.aero_front}
                  onChange={(e) => handleChange('aero_front', e.target.value)}
                  placeholder="e.g., Splitter position 2"
                  className="bg-secondary border-border focus:border-primary"
                  data-testid="aero-front-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Rear Aero</Label>
                <Input
                  value={formData.aero_rear}
                  onChange={(e) => handleChange('aero_rear', e.target.value)}
                  placeholder="e.g., Wing angle 12°"
                  className="bg-secondary border-border focus:border-primary"
                  data-testid="aero-rear-input"
                />
              </div>
            </div>
          </div>
            </>
          )}

          <Separator className="bg-border/50" />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="form-label">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this setup..."
              className="bg-secondary border-border focus:border-primary resize-none h-24"
              data-testid="setup-notes-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="setup-form-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="setup-form-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {setup ? 'Update Setup' : 'Save Setup'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetupFormDialog;
