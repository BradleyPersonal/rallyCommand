import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import RepairFormDialog from '@/components/RepairFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Plus, 
  Wrench,
  MoreHorizontal,
  Pencil,
  Trash2,
  Car,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function RepairsPage() {
  const { getAuthHeader } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        toast.error('Please log in to view repairs');
        setLoading(false);
        return;
      }
      
      // Fetch vehicles and repairs separately to handle partial failures
      let vehiclesData = [];
      let repairsData = [];
      
      try {
        const vehiclesRes = await axios.get(`${API}/vehicles`, { headers });
        vehiclesData = vehiclesRes.data;
      } catch (vErr) {
        console.error('Failed to fetch vehicles:', vErr);
        toast.error('Failed to load vehicles');
      }
      
      try {
        const repairsRes = await axios.get(`${API}/repairs`, { headers });
        repairsData = repairsRes.data;
      } catch (rErr) {
        console.error('Failed to fetch repairs:', rErr);
        toast.error('Failed to load repairs');
      }
      
      setVehicles(vehiclesData);
      setRepairs(repairsData);
      
      // If both failed, show error state
      if (vehiclesData.length === 0 && repairsData.length === 0) {
        // Check if it's a real empty state or an error
        // If the user has no vehicles, that's fine - show the empty state
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(true);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to fetch data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this repair log?')) return;
    
    try {
      await axios.delete(`${API}/repairs/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Repair log deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete repair log');
    }
  };

  const handleEdit = (repair) => {
    setEditingRepair(repair);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRepair(null);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchData();
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
  };

  const formatDate = (dateString) => {
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

  return (
    <Layout>
      <div className="space-y-6" data-testid="repairs-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Repair Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              {repairs.length} repair{repairs.length !== 1 ? 's' : ''} logged
            </p>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider"
            data-testid="add-repair-btn"
            disabled={vehicles.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Repair
          </Button>
        </div>

        {vehicles.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No vehicles in your garage</p>
              <p className="text-sm mt-1">
                Add a vehicle first before logging repairs
              </p>
              <Link to="/garage">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : repairs.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No repairs logged</p>
              <p className="text-sm mt-1">
                Start tracking your vehicle repairs
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="mt-4"
                data-testid="empty-add-repair-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log First Repair
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {repairs.map((repair, index) => (
              <Card 
                key={repair.id}
                className="bg-card border-border/50 hover:border-primary/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`repair-card-${repair.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="font-medium">
                          <Car className="w-3 h-3 mr-1" />
                          {getVehicleName(repair.vehicle_id)}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(repair.created_at)}
                        </span>
                      </div>
                      <CardTitle className="text-xl tracking-tight flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-accent" />
                        {repair.cause_of_damage}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEdit(repair)}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(repair.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Repair Details */}
                  {repair.repair_details && (
                    <p className="text-sm text-foreground">{repair.repair_details}</p>
                  )}

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
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
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

      {/* Add/Edit Repair Dialog */}
      <RepairFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        repair={editingRepair}
        vehicles={vehicles}
      />
    </Layout>
  );
}
