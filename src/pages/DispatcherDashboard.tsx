import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Clock, ShieldCheck, Plus, Map as MapIcon, Bell, Filter, MessageSquare, MoreVertical, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Job, JobStatus } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import FleetMapView from '../components/FleetMapView';

export default function DispatcherDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState({
    status: 'all',
    vehicle: 'all',
    driver: 'all',
    priority: 'all',
    dateRange: 'all' // simplified for now or I can add specific dates
  });

  useEffect(() => {
    api.get<Job[]>('/api/jobs')
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Active Jobs', value: jobs.filter(j => j.status === 'in_transit').length, icon: Truck, trend: '+2', color: 'text-primary' },
    { label: 'Pending', value: jobs.filter(j => j.status === 'pending').length, icon: Clock, color: 'text-on-surface' },
    { label: 'Drivers Online', value: 8, total: 12, icon: ShieldCheck, pulse: true, color: 'text-on-surface' },
  ];

  const uniqueVehicles = Array.from(new Set(jobs.map(j => j.vehicle_name))).sort();
  const uniqueDrivers = Array.from(new Set(jobs.map(j => j.driver_name))).sort();

  const filteredJobs = jobs.filter(job => {
    const statusMatch = searchParams.status === 'all' || job.status === searchParams.status;
    const vehicleMatch = searchParams.vehicle === 'all' || job.vehicle_name === searchParams.vehicle;
    const driverMatch = searchParams.driver === 'all' || job.driver_name === searchParams.driver;
    const priorityMatch = searchParams.priority === 'all' || job.priority === searchParams.priority;
    
    // Simple date range check (e.g., today vs all)
    let dateMatch = true;
    if (searchParams.dateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dateMatch = job.created_at.startsWith(today);
    }

    return statusMatch && vehicleMatch && driverMatch && priorityMatch && dateMatch;
  });

  return (
    <div className="flex-1 pb-32">
       <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-primary">
            <TrendingUp size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface lowercase">C&P Rent-A-Car fleet.</h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-8">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary">Dashboard</Link>
            <Link to="/jobs" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-primary">Jobs</Link>
            <Link to="/reports" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-primary">Reports</Link>
          </nav>
          <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden border-2 border-surface-container-highest shadow-sm">
            <img src="https://i.pravatar.cc/100?u=dispatcher" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Summary Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container-lowest rounded-[2rem] p-8 relative overflow-hidden group kinetic-shadow"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <stat.icon size={96} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">{stat.label}</span>
                  {stat.pulse && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />}
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className={`text-5xl font-extrabold tracking-tighter font-headline ${stat.color}`}>{stat.value.toString().padStart(2, '0')}</span>
                  {stat.trend && (
                    <span className="text-sm font-semibold text-secondary flex items-center">
                      <TrendingUp size={12} className="mr-1" />
                      {stat.trend}
                    </span>
                  )}
                  {stat.total && <span className="text-xs font-medium text-on-surface-variant">/ {stat.total} Total</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Quick Actions */}
        <section className="bg-surface-container p-2 rounded-xl flex flex-wrap gap-2 items-center">
          <Link to="/jobs/new" className="gradient-btn px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
            <Plus size={18} />
            New Job
          </Link>
          <button 
            onClick={() => setShowMap(true)}
            className="bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-sm uppercase tracking-wide active:scale-95 transition-all shadow-sm"
          >
            <MapIcon size={18} />
            Map View
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-sm uppercase tracking-wide active:scale-95 transition-all",
              showFilters && "bg-primary text-white hover:bg-primary/90"
            )}
          >
            <Filter size={18} />
            Filters
          </button>
          <div className="ml-auto flex items-center gap-1 bg-surface-container-highest/50 p-1 rounded-lg">
            {(['all', 'pending', 'in_transit', 'delayed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSearchParams({ ...searchParams, status: s })}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                  searchParams.status === s 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-highest"
                )}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* Collapsible Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline mb-2 block">Vehicle</label>
                  <select 
                    value={searchParams.vehicle}
                    onChange={(e) => setSearchParams({ ...searchParams, vehicle: e.target.value })}
                    className="w-full bg-surface-container p-3 rounded-xl text-xs font-bold border-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Vehicles</option>
                    {uniqueVehicles.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline mb-2 block">Driver</label>
                  <select 
                    value={searchParams.driver}
                    onChange={(e) => setSearchParams({ ...searchParams, driver: e.target.value })}
                    className="w-full bg-surface-container p-3 rounded-xl text-xs font-bold border-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Drivers</option>
                    {uniqueDrivers.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline mb-2 block">Priority</label>
                  <select 
                    value={searchParams.priority}
                    onChange={(e) => setSearchParams({ ...searchParams, priority: e.target.value })}
                    className="w-full bg-surface-container p-3 rounded-xl text-xs font-bold border-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline mb-2 block">Date Range</label>
                  <select 
                    value={searchParams.dateRange}
                    onChange={(e) => setSearchParams({ ...searchParams, dateRange: e.target.value })}
                    className="w-full bg-surface-container p-3 rounded-xl text-xs font-bold border-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setSearchParams({ status: 'all', vehicle: 'all', driver: 'all', priority: 'all', dateRange: 'all' })}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Job List */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-extrabold tracking-tight font-headline">Recent Active Jobs</h2>
            <button className="text-primary text-sm font-bold uppercase tracking-widest hover:underline">View All Records</button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center italic text-outline">Loading fleet data...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-outline gap-4 bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20">
                <Filter size={48} className="opacity-10" />
                <p className="font-bold text-sm uppercase tracking-widest">No matching jobs found</p>
                <button 
                  onClick={() => setSearchParams({ status: 'all', vehicle: 'all', driver: 'all', priority: 'all', dateRange: 'all' })}
                  className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  Reset All Filters
                </button>
              </div>
            ) : filteredJobs.map((job, i) => (
              <Link
                key={job.id}
                to={`/driver/job/${job.id}`}
                className="no-underline"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:kinetic-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-surface-container-highest ${job.status === 'delayed' ? 'text-error' : 'text-primary'}`}>
                    {job.type === 'Workshop' ? <AlertTriangle /> : <Truck />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-surface-container text-on-surface-variant px-2 py-0.5 rounded uppercase tracking-tighter">{job.id}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 ${
                        job.status === 'delayed' ? 'text-error' : job.status === 'in_transit' ? 'text-secondary' : 'text-primary'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          job.status === 'delayed' ? 'bg-error' : job.status === 'in_transit' ? 'bg-secondary' : 'bg-primary'
                        }`} />
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{job.vehicle_name}</h3>
                    <p className="text-sm text-on-surface-variant">Assigned to: <span className="font-semibold text-on-surface">{job.driver_name}</span></p>
                    {job.driver_note && (
                      <div className="mt-2 p-3 bg-surface-container-high/50 rounded-xl border-l-4 border-primary">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter mb-1 flex items-center gap-2">
                          <MessageSquare size={12} />
                          Driver Update
                        </p>
                        <p className="text-sm italic text-on-surface">"{job.driver_note}"</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-outline tracking-widest">
                      {job.status === 'delayed' ? 'Delay Reason' : 'ETA Arrival'}
                    </p>
                    <p className={`text-lg font-black ${job.status === 'delayed' ? 'text-error' : 'text-primary'}`}>{job.eta}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface-variant">
                      <MessageSquare size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface-variant">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Map View Overlay Modal */}
      <AnimatePresence>
        {showMap && (
          <FleetMapView onClose={() => setShowMap(false)} />
        )}
      </AnimatePresence>

      {/* Map View Overlay Bubble (Bottom Right) */}
      <div 
        className="fixed bottom-24 right-8 hidden lg:block z-40 group cursor-pointer"
        onClick={() => setShowMap(true)}
      >
        <div className="relative">
          <div className="w-64 h-64 bg-surface-container-lowest rounded-full overflow-hidden shadow-2xl shadow-primary/10 border-4 border-white transition-all group-hover:scale-105">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" 
              alt="Map" 
              className="w-full h-full object-cover grayscale brightness-50" 
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-primary-container text-on-primary-container p-2 rounded-lg shadow-lg">
                <MapIcon size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
