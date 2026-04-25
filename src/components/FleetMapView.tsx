import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { X, Truck, Navigation, Signal, Info, ChevronRight } from 'lucide-react';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';

interface FleetMapViewProps {
  onClose: () => void;
}

export default function FleetMapView({ onClose }: FleetMapViewProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the same host/port
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    socket.on('fleet:telemetry', (data: Vehicle[]) => {
      setVehicles(data);
      if (selectedVehicle) {
        const updated = data.find(v => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    });

    // Initial fetch
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => setVehicles(data));

    return () => {
      socket.disconnect();
    };
  }, []);

  // Map Bounds for Houston Simulation
  const bounds = {
    minLat: 29.7,
    maxLat: 29.85,
    minLng: -95.45,
    maxLng: -95.3,
  };

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-3xl" onClick={onClose} />
      
      <motion.div
        initial={{ y: 100, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.9 }}
        className="relative w-full max-w-7xl aspect-video md:aspect-[21/9] bg-surface rounded-[4rem] kinetic-shadow overflow-hidden flex flex-col md:flex-row"
      >
        {/* Header (Floating) */}
        <div className="absolute top-8 left-8 right-8 z-20 flex justify-between items-start pointer-events-none">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] kinetic-shadow pointer-events-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", connected ? "bg-primary shadow-[0_0_12px_#005bbf]" : "bg-error")} />
              <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">Fleet Overview</h2>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Houston Metro Area • Real-Time Telemetry</p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-4 bg-white/80 backdrop-blur-xl rounded-full kinetic-shadow hover:bg-white transition-colors pointer-events-auto"
          >
            <X size={24} className="text-on-surface" />
          </button>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative bg-surface-container-low overflow-hidden group">
          {/* Stylized Map Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
               {Array.from({ length: 96 }).map((_, i) => (
                 <div key={i} className="border-r border-b border-on-surface" />
               ))}
            </div>
          </div>

          {/* Simulated Map Topography (Simplified) */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0,20 Q50,40 100,20" stroke="currentColor" fill="none" strokeWidth="2" strokeOpacity="0.5" />
             <path d="M20,0 Q40,50 20,100" stroke="currentColor" fill="none" strokeWidth="2" strokeOpacity="0.5" />
             <path d="M60,0 Q80,50 60,100" stroke="currentColor" fill="none" strokeWidth="2" strokeOpacity="0.5" />
             <path d="M0,70 Q50,50 100,70" stroke="currentColor" fill="none" strokeWidth="2" strokeOpacity="0.5" />
          </svg>

          {/* Vehicle Markers */}
          <AnimatePresence>
            {vehicles.map((v) => {
              const pos = project(v.lat, v.lng);
              const isSelected = selectedVehicle?.id === v.id;
              
              return (
                <motion.button
                  key={v.id}
                  layoutId={v.id}
                  initial={false}
                  animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  onClick={() => setSelectedVehicle(v)}
                  className={cn(
                    "absolute -ml-6 -mt-6 w-12 h-12 rounded-full flex items-center justify-center transition-all z-10",
                    isSelected ? "bg-primary text-white scale-110 shadow-2xl z-30" : "bg-white hover:bg-surface-container shadow-lg z-10"
                  )}
                >
                   <Truck size={20} className={cn(isSelected ? "text-white" : "text-primary")} />
                   
                   {/* Tooltip on select */}
                   {isSelected && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="absolute bottom-full mb-3 bg-on-surface text-white px-3 py-1.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest pointer-events-none shadow-2xl"
                     >
                       {v.name}
                     </motion.div>
                   )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Sidebar Info Panel */}
        <aside className="w-full md:w-96 bg-white/50 backdrop-blur-xl border-l border-outline-variant/10 p-8 flex flex-col gap-6">
          <div className="flex-1 space-y-8">
            <section>
              <h3 className="font-headline font-black text-xs uppercase tracking-widest text-on-surface-variant/40 mb-6 flex items-center gap-2">
                <Signal size={12} />
                Live Fleet Data
              </h3>
              
              <AnimatePresence mode="wait">
                {selectedVehicle ? (
                  <motion.div
                    key={selectedVehicle.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary">
                        <Truck size={32} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tighter text-primary">Unit {selectedVehicle.id}</div>
                        <h4 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">{selectedVehicle.name}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-surface-container-low p-4 rounded-2xl">
                         <span className="text-[10px] font-bold uppercase text-outline tracking-wider">Status</span>
                         <p className="font-bold text-sm text-secondary flex items-center gap-2 mt-1 uppercase">
                           <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                           {selectedVehicle.status}
                         </p>
                       </div>
                       <div className="bg-surface-container-low p-4 rounded-2xl">
                         <span className="text-[10px] font-bold uppercase text-outline tracking-wider">Signal</span>
                         <p className="font-bold text-sm text-on-surface flex items-center gap-2 mt-1">98% Strong</p>
                       </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-outline-variant/10">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-on-surface-variant font-medium">Plate</span>
                          <span className="font-mono font-bold">{selectedVehicle.plate}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-on-surface-variant font-medium">Coordinates</span>
                          <span className="font-mono font-bold">{selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}</span>
                       </div>
                    </div>

                    <button className="w-full bg-surface-container-highest hover:bg-surface-container text-on-surface font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all mt-4 flex items-center justify-center gap-2">
                       <Navigation size={14} /> Open Route Intelligence
                    </button>
                  </motion.div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/40">
                    <Info size={40} className="mb-4 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">Select a vehicle to inspect live telemetry</p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            <section className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
               <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-3">Next Milestone</h5>
               <div className="flex justify-between items-center">
                 <div>
                   <p className="font-headline font-extrabold text-2xl text-on-surface">12.4 mi</p>
                   <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase">To Distribution Hub Alpha</p>
                 </div>
                 <ChevronRight className="text-primary opacity-40" />
               </div>
            </section>
          </div>

          <div className="pt-6 border-t border-outline-variant/10">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
               <span>Units Tracking</span>
               <span>{vehicles.length} Total</span>
             </div>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}
