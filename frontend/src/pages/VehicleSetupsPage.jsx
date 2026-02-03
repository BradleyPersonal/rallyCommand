import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import SetupFormDialog from '@/components/SetupFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Plus,
  Car,
  Hash,
  Settings,
  Star,
  Calendar,
  MapPin,
  MoreHorizontal,
  Eye,
  Gauge
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function VehicleSetupsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState(null);
  const [viewingSetup, setViewingSetup] = useState(null);

  useEffect(() => {
    fetchVehicle();
    fetchSetups();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`${API}/vehicles/${id}`, {
        headers: getAuthHeader()
      });
      setVehicle(response.data);
    } catch (error) {
      toast.error('Vehicle not found');
      navigate('/garage');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetups = async () => {
    try {
      const response = await axios.get(`${API}/setups/vehicle/${id}`, {
        headers: getAuthHeader()
      });
      setSetups(response.data);
    } catch (error) {
      console.error('Failed to fetch setups');
    }
  };

  const handleSetupSaved = () => {
    setSetupDialogOpen(false);
    setEditingSetup(null);
    fetchSetups();
  };

  const handleDeleteSetup = async (setupId) => {
    if (!window.confirm('Are you sure you want to delete this setup?')) return;
    
    try {
      await axios.delete(`${API}/setups/${setupId}`, {
        headers: getAuthHeader()
      });
      toast.success('Setup deleted');
      fetchSetups();
    } catch (error) {
      toast.error('Failed to delete setup');
    }
  };

  const handleEditSetup = (setup) => {
    setEditingSetup(setup);
    setSetupDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full spinner" />
        </div>
      </Layout>
    );
  }

  if (!vehicle) return null;

  return (
    <Layout>
      <div className="space-y-6" data-testid="vehicle-setups-page">
        {/* Back Button */}
        <Link to={`/vehicle/${id}`}>
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Vehicle
          </Button>
        </Link>

        {/* Vehicle Header with Photo */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Vehicle Photo */}
          <div className="w-full md:w-64 h-48 bg-secondary/50 rounded-lg overflow-hidden flex-shrink-0">
            {vehicle.photo ? (
              <img 
                src={vehicle.photo} 
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              {vehicle.make}
            </h1>
            <p className="text-2xl text-primary font-medium">{vehicle.model}</p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              {vehicle.registration && (
                <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                  {vehicle.registration}
                </Badge>
              )}
              {vehicle.vin && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono">{vehicle.vin}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Setups Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl tracking-tight uppercase flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              All Setups
            </h2>
            <p className="text-muted-foreground mt-1">
              {setups.length} setup{setups.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingSetup(null);
              setSetupDialogOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="add-setup-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setup
          </Button>
        </div>

        {/* Setups Grid */}
        {setups.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Gauge className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No setups saved yet</p>
              <p className="text-sm mt-1">
                Create your first setup to track suspension, aero, and more
              </p>
              <Button 
                onClick={() => setSetupDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setups.map((setup, index) => (
              <Card 
                key={setup.id}
                className="bg-card border-border/50 hover:border-primary/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`setup-card-${setup.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl tracking-tight uppercase">
                        {setup.name}
                      </CardTitle>
                      {setup.rating > 0 && (
                        <div className="mt-1">
                          {renderStars(setup.rating)}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setViewingSetup(setup)}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEditSetup(setup)}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSetup(setup.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Event Info */}
                  {(setup.event_name || setup.event_date) && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      {setup.event_name && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{setup.event_name}</span>
                        </div>
                      )}
                      {setup.event_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(setup.event_date)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator className="bg-border/50" />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-secondary/30 rounded-sm">
                      <p className="text-muted-foreground">Tyre Pressure (F)</p>
                      <p className="font-mono text-foreground">
                        {setup.tyre_pressure_fl}/{setup.tyre_pressure_fr} psi
                      </p>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-sm">
                      <p className="text-muted-foreground">Tyre Pressure (R)</p>
                      <p className="font-mono text-foreground">
                        {setup.tyre_pressure_rl}/{setup.tyre_pressure_rr} psi
                      </p>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-sm">
                      <p className="text-muted-foreground">Camber</p>
                      <p className="font-mono text-foreground">
                        F: {setup.camber_front}° / R: {setup.camber_rear}°
                      </p>
                    </div>
                    <div className="p-2 bg-secondary/30 rounded-sm">
                      <p className="text-muted-foreground">Ride Height</p>
                      <p className="font-mono text-foreground">
                        F: {setup.ride_height_fl}mm / R: {setup.ride_height_rl}mm
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setViewingSetup(setup)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Setup
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Setup Form Dialog */}
      <SetupFormDialog
        open={setupDialogOpen}
        onClose={() => {
          setSetupDialogOpen(false);
          setEditingSetup(null);
        }}
        onSaved={handleSetupSaved}
        setup={editingSetup}
        vehicleId={id}
      />

      {/* Setup View Dialog */}
      {viewingSetup && (
        <SetupViewDialog
          setup={viewingSetup}
          onClose={() => setViewingSetup(null)}
          onEdit={() => {
            setViewingSetup(null);
            handleEditSetup(viewingSetup);
          }}
        />
      )}
    </Layout>
  );
}

// Setup View Dialog Component
function SetupViewDialog({ setup, onClose, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={!!setup} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl tracking-tight uppercase">
              {setup.name}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          {setup.rating > 0 && (
            <div className="mt-2">{renderStars(setup.rating)}</div>
          )}
          {setup.event_name && (
            <p className="text-muted-foreground mt-1">{setup.event_name}</p>
          )}
          {setup.event_date && (
            <p className="text-sm text-muted-foreground">{formatDate(setup.event_date)}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Tyre Pressures */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Tyre Pressures (psi)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Front Left</p>
                <p className="text-xl font-mono text-foreground">{setup.tyre_pressure_fl}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Front Right</p>
                <p className="text-xl font-mono text-foreground">{setup.tyre_pressure_fr}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Rear Left</p>
                <p className="text-xl font-mono text-foreground">{setup.tyre_pressure_rl}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Rear Right</p>
                <p className="text-xl font-mono text-foreground">{setup.tyre_pressure_rr}</p>
              </div>
            </div>
          </div>

          {/* Ride Height */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Ride Height (mm)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Front Left</p>
                <p className="text-xl font-mono text-foreground">{setup.ride_height_fl}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Front Right</p>
                <p className="text-xl font-mono text-foreground">{setup.ride_height_fr}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Rear Left</p>
                <p className="text-xl font-mono text-foreground">{setup.ride_height_rl}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Rear Right</p>
                <p className="text-xl font-mono text-foreground">{setup.ride_height_rr}</p>
              </div>
            </div>
          </div>

          {/* Suspension Geometry */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Suspension Geometry
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Front Camber</p>
                <p className="text-xl font-mono text-foreground">{setup.camber_front}°</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Rear Camber</p>
                <p className="text-xl font-mono text-foreground">{setup.camber_rear}°</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Front Toe</p>
                <p className="text-xl font-mono text-foreground">{setup.toe_front}°</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-sm">
                <p className="text-xs text-muted-foreground">Rear Toe</p>
                <p className="text-xl font-mono text-foreground">{setup.toe_rear}°</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {setup.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
                Notes
              </h4>
              <p className="text-foreground">{setup.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
