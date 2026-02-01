import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Layers,
  ArrowRight,
  Wrench,
  Droplets,
  Cog,
  Clock
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: getAuthHeader()
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'parts': return <Cog className="w-4 h-4" />;
      case 'tools': return <Wrench className="w-4 h-4" />;
      case 'fluids': return <Droplets className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Rally car inventory overview
            </p>
          </div>
          <Link to="/inventory">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider"
              data-testid="view-inventory-btn"
            >
              View Inventory
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Items */}
          <Card className="bg-card border-border/50 stat-card" data-testid="stat-total-items">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Total Items
                  </p>
                  <p className="text-4xl font-mono font-bold text-foreground">
                    {stats?.total_items || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-sm flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card 
            className={`bg-card border-border/50 stat-card ${stats?.low_stock_count > 0 ? 'border-l-4 border-l-accent' : ''}`}
            data-testid="stat-low-stock"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Low Stock
                  </p>
                  <p className={`text-4xl font-mono font-bold ${stats?.low_stock_count > 0 ? 'text-accent' : 'text-foreground'}`}>
                    {stats?.low_stock_count || 0}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${stats?.low_stock_count > 0 ? 'bg-accent/20' : 'bg-secondary'}`}>
                  <AlertTriangle className={`w-6 h-6 ${stats?.low_stock_count > 0 ? 'text-accent' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card className="bg-card border-border/50 stat-card" data-testid="stat-total-value">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Total Value
                  </p>
                  <p className="text-3xl font-mono font-bold text-accent">
                    {formatCurrency(stats?.total_value || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-sm flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="bg-card border-border/50 stat-card" data-testid="stat-categories">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Categories
                  </p>
                  <p className="text-4xl font-mono font-bold text-foreground">
                    {Object.keys(stats?.categories || {}).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary rounded-sm flex items-center justify-center">
                  <Layers className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card className="bg-card border-border/50" data-testid="category-breakdown">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl tracking-tight uppercase">
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.categories && Object.keys(stats.categories).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <div 
                      key={category}
                      className="flex items-center justify-between p-4 bg-secondary/30 border border-border/50 rounded-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center category-${category}`}>
                          {getCategoryIcon(category)}
                        </div>
                        <span className="font-medium uppercase tracking-wide text-foreground">
                          {category}
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-lg px-3">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No items yet. Add your first inventory item!</p>
                  <Link to="/inventory">
                    <Button variant="outline" className="mt-4" data-testid="add-first-item-btn">
                      Add Item
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border-border/50" data-testid="recent-activity">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl tracking-tight uppercase">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.slice(0, 5).map((activity, index) => (
                    <div 
                      key={activity.id}
                      className={`flex items-center justify-between p-3 border-l-2 border-primary/50 bg-secondary/20 animate-fade-in stagger-${index + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {activity.item_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.reason || activity.event_name || 'Used'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="font-mono">
                          -{activity.quantity_used}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
