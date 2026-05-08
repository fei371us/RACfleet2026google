import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutGrid, Truck, ClipboardList, ShieldCheck, Settings, Shield, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';

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
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';

const NAV_ITEMS = [
  { icon: LayoutGrid,  label: 'Dashboard', path: '/',          roles: [UserRole.ADMIN, UserRole.FLEET_CONTROL, UserRole.FLEET_CONTROL_SUPERVISOR, UserRole.DRIVER] },
  { icon: ClipboardList, label: 'Requester', path: '/requester', roles: [UserRole.ADMIN, UserRole.REQUESTER] },
  { icon: Settings,    label: 'Workshop',  path: '/workshop',  roles: [UserRole.ADMIN, UserRole.WORKSHOP_ADVISER] },
  { icon: ShieldCheck, label: 'Control',   path: '/control',   roles: [UserRole.ADMIN, UserRole.FLEET_CONTROL, UserRole.FLEET_CONTROL_SUPERVISOR] },
  { icon: Truck,       label: 'Driver',    path: '/driver',    roles: [UserRole.ADMIN, UserRole.DRIVER] },
  { icon: Shield,      label: 'Admin',     path: '/admin',     roles: [UserRole.ADMIN] },
];

function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const visible = NAV_ITEMS.filter(item => !user || item.roles.includes(user.role as UserRole));

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-2xl glass-panel border-t border-outline-variant/15 shadow-[0_-4px_24px_rgba(7,30,39,0.06)] flex items-center gap-1 px-1.5 pb-6 pt-2.5 overflow-x-auto">
      {visible.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex min-w-[76px] flex-1 flex-col items-center justify-center px-1 py-1.5 transition-all duration-200 active:scale-90 overflow-hidden",
              isActive ? "text-primary bg-surface-container-low rounded-xl" : "text-on-surface-variant/40"
            )}
          >
            <item.icon size={20} className="mb-0.5 shrink-0" />
            <span className="block w-full text-center font-body text-[9px] font-semibold uppercase tracking-wide truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AppShell() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <AnimatePresence>
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginPage />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"                                element={<DispatcherDashboard />} />
          <Route path="/requester"                       element={<RequesterHome />} />
          <Route path="/workshop"                        element={<WorkshopAdviserDashboard />} />
          <Route path="/control"                         element={<FleetControl />} />
          <Route path="/admin"                           element={<AdminDashboard />} />
          <Route path="/driver"                          element={<DriverHome />} />
          <Route path="/driver/job/:id"                  element={<JobDetail />} />
          <Route path="/driver/job/:id/vehicle-exterior" element={<VehicleExterior />} />
          <Route path="/driver/inspection/:id"           element={<VehicleInspection />} />
          <Route path="/jobs/new"                        element={<CreateJob />} />
          <Route path="*"                                element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
      <button
        onClick={logout}
        className="fixed top-4 right-4 z-[100] p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all shadow-lg"
        title="Logout"
      >
        <LogOut size={18} />
      </button>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-surface-container-low">
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </div>
    </Router>
  );
}
