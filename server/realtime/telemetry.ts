import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

export function initTelemetry(io: Server, prisma: PrismaClient): void {
  setInterval(async () => {
    const vehicles = await prisma.vehicle.findMany({ select: { id: true, lat: true, lng: true } });
    await Promise.all(
      vehicles.map(v =>
        prisma.vehicle.update({
          where: { id: v.id },
          data: {
            lat: v.lat + (Math.random() - 0.5) * 0.001,
            lng: v.lng + (Math.random() - 0.5) * 0.001,
          },
        })
      )
    );
    const updated = await prisma.vehicle.findMany();
    io.emit('fleet:telemetry', updated);
  }, 3000);
}
