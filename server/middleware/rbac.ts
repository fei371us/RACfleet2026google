import { Response, NextFunction } from 'express';
import { AuthedRequest } from './auth.js';

export const UserRole = {
  ADMIN: 'admin',
  REQUESTER: 'requester',
  FLEET_CONTROL: 'fleet_control',
  FLEET_CONTROL_SUPERVISOR: 'fleet_control_supervisor',
  WORKSHOP_ADVISER: 'workshop_adviser',
  DRIVER: 'driver',
} as const;

export type UserRoleValue = typeof UserRole[keyof typeof UserRole];

export function requireRole(...roles: UserRoleValue[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role as UserRoleValue)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
