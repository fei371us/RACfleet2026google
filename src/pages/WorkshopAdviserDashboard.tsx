import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Wrench, ClipboardCheck, Timer, AlertTriangle, Search, ChevronRight, Activity, Zap, HardHat, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Job, Vehicle, JobStatus } from '../types';
import { cn } from '../lib/utils';

export default function WorkshopAdviserDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'maintenance' | 'repairs'>('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(res => res.json()),
      fetch('/api/vehicles').then(res => res.json())
    ]).then(([jobsData, vehiclesData]) => {
      // Filter for Workshop related jobs
      setJobs(jobsData.filter((j: Job) => j.type === 'Workshop' || j.job_scope?.toLowerCase().includes('maintenance')));
      setVehicles(vehiclesData);
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: 'In Workshop', value: jobs.filter(j => j.status === 'in_transit').length, icon: Warehouse, color: 'text-primary' },
    { label: 'Pending Entry', value: jobs.filter(j => j.status === 'pending').length, icon: Timer, color: 'text-secondary' },
    { label: 'Critical Assets', value: jobs.filter(j => j.priority === 'critical').length, icon: AlertTriangle, color: 'text-error' },
  ];

  return (
    <div className="flex-1 pb-32">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Settings size={24} />
          </div>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Workshop Adviser</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Systems Synchronized</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-primary/20 overflow-hidden">
            <img src="https://i.pravatar.cc/100?u=adviser1" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Adviser Command Banner */}
        <section className="bg-surface-container-lowest rounded-[3rem] p-12 kinetic-shadow relative overflow-hidden border border-outline-variant/5">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-primary/20">Operational Tier 1</span>
              </div>
              <h2 className="text-4xl font-black tracking-tight font-headline text-on-surface mb-4 leading-tight uppercase underline decoration-primary/30 decoration-4">Technical Oversight</h2>
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed max-w-sm italic">
                Strategize maintenance windows and prioritize critical repairs. Your cockpit for fleet longevity.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
               {stats.map(stat => (
                 <div key={stat.label} className="bg-surface-container-high/30 p-6 rounded-[2rem] text-center border border-white/10">
                    <stat.icon className={cn("mx-auto mb-3", stat.color)} size={24} />
                    <p className="text-3xl font-black font-headline text-on-surface">{stat.value.toString().padStart(2, '0')}</p>
                    <p className="text-[8px] font-black uppercase text-outline mt-1">{stat.label}</p>
                 </div>
               ))}
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 opacity-[0.03] pointer-events-none">
            <HardHat size={400} />
          </div>
        </section>

        {/* Workflow Management */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Active Technical Pipeline */}
           <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center justify-between px-4">
               <h3 className="font-headline font-black uppercase text-xl flex items-center gap-3">
                 <Activity className="text-primary" />
                 Diagnostic Pipeline
               </h3>
               <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
                 {(['all', 'maintenance', 'repairs'] as const).map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab ? "bg-white text-primary shadow-sm" : "text-outline hover:text-on-surface"
                    )}
                   >
                     {tab}
                   </button>
                 ))}
               </div>
             </div>

             <div className="space-y-4">
               {loading ? (
                 <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
                    <Settings className="animate-spin text-primary" size={48} />
                    <p className="font-black text-[10px] uppercase tracking-[0.2em]">Recalibrating Diagnostics...</p>
                 </div>
               ) : jobs.length === 0 ? (
                 <div className="h-64 flex flex-col items-center justify-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-outline">
                    No active workshop missions detected.
                 </div>
               ) : jobs.map((job) => (
                 <motion.div 
                   layoutId={job.id}
                   key={job.id}
                   className="bg-surface-container-lowest rounded-[2rem] p-6 kinetic-shadow flex items-center justify-between group hover:bg-surface-bright transition-all"
                 >
                   <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-surface-container flex flex-col items-center justify-center text-primary border border-outline-variant/5">
                        <Wrench size={24} />
                        <span className="text-[8px] font-black mt-1 uppercase">{job.priority === 'critical' ? 'Urgent' : 'Routine'}</span>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-outline uppercase">{job.id}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                            job.status === 'pending' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                          )}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-headline font-black text-lg text-on-surface uppercase tracking-tight">{job.vehicle_name}</h4>
                        <p className="text-xs font-medium text-on-surface-variant line-clamp-1">{job.job_scope || 'General Inspection Required'}</p>
                     </div>
                   </div>

                   <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black uppercase text-outline">Vehicle Entry</p>
                        <p className="font-bold text-sm text-on-surface">{job.vehicle_number_out || 'PENDING'}</p>
                      </div>
                      <Link 
                        to={`/driver/job/${job.id}`} 
                        className="p-4 rounded-2xl bg-surface-container-high group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-transparent group-hover:shadow-primary/30"
                      >
                        <ChevronRight size={24} />
                      </Link>
                   </div>
                 </motion.div>
               ))}
             </div>
           </div>

           {/* Workshop Health/Summary */}
           <div className="lg:col-span-4 space-y-6">
              <section className="bg-surface-container-low rounded-[2.5rem] p-8 space-y-6">
                <h3 className="font-headline font-black uppercase text-sm tracking-widest flex items-center gap-2">
                  <ClipboardCheck className="text-primary" />
                  Bay Availability
                </h3>
                
                <div className="space-y-4">
                  {[
                    { bay: 'Bay 01 - Heavy Duty', status: 'Occupied', progress: 65, tech: 'Sarah C.' },
                    { bay: 'Bay 02 - Routine', status: 'Available', progress: 0, tech: '---' },
                    { bay: 'Bay 03 - Quick Ops', status: 'Occupied', progress: 20, tech: 'Marcus T.' },
                    { bay: 'Bay 04 - Special', status: 'Maintenance', progress: 100, tech: 'Ready' },
                  ].map(bay => (
                    <div key={bay.bay} className="bg-surface-container-lowest/50 p-4 rounded-2xl border border-outline-variant/10">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-on-surface uppercase">{bay.bay}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                            bay.status === 'Available' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
                          )}>{bay.status}</span>
                       </div>
                       <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${bay.progress}%` }}
                            className="h-full bg-primary"
                          />
                       </div>
                       <div className="flex justify-between mt-2">
                          <span className="text-[8px] font-bold text-outline uppercase">{bay.tech}</span>
                          <span className="text-[8px] font-bold text-outline">{bay.progress}% Complete</span>
                       </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-primary p-8 rounded-[2.5rem] text-white kinetic-shadow overflow-hidden relative">
                 <div className="relative z-10">
                    <Zap className="mb-4" size={32} />
                    <h4 className="font-headline font-black italic text-xl uppercase mb-2">Fleet Analytics</h4>
                    <p className="text-white/60 text-xs font-medium mb-6">Aggregate workshop data indicates 98% uptime this quarter across active missions.</p>
                    <button className="w-full bg-white text-primary py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all">
                      Export Tech Report
                    </button>
                 </div>
                 <div className="absolute top-0 right-0 opacity-10">
                    <Activity size={160} />
                 </div>
              </section>
           </div>
        </div>
      </main>
    </div>
  );
}
