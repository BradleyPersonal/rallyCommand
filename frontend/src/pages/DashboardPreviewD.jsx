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
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function DashboardPreviewD() {
  const { getAuthHeader, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [inventory, setInventory] = useState([]);
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
      const [statsRes, vehiclesRes, invRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/vehicles`, { headers }),
        axios.get(`${API}/inventory`, { headers }),
      ]);
      setStats(statsRes.data);
      setVehicles(vehiclesRes.data);
      setInventory(invRes.data);

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

  // Compute attention items
  const computeAlerts = () => {
    const alerts = [];

    // Low stock items (top 3)
    const lowStock = inventory
      .filter((i) => i.quantity <= i.min_stock)
      .slice(0, 3)
      .map((i) => ({
        kind: 'low-stock',
        title: `${i.name} running low`,
        detail: `${i.quantity} of ${i.min_stock} min`,
        link: `/inventory/${i.id}`,
        action: 'Restock',
      }));
    alerts.push(...lowStock);

    // Unrated setups (last 5 setups with rating == 0)
    const unrated = (stats?.recent_setups || [])
      .filter((s) => !s.rating || s.rating === 0)
      .slice(0, 2)
      .map((s) => ({
        kind: 'unrated',
        title: `Rate "${s.name}"`,
        detail: `${s.vehicle_name}${s.event_name ? ` · ${s.event_name}` : ''}`,
        link: `/vehicle/${s.vehicle_id}/setups`,
        action: 'Rate now',
      }));
    alerts.push(...unrated);

    return alerts.slice(0, 4);
  };

  const alerts = computeAlerts();

  // Aggregate counts
  const totalSetups = Object.values(setupsByVehicle).reduce((s, arr) => s + arr.length, 0);
  const totalRepairs = Object.values(repairsByVehicle).reduce((s, arr) => s + arr.length, 0);
  const repairCostYtd = Object.values(repairsByVehicle).reduce(
    (s, arr) => s + arr.reduce((s2, r) => s2 + (r.total_parts_cost || 0), 0),
    0
  );
  const allRatings = Object.values(setupsByVehicle)
    .flat()
    .map((s) => s.rating || 0)
    .filter((r) => r > 0);
  const bestRating = allRatings.length ? Math.max(...allRatings) : 0;

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
      <div className="space-y-6 md:space-y-8" data-testid="dashboard-preview-d">
        {/* Trial banner */}
        <div className="bg-accent/10 border-l-4 border-accent rounded-sm p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs uppercase tracking-widest text-accent font-bold">
            Preview · Option D — Hybrid (Alerts + KPIs + Vehicles)
          </div>
          <div className="flex gap-2 text-xs">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground underline">
              Current
            </Link>
            <Link to="/dashboard-preview-a" className="text-muted-foreground hover:text-foreground underline">
              Preview A
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Command Center
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} ·{' '}
              {alerts.length > 0
                ? `${alerts.length} item${alerts.length === 1 ? '' : 's'} need attention`
                : 'All systems go'}
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

        {/* Attention Required */}
        {alerts.length > 0 ? (
          <Card
            className="bg-card border-border/50 border-l-4 border-l-primary"
            data-testid="attention-panel"
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-primary" />
                <p className="text-xs uppercase tracking-widest text-primary font-bold">
                  Attention Required
                </p>
              </div>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <Link
                    key={i}
                    to={a.link}
                    className="flex items-center justify-between p-2.5 bg-secondary/30 border border-border/50 rounded-sm hover:border-primary/50 transition-colors"
                    data-testid={`alert-${a.kind}-${i}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {a.kind === 'low-stock' ? (
                        <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Star className="w-4 h-4 text-accent shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider shrink-0 ml-2"
                    >
                      {a.action} <ArrowRight className="w-3 h-3 ml-1" />
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="bg-card border-border/50 border-l-4 border-l-green-500/60"
            data-testid="all-clear-panel"
          >
            <CardContent className="p-4 md:p-5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">All systems go</p>
                <p className="text-xs text-muted-foreground">No alerts · ready for the next event</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI row — module-balanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Link to="/garage">
            <Card
              className="bg-card border-border/50 stat-card cursor-pointer hover:border-primary/50 transition-colors"
              data-testid="kpi-vehicles"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase mb-1 md:mb-2">
                      Vehicles
                    </p>
                    <p className="text-2xl md:text-4xl font-mono font-bold text-foreground">
                      {vehicles.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">tracked</p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary rounded-sm flex items-center justify-center">
                    <Car className="w-4 h-4 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/setups">
            <Card
              className="bg-card border-border/50 stat-card cursor-pointer hover:border-primary/50 transition-colors"
              data-testid="kpi-setups"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase mb-1 md:mb-2">
                      Setups
                    </p>
                    <p className="text-2xl md:text-4xl font-mono font-bold text-foreground">
                      {totalSetups}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      {bestRating > 0 ? (
                        <>
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          <span>{bestRating} best</span>
                        </>
                      ) : (
                        'no ratings yet'
                      )}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary rounded-sm flex items-center justify-center">
                    <Settings className="w-4 h-4 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/repairs">
            <Card
              className="bg-card border-border/50 stat-card cursor-pointer hover:border-primary/50 transition-colors"
              data-testid="kpi-repairs"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase mb-1 md:mb-2">
                      Repairs
                    </p>
                    <p className="text-2xl md:text-4xl font-mono font-bold text-foreground">
                      {totalRepairs}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatCurrency(repairCostYtd)} cost
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary rounded-sm flex items-center justify-center">
                    <Wrench className="w-4 h-4 md:w-6 md:h-6 text-orange-500" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventory">
            <Card
              className={`bg-card border-border/50 stat-card cursor-pointer hover:border-primary/50 transition-colors ${
                stats?.low_stock_count > 0 ? 'border-l-4 border-l-accent' : ''
              }`}
              data-testid="kpi-inventory"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground tracking-widest uppercase mb-1 md:mb-2">
                      Inventory
                    </p>
                    <p className="text-2xl md:text-4xl font-mono font-bold text-foreground">
                      {stats?.total_items || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {stats?.low_stock_count > 0 ? (
                        <span className="text-accent">{stats.low_stock_count} low ⚠</span>
                      ) : (
                        formatCurrency(stats?.total_value)
                      )}
                    </p>
                  </div>
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary rounded-sm flex items-center justify-center">
                    <Package className="w-4 h-4 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Bottom split: Vehicle cards | Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Compact vehicle cards */}
          <Card className="bg-card border-border/50" data-testid="vehicle-list-panel">
            <CardContent className="p-4 md:p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Fleet
              </p>
              {vehicles.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Car className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm mb-3">No vehicles yet</p>
                  <Link to="/garage">
                    <Button variant="outline" size="sm">
                      Add Vehicle
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((v) => {
                    const setups = setupsByVehicle[v.id] || [];
                    const repairs = repairsByVehicle[v.id] || [];
                    const ratings = setups.map((s) => s.rating || 0).filter((r) => r > 0);
                    const best = ratings.length ? Math.max(...ratings) : 0;
                    return (
                      <Link
                        key={v.id}
                        to={`/vehicle/${v.id}`}
                        className="flex items-center justify-between p-3 bg-secondary/30 border border-border/50 rounded-sm hover:border-primary/50 transition-colors"
                        data-testid={`vehicle-row-${v.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-secondary rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
                            {v.photo ? (
                              <img
                                src={v.photo}
                                alt={v.make}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Car className="w-5 h-5 text-primary opacity-60" strokeWidth={1.2} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium uppercase tracking-wide text-sm truncate">
                              {v.make} {v.model}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {setups.length} setups · {repairs.length} repairs
                              {best > 0 && (
                                <>
                                  {' · '}
                                  <Star className="inline w-3 h-3 fill-accent text-accent" />{' '}
                                  {best}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <RecentActivityPanel stats={stats} formatCurrency={formatCurrency} />
        </div>
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
      created_at: r.created_at,
    })
  );

  const sorted = all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  const config = {
    usage: { color: 'border-primary/50 bg-primary/10', icon: <Package className="w-4 h-4 text-primary" /> },
    setup: { color: 'border-blue-500/50 bg-blue-500/10', icon: <Settings className="w-4 h-4 text-blue-500" /> },
    repair: {
      color: 'border-orange-500/50 bg-orange-500/10',
      icon: <Wrench className="w-4 h-4 text-orange-500" />,
    },
  };

  return (
    <Card className="bg-card border-border/50" data-testid="recent-activity-preview-d">
      <CardContent className="p-4 md:p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Recent Activity
        </p>
        {sorted.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
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
        )}
      </CardContent>
    </Card>
  );
}
