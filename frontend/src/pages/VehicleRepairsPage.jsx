import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
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
  Wrench,
  AlertTriangle,
  DollarSign,
  Users,
  MoreHorizontal,
  Calendar
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function VehicleRepairsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);

  useEffect(() => {
    fetchVehicle();
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

  const handleRepairSaved = () => {
    setRepairDialogOpen(false);
    setEditingRepair(null);
    fetchRepairs();
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
      <div className="space-y-6" data-testid="vehicle-repairs-page">
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

        {/* Repairs Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl tracking-tight uppercase flex items-center gap-2">
              <Wrench className="w-6 h-6 text-accent" />
              All Repairs
            </h2>
            <p className="text-muted-foreground mt-1">
              {repairs.length} repair{repairs.length !== 1 ? 's' : ''} logged
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingRepair(null);
              setRepairDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid="add-repair-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Repair
          </Button>
        </div>

        {/* Repairs Grid */}
        {repairs.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No repairs logged</p>
              <p className="text-sm mt-1">
                Track repairs and maintenance for this vehicle
              </p>
              <Button 
                onClick={() => setRepairDialogOpen(true)}
                className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log First Repair
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repairs.map((repair, index) => (
              <Card 
                key={repair.id}
                className="bg-card border-border/50 hover:border-accent/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`repair-card-${repair.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-accent" />
                        <CardTitle className="text-lg tracking-tight">
                          {repair.cause_of_damage}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(repair.created_at)}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEditRepair(repair)}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRepair(repair.id)}
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
                  {repair.affected_area && (
                    <p className="text-sm text-primary">Area: {repair.affected_area}</p>
                  )}
                  
                  {repair.repair_details && (
                    <p className="text-sm text-muted-foreground">{repair.repair_details}</p>
                  )}

                  <Separator className="bg-border/50" />

                  {/* Parts Used */}
                  {repair.parts_used && repair.parts_used.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">Parts Used</p>
                      <div className="flex flex-wrap gap-2">
                        {repair.parts_used.map((part, i) => (
                          <Badge 
                            key={i} 
                            variant={part.source === 'inventory' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {part.name} x{part.quantity}
                            {part.cost > 0 && ` (${formatCurrency(part.cost)})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {/* Total Cost */}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="text-foreground font-mono">
                        {formatCurrency(repair.total_parts_cost)}
                      </span>
                    </div>

                    {/* Technicians */}
                    {repair.technicians && repair.technicians.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{repair.technicians.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Repair Form Dialog */}
      <RepairFormDialog
        open={repairDialogOpen}
        onClose={() => {
          setRepairDialogOpen(false);
          setEditingRepair(null);
        }}
        onSaved={handleRepairSaved}
        repair={editingRepair}
        vehicles={vehicle ? [vehicle] : []}
      />
    </Layout>
  );
}
