import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, ClipboardList, CheckCircle2, Clock, AlertCircle, Search, Filter, ArrowRight, Truck, Settings, Fuel } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Job, JobStatus } from '../types';
import { cn } from '../lib/utils';

export default function RequesterHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Total Requests', value: jobs.length, icon: ClipboardList, color: 'text-primary' },
    { label: 'Active', value: jobs.filter(j => j.status === 'in_transit').length, icon: Clock, color: 'text-secondary' },
    { label: 'Completed', value: jobs.filter(j => j.status === 'completed').length, icon: CheckCircle2, color: 'text-green-500' },
  ];

  return (
    <div className="flex-1 pb-32">
       <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ClipboardList size={24} />
          </div>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Requester Hub</h1>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/jobs/new" className="gradient-btn px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <Plus size={16} />
            New Request
          </Link>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/20">
            <img src="https://i.pravatar.cc/100?u=requester1" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Welcome Hero */}
        <section className="bg-surface-container-low rounded-[2.5rem] p-10 kinetic-shadow relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tight font-headline text-on-surface mb-2">Welcome Back, Front Desk.</h2>
            <p className="text-on-surface-variant font-medium max-w-md">Initialize new vehicle missions, track workshop progress, and manage maintenance logs from one central cockpit.</p>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-20 opacity-10">
            <Truck size={200} />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={stat.label} className="bg-surface-container-lowest rounded-[2rem] p-8 kinetic-shadow flex items-center gap-6">
               <div className={cn("p-4 rounded-2xl bg-surface-container", stat.color)}>
                  <stat.icon size={32} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">{stat.label}</p>
                  <p className="text-3xl font-black font-headline text-on-surface">{stat.value.toString().padStart(2, '0')}</p>
               </div>
            </div>
          ))}
        </section>

        {/* Recent Requests Table-like list */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight font-headline uppercase">Recent Requests</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  placeholder="Search Job ID..." 
                  className="bg-surface-container-highest/50 border-none rounded-lg pl-9 pr-4 py-2 text-xs font-bold focus:ring-1 focus:ring-primary w-48"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
             {loading ? (
               <div className="h-40 flex items-center justify-center italic text-outline">Synchronizing requests...</div>
             ) : jobs.map((job) => (
               <div key={job.id} className="bg-surface-container-lowest rounded-3xl p-5 kinetic-shadow flex items-center justify-between group hover:bg-surface-bright transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      {job.type === 'Workshop' ? <Settings size={24} /> : job.type === 'Refill' ? <Fuel size={24} /> : <Truck size={24} />}
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-[10px] font-black text-on-surface-variant uppercase">{job.id}</span>
                         <span className={cn(
                           "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                           job.status === 'pending' ? 'bg-surface-container text-primary' : 
                           job.status === 'in_transit' ? 'bg-secondary/10 text-secondary' : 'bg-green-100 text-green-700'
                         )}>
                           {job.status}
                         </span>
                       </div>
                       <h4 className="font-bold text-on-surface">{job.company}</h4>
                       <p className="text-[10px] text-on-surface-variant/60 font-medium">
                         <span className="font-black text-primary uppercase">{job.vehicle_number_out || job.vehicle_plate}</span> • {job.requester} • {job.address || job.location} • {job.job_date || job.created_at.split('T')[0]}
                       </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                     <div className="hidden md:block">
                        <p className="text-[10px] font-black uppercase text-outline text-right">Window</p>
                        <p className="font-bold text-sm text-on-surface">{job.job_time || job.pickup_time}</p>
                     </div>
                     <Link to={`/driver/job/${job.id}`} className="p-3 rounded-full bg-surface-container-low group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight size={20} />
                     </Link>
                  </div>
               </div>
             ))}
          </div>
        </section>
      </main>
    </div>
  );
}
