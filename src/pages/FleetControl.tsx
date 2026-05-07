import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, UserCheck, ShieldCheck, CheckCircle2, UserPlus, X, Filter, Settings } from 'lucide-react';
import { Job } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useJobs } from '../hooks/useJobs';
import { useUsers } from '../hooks/useUsers';

export default function FleetControl() {
  const { jobs, loading, refetch } = useJobs();
  const { users } = useUsers();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [assigning, setAssigning]     = useState(false);
  const [tab, setTab] = useState<'SHUTTLER' | 'WORKSHOP'>('SHUTTLER');

  const drivers  = users.filter(u => u.role === 'driver');
  const advisers = users.filter(u => u.role === 'workshop_adviser');

  const unassigned = jobs.filter(j =>
    j.type === tab &&
    (tab === 'SHUTTLER' ? !j.driverId : !j.workshopAdviserId)
  );
  const active     = jobs.filter(j => j.type === tab && j.status !== 'PENDING' && j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
  const assignable = unassigned;

  const busyIds = new Set(
    tab === 'SHUTTLER'
      ? jobs.filter(j => j.status === 'ASSIGNED' || j.status === 'IN_PROGRESS').map(j => j.driverId).filter(Boolean)
      : jobs.filter(j => j.status === 'ASSIGNED' || j.status === 'IN_PROGRESS').map(j => j.workshopAdviserId).filter(Boolean)
  );

  const handleAssign = async (userId: string) => {
    if (!selectedJob) return;
    setAssigning(true);
    try {
      const body = tab === 'SHUTTLER' ? { driverId: userId } : { workshopAdviserId: userId };
      await api.post(`/api/jobs/${selectedJob.id}/assign`, body);
      await refetch();
      setSelectedJob(null);
    } finally {
      setAssigning(false);
    }
  };

  const personnel = tab === 'SHUTTLER' ? drivers : advisers;

  return (
    <div className="flex-1 pb-32">
      <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/10 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><ShieldCheck size={24} /></div>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Fleet Control</h1>
        </div>
        <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
          {(['SHUTTLER', 'WORKSHOP'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedJob(null); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                tab === t ? "bg-white text-primary shadow-sm" : "text-outline hover:text-on-surface"
              )}
            >
              {t === 'SHUTTLER' ? <Truck size={12} /> : <Settings size={12} />}
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          {/* Stats banner */}
          <section className="bg-surface-container-lowest rounded-[2.5rem] p-10 kinetic-shadow relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-3xl font-black tracking-tight font-headline text-on-surface mb-2 uppercase">Command Center</h2>
                <p className="text-on-surface-variant font-medium text-sm leading-relaxed italic">
                  {tab === 'SHUTTLER' ? 'Assign drivers to pending shuttle missions.' : 'Assign workshop advisers to repair jobs.'}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-surface-container-high/50 p-6 rounded-[2rem] text-center min-w-[120px]">
                  <p className="text-[10px] font-black uppercase text-outline mb-1">Queue</p>
                  <p className="text-4xl font-black font-headline text-primary">{unassigned.length.toString().padStart(2, '0')}</p>
                </div>
                <div className="bg-surface-container-high/50 p-6 rounded-[2rem] text-center min-w-[120px]">
                  <p className="text-[10px] font-black uppercase text-outline mb-1">Active</p>
                  <p className="text-4xl font-black font-headline text-secondary">{active.length.toString().padStart(2, '0')}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none"><UserCheck size={280} /></div>
          </section>

          {/* Assignment queue */}
          <section className="space-y-4">
            <h3 className="text-xl font-black tracking-tight font-headline uppercase px-4">Needs Assignment</h3>
            {loading ? (
              <div className="h-40 flex items-center justify-center font-bold text-outline uppercase tracking-widest animate-pulse italic">Scanning...</div>
            ) : assignable.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/20 gap-4">
                <CheckCircle2 size={48} className="text-green-500/20" />
                <p className="font-bold text-sm uppercase tracking-widest text-outline">All {tab} jobs assigned</p>
              </div>
            ) : assignable.map((job) => (
              <motion.div
                layoutId={job.id}
                key={job.id}
                className={cn(
                  "bg-surface-container-lowest rounded-3xl p-6 kinetic-shadow flex items-center justify-between group transition-all",
                  selectedJob?.id === job.id ? "ring-2 ring-primary bg-surface-bright" : "hover:bg-surface-bright"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                    {tab === 'SHUTTLER' ? <Truck size={28} /> : <Settings size={28} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-outline/60">{job.id}</span>
                      <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded",
                        job.priority === 'CRITICAL' ? 'bg-error/10 text-error' :
                        job.priority === 'HIGH'     ? 'bg-secondary/10 text-secondary' :
                        'bg-surface-container text-outline'
                      )}>{job.priority}</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-surface-container text-outline">
                        {job.status}
                      </span>
                    </div>
                    <h4 className="font-black text-on-surface uppercase tracking-tight">{job.company}</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      {job.vehicle_name} • {job.location || job.job_scope || '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className="gradient-btn px-6 py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  <UserPlus size={16} />
                  Assign
                </button>
              </motion.div>
            ))}
          </section>
        </div>

        {/* Personnel panel */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface-container-low rounded-[2rem] p-8 space-y-6 sticky top-24">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <h3 className="font-headline font-black uppercase text-sm tracking-widest">
                {tab === 'SHUTTLER' ? 'Drivers' : 'Advisers'}
              </h3>
              <Filter size={16} className="text-outline" />
            </div>

            <div className="space-y-4">
              {personnel.map(person => {
                const busy = busyIds.has(person.id);
                return (
                  <div key={person.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={`https://i.pravatar.cc/100?u=${person.id}`}
                          className="w-12 h-12 rounded-2xl grayscale group-hover:grayscale-0 transition-all"
                          alt={person.name}
                        />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface-container-low",
                          busy ? 'bg-primary' : 'bg-secondary'
                        )} />
                      </div>
                      <div>
                        <p className="font-black text-xs text-on-surface uppercase tracking-tighter">{person.name}</p>
                        <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{busy ? 'On Job' : 'Available'}</p>
                      </div>
                    </div>
                    {selectedJob && (
                      <button
                        disabled={assigning}
                        onClick={() => handleAssign(person.id)}
                        className="p-3 bg-primary text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedJob && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-6 bg-primary/10 rounded-[1.5rem] border border-primary/20 text-center"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Targeting Mode</span>
                    <button onClick={() => setSelectedJob(null)} className="text-primary hover:scale-110"><X size={14} /></button>
                  </div>
                  <p className="text-xs font-bold text-on-surface mb-1 truncate">Assigning: {selectedJob.id}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest italic font-bold">Select personnel above</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
}
