import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, Clock, Timer, Navigation, Map as MapIcon, MoreVertical, ChevronRight, MapPin, Package, Settings, User, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Job, JobStatus } from '../types';

export default function DriverHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [user, setUser] = useState<{ name: string } | null>(null);

  const fetchJobs = () => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        const savedUser = localStorage.getItem('fleet_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          // Show jobs assigned to this driver or pending
          setJobs(data.filter((j: Job) => j.driver_name === userData.name || j.status === 'pending'));
        } else {
          setJobs(data);
        }
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveNote = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_note: noteContent })
      });
      setActiveNoteId(null);
      setNoteContent('');
      fetchJobs();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  return (
    <div className="flex-1 pb-32">
       <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-primary" />
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">kinetic fleet</h1>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest border border-primary/20">
          <img src="https://i.pravatar.cc/100?u=driver101" alt="Driver" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="pt-20 px-4 max-w-md mx-auto space-y-8">
        {/* Welcome Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-1">Fleet Operations</p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Welcome, {user?.name || 'Personnel'}</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-label text-[10px] font-bold uppercase text-primary tracking-widest opacity-60">Duty Status</span>
              <div className="flex items-center bg-surface-container-high p-1 rounded-full gap-1">
                <button 
                  onClick={() => setStatus('online')}
                  className={`${status === 'online' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant/60'} px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all`}
                >
                  Online
                </button>
                <button 
                  onClick={() => setStatus('offline')}
                  className={`${status === 'offline' ? 'bg-error text-white shadow-sm' : 'text-on-surface-variant/60'} px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-[2rem] kinetic-shadow">
              <Timer className="text-secondary mb-2" size={20} />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Shift Time</p>
              <h3 className="font-headline text-2xl font-bold">06h 42m</h3>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-[2rem] kinetic-shadow">
              <Navigation className="text-primary mb-2" size={20} />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Next Milestone</p>
              <h3 className="font-headline text-2xl font-bold">12.4 mi</h3>
            </div>
          </div>
        </section>

        {/* Upcoming Jobs */}
        <section className="space-y-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-headline text-lg font-bold tracking-tight">Upcoming Jobs</h3>
            <span className="bg-primary-container/10 text-primary px-2.5 py-1 rounded-md text-[10px] font-black uppercase">{jobs.length} Pending</span>
          </div>

          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <motion.div 
                key={job.id}
                whileTap={{ scale: 0.98 }}
                className="bg-surface-container-lowest rounded-[2rem] p-1 group transition-all hover:bg-surface-bright kinetic-shadow"
              >
                <div className="flex flex-col p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase ${
                         job.priority === 'high' || job.priority === 'critical' ? 'bg-error text-white' : 'bg-surface-container-highest text-on-surface-variant'
                       }`}>
                         {job.priority}
                       </span>
                       <span className="font-label text-[10px] font-bold text-outline">ID: {job.id}</span>
                    </div>
                    <span className="font-headline text-[10px] font-black uppercase text-primary tracking-widest">{job.job_date} • {job.job_time || job.pickup_time}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                       {job.type === 'Workshop' ? <Settings /> : <Truck size={28} />}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface uppercase tracking-tight">{job.company}</h4>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">{job.vehicle_name}</p>
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <MapPin size={10} />
                        <span className="text-[10px] font-medium">{job.address || job.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {job.status === JobStatus.PENDING ? (
                      <button 
                        onClick={() => handleUpdateStatus(job.id, JobStatus.IN_TRANSIT)}
                        className="flex-1 gradient-btn py-3 rounded-xl font-label text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Navigation size={14} />
                        Start Job
                      </button>
                    ) : job.status === JobStatus.IN_TRANSIT ? (
                      <button 
                        onClick={() => handleUpdateStatus(job.id, JobStatus.COMPLETED)}
                        className="flex-1 bg-secondary text-white py-3 rounded-xl font-label text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Complete Job
                      </button>
                    ) : (
                      <Link 
                        to={`/driver/job/${job.id}`}
                        className="flex-1 bg-surface-container-high py-3 rounded-xl font-label text-[10px] font-black uppercase tracking-widest flex items-center justify-center"
                      >
                        View Details
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        setActiveNoteId(activeNoteId === job.id ? null : job.id);
                        setNoteContent(job.driver_note || '');
                      }}
                      className="px-4 border border-outline-variant/15 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center gap-2"
                    >
                      <Package size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Note</span>
                    </button>
                    <button className="px-4 border border-outline-variant/15 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {activeNoteId === job.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-outline-variant/10"
                    >
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add a brief note or update..."
                        className="w-full bg-surface-container-highest border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary h-24 mb-2"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveNote(job.id)}
                          className="flex-1 bg-primary text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                          Save Note
                        </button>
                        <button 
                          onClick={() => {
                            setActiveNoteId(null);
                            setNoteContent('');
                          }}
                          className="px-4 border border-outline-variant/15 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Navigation Snapshot */}
          <Link to="/map" className="relative block h-32 rounded-[2rem] overflow-hidden bg-surface-container-highest group">
            <div 
              className="absolute inset-0 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1569336415962-a4bd4f79c3f2?auto=format&fit=crop&q=80&w=600")', backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent" />
            <div className="absolute bottom-4 left-6">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Route Status</p>
              <h4 className="text-white font-headline font-bold text-lg">Live Map Overview</h4>
            </div>
            <div className="absolute top-4 right-4 bg-primary p-2 rounded-full shadow-lg text-white">
              <Navigation size={20} />
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
