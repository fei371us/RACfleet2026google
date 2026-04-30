import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ClipboardList, CheckCircle2, Clock, Search, ArrowRight, Truck, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { JobStatus } from '../types';
import { cn } from '../lib/utils';
import { useJobs } from '../hooks/useJobs';

export default function RequesterHome() {
  const { jobs, loading } = useJobs();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? jobs.filter(j =>
        j.id?.toLowerCase().includes(query.toLowerCase()) ||
        j.company?.toLowerCase().includes(query.toLowerCase()) ||
        j.address?.toLowerCase().includes(query.toLowerCase()) ||
        j.location?.toLowerCase().includes(query.toLowerCase())
      )
    : jobs;

  const stats = [
    { label: 'Total Requests', value: jobs.length, icon: ClipboardList, color: 'text-primary' },
    { label: 'Active',         value: jobs.filter(j => j.status === JobStatus.ASSIGNED || j.status === JobStatus.IN_PROGRESS).length, icon: Clock, color: 'text-secondary' },
    { label: 'Completed',      value: jobs.filter(j => j.status === JobStatus.COMPLETED).length, icon: CheckCircle2, color: 'text-green-500' },
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
        <Link to="/jobs/new" className="gradient-btn px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
          <Plus size={16} />
          New Request
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        <section className="bg-surface-container-low rounded-[2.5rem] p-10 kinetic-shadow relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tight font-headline text-on-surface mb-2">Welcome Back, Front Desk.</h2>
            <p className="text-on-surface-variant font-medium max-w-md">Initialize new vehicle missions, track workshop progress, and manage maintenance logs from one central cockpit.</p>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-20 opacity-10 pointer-events-none">
            <Truck size={200} />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
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

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight font-headline uppercase">Recent Requests</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search ID, company, address..."
                className="bg-surface-container-highest/50 border-none rounded-lg pl-9 pr-4 py-2 text-xs font-bold focus:ring-1 focus:ring-primary w-64"
              />
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="h-40 flex items-center justify-center italic text-outline">Synchronizing requests...</div>
            ) : filtered.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-outline italic text-sm">No requests found.</div>
            ) : filtered.map((job) => (
              <Link
                key={job.id}
                to={`/driver/job/${job.id}`}
                className="no-underline"
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-container-lowest rounded-3xl p-5 kinetic-shadow flex items-center justify-between group hover:bg-surface-bright transition-all cursor-pointer"
                >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    {job.type === 'WORKSHOP' ? <Settings size={24} /> : <Truck size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-on-surface-variant uppercase">{job.id}</span>
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                        job.status === JobStatus.PENDING     ? 'bg-surface-container text-primary' :
                        job.status === JobStatus.ASSIGNED    ? 'bg-secondary/10 text-secondary' :
                        job.status === JobStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        job.status === JobStatus.COMPLETED   ? 'bg-green-100 text-green-700' :
                        'bg-surface-container text-outline'
                      )}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-primary/5 text-primary">{job.type}</span>
                    </div>
                    <h4 className="font-bold text-on-surface">{job.company}</h4>
                    <p className="text-[10px] text-on-surface-variant/60 font-medium">
                      <span className="font-black text-primary uppercase">{job.vehicle_number_out || job.vehicle_plate}</span>
                      {' • '}{job.address || job.location}
                      {' • '}{job.job_date ? new Date(job.job_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="hidden md:block">
                    <p className="text-[10px] font-black uppercase text-outline text-right">Window</p>
                    <p className="font-bold text-sm text-on-surface">{job.job_time || job.pickup_time || '---'}</p>
                  </div>
                  <Link to={`/driver/job/${job.id}`} className="p-3 rounded-full bg-surface-container-low group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
