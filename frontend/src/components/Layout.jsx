import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useVehicleFilter } from '@/context/VehicleFilterContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeedbackDialog from '@/components/FeedbackDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Gauge, 
  LayoutDashboard, 
  Package, 
  Car,
  Wrench,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  MessageSquarePlus,
  Bug,
  Lightbulb,
  Eye,
  CheckCircle2
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Main nav items (without Garage - it moves to the right)
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/setups', label: 'Setups', icon: Settings },
  { path: '/repairs', label: 'Repairs', icon: Wrench },
];

export const Layout = ({ children }) => {
  const { user, logout, getAuthHeader } = useAuth();
  const { selectedVehicle, selectVehicle, clearFilter } = useVehicleFilter();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  // Fetch vehicles for the dropdown
  useEffect(() => {
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
    
    fetchVehicles();
  }, [getAuthHeader]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleVehicleSelect = (vehicle) => {
    selectVehicle(vehicle);
  };

  const handleAllVehicles = () => {
    clearFilter();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 md:gap-3" data-testid="logo-link">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-sm flex items-center justify-center">
                <Gauge className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg tracking-tight uppercase text-foreground leading-none">
                  RallyCommand
                </h1>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                  Inventory Control
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={`nav-item px-4 ${isActive(item.path) ? 'active bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Right Side Controls */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Garage Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={selectedVehicle ? "default" : "outline"}
                    size="sm"
                    className={`gap-1 md:gap-2 px-2 md:px-3 ${selectedVehicle ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-border'}`}
                    data-testid="garage-menu-btn"
                  >
                    <Car className="w-4 h-4" />
                    {/* Hide text on mobile, show on sm+ */}
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Garage'}
                    </span>
                    <ChevronDown className="w-3 h-3 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* View Garage Option */}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/garage" className="flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
                      View Garage
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Vehicle Options */}
                  {vehicles.length > 0 ? (
                    <>
                      {vehicles.map((vehicle) => (
                        <DropdownMenuItem 
                          key={vehicle.id}
                          onClick={() => handleVehicleSelect(vehicle)}
                          className="cursor-pointer flex items-center justify-between"
                          data-testid={`select-vehicle-${vehicle.id}`}
                        >
                          <span className="flex items-center">
                            <Car className="w-4 h-4 mr-2 text-muted-foreground" />
                            {vehicle.make} {vehicle.model}
                          </span>
                          {selectedVehicle?.id === vehicle.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      
                      <DropdownMenuSeparator />
                      
                      {/* All Vehicles Option */}
                      <DropdownMenuItem 
                        onClick={handleAllVehicles}
                        className="cursor-pointer flex items-center justify-between"
                        data-testid="select-all-vehicles"
                      >
                        <span className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                          All Vehicles
                        </span>
                        {!selectedVehicle && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        )}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem disabled className="text-muted-foreground">
                      No vehicles added yet
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Feedback Button - Hidden on mobile, shown in burger menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="hidden md:flex border-primary/50 text-primary hover:bg-primary/10 hover:text-primary gap-2"
                    data-testid="feedback-menu-btn"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span className="hidden lg:inline">Feedback</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem 
                    onClick={() => setFeedbackDialogOpen(true)}
                    className="cursor-pointer"
                    data-testid="report-bug-btn"
                  >
                    <Bug className="w-4 h-4 mr-2 text-red-500" />
                    Report a Bug
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFeedbackDialogOpen(true)}
                    className="cursor-pointer"
                    data-testid="suggest-feature-btn"
                  >
                    <Lightbulb className="w-4 h-4 mr-2 text-blue-500" />
                    Suggest a Feature
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Account Menu - Hidden on mobile, shown in burger menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex gap-2 px-2" data-testid="user-menu-btn">
                    <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="hidden lg:inline text-foreground max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/account" data-testid="account-settings-link">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {selectedVehicle && (
            <div className="pb-2 -mt-1">
              <Badge 
                variant="secondary" 
                className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs"
                data-testid="active-filter-badge"
              >
                <Car className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Filtering:</span> {selectedVehicle.make} {selectedVehicle.model}
                <button 
                  onClick={clearFilter}
                  className="ml-2 hover:text-blue-300"
                  data-testid="clear-filter-btn"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {/* Navigation Items */}
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-12 text-base ${isActive(item.path) ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {/* Mobile Garage Link */}
              <Link 
                to="/garage"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-12 text-base ${isActive('/garage') ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                >
                  <Car className="w-5 h-5 mr-3" />
                  Garage
                </Button>
              </Link>

              <div className="border-t border-border my-2 pt-2">
                {/* Feedback Options */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-base text-muted-foreground"
                  onClick={() => {
                    setFeedbackDialogOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <MessageSquarePlus className="w-5 h-5 mr-3" />
                  Send Feedback
                </Button>
              </div>

              {/* User Profile Section */}
              <div className="border-t border-border pt-3 mt-2">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded-sm flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  data-testid="mobile-logout-btn"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-4 md:py-8">
        {children}
      </main>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackDialogOpen} 
        onClose={() => setFeedbackDialogOpen(false)} 
      />
    </div>
  );
};

export default Layout;
