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
  Clock,
  Settings,
  Star,
  Car
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
          <Link to="/inventory">
            <Card className="bg-card border-border/50 stat-card cursor-pointer hover:border-primary/50 transition-colors" data-testid="stat-total-items">
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
          </Link>

          {/* Low Stock */}
          <Link to="/inventory?low_stock=true">
            <Card 
              className={`bg-card border-border/50 stat-card cursor-pointer hover:border-primary/50 transition-colors ${stats?.low_stock_count > 0 ? 'border-l-4 border-l-accent' : ''}`}
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
          </Link>

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
                    <Link 
                      key={category}
                      to={`/inventory?category=${category}`}
                      data-testid={`category-link-${category}`}
                    >
                      <div 
                        className="flex items-center justify-between p-4 bg-secondary/30 border border-border/50 rounded-sm cursor-pointer hover:border-primary/50 transition-colors"
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
                    </Link>
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
              {/* Combine and sort all activity types */}
              {(() => {
                const allActivity = [];
                
                // Add usage logs (inventory usage)
                if (stats?.recent_activity) {
                  stats.recent_activity.forEach((activity) => {
                    allActivity.push({
                      type: 'usage',
                      id: activity.id,
                      link: `/inventory/${activity.item_id}`,
                      title: activity.item_name,
                      subtitle: activity.reason || activity.event_name || 'Used',
                      badge: `-${activity.quantity_used}`,
                      created_at: activity.created_at
                    });
                  });
                }
                
                // Add recent setups
                if (stats?.recent_setups) {
                  stats.recent_setups.forEach((setup) => {
                    allActivity.push({
                      type: 'setup',
                      id: setup.id,
                      link: `/vehicle/${setup.vehicle_id}/setups`,
                      title: setup.name,
                      subtitle: setup.vehicle_name,
                      badge: setup.conditions || setup.event_name || 'Setup',
                      rating: setup.rating,
                      created_at: setup.created_at
                    });
                  });
                }
                
                // Add recent repairs
                if (stats?.recent_repairs) {
                  stats.recent_repairs.forEach((repair) => {
                    allActivity.push({
                      type: 'repair',
                      id: repair.id,
                      link: `/vehicle/${repair.vehicle_id}/repairs`,
                      title: repair.cause_of_damage,
                      subtitle: repair.vehicle_name,
                      badge: repair.affected_area || 'Repair',
                      cost: repair.total_parts_cost,
                      created_at: repair.created_at
                    });
                  });
                }
                
                // Sort by created_at descending and take only top 5
                allActivity.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const top5Activity = allActivity.slice(0, 5);
                
                if (top5Activity.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {top5Activity.map((activity, index) => {
                      // Color and icon based on type
                      const config = {
                        usage: {
                          borderColor: 'border-primary/50',
                          bgColor: 'bg-primary/10',
                          icon: <Package className="w-4 h-4 text-primary" />,
                          badgeVariant: 'destructive'
                        },
                        setup: {
                          borderColor: 'border-blue-500/50',
                          bgColor: 'bg-blue-500/10',
                          icon: <Settings className="w-4 h-4 text-blue-500" />,
                          badgeVariant: 'secondary'
                        },
                        repair: {
                          borderColor: 'border-orange-500/50',
                          bgColor: 'bg-orange-500/10',
                          icon: <Wrench className="w-4 h-4 text-orange-500" />,
                          badgeVariant: 'outline'
                        }
                      };
                      
                      const c = config[activity.type];
                      
                      return (
                        <Link 
                          key={`${activity.type}-${activity.id}`}
                          to={activity.link}
                          className={`flex items-center justify-between p-3 border-l-2 ${c.borderColor} ${c.bgColor} animate-fade-in stagger-${index + 1} hover:opacity-80 transition-opacity cursor-pointer`}
                          data-testid={`activity-${activity.type}-${activity.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {c.icon}
                            <div>
                              <p className="font-medium text-foreground">
                                {activity.title}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                {activity.type !== 'usage' && <Car className="w-3 h-3" />}
                                {activity.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {activity.type === 'usage' ? (
                              <Badge variant={c.badgeVariant} className="font-mono">
                                {activity.badge}
                              </Badge>
                            ) : activity.type === 'setup' ? (
                              <div className="flex flex-col items-end gap-1">
                                {activity.rating > 0 && (
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 ${star <= activity.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <Badge variant={c.badgeVariant} className="text-xs capitalize">
                                  {activity.badge}
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                {activity.cost > 0 && (
                                  <span className="text-sm font-mono text-orange-500">
                                    {formatCurrency(activity.cost)}
                                  </span>
                                )}
                                <Badge variant={c.badgeVariant} className="text-xs capitalize border-orange-500/50 text-orange-500">
                                  {activity.badge}
                                </Badge>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
