export enum JobType {
  DELIVERY = 'Delivery',
  WORKSHOP = 'Workshop',
  REFILL = 'Refill'
}

export enum JobStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  DELAYED = 'delayed',
  COMPLETED = 'completed'
}

export enum UserRole {
  REQUESTER = 'requester',
  FLEET_CONTROL = 'fleet_control',
  FLEET_CONTROL_SUPERVISOR = 'fleet_control_supervisor',
  WORKSHOP_ADVISER = 'workshop_adviser',
  ADMIN = 'admin',
  DRIVER = 'driver'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  created_at: string;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: 'low' | 'standard' | 'high' | 'critical';
  vehicle_id: string;
  vehicle_name?: string;
  vehicle_plate?: string;
  driver_name: string;
  location: string;
  pickup_time: string;
  destination: string;
  instructions: string;
  eta: string;
  driver_note?: string;
  created_at: string;
  // New fields
  job_date: string;
  job_scope: string;
  vehicle_number_out: string;
  vehicle_number_in?: string;
  job_time: string;
  company: string;
  requester: string;
  contact_person: string;
  contact_number: string;
  address: string;
  remarks: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  last_inspection: string;
  status: string;
  lat: number;
  lng: number;
}

export interface InspectionPin {
  id?: number;
  job_id: string;
  vehicle_id: string;
  x: number;
  y: number;
  type: 'critical' | 'cosmetic' | 'preexisting';
  note: string;
  photo_url?: string;
}
