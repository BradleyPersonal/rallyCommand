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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  History,
  ClipboardList,
  Calendar,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  Trash2,
  Eye
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function StocktakeHistoryDialog({ open, onClose }) {
  const { getAuthHeader } = useAuth();
  const [stocktakes, setStocktakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStocktake, setSelectedStocktake] = useState(null);

  useEffect(() => {
    if (open) {
      fetchStocktakes();
    }
  }, [open]);

  const fetchStocktakes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/stocktakes`, {
        headers: getAuthHeader()
      });
      setStocktakes(response.data);
    } catch (error) {
      toast.error('Failed to load stocktake history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stocktake record?')) return;
    
    try {
      await axios.delete(`${API}/stocktakes/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Stocktake deleted');
      fetchStocktakes();
      if (selectedStocktake?.id === id) {
        setSelectedStocktake(null);
      }
    } catch (error) {
      toast.error('Failed to delete stocktake');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always'
    }).format(value);
  };

  // Detail View
  if (selectedStocktake) {
    const discrepancies = selectedStocktake.items.filter(item => item.difference !== 0);
    
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedStocktake(null)}
                className="p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Stocktake Details
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Date & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(selectedStocktake.created_at)}
              </div>
              <Badge variant={selectedStocktake.status === 'applied' ? 'default' : 'secondary'}>
                {selectedStocktake.status === 'applied' ? (
                  <><Check className="w-3 h-3 mr-1" /> Applied</>
                ) : (
                  'Completed'
                )}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="bg-secondary/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold">{selectedStocktake.total_items_counted}</p>
                  <p className="text-xs text-muted-foreground">Counted</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-green-500">{selectedStocktake.items_matched}</p>
                  <p className="text-xs text-muted-foreground">Matched</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-blue-500">{selectedStocktake.items_over}</p>
                  <p className="text-xs text-muted-foreground">Over</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-orange-500">{selectedStocktake.items_under}</p>
                  <p className="text-xs text-muted-foreground">Under</p>
                </CardContent>
              </Card>
            </div>

            {/* Value Difference */}
            <Card className={`${selectedStocktake.total_value_difference >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Value Difference
                </span>
                <span className={`text-xl font-mono font-bold ${selectedStocktake.total_value_difference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(selectedStocktake.total_value_difference)}
                </span>
              </CardContent>
            </Card>

            {/* Discrepancies */}
            {discrepancies.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Discrepancies ({discrepancies.length})
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {discrepancies.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-2 rounded-lg border ${
                          item.difference > 0 
                            ? 'bg-blue-500/10 border-blue-500/30' 
                            : 'bg-orange-500/10 border-orange-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground text-sm">{item.item_name}</span>
                          <div className="flex items-center gap-2">
                            {item.difference > 0 ? (
                              <TrendingUp className="w-3 h-3 text-blue-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-orange-500" />
                            )}
                            <span className={`font-mono text-sm ${item.difference > 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.expected_quantity} → {item.actual_quantity} ({formatCurrency(item.value_difference)})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {selectedStocktake.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
                  <p className="text-sm text-foreground">{selectedStocktake.notes}</p>
                </div>
              </>
            )}

            {selectedStocktake.applied_at && (
              <p className="text-xs text-muted-foreground text-center">
                Corrections applied: {formatDate(selectedStocktake.applied_at)}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // List View
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Stocktake History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full spinner" />
          </div>
        ) : stocktakes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No stocktakes recorded yet</p>
            <p className="text-sm mt-1">Complete a stocktake to see it here</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {stocktakes.map((stocktake) => (
              <Card 
                key={stocktake.id}
                className="bg-secondary/30 border-border hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => setSelectedStocktake(stocktake)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium">
                          {formatDate(stocktake.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {stocktake.total_items_counted} items
                        </span>
                        {stocktake.items_over > 0 && (
                          <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-500">
                            +{stocktake.items_over} over
                          </Badge>
                        )}
                        {stocktake.items_under > 0 && (
                          <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-500">
                            -{stocktake.items_under} under
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-sm font-mono ${stocktake.total_value_difference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(stocktake.total_value_difference)}
                        </span>
                        <Badge variant={stocktake.status === 'applied' ? 'default' : 'secondary'} className="text-xs">
                          {stocktake.status === 'applied' ? 'Applied' : 'Saved'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(stocktake.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
