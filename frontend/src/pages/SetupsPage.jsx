import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useVehicleFilter } from '@/context/VehicleFilterContext';
import Layout from '@/components/Layout';
import SetupFormDialog from '@/components/SetupFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Settings,
  MoreHorizontal,
  Pencil,
  Trash2,
  Car,
  Calendar,
  Star,
  Search,
  Filter,
  Eye,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  GitCompare,
  Copy,
  X,
  Check,
  FolderOpen,
  ChevronDown,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter, DialogDescription } from '@/components/ui/dialog';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Condition icons mapping
const conditionIcons = {
  sunny: Sun,
  dry: Sun,
  raining: CloudRain,
  wet: Droplets,
  mixed: Cloud,
  dusty: Cloud,
  muddy: Droplets,
  'snow/ice': Cloud,
};

export default function SetupsPage() {
  const { getAuthHeader } = useAuth();
  const { selectedVehicle: globalVehicle } = useVehicleFilter();
  const [setups, setSetups] = useState([]);
  const [filteredSetups, setFilteredSetups] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSetup, setViewingSetup] = useState(null);
  
  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  
  // Duplicate state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicatingSetup, setDuplicatingSetup] = useState(null);
  const [duplicateName, setDuplicateName] = useState('');
  
  // Group state
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', track_name: '', date: '', vehicle_id: '' });
  const [preselectedGroupId, setPreselectedGroupId] = useState(null);

  // Sync local filter with global vehicle filter
  useEffect(() => {
    if (globalVehicle) {
      setSelectedVehicle(globalVehicle.id);
    } else {
      setSelectedVehicle('all');
    }
  }, [globalVehicle]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        toast.error('Please log in to view setups');
        setLoading(false);
        return;
      }
      
      let vehiclesData = [];
      let setupsData = [];
      let groupsData = [];
      
      try {
        const vehiclesRes = await axios.get(`${API}/vehicles`, { headers });
        vehiclesData = vehiclesRes.data;
      } catch (vErr) {
        console.error('Failed to fetch vehicles:', vErr);
      }
      
      // Fetch setups and groups for all vehicles
      for (const vehicle of vehiclesData) {
        try {
          const setupsRes = await axios.get(`${API}/setups/vehicle/${vehicle.id}`, { headers });
          setupsData = [...setupsData, ...setupsRes.data];
        } catch (sErr) {
          console.error(`Failed to fetch setups for vehicle ${vehicle.id}:`, sErr);
        }
        
        try {
          const groupsRes = await axios.get(`${API}/setup-groups/vehicle/${vehicle.id}`, { headers });
          groupsData = [...groupsData, ...groupsRes.data];
        } catch (gErr) {
          console.error(`Failed to fetch groups for vehicle ${vehicle.id}:`, gErr);
        }
      }
      
      // Sort by created_at descending
      setupsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      groupsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setVehicles(vehiclesData);
      setSetups(setupsData);
      setGroups(groupsData);
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
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter setups and groups based on vehicle and search
  useEffect(() => {
    let filteredS = setups;
    let filteredG = groups;
    
    // Filter by vehicle
    if (selectedVehicle !== 'all') {
      filteredS = filteredS.filter(s => s.vehicle_id === selectedVehicle);
      filteredG = filteredG.filter(g => g.vehicle_id === selectedVehicle);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredS = filteredS.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.event_name?.toLowerCase().includes(query) ||
        s.conditions?.toLowerCase().includes(query)
      );
      filteredG = filteredG.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.track_name?.toLowerCase().includes(query)
      );
    }
    
    // Only show ungrouped setups in main list (grouped ones show in group view)
    const ungroupedSetups = filteredS.filter(s => !s.group_id);
    
    setFilteredSetups(ungroupedSetups);
    setFilteredGroups(filteredG);
  }, [selectedVehicle, searchQuery, setups, groups]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this setup?')) return;
    
    try {
      await axios.delete(`${API}/setups/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Setup deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete setup');
    }
  };

  // Group handlers
  const openGroupDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        name: group.name,
        track_name: group.track_name || '',
        date: group.date || '',
        vehicle_id: group.vehicle_id
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({
        name: '',
        track_name: '',
        date: '',
        vehicle_id: selectedVehicle !== 'all' ? selectedVehicle : vehicles[0]?.id || ''
      });
    }
    setGroupDialogOpen(true);
  };

  const handleGroupSave = async () => {
    if (!groupFormData.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (!groupFormData.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }

    try {
      if (editingGroup) {
        await axios.put(`${API}/setup-groups/${editingGroup.id}`, {
          name: groupFormData.name,
          track_name: groupFormData.track_name,
          date: groupFormData.date
        }, { headers: getAuthHeader() });
        toast.success('Group updated');
      } else {
        await axios.post(`${API}/setup-groups`, groupFormData, {
          headers: getAuthHeader()
        });
        toast.success('Group created');
      }
      setGroupDialogOpen(false);
      setEditingGroup(null);
      fetchData();
    } catch (error) {
      toast.error(editingGroup ? 'Failed to update group' : 'Failed to create group');
    }
  };

  const handleGroupDelete = async (groupId) => {
    if (!window.confirm('Delete this group? Setups in this group will be ungrouped, not deleted.')) return;
    
    try {
      await axios.delete(`${API}/setup-groups/${groupId}`, {
        headers: getAuthHeader()
      });
      toast.success('Group deleted');
      setViewingGroup(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const getGroupSetups = (groupId) => {
    return setups.filter(s => s.group_id === groupId);
  };

  const addSetupToGroup = (groupId) => {
    setPreselectedGroupId(groupId);
    setDialogOpen(true);
  };

  const handleQuickRating = async (setupId, newRating, e) => {
    e.stopPropagation(); // Prevent card click
    try {
      await axios.put(`${API}/setups/${setupId}`, { rating: newRating }, {
        headers: getAuthHeader()
      });
      // Update local state immediately for better UX
      setSetups(prev => prev.map(s => 
        s.id === setupId ? { ...s, rating: newRating } : s
      ));
      toast.success('Rating updated');
    } catch (error) {
      toast.error('Failed to update rating');
    }
  };

  const handleEdit = (setup) => {
    setEditingSetup(setup);
    setPreselectedGroupId(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSetup(null);
    setPreselectedGroupId(null);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchData();
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';
  };

  // Compare mode handlers
  const toggleCompareMode = () => {
    if (compareMode) {
      setCompareMode(false);
      setSelectedForCompare([]);
    } else {
      setCompareMode(true);
      setSelectedForCompare([]);
    }
  };

  const handleCompareSelect = (setup, e) => {
    e.stopPropagation();
    
    // Check if already selected
    if (selectedForCompare.find(s => s.id === setup.id)) {
      setSelectedForCompare(prev => prev.filter(s => s.id !== setup.id));
      return;
    }
    
    // If already have 2 selected, remove the first one
    if (selectedForCompare.length >= 2) {
      setSelectedForCompare(prev => [...prev.slice(1), setup]);
      return;
    }
    
    // Check if from same vehicle (only if one is already selected)
    if (selectedForCompare.length === 1 && selectedForCompare[0].vehicle_id !== setup.vehicle_id) {
      toast.error('Can only compare setups from the same vehicle');
      return;
    }
    
    setSelectedForCompare(prev => [...prev, setup]);
  };

  const openCompareDialog = () => {
    if (selectedForCompare.length === 2) {
      setCompareDialogOpen(true);
    }
  };

  // Duplicate handlers
  const openDuplicateDialog = (setup) => {
    setDuplicatingSetup(setup);
    setDuplicateName(`${setup.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicate = async () => {
    if (!duplicatingSetup || !duplicateName.trim()) {
      toast.error('Please enter a name for the duplicate');
      return;
    }

    try {
      // Create duplicate setup data
      const duplicateData = {
        name: duplicateName.trim(),
        vehicle_id: duplicatingSetup.vehicle_id,
        conditions: duplicatingSetup.conditions || '',
        tyre_compound: duplicatingSetup.tyre_compound || '',
        tyre_type: duplicatingSetup.tyre_type || '',
        tyre_size: duplicatingSetup.tyre_size || '',
        tyre_condition: duplicatingSetup.tyre_condition || '',
        tyre_pressure_fl: duplicatingSetup.tyre_pressure_fl || 0,
        tyre_pressure_fr: duplicatingSetup.tyre_pressure_fr || 0,
        tyre_pressure_rl: duplicatingSetup.tyre_pressure_rl || 0,
        tyre_pressure_rr: duplicatingSetup.tyre_pressure_rr || 0,
        ride_height_fl: duplicatingSetup.ride_height_fl || 0,
        ride_height_fr: duplicatingSetup.ride_height_fr || 0,
        ride_height_rl: duplicatingSetup.ride_height_rl || 0,
        ride_height_rr: duplicatingSetup.ride_height_rr || 0,
        camber_front: duplicatingSetup.camber_front || 0,
        camber_rear: duplicatingSetup.camber_rear || 0,
        toe_front: duplicatingSetup.toe_front || 0,
        toe_rear: duplicatingSetup.toe_rear || 0,
        spring_rate_front: duplicatingSetup.spring_rate_front || 0,
        spring_rate_rear: duplicatingSetup.spring_rate_rear || 0,
        damper_front: duplicatingSetup.damper_front || 0,
        damper_rear: duplicatingSetup.damper_rear || 0,
        arb_front: duplicatingSetup.arb_front || 0,
        arb_rear: duplicatingSetup.arb_rear || 0,
        aero_front: duplicatingSetup.aero_front || '',
        aero_rear: duplicatingSetup.aero_rear || '',
        event_name: duplicatingSetup.event_name || '',
        event_date: duplicatingSetup.event_date || '',
        rating: 0, // Start fresh rating for duplicate
        notes: duplicatingSetup.notes || ''
      };

      const response = await axios.post(`${API}/setups`, duplicateData, {
        headers: getAuthHeader()
      });

      toast.success('Setup duplicated!');
      setDuplicateDialogOpen(false);
      setDuplicatingSetup(null);
      setDuplicateName('');
      setViewingSetup(null); // Close view dialog if open
      
      // Refresh and open the new setup for editing
      await fetchData();
      setEditingSetup(response.data);
      setDialogOpen(true);
    } catch (error) {
      toast.error('Failed to duplicate setup');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  const getConditionIcon = (conditions) => {
    if (!conditions) return null;
    const conditionLower = conditions.toLowerCase();
    for (const [key, Icon] of Object.entries(conditionIcons)) {
      if (conditionLower.includes(key)) {
        return <Icon className="w-4 h-4" />;
      }
    }
    return <Cloud className="w-4 h-4" />;
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

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Settings className="w-16 h-16 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">Failed to load data</p>
          <Button onClick={fetchData} className="mt-2">
            Try Again
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6" data-testid="setups-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Vehicle Setups
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              {filteredSetups.length} setup{filteredSetups.length !== 1 ? 's' : ''} {selectedVehicle !== 'all' || searchQuery ? 'found' : 'saved'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Compare Mode Toggle */}
            {setups.length >= 2 && (
              <Button 
                onClick={toggleCompareMode}
                variant={compareMode ? "default" : "outline"}
                className={`rounded-sm font-bold uppercase tracking-wider text-sm ${
                  compareMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
                }`}
                data-testid="compare-mode-btn"
              >
                {compareMode ? (
                  <>
                    <X className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Cancel</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Compare</span>
                  </>
                )}
              </Button>
            )}
            
            {/* Compare Action Button (shows when 2 selected) */}
            {compareMode && selectedForCompare.length === 2 && (
              <Button 
                onClick={openCompareDialog}
                className="bg-green-600 hover:bg-green-700 text-white rounded-sm font-bold uppercase tracking-wider text-sm animate-pulse"
                data-testid="open-compare-btn"
              >
                <Check className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Compare ({selectedForCompare.length})</span>
                <span className="sm:hidden">Go</span>
              </Button>
            )}
            
            {/* New Dropdown (Setup or Group) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider text-sm"
                  data-testid="new-dropdown-btn"
                  disabled={vehicles.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">New</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => { setPreselectedGroupId(null); setDialogOpen(true); }}
                  className="cursor-pointer"
                  data-testid="new-setup-option"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Setup
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openGroupDialog()}
                  className="cursor-pointer"
                  data-testid="new-group-option"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Compare Mode Instructions */}
        {compareMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Compare Mode Active
              </p>
              <p className="text-xs text-muted-foreground">
                Select 2 setups from the same vehicle to compare. {selectedForCompare.length}/2 selected
                {selectedForCompare.length === 1 && ` (${getVehicleName(selectedForCompare[0].vehicle_id)})`}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        {vehicles.length > 0 && setups.length > 0 && (
          <div className="flex items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search setups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border text-sm"
                data-testid="setup-search-input"
              />
            </div>
          </div>
        )}

        {vehicles.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No vehicles in your garage</p>
              <p className="text-sm mt-1">
                Add a vehicle first before creating setups
              </p>
              <Link to="/garage">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : setups.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No setups saved</p>
              <p className="text-sm mt-1">
                Start tracking your vehicle setups
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="mt-4"
                data-testid="empty-add-setup-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Setup
              </Button>
            </CardContent>
          </Card>
        ) : filteredSetups.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No setups found</p>
              <p className="text-sm mt-1">
                Try a different search or filter
              </p>
              <Button 
                onClick={() => { setSelectedVehicle('all'); setSearchQuery(''); }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSetups.map((setup, index) => {
              const isSelected = selectedForCompare.find(s => s.id === setup.id);
              const canSelect = !compareMode || selectedForCompare.length < 2 || isSelected || 
                (selectedForCompare.length === 1 && selectedForCompare[0].vehicle_id === setup.vehicle_id);
              const isDisabledForCompare = compareMode && selectedForCompare.length === 1 && 
                selectedForCompare[0].vehicle_id !== setup.vehicle_id;
              
              return (
                <Card 
                  key={setup.id}
                  className={`bg-card border-border/50 transition-all animate-fade-in cursor-pointer ${
                    isSelected 
                      ? 'border-amber-500 ring-2 ring-amber-500/30' 
                      : 'hover:border-primary/50'
                  } ${isDisabledForCompare ? 'opacity-40' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  data-testid={`setup-card-${setup.id}`}
                  onClick={() => compareMode ? handleCompareSelect(setup, { stopPropagation: () => {} }) : setViewingSetup(setup)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      {/* Compare Mode Checkbox */}
                      {compareMode && (
                        <div 
                          className="mr-3 mt-1"
                          onClick={(e) => handleCompareSelect(setup, e)}
                        >
                          <Checkbox 
                            checked={!!isSelected}
                            disabled={isDisabledForCompare}
                            className={`h-5 w-5 ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : ''}`}
                            data-testid={`compare-checkbox-${setup.id}`}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="font-medium">
                            <Car className="w-3 h-3 mr-1" />
                            {getVehicleName(setup.vehicle_id)}
                          </Badge>
                          {setup.conditions && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getConditionIcon(setup.conditions)}
                              {setup.conditions}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl tracking-tight flex items-center gap-2">
                          <Settings className="w-5 h-5 text-blue-500" />
                          {setup.name}
                        </CardTitle>
                        {setup.event_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {setup.event_name}
                            {setup.event_date && ` • ${setup.event_date}`}
                          </p>
                        )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setViewingSetup(setup); }}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleEdit(setup); }}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); openDuplicateDialog(setup); }}
                          className="cursor-pointer"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDelete(setup.id); }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(setup.created_at)}
                    </div>
                    {/* Quick Rating Component */}
                    <div 
                      className="flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`quick-rating-${setup.id}`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={(e) => handleQuickRating(setup.id, setup.rating === star ? 0 : star, e)}
                          className="p-0.5 hover:scale-125 transition-transform"
                          title={setup.rating === star ? 'Click to remove rating' : `Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-4 h-4 transition-colors ${
                              star <= setup.rating 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-muted-foreground/30 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Setup Dialog */}
      <SetupFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        setup={editingSetup}
        vehicles={vehicles}
        preselectedVehicleId={selectedVehicle !== 'all' ? selectedVehicle : vehicles[0]?.id}
      />

      {/* View Setup Dialog */}
      <SetupViewDialog 
        setup={viewingSetup} 
        vehicleName={viewingSetup ? getVehicleName(viewingSetup.vehicle_id) : ''}
        onClose={() => setViewingSetup(null)} 
        onEdit={handleEdit}
        onDuplicate={openDuplicateDialog}
      />

      {/* Duplicate Setup Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={(open) => { if (!open) { setDuplicateDialogOpen(false); setDuplicatingSetup(null); setDuplicateName(''); } }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Duplicate Setup
            </DialogTitle>
            <DialogDescription>
              Create a copy of "{duplicatingSetup?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Setup Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter name for the duplicate"
                className="bg-secondary border-border"
                autoFocus
                data-testid="duplicate-name-input"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The duplicate will be created for the same vehicle. You can change the vehicle when editing.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDuplicateDialogOpen(false); setDuplicatingSetup(null); setDuplicateName(''); }}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={!duplicateName.trim()} data-testid="confirm-duplicate-btn">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Setups Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={(open) => { if (!open) setCompareDialogOpen(false); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-amber-500" />
              Compare Setups
            </DialogTitle>
            {selectedForCompare.length === 2 && (
              <DialogDescription>
                Comparing setups for {getVehicleName(selectedForCompare[0].vehicle_id)}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedForCompare.length === 2 && (
            <SetupComparisonView 
              setupA={selectedForCompare[0]} 
              setupB={selectedForCompare[1]} 
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// Setup View Dialog Component
function SetupViewDialog({ setup, vehicleName, onClose, onEdit, onDuplicate }) {
  if (!setup) return null;

  // Check if a setup has any advanced fields populated
  const hasAdvancedFields = () => {
    return (
      setup.ride_height_fl > 0 || setup.ride_height_fr > 0 || setup.ride_height_rl > 0 || setup.ride_height_rr > 0 ||
      setup.camber_front !== 0 || setup.camber_rear !== 0 ||
      setup.toe_front !== 0 || setup.toe_rear !== 0 ||
      setup.spring_rate_front > 0 || setup.spring_rate_rear > 0 ||
      setup.damper_front > 0 || setup.damper_rear > 0 ||
      setup.arb_front > 0 || setup.arb_rear > 0 ||
      (setup.aero_front && setup.aero_front !== '') || (setup.aero_rear && setup.aero_rear !== '')
    );
  };

  const showAdvancedSections = hasAdvancedFields();

  const formatValue = (value, unit = '') => {
    if (value === 0 || value === '') return '-';
    return `${value}${unit}`;
  };

  return (
    <Dialog open={!!setup} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-500" />
                {setup.name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Badge variant="secondary">
                  <Car className="w-3 h-3 mr-1" />
                  {vehicleName}
                </Badge>
                {setup.conditions && (
                  <Badge variant="outline">{setup.conditions}</Badge>
                )}
                {setup.rating > 0 && (
                  <div className="flex items-center gap-0.5 ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= setup.rating 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(setup)}
                className="text-xs"
                data-testid="view-duplicate-btn"
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(setup)}
                className="text-xs"
                data-testid="view-edit-btn"
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Event Info */}
          {(setup.event_name || setup.event_date) && (
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Event</p>
              <p className="font-medium">{setup.event_name || 'Unnamed Event'}</p>
              {setup.event_date && (
                <p className="text-sm text-muted-foreground">{setup.event_date}</p>
              )}
            </div>
          )}

          {/* Tyre Information */}
          {(setup.tyre_compound || setup.tyre_type || setup.tyre_size || setup.tyre_condition) && (
            <div>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Tyre Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Compound</p>
                  <p className="text-lg capitalize">{formatValue(setup.tyre_compound)}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="text-lg capitalize">{formatValue(setup.tyre_condition)}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-lg">{formatValue(setup.tyre_type)}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded">
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="text-lg font-mono">{formatValue(setup.tyre_size)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tyre Pressures */}
          <div>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Tyre Pressures (PSI)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded text-center">
                <p className="text-xs text-muted-foreground">FL</p>
                <p className="text-lg font-mono">{formatValue(setup.tyre_pressure_fl)}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded text-center">
                <p className="text-xs text-muted-foreground">FR</p>
                <p className="text-lg font-mono">{formatValue(setup.tyre_pressure_fr)}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded text-center">
                <p className="text-xs text-muted-foreground">RL</p>
                <p className="text-lg font-mono">{formatValue(setup.tyre_pressure_rl)}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded text-center">
                <p className="text-xs text-muted-foreground">RR</p>
                <p className="text-lg font-mono">{formatValue(setup.tyre_pressure_rr)}</p>
              </div>
            </div>
          </div>

          {/* Advanced Sections - Only show if setup has advanced fields */}
          {showAdvancedSections && (
            <>
              {/* Ride Heights */}
              <div>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Ride Height (mm)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">FL</p>
                    <p className="text-lg font-mono">{formatValue(setup.ride_height_fl)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">FR</p>
                    <p className="text-lg font-mono">{formatValue(setup.ride_height_fr)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">RL</p>
                    <p className="text-lg font-mono">{formatValue(setup.ride_height_rl)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded text-center">
                    <p className="text-xs text-muted-foreground">RR</p>
                    <p className="text-lg font-mono">{formatValue(setup.ride_height_rr)}</p>
                  </div>
                </div>
              </div>

              {/* Alignment */}
              <div>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Alignment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Camber Front</p>
                    <p className="text-lg font-mono">{formatValue(setup.camber_front, '°')}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Camber Rear</p>
                    <p className="text-lg font-mono">{formatValue(setup.camber_rear, '°')}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Toe Front</p>
                    <p className="text-lg font-mono">{formatValue(setup.toe_front, 'mm')}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Toe Rear</p>
                    <p className="text-lg font-mono">{formatValue(setup.toe_rear, 'mm')}</p>
                  </div>
                </div>
              </div>

              {/* Suspension */}
              <div>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Suspension</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Spring Rate Front</p>
                    <p className="text-lg font-mono">{formatValue(setup.spring_rate_front)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Spring Rate Rear</p>
                    <p className="text-lg font-mono">{formatValue(setup.spring_rate_rear)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Damper Front</p>
                    <p className="text-lg font-mono">{formatValue(setup.damper_front)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">Damper Rear</p>
                    <p className="text-lg font-mono">{formatValue(setup.damper_rear)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">ARB Front</p>
                    <p className="text-lg font-mono">{formatValue(setup.arb_front)}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded">
                    <p className="text-xs text-muted-foreground">ARB Rear</p>
                    <p className="text-lg font-mono">{formatValue(setup.arb_rear)}</p>
                  </div>
                </div>
              </div>

              {/* Aero */}
              {(setup.aero_front || setup.aero_rear) && (
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Aerodynamics</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary/30 rounded">
                      <p className="text-xs text-muted-foreground">Front</p>
                      <p className="text-lg">{formatValue(setup.aero_front)}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded">
                      <p className="text-xs text-muted-foreground">Rear</p>
                      <p className="text-lg">{formatValue(setup.aero_rear)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          {setup.notes && (
            <div>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{setup.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Setup Comparison View Component
function SetupComparisonView({ setupA, setupB }) {
  if (!setupA || !setupB) return null;

  const formatValue = (value, unit = '') => {
    if (value === 0 || value === '' || value === null || value === undefined) return '-';
    return `${value}${unit}`;
  };

  // Helper to determine if values are different
  const isDifferent = (a, b) => {
    const valA = a === null || a === undefined ? '' : a;
    const valB = b === null || b === undefined ? '' : b;
    return valA !== valB;
  };

  // Comparison row component
  const CompareRow = ({ label, valueA, valueB, unit = '' }) => {
    const different = isDifferent(valueA, valueB);
    return (
      <div className={`grid grid-cols-3 gap-4 py-2 px-3 rounded ${different ? 'bg-amber-500/10' : ''}`}>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`text-sm font-mono text-center ${different ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
          {formatValue(valueA, unit)}
        </div>
        <div className={`text-sm font-mono text-center ${different ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
          {formatValue(valueB, unit)}
        </div>
      </div>
    );
  };

  // Section header
  const SectionHeader = ({ title }) => (
    <div className="grid grid-cols-3 gap-4 py-2 px-3 bg-secondary/50 rounded-t-lg border-b border-border/50">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>
      <div className="text-xs font-semibold text-center text-primary uppercase tracking-wider">{setupA.name}</div>
      <div className="text-xs font-semibold text-center text-primary uppercase tracking-wider">{setupB.name}</div>
    </div>
  );

  return (
    <div className="space-y-6 mt-4" data-testid="setup-comparison-view">
      {/* Basic Info */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Basic Info" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Conditions" valueA={setupA.conditions} valueB={setupB.conditions} />
          <CompareRow label="Event" valueA={setupA.event_name} valueB={setupB.event_name} />
          <CompareRow label="Date" valueA={setupA.event_date} valueB={setupB.event_date} />
          <CompareRow label="Rating" valueA={setupA.rating ? `${setupA.rating}/5` : '-'} valueB={setupB.rating ? `${setupB.rating}/5` : '-'} />
        </div>
      </div>

      {/* Tyre Information */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Tyre Information" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Compound" valueA={setupA.tyre_compound} valueB={setupB.tyre_compound} />
          <CompareRow label="Type" valueA={setupA.tyre_type} valueB={setupB.tyre_type} />
          <CompareRow label="Size" valueA={setupA.tyre_size} valueB={setupB.tyre_size} />
          <CompareRow label="Condition" valueA={setupA.tyre_condition} valueB={setupB.tyre_condition} />
        </div>
      </div>

      {/* Tyre Pressures */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Tyre Pressures (PSI)" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Front Left" valueA={setupA.tyre_pressure_fl} valueB={setupB.tyre_pressure_fl} />
          <CompareRow label="Front Right" valueA={setupA.tyre_pressure_fr} valueB={setupB.tyre_pressure_fr} />
          <CompareRow label="Rear Left" valueA={setupA.tyre_pressure_rl} valueB={setupB.tyre_pressure_rl} />
          <CompareRow label="Rear Right" valueA={setupA.tyre_pressure_rr} valueB={setupB.tyre_pressure_rr} />
        </div>
      </div>

      {/* Ride Height */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Ride Height (mm)" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Front Left" valueA={setupA.ride_height_fl} valueB={setupB.ride_height_fl} />
          <CompareRow label="Front Right" valueA={setupA.ride_height_fr} valueB={setupB.ride_height_fr} />
          <CompareRow label="Rear Left" valueA={setupA.ride_height_rl} valueB={setupB.ride_height_rl} />
          <CompareRow label="Rear Right" valueA={setupA.ride_height_rr} valueB={setupB.ride_height_rr} />
        </div>
      </div>

      {/* Alignment */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Alignment" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Camber Front" valueA={setupA.camber_front} valueB={setupB.camber_front} unit="°" />
          <CompareRow label="Camber Rear" valueA={setupA.camber_rear} valueB={setupB.camber_rear} unit="°" />
          <CompareRow label="Toe Front" valueA={setupA.toe_front} valueB={setupB.toe_front} unit="mm" />
          <CompareRow label="Toe Rear" valueA={setupA.toe_rear} valueB={setupB.toe_rear} unit="mm" />
        </div>
      </div>

      {/* Suspension */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Suspension" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Spring Rate Front" valueA={setupA.spring_rate_front} valueB={setupB.spring_rate_front} />
          <CompareRow label="Spring Rate Rear" valueA={setupA.spring_rate_rear} valueB={setupB.spring_rate_rear} />
          <CompareRow label="Damper Front" valueA={setupA.damper_front} valueB={setupB.damper_front} />
          <CompareRow label="Damper Rear" valueA={setupA.damper_rear} valueB={setupB.damper_rear} />
          <CompareRow label="ARB Front" valueA={setupA.arb_front} valueB={setupB.arb_front} />
          <CompareRow label="ARB Rear" valueA={setupA.arb_rear} valueB={setupB.arb_rear} />
        </div>
      </div>

      {/* Aero */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <SectionHeader title="Aerodynamics" />
        <div className="divide-y divide-border/30">
          <CompareRow label="Front" valueA={setupA.aero_front} valueB={setupB.aero_front} />
          <CompareRow label="Rear" valueA={setupA.aero_rear} valueB={setupB.aero_rear} />
        </div>
      </div>

      {/* Notes */}
      {(setupA.notes || setupB.notes) && (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <SectionHeader title="Notes" />
          <div className="grid grid-cols-3 gap-4 p-3">
            <div></div>
            <div className="text-sm whitespace-pre-wrap">{setupA.notes || '-'}</div>
            <div className="text-sm whitespace-pre-wrap">{setupB.notes || '-'}</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500/20 rounded"></div>
          <span>Highlighted rows indicate differences</span>
        </div>
      </div>
    </div>
  );
}
