import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import VehicleFormDialog from '@/components/VehicleFormDialog';
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
  Car,
  MoreHorizontal,
  Pencil,
  Trash2,
  Hash,
  FileText
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function GaragePage() {
  const { getAuthHeader } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`, {
        headers: getAuthHeader()
      });
      setVehicles(response.data);
    } catch (error) {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? Parts will be unlinked from this vehicle.')) return;
    
    try {
      await axios.delete(`${API}/vehicles/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingVehicle(null);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchVehicles();
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
      <div className="space-y-6" data-testid="garage-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Garage
            </h1>
            <p className="text-muted-foreground mt-1">
              {vehicles.length} of 2 vehicle slots used
            </p>
          </div>
          {vehicles.length < 2 && (
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider"
              data-testid="add-vehicle-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          )}
        </div>

        {/* Vehicles Grid */}
        {vehicles.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No vehicles in your garage</p>
              <p className="text-sm mt-1">
                Add up to 2 vehicles to track parts for each
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="mt-4"
                data-testid="empty-add-vehicle-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((vehicle, index) => (
              <Card 
                key={vehicle.id}
                className="bg-card border-border/50 overflow-hidden animate-fade-in hover:border-primary/50 transition-colors group"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`vehicle-card-${vehicle.id}`}
              >
                {/* Vehicle Photo - Clickable */}
                <Link to={`/vehicle/${vehicle.id}`}>
                  {vehicle.photo ? (
                    <div className="h-48 bg-secondary overflow-hidden cursor-pointer">
                      <img 
                        src={vehicle.photo} 
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-secondary/50 flex items-center justify-center cursor-pointer group-hover:bg-secondary/70 transition-colors">
                      <Car className="w-16 h-16 text-muted-foreground/50" />
                    </div>
                  )}
                </Link>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Link to={`/vehicle/${vehicle.id}`} className="flex-1">
                      <CardTitle className="text-2xl tracking-tight uppercase cursor-pointer hover:text-primary transition-colors">
                        {vehicle.make}
                      </CardTitle>
                      <p className="text-lg text-primary font-medium">
                        {vehicle.model}
                      </p>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`vehicle-menu-${vehicle.id}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(vehicle)} className="cursor-pointer" data-testid={`edit-vehicle-${vehicle.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(vehicle.id)} 
                          className="cursor-pointer text-destructive focus:text-destructive"
                          data-testid={`delete-vehicle-${vehicle.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Registration */}
                  {vehicle.registration && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                        {vehicle.registration}
                      </Badge>
                    </div>
                  )}

                  {/* VIN */}
                  {vehicle.vin && (
                    <div className="flex items-start gap-2 text-sm">
                      <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase">VIN</p>
                        <p className="font-mono text-foreground text-xs">{vehicle.vin}</p>
                      </div>
                    </div>
                  )}

                  {/* View Setups Link */}
                  <Link to={`/vehicle/${vehicle.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      data-testid={`view-setups-${vehicle.id}`}
                    >
                      View Setups
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}

            {/* Add Vehicle Placeholder */}
            {vehicles.length < 2 && (
              <Card 
                className="bg-card/50 border-border/30 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setDialogOpen(true)}
                data-testid="add-vehicle-placeholder"
              >
                <CardContent className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                  <Plus className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg">Add Another Vehicle</p>
                  <p className="text-sm">1 slot remaining</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Vehicle Dialog */}
      <VehicleFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        vehicle={editingVehicle}
      />
    </Layout>
  );
}
