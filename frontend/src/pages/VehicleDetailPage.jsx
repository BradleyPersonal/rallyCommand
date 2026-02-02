import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import VehicleFormDialog from '@/components/VehicleFormDialog';
import SetupFormDialog from '@/components/SetupFormDialog';
import RepairFormDialog from '@/components/RepairFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Gauge,
  Wrench,
  AlertTriangle,
  DollarSign,
  Users
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [setups, setSetups] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState(null);
  const [editingRepair, setEditingRepair] = useState(null);
  const [viewingSetup, setViewingSetup] = useState(null);

  useEffect(() => {
    fetchVehicle();
    fetchSetups();
    fetchRepairs();
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

  const fetchRepairs = async () => {
    try {
      const response = await axios.get(`${API}/repairs/vehicle/${id}`, {
        headers: getAuthHeader()
      });
      setRepairs(response.data);
    } catch (error) {
      console.error('Failed to fetch repairs');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle? All setups and repairs will also be deleted.')) return;
    
    try {
      await axios.delete(`${API}/vehicles/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Vehicle deleted');
      navigate('/garage');
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleEditSaved = () => {
    setEditDialogOpen(false);
    fetchVehicle();
  };

  const handleSetupSaved = () => {
    setSetupDialogOpen(false);
    setEditingSetup(null);
    fetchSetups();
  };

  const handleRepairSaved = () => {
    setRepairDialogOpen(false);
    setEditingRepair(null);
    fetchRepairs();
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

  const handleDeleteRepair = async (repairId) => {
    if (!window.confirm('Are you sure you want to delete this repair log?')) return;
    
    try {
      await axios.delete(`${API}/repairs/${repairId}`, {
        headers: getAuthHeader()
      });
      toast.success('Repair deleted');
      fetchRepairs();
    } catch (error) {
      toast.error('Failed to delete repair');
    }
  };

  const handleEditSetup = (setup) => {
    setEditingSetup(setup);
    setSetupDialogOpen(true);
  };

  const handleEditRepair = (repair) => {
    setEditingRepair(repair);
    setRepairDialogOpen(true);
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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
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
      <div className="space-y-6" data-testid="vehicle-detail-page">
        {/* Back Button */}
        <Link to="/garage">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="back-to-garage-btn">
            <ArrowLeft className="w-4 h-4" />
            Back to Garage
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            {vehicle.photo ? (
              <div className="w-24 h-24 rounded-sm overflow-hidden border border-border flex-shrink-0">
                <img 
                  src={vehicle.photo} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-secondary rounded-sm flex items-center justify-center flex-shrink-0">
                <Car className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl tracking-tighter uppercase text-foreground">
                {vehicle.make}
              </h1>
              <p className="text-xl text-primary font-medium">{vehicle.model}</p>
              <div className="flex items-center gap-3 mt-2">
                {vehicle.registration && (
                  <Badge variant="secondary" className="font-mono">
                    {vehicle.registration}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              data-testid="edit-vehicle-btn"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-testid="delete-vehicle-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Vehicle Info */}
        {vehicle.vin && (
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground tracking-widest uppercase">VIN</span>
                <span className="font-mono text-sm text-foreground">{vehicle.vin}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setups Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl tracking-tight uppercase flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Vehicle Setups
            </h2>
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

          {setups.length === 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Gauge className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No setups saved yet</p>
                <p className="text-sm mt-1">
                  Create your first setup to track suspension, aero, and more
                </p>
                <Button 
                  onClick={() => setSetupDialogOpen(true)}
                  className="mt-4"
                  data-testid="empty-add-setup-btn"
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
                      data-testid={`view-setup-${setup.id}`}
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
      </div>

      {/* Edit Vehicle Dialog */}
      <VehicleFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSaved={handleEditSaved}
        vehicle={vehicle}
      />

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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <Card 
        className="bg-card border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl tracking-tight uppercase">
                {setup.name}
              </CardTitle>
              {setup.rating > 0 && (
                <div className="mt-2">
                  {renderStars(setup.rating)}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          {(setup.event_name || setup.event_date) && (
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {setup.event_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{setup.event_name}</span>
                </div>
              )}
              {setup.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(setup.event_date)}</span>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tyre Pressures */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Tyre Pressures (psi)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Left</span>
                  <span className="font-mono text-foreground">{setup.tyre_pressure_fl}</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Left</span>
                  <span className="font-mono text-foreground">{setup.tyre_pressure_rl}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Right</span>
                  <span className="font-mono text-foreground">{setup.tyre_pressure_fr}</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Right</span>
                  <span className="font-mono text-foreground">{setup.tyre_pressure_rr}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Ride Height */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Ride Height (mm)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Left</span>
                  <span className="font-mono text-foreground">{setup.ride_height_fl}</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Left</span>
                  <span className="font-mono text-foreground">{setup.ride_height_rl}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Right</span>
                  <span className="font-mono text-foreground">{setup.ride_height_fr}</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Right</span>
                  <span className="font-mono text-foreground">{setup.ride_height_rr}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Geometry */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Suspension Geometry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Camber</span>
                  <span className="font-mono text-foreground">{setup.camber_front}°</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Camber</span>
                  <span className="font-mono text-foreground">{setup.camber_rear}°</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Toe</span>
                  <span className="font-mono text-foreground">{setup.toe_front}°</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Toe</span>
                  <span className="font-mono text-foreground">{setup.toe_rear}°</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Suspension */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Suspension Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Springs</span>
                  <span className="font-mono text-foreground">{setup.spring_rate_front} N/mm</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Springs</span>
                  <span className="font-mono text-foreground">{setup.spring_rate_rear} N/mm</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Front Dampers</span>
                  <span className="font-mono text-foreground">{setup.damper_front}</span>
                </div>
                <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                  <span className="text-muted-foreground">Rear Dampers</span>
                  <span className="font-mono text-foreground">{setup.damper_rear}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                <span className="text-muted-foreground">Front ARB</span>
                <span className="font-mono text-foreground">{setup.arb_front}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary/30 rounded-sm">
                <span className="text-muted-foreground">Rear ARB</span>
                <span className="font-mono text-foreground">{setup.arb_rear}</span>
              </div>
            </div>
          </div>

          {/* Aero */}
          {(setup.aero_front || setup.aero_rear) && (
            <>
              <Separator className="bg-border/50" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
                  Aerodynamics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/30 rounded-sm">
                    <p className="text-muted-foreground text-sm">Front</p>
                    <p className="font-mono text-foreground">{setup.aero_front || '-'}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-sm">
                    <p className="text-muted-foreground text-sm">Rear</p>
                    <p className="font-mono text-foreground">{setup.aero_rear || '-'}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {setup.notes && (
            <>
              <Separator className="bg-border/50" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
                  Notes
                </h3>
                <p className="text-foreground whitespace-pre-wrap">{setup.notes}</p>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
