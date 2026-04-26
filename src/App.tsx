import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Truck, BarChart3, User, Menu, Bell, Plus, Map as MapIcon, ChevronRight, ClipboardList, ShieldCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { cn } from './lib/utils';

// Pages (to be implemented)
import DispatcherDashboard from './pages/DispatcherDashboard';
import DriverHome from './pages/DriverHome';
import CreateJob from './pages/CreateJob';
import JobDetail from './pages/JobDetail';
import VehicleInspection from './pages/VehicleInspection';
import VehicleExterior from './pages/VehicleExterior';
import RequesterHome from './pages/RequesterHome';
import FleetControl from './pages/FleetControl';
import WorkshopAdviserDashboard from './pages/WorkshopAdviserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import { User as UserType, UserRole } from './types';
import { Shield, LogOut } from 'lucide-react';

function BottomNav({ user }: { user: UserType | null }) {
  const location = useLocation();
  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/', roles: [UserRole.ADMIN, UserRole.FLEET_CONTROL, UserRole.FLEET_CONTROL_SUPERVISOR] },
    { icon: ClipboardList, label: 'Requester', path: '/requester', roles: [UserRole.ADMIN, UserRole.REQUESTER] },
    { icon: Settings, label: 'Workshop', path: '/workshop', roles: [UserRole.ADMIN, UserRole.WORKSHOP_ADVISER] },
    { icon: ShieldCheck, label: 'Control', path: '/control', roles: [UserRole.ADMIN, UserRole.FLEET_CONTROL, UserRole.FLEET_CONTROL_SUPERVISOR] },
    { icon: Truck, label: 'Driver', path: '/driver', roles: [UserRole.ADMIN, UserRole.DRIVER] },
    { icon: Shield, label: 'Admin', path: '/admin', roles: [UserRole.ADMIN] },
  ];

  const visibleItems = navItems.filter(item => !user || item.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-2xl glass-panel border-t border-outline-variant/15 shadow-[0_-4px_24px_rgba(7,30,39,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
      {visibleItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path === '/driver' && location.pathname.startsWith('/driver'));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-2 transition-all duration-200 active:scale-90",
              isActive ? "text-primary bg-surface-container-low rounded-xl" : "text-on-surface-variant/40"
            )}
          >
            <item.icon size={24} className="mb-1" />
            <span className="font-body text-[10px] font-semibold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('fleet_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fleet_user');
    setCurrentUser(null);
  };

  if (!authChecked) return null;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-surface-container-low">
        <AnimatePresence>
          {!currentUser && <LoginPage onLoginSuccess={setCurrentUser} />}
        </AnimatePresence>

        {currentUser && (
          <>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<DispatcherDashboard />} />
                <Route path="/requester" element={<RequesterHome />} />
                <Route path="/workshop" element={<WorkshopAdviserDashboard />} />
                <Route path="/control" element={<FleetControl />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/driver" element={<DriverHome />} />
                <Route path="/driver/job/:id" element={<JobDetail />} />
                <Route path="/driver/job/:id/vehicle-exterior" element={<VehicleExterior />} />
                <Route path="/driver/inspection/:id" element={<VehicleInspection />} />
                <Route path="/jobs/new" element={<CreateJob />} />
              </Routes>
            </AnimatePresence>
            <BottomNav user={currentUser} />
            <button 
              onClick={handleLogout}
              className="fixed top-4 right-4 z-[100] p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all shadow-lg"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </Router>
  );
}
