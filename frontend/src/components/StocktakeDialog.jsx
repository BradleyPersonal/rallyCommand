import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ClipboardList, 
  FileText, 
  Monitor,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Save,
  Download,
  Package,
  MapPin,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  Car
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function StocktakeDialog({ open, onClose, items, onStocktakeComplete }) {
  const { getAuthHeader } = useAuth();
  const [mode, setMode] = useState(null); // null, 'device', 'pdf'
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [stocktakeData, setStocktakeData] = useState([]);
  const [tempCount, setTempCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStocktake, setSavedStocktake] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [filteredItems, setFilteredItems] = useState([]);

  // Fetch vehicles when dialog opens
  useEffect(() => {
    if (open) {
      fetchVehicles();
    }
  }, [open]);

  const fetchVehicles = async () => {
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) return;
      const response = await axios.get(`${API}/vehicles`, { headers });
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  // Filter items based on selected vehicle
  useEffect(() => {
    if (!items || items.length === 0) {
      setFilteredItems([]);
      return;
    }

    if (selectedVehicle === 'all') {
      setFilteredItems(items);
    } else {
      // Show items linked to selected vehicle OR items with no vehicle assigned
      const filtered = items.filter(item => 
        item.vehicle_ids?.includes(selectedVehicle) || 
        !item.vehicle_ids || 
        item.vehicle_ids.length === 0
      );
      setFilteredItems(filtered);
    }
  }, [items, selectedVehicle]);

  // Initialize stocktake data when filtered items change
  useEffect(() => {
    if (filteredItems && filteredItems.length > 0) {
      setStocktakeData(filteredItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        location: item.location || 'Not specified',
        expected_quantity: item.quantity,
        actual_quantity: null, // null means not yet counted
        counted: false,
        difference: 0,
        price: item.price,
        value_difference: 0
      })));
    } else {
      setStocktakeData([]);
    }
  }, [filteredItems]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setMode(null);
      setSelectedItemIndex(null);
      setShowSummary(false);
      setNotes('');
      setSavedStocktake(null);
      setTempCount(0);
      setSelectedVehicle('all');
    }
  }, [open]);

  // Set temp count when selecting an item
  useEffect(() => {
    if (selectedItemIndex !== null && stocktakeData[selectedItemIndex]) {
      const item = stocktakeData[selectedItemIndex];
      setTempCount(item.counted ? item.actual_quantity : item.expected_quantity);
    }
  }, [selectedItemIndex, stocktakeData]);

  const handleSaveCount = () => {
    if (selectedItemIndex === null) return;
    
    const newData = [...stocktakeData];
    const actualQty = parseInt(tempCount) || 0;
    const diff = actualQty - newData[selectedItemIndex].expected_quantity;
    newData[selectedItemIndex].actual_quantity = actualQty;
    newData[selectedItemIndex].counted = true;
    newData[selectedItemIndex].difference = diff;
    newData[selectedItemIndex].value_difference = diff * newData[selectedItemIndex].price;
    setStocktakeData(newData);
    setSelectedItemIndex(null);
  };

  const handleBackToList = () => {
    setSelectedItemIndex(null);
  };

  const getCountedStats = () => {
    const counted = stocktakeData.filter(item => item.counted).length;
    const total = stocktakeData.length;
    return { counted, total, remaining: total - counted };
  };

  const getSummaryStats = () => {
    const countedItems = stocktakeData.filter(item => item.counted);
    const matched = countedItems.filter(item => item.difference === 0).length;
    const over = countedItems.filter(item => item.difference > 0);
    const under = countedItems.filter(item => item.difference < 0);
    const totalValueDiff = countedItems.reduce((sum, item) => sum + item.value_difference, 0);
    
    return { matched, over, under, totalValueDiff, countedItems };
  };

  const handleSaveStocktake = async () => {
    const countedItems = stocktakeData.filter(item => item.counted);
    
    if (countedItems.length === 0) {
      toast.error('Please count at least one item before saving');
      return;
    }

    setSaving(true);
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        toast.error('Session expired. Please log in again.');
        setSaving(false);
        return;
      }
      
      const payload = {
        items: countedItems.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          location: item.location,
          expected_quantity: item.expected_quantity,
          actual_quantity: item.actual_quantity,
          difference: item.difference,
          price: item.price,
          value_difference: item.value_difference
        })),
        notes
      };
      
      console.log('Saving stocktake to:', `${API}/stocktakes`);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Headers:', headers);
      
      const response = await axios.post(`${API}/stocktakes`, payload, { headers });
      console.log('Response:', response.data);
      setSavedStocktake(response.data);
      toast.success('Stocktake saved successfully');
    } catch (error) {
      console.error('Stocktake save error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      toast.error(`Failed to save stocktake: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCorrections = async () => {
    if (!savedStocktake) return;
    
    setSaving(true);
    try {
      await axios.post(`${API}/stocktakes/${savedStocktake.id}/apply`, {}, {
        headers: getAuthHeader()
      });
      toast.success('Stock levels corrected successfully');
      onStocktakeComplete?.();
      onClose();
    } catch (error) {
      toast.error('Failed to apply corrections');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = () => {
    const itemsToInclude = filteredItems;
    const vehicleName = selectedVehicle === 'all' 
      ? 'All Vehicles' 
      : vehicles.find(v => v.id === selectedVehicle)?.make + ' ' + vehicles.find(v => v.id === selectedVehicle)?.model || 'Unknown';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RallyCommand Stocktake Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 5px; }
          .date { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: 600; }
          .qty { text-align: center; width: 80px; }
          .price { text-align: right; }
          .value { text-align: right; font-weight: 600; }
          .location { color: #666; }
          .total-row { background-color: #f9f9f9; font-weight: 600; }
          .counted-col { width: 100px; border: 1px solid #999; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>RALLYCOMMAND STOCKTAKE REPORT</h1>
        <p class="subtitle">Vehicle Filter: ${vehicleName}</p>
        <p class="date">Generated: ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })}</p>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Location</th>
              <th class="qty">Stock Qty</th>
              <th class="counted-col">Counted</th>
              <th class="price">Unit Price</th>
              <th class="price">Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToInclude.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-transform: capitalize;">${item.category}</td>
                <td class="location">${item.location || '-'}</td>
                <td class="qty">${item.quantity}</td>
                <td class="counted-col"></td>
                <td class="price">$${item.price.toFixed(2)}</td>
                <td class="price">$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td class="qty">${itemsToInclude.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td></td>
              <td></td>
              <td class="price">$${itemsToInclude.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 40px;">
          <p><strong>Counted By:</strong> _________________________</p>
          <p><strong>Date:</strong> _________________________</p>
          <p><strong>Notes:</strong></p>
          <div style="border: 1px solid #ccc; min-height: 100px; padding: 10px;"></div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const currentItem = selectedItemIndex !== null ? stocktakeData[selectedItemIndex] : null;
  const stats = getSummaryStats();
  const countedStats = getCountedStats();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always'
    }).format(value);
  };

  // Mode Selection Screen
  if (mode === null) {
    const getVehicleName = (vehicleId) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      return vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown';
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Stocktake Report
            </DialogTitle>
            <DialogDescription>
              Choose which items to count and how to complete the stocktake
            </DialogDescription>
          </DialogHeader>

          {/* Vehicle Filter Selection */}
          <div className="space-y-2 mt-4">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" />
              Vehicle Filter
            </Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="bg-secondary border-border" data-testid="stocktake-vehicle-select">
                <SelectValue placeholder="Select vehicle filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    All Vehicles (All Items)
                  </span>
                </SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    <span className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      {vehicle.make} {vehicle.model}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedVehicle === 'all' 
                ? 'All inventory items will be included in the stocktake'
                : `Items for ${getVehicleName(selectedVehicle)} and universal parts will be included`
              }
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <Card 
              className="bg-secondary/30 border-border hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => setMode('device')}
              data-testid="stocktake-device-option"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">Complete on Device</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Count items from a list. Get a summary of discrepancies and option to correct stock levels.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card 
              className="bg-secondary/30 border-border hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => {
                generatePDF();
                onClose();
              }}
              data-testid="stocktake-pdf-option"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">Generate PDF Printout</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Print a stocktake sheet to manually count items. Includes item names, locations, quantities, and values.
                  </p>
                </div>
                <Download className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            {filteredItems.length} items to count • Total value: ${filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Summary Screen
  if (showSummary) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Stocktake Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats.countedItems.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Items Counted</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">{stats.matched}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Matched</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-500">{stats.over.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Over Stock</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-orange-500">{stats.under.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Under Stock</p>
                </CardContent>
              </Card>
            </div>

            {/* Value Difference */}
            <Card className={`border ${stats.totalValueDiff >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-5 h-5 ${stats.totalValueDiff >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-muted-foreground">Total Value Difference</span>
                  </div>
                  <span className={`text-2xl font-mono font-bold ${stats.totalValueDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(stats.totalValueDiff)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Discrepancies List */}
            {(stats.over.length > 0 || stats.under.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Items with Discrepancies
                </h3>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {stats.under.map((item, idx) => (
                    <div key={`under-${idx}`} className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-foreground">{item.item_name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-orange-500 text-orange-500 font-mono">
                          {item.difference}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected: {item.expected_quantity} → Actual: {item.actual_quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stats.over.map((item, idx) => (
                    <div key={`over-${idx}`} className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-foreground">{item.item_name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-blue-500 text-blue-500 font-mono">
                          +{item.difference}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected: {item.expected_quantity} → Actual: {item.actual_quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this stocktake..."
                className="bg-secondary border-border resize-none h-20"
              />
            </div>

            <Separator className="bg-border/50" />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {!savedStocktake ? (
                <Button
                  onClick={handleSaveStocktake}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground"
                  data-testid="save-stocktake-btn"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full spinner" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Stocktake
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-green-500 py-2">
                    <Check className="w-5 h-5" />
                    <span>Stocktake saved successfully</span>
                  </div>
                  
                  {(stats.over.length > 0 || stats.under.length > 0) && (
                    <Button
                      onClick={handleApplyCorrections}
                      disabled={saving}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      data-testid="apply-corrections-btn"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-accent-foreground border-t-transparent rounded-full spinner" />
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Correct Stock Levels ({stats.over.length + stats.under.length} items)
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Item Counting Screen (when an item is selected)
  if (selectedItemIndex !== null && currentItem) {
    const diff = (parseInt(tempCount) || 0) - currentItem.expected_quantity;
    const valueDiff = diff * currentItem.price;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Count Item
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Item Info Card */}
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{currentItem.item_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {currentItem.location}
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-border/50" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Expected Qty</p>
                    <p className="text-2xl font-mono font-bold text-foreground">{currentItem.expected_quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Unit Value</p>
                    <p className="text-2xl font-mono font-bold text-accent">${currentItem.price.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Count Input */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Actual Count</Label>
              <Input
                type="number"
                min="0"
                value={tempCount}
                onChange={(e) => setTempCount(e.target.value)}
                className="bg-secondary border-border text-3xl font-mono font-bold h-16 text-center"
                data-testid="stocktake-count-input"
              />
              
              {/* Difference indicator */}
              {diff !== 0 && (
                <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${
                  diff > 0 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {diff > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-mono font-bold">
                    {diff > 0 ? '+' : ''}{diff} 
                    ({formatCurrency(valueDiff)})
                  </span>
                </div>
              )}
              {diff === 0 && (
                <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-500/20 text-green-500">
                  <Check className="w-4 h-4" />
                  <span>Matches expected quantity</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                onClick={handleSaveCount}
                className="flex-1 bg-primary text-primary-foreground"
                data-testid="stocktake-save-count-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Count
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Items List Screen (main on-device view)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Stocktake
          </DialogTitle>
          <DialogDescription>
            {countedStats.counted} of {countedStats.total} items counted
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(countedStats.counted / countedStats.total) * 100}%` }}
          />
        </div>

        {/* Items List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {stocktakeData.map((item, index) => (
              <Card 
                key={item.item_id}
                className={`border cursor-pointer transition-colors hover:border-primary/50 ${
                  item.counted 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-secondary/30 border-border'
                }`}
                onClick={() => setSelectedItemIndex(index)}
                data-testid={`stocktake-item-${index}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.counted ? 'bg-green-500/20' : 'bg-secondary'
                      }`}>
                        {item.counted ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{item.item_name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                          <span className="font-mono">Qty: {item.expected_quantity}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.counted && (
                        <div className="text-right">
                          {item.difference !== 0 ? (
                            <Badge 
                              variant="outline" 
                              className={`font-mono ${
                                item.difference > 0 
                                  ? 'border-blue-500 text-blue-500' 
                                  : 'border-orange-500 text-orange-500'
                              }`}
                            >
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              <Check className="w-3 h-3" />
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Counted: {item.actual_quantity}
                          </p>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setMode(null)}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={() => setShowSummary(true)}
            disabled={countedStats.counted === 0}
            className="flex-1 bg-primary text-primary-foreground"
            data-testid="stocktake-view-summary-btn"
          >
            View Summary
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
