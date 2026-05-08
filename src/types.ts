export enum JobType {
  SHUTTLER = 'SHUTTLER',
  WORKSHOP = 'WORKSHOP',
}

export enum ShuttlerSubType {
  DELIVERY = 'Delivery / Collection / Transfer Cars (MBS)',
  SWITCHING = 'Switching & Collection',
  WASH = 'Wash Car',
  FETCH_SEND = 'Fetch / Send Shuttler',
  DISPATCH = 'Dispatch / Mailing / Banking',
  TRANSFER_PIONEER = 'Transfer Cars (Pioneer Crescent)',
  CHECK_IN_OUT = 'Check In / Out Vehicle',
  REFUEL = 'Refuel Petrol / Diesel',
  LTA_INSPECTION = 'LTA Inspection',
  BATTERY = 'Change Vehicles Battery',
  LIGHT_WIPER = 'Change Light Bulb / Wiper / Remote Battery',
  ERRANDS = 'Errands',
  OTHERS = 'Others',
}

export enum JobStatus {
  PENDING     = 'PENDING',
  ASSIGNED    = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
  CANCELLED   = 'CANCELLED',
}

export enum JobPriority {
  LOW      = 'LOW',
  STANDARD = 'STANDARD',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum UserRole {
  REQUESTER                = 'requester',
  FLEET_CONTROL            = 'fleet_control',
  FLEET_CONTROL_SUPERVISOR = 'fleet_control_supervisor',
  WORKSHOP_ADVISER         = 'workshop_adviser',
  ADMIN                    = 'admin',
  DRIVER                   = 'driver',
}

export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  createdAt?: string;
}

export interface ChecklistItem {
  id: number;
  task: string;
  verified: boolean;
}

export interface Job {
  id: string;           // = reference (e.g. KF-1401), surfaced by flattenJob
  job_db_id?: string;   // internal UUID in Jobs.id
  reference: string;
  type: string;         // 'SHUTTLER' | 'WORKSHOP'
  shuttlerSubType?: string; // SHUTTLER job sub-type (Delivery, Washing, etc.)
  status: string;       // 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: string;     // 'LOW' | 'STANDARD' | 'HIGH' | 'CRITICAL'
  vehicleId?: string;
  driverId?: string;
  requesterId?: string;
  workshopAdviserId?: string;

  // snake_case aliases surfaced by flattenJob
  vehicle_name?: string;
  vehicle_plate?: string;
  driver_name?: string;
  driver_note?: string;
  job_date?: string;
  job_scope?: string;
  shuttler_sub_type?: string;
  vehicle_number_out?: string;
  vehicle_number_in?: string;
  job_time?: string;
  contact_person?: string;
  contact_number?: string;
  created_at?: string;

  // Direct fields
  company?: string;
  address?: string;
  location?: string;
  destination?: string;
  instructions?: string;
  remarks?: string;
  workPerformed?: string;
  checklist?: ChecklistItem[];

  // Legacy / display aliases
  pickup_time?: string;
  requester?: string;
  eta?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  lastInspection?: string;
  last_inspection?: string;
  status: string;
  lat: number;
  lng: number;
}

export interface WorkshopBay {
  id: string;
  name: string;
  category: string;
  status: string;
  currentJobId?: string;
  technician?: string;
}

export interface InspectionPin {
  id?: number;
  jobId?: string;
  job_id?: string;
  vehicleId?: string;
  vehicle_id?: string;
  x: number;
  y: number;
  type: string;
  note?: string;
  photoUrl?: string;
  photo_url?: string;
}
