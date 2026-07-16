export type UserRole = 'PORT_AGENT' | 'SHIP_AGENT' | 'PROTECTIVE_AGENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  rating?: number;
  completedTurnarounds?: number;
  specialty?: string;
  phone?: string;
  locations?: string[];
  status?: 'Available' | 'Busy' | 'On Voyage';
}

export interface Organization {
  id: string;
  companyName: string;
  address?: string;
  licenseId?: string;
}

export type VesselStatus = 'Scheduled' | 'Arriving' | 'Berthed' | 'Cargo Operations' | 'Departing' | 'Completed';

export interface Vessel {
  id: string;
  vesselName: string;
  imoNumber: string;
  callSign: string;
  flag: string;
  vesselType: string;
  grossTonnage: number;
  deadweight: number;
  captainDetails: string;
  crewCount: number;
  eta: string;
  etd: string;
  currentPort: string;
  voyageNumber: string;
  status: VesselStatus;
  assignedPortAgentId?: string;
  assignedPortAgentName?: string;
}

export interface Voyage {
  id: string;
  vesselId: string;
  vesselName: string; // denormalized for convenience
  voyageNumber: string;
  originPort: string;
  destinationPort: string;
  eta: string;
  etd: string;
  etb?: string;
  actualEta?: string;
  actualEtb?: string;
  actualEtd?: string;
  cargoType: string;
  cargoQuantity: number;
  cargoStatus: string;
  loadingSchedule: string;
  unloadingSchedule: string;
  portAgentId?: string;
  shipAgentId?: string;
  protectiveAgentId?: string;
  timeline: {
    event: string;
    timestamp: string;
    completed: boolean;
  }[];
  status: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delayed';

export type TaskCategory = 'Documentation' | 'Commercial' | 'Marine' | 'Crew' | 'Authorities';

export interface Task {
  id: string;
  voyageId: string;
  voyageNumber: string;
  title: string;
  description: string;
  assignedTo: string; // Role or User ID
  status: TaskStatus;
  dueDate: string;
  category?: TaskCategory;
}

export interface Document {
  id: string;
  voyageId: string;
  voyageNumber: string;
  fileName: string;
  fileSize: string;
  type: 'Bill of Lading' | 'Cargo Manifest' | 'Customs Document' | 'Crew List' | 'Port Clearance' | 'Invoice' | 'Arrival Notice' | 'Departure Report';
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  category: string;
}

export interface Expense {
  id: string;
  voyageId: string;
  voyageNumber: string;
  amount: number;
  estimatedAmount: number;
  category: 'Pilotage' | 'Tug Services' | 'Mooring' | 'Bunkering' | 'Waste Disposal' | 'Fresh Water' | 'Crew Transport' | 'Port Dues' | 'Customs Clearances';
  status: 'Estimated' | 'Pending Approval' | 'Approved' | 'Rejected';
  description: string;
  submittedBy: string;
  submittedAt: string;
}

export interface Message {
  id: string;
  voyageId: string; // Chat can be linked to voyages
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  status: 'Unread' | 'Read';
  createdAt: string;
  type: 'Alert' | 'Reminder' | 'System';
}

export interface Incident {
  id: string;
  voyageId: string;
  voyageNumber: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Investigating' | 'Resolved';
  createdAt: string;
  reportedBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SOFEvent {
  id: string;
  timestamp: string;
  eventDescription: string;
  isCountable: number; // percentage countable: 0, 25, 50, 75, 100
  comments?: string;
}

export interface LaytimeCalculation {
  id: string;
  voyageId: string;
  voyageNumber: string;
  vesselName: string;
  cargoQuantity: number; // Metric Tons
  loadingRate: number; // Metric Tons per Day
  demurrageRate: number; // USD per day
  despatchRate: number; // USD per day
  laytimeTerms: 'WWD' | 'WWD_SHEX' | 'WWD_FHEX' | 'WWD_WIPON_WIBON';
  sofEvents: SOFEvent[];
  status: 'Draft' | 'Sent for Approval' | 'Approved' | 'Disputed';
  createdAt: string;
  updatedAt: string;
}

export type PartnerType = 'Principal' | 'Vendor' | 'Port Authority' | 'Terminal' | 'Client';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  contactName?: string;
  email?: string;
  phone?: string;
  portsCovered?: string[];
  notes?: string;
  createdAt: string;
}

export interface CrewMember {
  id: string;
  vesselId?: string;
  vesselName?: string;
  fullName: string;
  rank: string;
  nationality?: string;
  seamanBookNumber?: string;
  passportNumber?: string;
  signOnDate?: string;
  signOffDate?: string;
  status: 'Onboard' | 'Signed Off' | 'Scheduled';
  contactPhone?: string;
  notes?: string;
}

export interface Tariff {
  id: string;
  serviceCategory: string;
  description?: string;
  port?: string;
  vendorId?: string;
  vendorName?: string;
  rate: number;
  currency: string;
  unit: string;
  effectiveDate: string;
  notes?: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  voyageId: string;
  voyageNumber: string;
  partnerId?: string;
  partnerName?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export const ROLE_ALLOWED_VIEWS: Record<UserRole, string[]> = {
  PORT_AGENT: ['dashboard', 'planning', 'vessels', 'voyages', 'tasks', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'crm', 'partners', 'messages', 'reports', 'notifications', 'settings'],
  SHIP_AGENT: ['dashboard', 'planning', 'vessels', 'voyages', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'laytime', 'crm', 'partners', 'messages', 'reports', 'notifications', 'settings'],
  PROTECTIVE_AGENT: ['dashboard', 'planning', 'vessels', 'voyages', 'tasks', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'crm', 'partners', 'messages', 'reports', 'notifications', 'settings'],
  ADMIN: ['dashboard', 'planning', 'vessels', 'voyages', 'tasks', 'crew', 'documents', 'expenses', 'invoices', 'tariffs', 'approvals', 'laytime', 'crm', 'partners', 'messages', 'reports', 'notifications', 'settings', 'company', 'admin', 'auditlogs']
};

