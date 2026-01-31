import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import ItemFormDialog from '@/components/ItemFormDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Wrench, 
  Droplets, 
  Cog,
  AlertTriangle,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: '', label: 'All Categories', icon: Package },
  { value: 'parts', label: 'Parts', icon: Cog },
  { value: 'tools', label: 'Tools', icon: Wrench },
  { value: 'fluids', label: 'Fluids', icon: Droplets },
];

export default function InventoryPage() {
  const { getAuthHeader } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [categoryFilter, showLowStock]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (showLowStock) params.append('low_stock', 'true');
      
      const response = await axios.get(`${API}/inventory?${params}`, {
        headers: getAuthHeader()
      });
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchItems();
      return;
    }
    
    try {
      const params = new URLSearchParams();
      params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await axios.get(`${API}/inventory?${params}`, {
        headers: getAuthHeader()
      });
      setItems(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await axios.delete(`${API}/inventory/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Item deleted');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSaved = () => {
    handleDialogClose();
    fetchItems();
  };

  const getCategoryBadge = (category) => {
    const className = `category-${category}`;
    return (
      <Badge variant="outline" className={`${className} uppercase text-xs tracking-wider`}>
        {category}
      </Badge>
    );
  };

  const isLowStock = (item) => item.quantity <= item.min_stock;

  const filteredItems = items.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.part_number.toLowerCase().includes(searchLower) ||
      item.supplier.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Layout>
      <div className="space-y-6" data-testid="inventory-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} in stock
            </p>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider"
            data-testid="add-item-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, part number, supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-secondary border-border h-10"
                    data-testid="search-input"
                  />
                </div>
                <Button 
                  variant="secondary" 
                  onClick={handleSearch}
                  className="px-4"
                  data-testid="search-btn"
                >
                  Search
                </Button>
              </div>

              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[160px] justify-between" data-testid="category-filter-btn">
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      {categories.find(c => c.value === categoryFilter)?.label || 'All Categories'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.value}
                      onClick={() => setCategoryFilter(cat.value)}
                      className="cursor-pointer"
                      data-testid={`filter-${cat.value || 'all'}`}
                    >
                      <cat.icon className="w-4 h-4 mr-2" />
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Low Stock Toggle */}
              <Button
                variant={showLowStock ? 'default' : 'outline'}
                onClick={() => setShowLowStock(!showLowStock)}
                className={showLowStock ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
                data-testid="low-stock-filter-btn"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Low Stock
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="bg-card border-border/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full spinner" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No items found</p>
              <p className="text-sm mt-1">
                {search || categoryFilter || showLowStock 
                  ? 'Try adjusting your filters'
                  : 'Add your first inventory item to get started'}
              </p>
              {!search && !categoryFilter && !showLowStock && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="mt-4"
                  data-testid="empty-add-item-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="inventory-table">
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Part #</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground text-center">Qty</TableHead>
                    <TableHead className="text-muted-foreground">Location</TableHead>
                    <TableHead className="text-muted-foreground text-right">Price</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow 
                      key={item.id}
                      className={`inventory-row border-b border-border/50 animate-fade-in ${isLowStock(item) ? 'low-stock' : ''}`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                      data-testid={`inventory-row-${item.id}`}
                    >
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {isLowStock(item) && (
                            <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0" />
                          )}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {item.part_number || '-'}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(item.category)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary"
                          className={`quantity-badge ${isLowStock(item) ? 'quantity-low' : 'quantity-ok'}`}
                        >
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.location || '-'}
                      </TableCell>
                      <TableCell className="text-right price font-mono">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`item-menu-${item.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/inventory/${item.id}`} className="cursor-pointer" data-testid={`view-item-${item.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer" data-testid={`edit-item-${item.id}`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(item.id)} 
                              className="cursor-pointer text-destructive focus:text-destructive"
                              data-testid={`delete-item-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Add/Edit Item Dialog */}
      <ItemFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        item={editingItem}
      />
    </Layout>
  );
}
