import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  AlertTriangle,
  Wrench,
  Settings,
  Star,
  Car,
  Plus,
  ArrowRight,
  Cog,
  Droplets,
  TrendingUp,
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function DashboardPreviewA() {
  const { getAuthHeader, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [setupsByVehicle, setSetupsByVehicle] = useState({});
  const [repairsByVehicle, setRepairsByVehicle] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const [statsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/vehicles`, { headers }),
      ]);
      setStats(statsRes.data);
      setVehicles(vehiclesRes.data);

      // Fetch setups + repairs per vehicle in parallel
      const setupsMap = {};
      const repairsMap = {};
      await Promise.all(
        vehiclesRes.data.map(async (v) => {
          const [s, r] = await Promise.all([
            axios.get(`${API}/setups/vehicle/${v.id}`, { headers }).catch(() => ({ data: [] })),
            axios.get(`${API}/repairs/vehicle/${v.id}`, { headers }).catch(() => ({ data: [] })),
          ]);
          setupsMap[v.id] = s.data || [];
          repairsMap[v.id] = r.data || [];
        })
      );
      setSetupsByVehicle(setupsMap);
      setRepairsByVehicle(repairsMap);
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'parts':
        return <Cog className="w-3.5 h-3.5" />;
      case 'tools':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'fluids':
        return <Droplets className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  const getVehicleStats = (vehicleId) => {
    const setups = setupsByVehicle[vehicleId] || [];
    const repairs = repairsByVehicle[vehicleId] || [];
    const ratings = setups.map((s) => s.rating || 0).filter((r) => r > 0);
    const bestRating = ratings.length ? Math.max(...ratings) : 0;
    const lastSetup = setups.length
      ? [...setups].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
    const repairTotal = repairs.reduce((s, r) => s + (r.total_parts_cost || 0), 0);
    return {
      setupCount: setups.length,
      repairCount: repairs.length,
      bestRating,
      lastSetup,
      repairTotal,
    };
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
      <div className="space-y-6 md:space-y-8" data-testid="dashboard-preview-a">
        {/* Trial banner */}
        <div className="bg-accent/10 border-l-4 border-accent rounded-sm p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs uppercase tracking-widest text-accent font-bold">
            Preview · Option A — Pit Wall (Vehicle-Centric)
          </div>
          <div className="flex gap-2 text-xs">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground underline">
              Current
            </Link>
            <Link to="/dashboard-preview-d" className="text-muted-foreground hover:text-foreground underline">
              Preview D
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Pit Wall
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} ·{' '}
              {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} tracked
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/setups">
              <Button
                variant="outline"
                className="rounded-sm font-bold uppercase tracking-wider text-xs"
                data-testid="quick-new-setup-btn"
              >
                <Plus className="w-4 h-4 mr-1" /> Setup
              </Button>
            </Link>
            <Link to="/repairs">
              <Button
                variant="outline"
                className="rounded-sm font-bold uppercase tracking-wider text-xs"
                data-testid="quick-new-repair-btn"
              >
                <Plus className="w-4 h-4 mr-1" /> Repair
              </Button>
            </Link>
          </div>
        </div>

        {/* Vehicle hero cards */}
        {vehicles.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border/50">
            <CardContent className="p-12 text-center">
              <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No vehicles yet — add your first rally car.</p>
              <Link to="/garage">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider">
                  Go to Garage
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div
            className={`grid gap-4 ${
              vehicles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {vehicles.map((v) => {
              const vs = getVehicleStats(v.id);
              return (
                <Card
                  key={v.id}
                  className="bg-card border-border/50 hover:border-primary/50 transition-colors overflow-hidden"
                  data-testid={`vehicle-hero-${v.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Photo / icon column */}
                      <div className="w-24 sm:w-32 bg-secondary/40 flex items-center justify-center shrink-0 relative">
                        {v.photo ? (
                          <img
                            src={v.photo}
                            alt={`${v.make} ${v.model}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Car className="w-10 h-10 text-primary opacity-60" strokeWidth={1.2} />
                        )}
                      </div>
                      {/* Stats column */}
                      <div className="flex-1 p-4 md:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {v.registration || 'No rego'}
                            </p>
                            <h2 className="text-lg md:text-xl tracking-tight uppercase font-bold leading-tight">
                              {v.make} {v.model}
                            </h2>
                          </div>
                          <Link to={`/vehicle/${v.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              data-testid={`view-vehicle-${v.id}`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Setups
                            </p>
                            <p className="text-2xl font-mono font-bold text-foreground">
                              {vs.setupCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Best
                            </p>
                            <div className="flex items-center gap-1 h-7">
                              {vs.bestRating > 0 ? (
                                <>
                                  <Star className="w-4 h-4 fill-accent text-accent" />
                                  <span className="text-lg font-mono font-bold text-accent">
                                    {vs.bestRating}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-mono text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              Repairs
                            </p>
                            <p className="text-2xl font-mono font-bold text-foreground">
                              {vs.repairCount}
                            </p>
                          </div>
                        </div>

                        {vs.lastSetup ? (
                          <p className="text-xs text-muted-foreground truncate">
                            Last setup:{' '}
                            <span className="text-foreground">{vs.lastSetup.name}</span>
                            {vs.lastSetup.event_name ? ` · ${vs.lastSetup.event_name}` : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No setups yet</p>
                        )}

                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                          <Link to={`/vehicle/${v.id}/setups`} className="flex-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full text-xs uppercase tracking-wider"
                              data-testid={`vehicle-setups-btn-${v.id}`}
                            >
                              <Settings className="w-3 h-3 mr-1" /> Setups
                            </Button>
                          </Link>
                          <Link to={`/vehicle/${v.id}/repairs`} className="flex-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full text-xs uppercase tracking-wider"
                              data-testid={`vehicle-repairs-btn-${v.id}`}
                            >
                              <Wrench className="w-3 h-3 mr-1" /> Repairs
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Inventory health strip */}
        <Card className="bg-card border-border/50" data-testid="inventory-health-strip">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Inventory Health
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-foreground">
                    {stats?.total_items || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">items ·</span>
                  <span className="text-lg font-mono font-bold text-accent">
                    {formatCurrency(stats?.total_value)}
                  </span>
                  {stats?.low_stock_count > 0 && (
                    <Badge variant="destructive" className="font-mono">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {stats.low_stock_count} low
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(stats?.categories || {}).map(([cat, count]) => (
                  <Link
                    key={cat}
                    to={`/inventory?category=${cat}`}
                    data-testid={`inv-category-${cat}`}
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border border-border/50 rounded-sm hover:border-primary/50 transition-colors">
                      <div className={`category-${cat} w-6 h-6 rounded-sm flex items-center justify-center`}>
                        {getCategoryIcon(cat)}
                      </div>
                      <span className="text-xs uppercase tracking-wide">{cat}</span>
                      <span className="text-xs font-mono font-bold">{count}</span>
                    </div>
                  </Link>
                ))}
                <Link to="/inventory">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs uppercase tracking-wider"
                    data-testid="manage-inventory-btn"
                  >
                    Manage <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity (compact) */}
        <RecentActivityPanel stats={stats} formatCurrency={formatCurrency} />
      </div>
    </Layout>
  );
}

function RecentActivityPanel({ stats, formatCurrency }) {
  const all = [];
  (stats?.recent_activity || []).forEach((a) =>
    all.push({
      type: 'usage',
      id: a.id,
      link: `/inventory/${a.item_id}`,
      title: a.item_name,
      subtitle: a.reason || a.event_name || 'Used',
      meta: `-${a.quantity_used}`,
      created_at: a.created_at,
    })
  );
  (stats?.recent_setups || []).forEach((s) =>
    all.push({
      type: 'setup',
      id: s.id,
      link: `/vehicle/${s.vehicle_id}/setups`,
      title: s.name,
      subtitle: s.vehicle_name,
      rating: s.rating,
      meta: s.conditions || s.event_name || 'Setup',
      created_at: s.created_at,
    })
  );
  (stats?.recent_repairs || []).forEach((r) =>
    all.push({
      type: 'repair',
      id: r.id,
      link: `/vehicle/${r.vehicle_id}/repairs`,
      title: r.cause_of_damage,
      subtitle: r.vehicle_name,
      cost: r.total_parts_cost,
      meta: r.affected_area || 'Repair',
      created_at: r.created_at,
    })
  );

  const sorted = all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  if (sorted.length === 0) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  const config = {
    usage: { color: 'border-primary/50 bg-primary/10', icon: <Package className="w-4 h-4 text-primary" /> },
    setup: { color: 'border-blue-500/50 bg-blue-500/10', icon: <Settings className="w-4 h-4 text-blue-500" /> },
    repair: {
      color: 'border-orange-500/50 bg-orange-500/10',
      icon: <Wrench className="w-4 h-4 text-orange-500" />,
    },
  };

  return (
    <Card className="bg-card border-border/50" data-testid="recent-activity-preview-a">
      <CardContent className="p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Recent Activity
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sorted.map((a) => {
            const c = config[a.type];
            return (
              <Link
                key={`${a.type}-${a.id}`}
                to={a.link}
                className={`flex items-center justify-between p-2.5 border-l-2 ${c.color} hover:opacity-80 transition-opacity`}
                data-testid={`activity-${a.type}-${a.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.icon}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.subtitle}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {a.type === 'usage' && (
                    <Badge variant="destructive" className="font-mono text-xs">
                      {a.meta}
                    </Badge>
                  )}
                  {a.type === 'setup' && a.rating > 0 && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= a.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {a.type === 'repair' && a.cost > 0 && (
                    <span className="text-xs font-mono text-orange-500">
                      {formatCurrency(a.cost)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
