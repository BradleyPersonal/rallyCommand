import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import ItemFormDialog from '@/components/ItemFormDialog';
import UsageLogDialog from '@/components/UsageLogDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Minus,
  Package,
  MapPin,
  Hash,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [item, setItem] = useState(null);
  const [usageLogs, setUsageLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);

  useEffect(() => {
    fetchItem();
    fetchUsageLogs();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API}/inventory/${id}`, {
        headers: getAuthHeader()
      });
      setItem(response.data);
    } catch (error) {
      toast.error('Item not found');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageLogs = async () => {
    try {
      const response = await axios.get(`${API}/usage/${id}`, {
        headers: getAuthHeader()
      });
      setUsageLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch usage logs');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item? This will also delete all usage history.')) return;
    
    try {
      await axios.delete(`${API}/inventory/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Item deleted');
      navigate('/inventory');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleEditSaved = () => {
    setEditDialogOpen(false);
    fetchItem();
  };

  const handleUsageLogged = () => {
    setUsageDialogOpen(false);
    fetchItem();
    fetchUsageLogs();
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

  const getCategoryClass = (category) => `category-${category}`;
  const isLowStock = item?.quantity <= item?.min_stock;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full spinner" />
        </div>
      </Layout>
    );
  }

  if (!item) return null;

  return (
    <Layout>
      <div className="space-y-6" data-testid="item-detail-page">
        {/* Back Button */}
        <Link to="/inventory">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="back-to-inventory-btn">
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isLowStock && (
                <div className="w-10 h-10 bg-accent/20 rounded-sm flex items-center justify-center animate-pulse-glow">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl tracking-tighter uppercase text-foreground">
                  {item.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`${getCategoryClass(item.category)} uppercase text-xs tracking-wider`}>
                    {item.category}
                  </Badge>
                  {isLowStock && (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 uppercase text-xs">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setUsageDialogOpen(true)}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="log-usage-btn"
            >
              <Minus className="w-4 h-4 mr-2" />
              Log Usage
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
              data-testid="edit-item-btn"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-testid="delete-item-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2 bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight uppercase">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quantity Display */}
              <div className={`p-6 rounded-sm ${isLowStock ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/30 border border-border/50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Current Stock</p>
                    <p className={`text-5xl font-mono font-bold ${isLowStock ? 'text-accent' : 'text-foreground'}`}>
                      {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Min. Stock</p>
                    <p className="text-2xl font-mono text-muted-foreground">
                      {item.min_stock}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">Part Number</p>
                      <p className="font-mono text-foreground">{item.part_number || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">Location</p>
                      <p className="text-foreground">{item.location || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">Supplier</p>
                      <p className="text-foreground">{item.supplier || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase">Unit Price</p>
                      <p className="font-mono text-accent text-lg">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {item.notes && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Notes</p>
                      <p className="text-foreground whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Usage History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No usage logged yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsageDialogOpen(true)}
                    className="mt-4"
                    data-testid="first-usage-btn"
                  >
                    Log First Usage
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {usageLogs.map((log, index) => (
                    <div 
                      key={log.id}
                      className={`p-3 border-l-2 border-primary/50 bg-secondary/20 animate-fade-in`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="destructive" className="font-mono">
                          -{log.quantity_used}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      {(log.reason || log.event_name) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.event_name && <span className="text-foreground">{log.event_name}</span>}
                          {log.event_name && log.reason && ' - '}
                          {log.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ItemFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSaved={handleEditSaved}
        item={item}
      />

      {/* Usage Log Dialog */}
      <UsageLogDialog
        open={usageDialogOpen}
        onClose={() => setUsageDialogOpen(false)}
        onLogged={handleUsageLogged}
        item={item}
      />
    </Layout>
  );
}
