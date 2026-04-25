import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, UserCheck, ShieldCheck, Search, ChevronRight, AlertCircle, CheckCircle2, UserPlus, X, Filter, Plus } from 'lucide-react';
import { Job, Vehicle } from '../types';
import { cn } from '../lib/utils';

interface Driver {
  id: string;
  name: string;
  status: 'available' | 'on_job' | 'offline';
  assigned_vehicle?: string;
  avatar: string;
}

export default function FleetControl() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string; status: 'available' | 'on_job' | 'offline'; avatar: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(res => res.json()),
      fetch('/api/vehicles').then(res => res.json()),
      fetch('/api/users').then(res => res.json())
    ]).then(([jobsData, vehiclesData, usersData]) => {
      setJobs(jobsData);
      setVehicles(vehiclesData);
      
      // Filter for drivers and map to UI structure
      const activeJobsByDriver = jobsData.filter((j: Job) => j.status !== 'completed').map((j: Job) => j.driver_name);
      
      const driversData = usersData
        .filter((u: any) => u.role === 'driver')
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          status: activeJobsByDriver.includes(u.name) ? 'on_job' : 'available',
          avatar: `https://i.pravatar.cc/100?u=${u.id}`
        }));
        
      setDrivers(driversData);
      setLoading(false);
    });
  }, []);

  const handleAssignDriver = async (driverName: string) => {
    if (!selectedJob) return;
    setAssigning(true);
    
    try {
      // We need a specific endpoint for driver assignment or use the general patch
      // For now we'll use the patch endpoint but it needs to support driver_name
      await fetch(`/api/jobs/${selectedJob.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_name: driverName })
      });
      
      // Refresh local state
      setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, driver_name: driverName } : j));
      setSelectedJob(null);
    } catch (error) {
      console.error('Failed to assign driver:', error);
    } finally {
      setAssigning(false);
    }
  };

  const unassignedJobs = jobs.filter(j => !j.driver_name || j.driver_name === 'Unassigned');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  return (
    <div className="flex-1 pb-32">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Fleet Control</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {drivers.slice(0, 3).map(d => (
              <img key={d.id} src={d.avatar} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest" alt={d.name} />
            ))}
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold">+{drivers.length - 3}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Command Center Status */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest rounded-[2.5rem] p-10 kinetic-shadow relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
               <div className="max-w-md">
                 <h2 className="text-3xl font-black tracking-tight font-headline text-on-surface mb-2 uppercase">Command Center</h2>
                 <p className="text-on-surface-variant font-medium text-sm leading-relaxed italic">Real-time driver orchestration. Assign personnel to pending missions and monitor operational availability across the fleet.</p>
               </div>
               <div className="flex gap-4">
                 <div className="bg-surface-container-high/50 p-6 rounded-[2rem] text-center min-w-[120px]">
                   <p className="text-[10px] font-black uppercase text-outline mb-1">Queue</p>
                   <p className="text-4xl font-black font-headline text-primary">{unassignedJobs.length.toString().padStart(2, '0')}</p>
                 </div>
                 <div className="bg-surface-container-high/50 p-6 rounded-[2rem] text-center min-w-[120px]">
                   <p className="text-[10px] font-black uppercase text-outline mb-1">Available</p>
                   <p className="text-4xl font-black font-headline text-secondary">{availableDrivers.length.toString().padStart(2, '0')}</p>
                 </div>
               </div>
            </div>
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
              <UserCheck size={280} />
            </div>
          </section>

          {/* Pending Assignment List */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black tracking-tight font-headline uppercase flex items-center gap-2">
                <AlertCircle size={20} className="text-error" />
                Pending Assignment
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input placeholder="Filter queue..." className="bg-surface-container-highest/50 border-none rounded-lg pl-9 pr-4 py-2 text-xs font-bold w-48" />
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="h-40 flex items-center justify-center font-bold text-outline uppercase tracking-widest animate-pulse italic">Scanning Neural Network...</div>
              ) : unassignedJobs.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/20 gap-4">
                  <CheckCircle2 size={48} className="text-green-500/20" />
                  <p className="font-bold text-sm uppercase tracking-widest text-outline">All jobs strategically assigned</p>
                </div>
              ) : unassignedJobs.map((job) => (
                <motion.div 
                  layoutId={job.id}
                  key={job.id} 
                  className={cn(
                    "bg-surface-container-lowest rounded-3xl p-6 kinetic-shadow flex items-center justify-between group transition-all",
                    selectedJob?.id === job.id ? "ring-2 ring-primary bg-surface-bright" : "hover:bg-surface-bright"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Truck size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-outline/60">{job.id}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-error/10 text-error">Unassigned</span>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest">{job.job_date || 'ASAP'} • {job.job_time || job.pickup_time}</span>
                      </div>
                      <h4 className="font-black text-on-surface uppercase tracking-tight">{job.company}</h4>
                      <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-2">
                        <span className="font-bold text-primary">{job.requester}</span> • {job.location} <ChevronRight size={10} /> {job.destination}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="gradient-btn px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <UserPlus size={16} />
                    Assign Talent
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Personnel Status */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface-container-low rounded-[2rem] p-8 space-y-6 sticky top-24">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
               <h3 className="font-headline font-black uppercase text-sm tracking-widest">Global Personnel</h3>
               <Filter size={16} className="text-outline" />
            </div>

            <div className="space-y-4">
              {drivers.map(driver => (
                <div key={driver.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={driver.avatar} className="w-12 h-12 rounded-2xl grayscale group-hover:grayscale-0 transition-all" alt={driver.name} />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface-container-low",
                        driver.status === 'available' ? 'bg-secondary' : driver.status === 'on_job' ? 'bg-primary' : 'bg-outline'
                      )} />
                    </div>
                    <div>
                      <p className="font-black text-xs text-on-surface uppercase tracking-tighter">{driver.name}</p>
                      <p className="text-[9px] font-bold text-outline uppercase tracking-widest">
                        {driver.status === 'on_job' ? `On ${driver.assigned_vehicle}` : driver.status}
                      </p>
                    </div>
                  </div>
                  {selectedJob && driver.status === 'available' ? (
                    <button 
                      disabled={assigning}
                      onClick={() => handleAssignDriver(driver.name)}
                      className="p-3 bg-primary text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <button className="p-3 bg-surface-container-highest/20 text-outline rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selectedJob && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="p-6 bg-primary/10 rounded-[1.5rem] border border-primary/20 text-center"
               >
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Targeting Mode</span>
                    <button onClick={() => setSelectedJob(null)} className="text-primary hover:scale-110"><X size={14} /></button>
                 </div>
                 <p className="text-xs font-bold text-on-surface mb-1 truncate">ASSIGNING TO: {selectedJob.id}</p>
                 <p className="text-[10px] text-on-surface-variant uppercase tracking-widest italic font-bold">Select available personnel</p>
               </motion.div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
