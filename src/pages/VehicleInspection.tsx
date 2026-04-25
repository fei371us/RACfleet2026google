import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, ArrowLeft, Camera, ZoomIn, Info, AlertCircle, Edit, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { InspectionPin, Job } from '../types';
import { cn } from '../lib/utils';

export default function VehicleInspection() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pins, setPins] = useState<InspectionPin[]>([]);
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        setJob(data);
        setPins(data.pins || []);
      });
  }, [id]);

  const handleDiagramClick = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPin: InspectionPin = {
      job_id: id || '',
      vehicle_id: job?.vehicle_id || '',
      x,
      y,
      type: 'critical',
      note: ''
    };

    setPins([...pins, newPin]);
  };

  return (
    <div className="flex-1 pb-40">
      <header className="fixed top-0 z-50 w-full glass-panel border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">kinetic fleet</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-headline font-bold tracking-tight text-xs uppercase text-primary">Inspection</span>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold">D1</div>
        </div>
      </header>

      <main className="pt-24 px-4 md:px-8 max-w-5xl mx-auto space-y-8">
        <section>
          <p className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Step 2 of 4</p>
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Vehicle Exterior</h2>
          <p className="text-on-surface-variant text-sm mt-1">Tap the diagram to mark damage locations.</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Diagram */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-[2.5rem] p-8 relative kinetic-shadow overflow-hidden">
            <div 
              className="relative aspect-[4/3] w-full cursor-crosshair group"
              onClick={handleDiagramClick}
            >
              {/* Vehicle Wireframe Image */}
              <img 
                src="https://images.unsplash.com/photo-1549313861-33587f3d2956?auto=format&fit=crop&q=80&w=600" 
                alt="Vehicle Blueprint" 
                className="w-full h-full object-contain opacity-20 mix-blend-multiply"
              />
              
              {pins.map((pin, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute w-6 h-6 -ml-3 -mt-3 bg-error rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-lg animate-pulse"
                >
                  {index + 1}
                </motion.div>
              ))}

              {/* Overlay Grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-[0.03]">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-on-surface"></div>
                ))}
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-black text-on-surface-variant tracking-widest">
                <ZoomIn size={14} />
                PIN MODE ACTIVE
              </div>
            </div>
          </div>

          {/* Right Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low rounded-[2rem] p-6 kinetic-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-container rounded-xl text-white">
                  <Truck size={24} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-primary uppercase tracking-tighter">Unit #{job?.vehicle_id}</div>
                   <div className="font-headline font-bold text-on-surface">{job?.vehicle_name}</div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">License Plate</span>
                  <span className="font-mono font-bold">{job?.vehicle_plate}</span>
                </div>
                <div className="flex justify-between text-xs">
                   <span className="text-on-surface-variant font-medium">Last Inspection</span>
                   <span className="font-bold text-secondary">24 Oct (Clean)</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-highest rounded-[2rem] p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">Inspection Key</h3>
              <div className="space-y-4">
                {[
                  { color: 'bg-error', label: 'Critical Damage' },
                  { color: 'bg-secondary-container', label: 'Minor Issue' },
                  { color: 'bg-primary', label: 'Pre-existing' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", item.color)} />
                    <span className="text-xs font-bold text-on-surface">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Damage List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-xl flex items-center gap-3">
              Recorded Damages
              <span className="bg-error-container text-on-error-container text-[10px] px-3 py-1 rounded-full font-black uppercase">{pins.length} Pins</span>
            </h3>
            <button onClick={() => setPins([])} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Clear All</button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {pins.map((pin, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-surface-container-lowest rounded-[2.5rem] p-1 kinetic-shadow overflow-hidden flex flex-col md:flex-row group border-2 border-transparent hover:border-outline-variant/10 transition-all"
                >
                  <div className="md:w-64 h-40 bg-surface-container-highest relative flex items-center justify-center">
                    <img 
                      src={`https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=400&u=${i}`} 
                      alt="Damage" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-error text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Pin {i + 1}</div>
                  </div>
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-headline font-black uppercase tracking-tighter text-on-surface">External Panel {i+1}</span>
                        <span className="text-[8px] font-black text-error uppercase tracking-widest px-2 py-0.5 bg-error/10 rounded">Requires Photo</span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">System-detected indentation on rear passenger quadrant. Manual verification needed.</p>
                    </div>
                    <div className="flex gap-2 mt-6">
                       <button className="flex-1 bg-surface-container-low hover:bg-surface-container-high transition-colors text-primary font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                         <Edit size={14} /> Edit Note
                       </button>
                       <button className="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                         <Camera size={14} /> Update Photo
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <div className="mt-12 flex flex-col items-center gap-4">
           <button className="w-full md:w-80 gradient-btn py-5 rounded-[2rem] font-black text-[10px] tracking-[0.2em] uppercase">
             Continue to Tires & Fluids
           </button>
           <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">All marks are autosaved in real-time</span>
        </div>
      </main>
    </div>
  );
}
