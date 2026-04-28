import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useVehicleFilter } from '@/context/VehicleFilterContext';
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

export default function DashboardPage() {
  const { getAuthHeader, user } = useAuth();
  const { selectedVehicle } = useVehicleFilter();
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

  const getVehicleStats = (vehicleId) => {
    const setups = setupsByVehicle[vehicleId] || [];
    const repairs = repairsByVehicle[vehicleId] || [];
    const ratings = setups.map((s) => s.rating || 0).filter((r) => r > 0);
    const bestRating = ratings.length ? Math.max(...ratings) : 0;
    const lastSetup = setups.length
      ? [...setups].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
    return {
      setupCount: setups.length,
      repairCount: repairs.length,
      bestRating,
      lastSetup,
    };
  };

  // Filter when a specific vehicle is selected via header dropdown
  const visibleVehicles = selectedVehicle
    ? vehicles.filter((v) => v.id === selectedVehicle.id)
    : vehicles;

  // Inventory filtered by selected vehicle
  const filteredInventory = selectedVehicle
    ? inventory.filter(
        (i) =>
          i.vehicle_ids?.includes(selectedVehicle.id) ||
          !i.vehicle_ids ||
          i.vehicle_ids.length === 0
      )
    : inventory;

  // Aggregate counts respecting vehicle filter
  const visibleSetups = selectedVehicle
    ? setupsByVehicle[selectedVehicle.id] || []
    : Object.values(setupsByVehicle).flat();
  const visibleRepairs = selectedVehicle
    ? repairsByVehicle[selectedVehicle.id] || []
    : Object.values(repairsByVehicle).flat();

  const totalSetups = visibleSetups.length;
  const totalRepairs = visibleRepairs.length;
  const repairCostTotal = visibleRepairs.reduce((s, r) => s + (r.total_parts_cost || 0), 0);
  const ratings = visibleSetups.map((s) => s.rating || 0).filter((r) => r > 0);
  const bestRating = ratings.length ? Math.max(...ratings) : 0;

  const totalItems = filteredInventory.length;
  const lowStockCount = filteredInventory.filter((i) => i.quantity <= i.min_stock).length;
  const totalValue = filteredInventory.reduce((s, i) => s + i.price * i.quantity, 0);

  // Compute attention items
  const computeAlerts = () => {
    const alerts = [];
    const lowStock = filteredInventory
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

    const unrated = visibleSetups
      .filter((s) => !s.rating || s.rating === 0)
      .slice(0, 2)
      .map((s) => {
        const v = vehicles.find((vv) => vv.id === s.vehicle_id);
        return {
          kind: 'unrated',
          title: `Rate "${s.name}"`,
          detail: v ? `${v.make} ${v.model}` : '',
          link: `/vehicle/${s.vehicle_id}/setups`,
          action: 'Rate now',
        };
      });
    alerts.push(...unrated);

    return alerts.slice(0, 4);
  };

  const alerts = computeAlerts();

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
      <div className="space-y-6 md:space-y-8" data-testid="dashboard-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
              Pit Wall
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} ·{' '}
              {visibleVehicles.length} vehicle{visibleVehicles.length === 1 ? '' : 's'} tracked
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
        {visibleVehicles.length === 0 ? (
          <Card className="bg-card border-dashed border-2 border-border/50">
            <CardContent className="p-12 text-center">
              <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No vehicles yet — add your first rally car.</p>
              <Link to="/garage">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-bold uppercase tracking-wider"
                  data-testid="add-first-vehicle-btn"
                >
                  Go to Garage
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div
            className={`grid gap-4 ${
              visibleVehicles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {visibleVehicles.map((v) => {
              const vs = getVehicleStats(v.id);
              return (
                <Card
                  key={v.id}
                  className="bg-card border-border/50 hover:border-primary/50 transition-colors overflow-hidden"
                  data-testid={`vehicle-hero-${v.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex">
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

        {/* KPI tiles: Setups · Repairs · Inventory */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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
                      {formatCurrency(repairCostTotal)} cost
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
                lowStockCount > 0 ? 'border-l-4 border-l-accent' : ''
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
                      {totalItems}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {lowStockCount > 0 ? (
                        <span className="text-accent">{lowStockCount} low ⚠</span>
                      ) : (
                        formatCurrency(totalValue)
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

        {/* Recent activity */}
        <RecentActivityPanel
          stats={stats}
          formatCurrency={formatCurrency}
          selectedVehicle={selectedVehicle}
          inventory={inventory}
        />
      </div>
    </Layout>
  );
}

function RecentActivityPanel({ stats, formatCurrency, selectedVehicle, inventory }) {
  const all = [];
  (stats?.recent_activity || []).forEach((a) => {
    if (selectedVehicle) {
      const item = inventory.find((i) => i.id === a.item_id);
      if (
        !item ||
        (item.vehicle_ids?.length > 0 && !item.vehicle_ids.includes(selectedVehicle.id))
      ) {
        return;
      }
    }
    all.push({
      type: 'usage',
      id: a.id,
      link: `/inventory/${a.item_id}`,
      title: a.item_name,
      subtitle: a.reason || a.event_name || 'Used',
      meta: `-${a.quantity_used}`,
      created_at: a.created_at,
    });
  });
  (stats?.recent_setups || []).forEach((s) => {
    if (selectedVehicle && s.vehicle_id !== selectedVehicle.id) return;
    all.push({
      type: 'setup',
      id: s.id,
      link: `/vehicle/${s.vehicle_id}/setups`,
      title: s.name,
      subtitle: s.vehicle_name,
      rating: s.rating,
      created_at: s.created_at,
    });
  });
  (stats?.recent_repairs || []).forEach((r) => {
    if (selectedVehicle && r.vehicle_id !== selectedVehicle.id) return;
    all.push({
      type: 'repair',
      id: r.id,
      link: `/vehicle/${r.vehicle_id}/repairs`,
      title: r.cause_of_damage,
      subtitle: r.vehicle_name,
      cost: r.total_parts_cost,
      created_at: r.created_at,
    });
  });

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
    <Card className="bg-card border-border/50" data-testid="recent-activity">
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
        )}
      </CardContent>
    </Card>
  );
}
