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
  Minus,
  Save,
  Download,
  Package,
  MapPin,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function StocktakeDialog({ open, onClose, items, onStocktakeComplete }) {
  const { getAuthHeader } = useAuth();
  const [mode, setMode] = useState(null); // null, 'device', 'pdf'
  const [currentStep, setCurrentStep] = useState(0);
  const [stocktakeData, setStocktakeData] = useState([]);
  const [notes, setNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStocktake, setSavedStocktake] = useState(null);

  // Initialize stocktake data when items change
  useEffect(() => {
    if (items && items.length > 0) {
      setStocktakeData(items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        location: item.location || 'Not specified',
        expected_quantity: item.quantity,
        actual_quantity: item.quantity, // Default to expected
        difference: 0,
        price: item.price,
        value_difference: 0
      })));
    }
  }, [items]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setMode(null);
      setCurrentStep(0);
      setShowSummary(false);
      setNotes('');
      setSavedStocktake(null);
    }
  }, [open]);

  const handleQuantityChange = (index, value) => {
    const newData = [...stocktakeData];
    const actualQty = parseInt(value) || 0;
    const diff = actualQty - newData[index].expected_quantity;
    newData[index].actual_quantity = actualQty;
    newData[index].difference = diff;
    newData[index].value_difference = diff * newData[index].price;
    setStocktakeData(newData);
  };

  const getSummaryStats = () => {
    const matched = stocktakeData.filter(item => item.difference === 0).length;
    const over = stocktakeData.filter(item => item.difference > 0);
    const under = stocktakeData.filter(item => item.difference < 0);
    const totalValueDiff = stocktakeData.reduce((sum, item) => sum + item.value_difference, 0);
    
    return { matched, over, under, totalValueDiff };
  };

  const handleSaveStocktake = async () => {
    setSaving(true);
    try {
      const response = await axios.post(`${API}/stocktakes`, {
        items: stocktakeData,
        notes
      }, {
        headers: getAuthHeader()
      });
      setSavedStocktake(response.data);
      toast.success('Stocktake saved successfully');
    } catch (error) {
      toast.error('Failed to save stocktake');
      console.error(error);
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
    // Create printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RallyCommand Stocktake Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; margin-bottom: 5px; }
          .date { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .qty { text-align: center; width: 80px; }
          .price { text-align: right; }
          .value { text-align: right; font-weight: bold; }
          .location { color: #666; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .counted-col { width: 100px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>RALLYCOMMAND STOCKTAKE REPORT</h1>
        <p class="date">Generated: ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Location</th>
              <th class="qty">Stock Qty</th>
              <th class="counted-col">Counted</th>
              <th class="price">Unit Price</th>
              <th class="price">Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="location">${item.location || '-'}</td>
                <td class="qty">${item.quantity}</td>
                <td class="counted-col" style="border: 2px solid #000;"></td>
                <td class="price">$${item.price.toFixed(2)}</td>
                <td class="price">$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td class="qty">${items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td></td>
              <td></td>
              <td class="price">$${items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 40px;">
          <p><strong>Counted By:</strong> _________________________</p>
          <p><strong>Date:</strong> _________________________</p>
          <p><strong>Notes:</strong></p>
          <div style="border: 1px solid #ddd; min-height: 100px; padding: 10px;"></div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const currentItem = stocktakeData[currentStep];
  const stats = getSummaryStats();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always'
    }).format(value);
  };

  // Mode Selection Screen
  if (mode === null) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight uppercase flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              Stocktake Report
            </DialogTitle>
            <DialogDescription>
              Choose how you want to complete the stocktake
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 mt-6">
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
                    Count items one by one on your device. Get a summary of discrepancies and option to correct stock levels.
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
            {items.length} items to count • Total value: ${items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
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
                  <p className="text-3xl font-bold text-foreground">{stocktakeData.length}</p>
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
                  onClick={() => {
                    setShowSummary(false);
                    setCurrentStep(0);
                  }}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Edit Counts
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

  // On-Device Counting Screen
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Stocktake
          </DialogTitle>
          <DialogDescription>
            Item {currentStep + 1} of {stocktakeData.length}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / stocktakeData.length) * 100}%` }}
          />
        </div>

        {currentItem && (
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
                value={currentItem.actual_quantity}
                onChange={(e) => handleQuantityChange(currentStep, e.target.value)}
                className="bg-secondary border-border text-3xl font-mono font-bold h-16 text-center"
                data-testid="stocktake-count-input"
              />
              
              {/* Difference indicator */}
              {currentItem.difference !== 0 && (
                <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${
                  currentItem.difference > 0 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {currentItem.difference > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-mono font-bold">
                    {currentItem.difference > 0 ? '+' : ''}{currentItem.difference} 
                    ({formatCurrency(currentItem.value_difference)})
                  </span>
                </div>
              )}
              {currentItem.difference === 0 && (
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
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < stocktakeData.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 bg-primary text-primary-foreground"
                  data-testid="stocktake-next-btn"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSummary(true)}
                  className="flex-1 bg-accent text-accent-foreground"
                  data-testid="stocktake-finish-btn"
                >
                  View Summary
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
