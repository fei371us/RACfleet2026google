import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, ArrowLeft, ZoomIn, Camera, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { InspectionPin, Job } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

const PIN_TYPES = ['CRITICAL', 'COSMETIC', 'PREEXISTING'] as const;
type PinType = typeof PIN_TYPES[number];

const PIN_COLOR: Record<PinType, string> = {
  CRITICAL:    'bg-error',
  COSMETIC:    'bg-secondary-container',
  PREEXISTING: 'bg-primary',
};

export default function VehicleInspection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [pins, setPins]       = useState<InspectionPin[]>([]);
  const [job, setJob]         = useState<Job | null>(null);
  const [pinType, setPinType] = useState<PinType>('CRITICAL');

  useEffect(() => {
    if (!id) return;
    api.get<any>(`/api/jobs/${id}`).then(data => {
      setJob(data);
      if (Array.isArray(data.pins)) setPins(data.pins);
    });
  }, [id]);

  const handleDiagramClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;

    const payload: InspectionPin = {
      job_id:     id ?? '',
      vehicle_id: job?.vehicleId ?? '',
      x, y,
      type: pinType,
      note: '',
    };

    try {
      const saved = await api.post<InspectionPin>('/api/inspection/pins', payload);
      setPins(prev => [...prev, saved]);
    } catch {
      setPins(prev => [...prev, { ...payload, id: Date.now() }]);
    }
  };

  return (
    <div className="flex-1 pb-40">
      <header className="fixed top-0 z-50 w-full glass-panel border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-headline font-black text-lg tracking-tighter text-on-surface uppercase">Vehicle Inspection</h1>
        </div>
        <span className="font-headline font-bold tracking-tight text-xs uppercase text-primary">{job?.id}</span>
      </header>

      <main className="pt-24 px-4 md:px-8 max-w-5xl mx-auto space-y-8">
        <section>
          <p className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Step 2 of 4</p>
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Vehicle Exterior</h2>
          <p className="text-on-surface-variant text-sm mt-1">Tap the diagram to mark damage locations.</p>
        </section>

        {/* Pin type selector */}
        <div className="flex gap-3 flex-wrap">
          {PIN_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setPinType(t)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                pinType === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant/20 text-outline hover:border-primary/30"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full", PIN_COLOR[t])} />
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Diagram */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-[2.5rem] p-8 relative kinetic-shadow overflow-hidden">
            <div className="relative aspect-[4/3] w-full cursor-crosshair" onClick={handleDiagramClick}>
              <img
                src="https://images.unsplash.com/photo-1549313861-33587f3d2956?auto=format&fit=crop&q=80&w=600"
                alt="Vehicle Blueprint"
                className="w-full h-full object-contain opacity-20 mix-blend-multiply"
              />
              {pins.map((pin, index) => {
                const colorKey = (pin.type?.toUpperCase() as PinType) ?? 'CRITICAL';
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    className={cn(
                      "absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-lg",
                      PIN_COLOR[colorKey] ?? 'bg-error'
                    )}
                  >
                    {index + 1}
                  </motion.div>
                );
              })}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-[0.03]">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-on-surface" />
                ))}
              </div>
            </div>
            <div className="absolute bottom-6 left-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-black text-on-surface-variant tracking-widest">
                <ZoomIn size={14} />
                PIN MODE — {pinType}
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low rounded-[2rem] p-6 kinetic-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-container rounded-xl text-white"><Truck size={24} /></div>
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-tighter">Unit #{job?.vehicleId?.slice(-6)}</div>
                  <div className="font-headline font-bold text-on-surface">{job?.vehicle_name || job?.vehicle_plate || '—'}</div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-highest rounded-[2rem] p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">Inspection Key</h3>
              <div className="space-y-3">
                {PIN_TYPES.map(t => (
                  <div key={t} className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", PIN_COLOR[t])} />
                    <span className="text-xs font-bold text-on-surface capitalize">{t.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Damage list */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-xl flex items-center gap-3">
              Recorded Damages
              <span className="bg-error-container text-on-error-container text-[10px] px-3 py-1 rounded-full font-black uppercase">{pins.length} Pins</span>
            </h3>
            {pins.length > 0 && (
              <button onClick={() => setPins([])} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Clear All</button>
            )}
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {pins.map((pin, i) => {
                const colorKey = (pin.type?.toUpperCase() as PinType) ?? 'CRITICAL';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface-container-lowest rounded-[2.5rem] p-6 kinetic-shadow flex items-center gap-6"
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0", PIN_COLOR[colorKey] ?? 'bg-error')}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-xs uppercase tracking-widest text-on-surface">{pin.type} • Pin {i + 1}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">x: {pin.x.toFixed(1)}% y: {pin.y.toFixed(1)}%</p>
                      {pin.note && <p className="text-xs text-on-surface-variant mt-1">{pin.note}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-surface-container-low hover:bg-surface-container-high transition-colors text-primary rounded-2xl">
                        <Edit size={14} />
                      </button>
                      <button className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                        <Camera size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-full md:w-80 gradient-btn py-5 rounded-[2rem] font-black text-[10px] tracking-[0.2em] uppercase">
            Save &amp; Continue
          </button>
          <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Pins saved automatically on placement</span>
        </div>
      </main>
    </div>
  );
}
