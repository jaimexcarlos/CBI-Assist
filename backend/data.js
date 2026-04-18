// In-memory database for prototype
import bcrypt from 'bcryptjs';

// Hash password helper
const hashPassword = (password) => bcrypt.hashSync(password, 10);

// Users database
export const users = [
  {
    id: 'user-1',
    username: 'it_staff',
    passwordHash: hashPassword('password123'),
    role: 'staff_it',
    department: 'IT',
    firstName: 'John',
    lastName: 'Tech',
    email: 'john.tech@balaiisabel.com'
  },
  {
    id: 'user-2',
    username: 'housekeeping_staff',
    passwordHash: hashPassword('password123'),
    role: 'staff_housekeeping',
    department: 'Housekeeping',
    firstName: 'Maria',
    lastName: 'Clean',
    email: 'maria.clean@balaiisabel.com'
  },
  {
    id: 'user-3',
    username: 'engineering_staff',
    passwordHash: hashPassword('password123'),
    role: 'staff_engineering',
    department: 'Engineering',
    firstName: 'Carlos',
    lastName: 'Fix',
    email: 'carlos.fix@balaiisabel.com'
  },
  {
    id: 'user-4',
    username: 'frontoffice_staff',
    passwordHash: hashPassword('password123'),
    role: 'staff_front_office',
    department: 'Front Office',
    firstName: 'Ana',
    lastName: 'Welcome',
    email: 'ana.welcome@balaiisabel.com'
  },
  {
    id: 'user-5',
    username: 'executive',
    passwordHash: hashPassword('admin123'),
    role: 'executive',
    department: null,
    firstName: 'Robert',
    lastName: 'Manager',
    email: 'robert.manager@balaiisabel.com'
  }
];

// Guest sessions database
export const guestSessions = [
  {
    id: 'session-1',
    roomNumber: '101',
    pin: hashPassword('1234'),
    checkInDate: new Date('2026-04-15'),
    checkOutDate: new Date('2026-04-20'),
    isActive: true
  },
  {
    id: 'session-2',
    roomNumber: '102',
    pin: hashPassword('5678'),
    checkInDate: new Date('2026-04-16'),
    checkOutDate: new Date('2026-04-19'),
    isActive: true
  },
  {
    id: 'session-3',
    roomNumber: '201',
    pin: hashPassword('9012'),
    checkInDate: new Date('2026-04-14'),
    checkOutDate: new Date('2026-04-21'),
    isActive: true
  }
];

// Tickets database
export const tickets = [];

// Ticket notes database
export const ticketNotes = [];

// Ticket ratings database
export const ticketRatings = [];

// Job orders database
export const jobOrders = [];

// Category to department mapping
export const categoryToDepartment = {
  'Wi-Fi/IT': 'IT',
  'TV/Entertainment': 'IT',
  'Housekeeping': 'Housekeeping',
  'Repairs/Maintenance': 'Engineering',
  'Front Office': 'Front Office'
};

// Sub-categories by category
export const subCategories = {
  'Wi-Fi/IT': [
    'Cannot connect to Wi-Fi network',
    'Wi-Fi connection is dropping/unstable',
    'Other (Please specify)'
  ],
  'TV/Entertainment': [
    'TV will not turn on',
    'Remote control not working / Needs batteries',
    'Cannot log into Smart TV apps',
    'Request for HDMI or AV Cables',
    'Other (Please specify)'
  ],
  'Housekeeping': [
    'Request: Extra Bath Towels',
    'Request: Extra Pillows',
    'Request: Extra Mattress',
    'Request: Extra Bedsheets',
    'Request: Extra Soap',
    'Request: Extra Coffee',
    'Request: Extra Toothpaste',
    'Request: Extra Toothbrush',
    'Request: Extra Bottled Water',
    'Request: Assistance with Door',
    'Request: Refill Water Dispenser',
    'Borrow: Hair Dryer',
    'Borrow: Flat Iron',
    'Request: Luggage Assistance (Pick-up/Drop-off)',
    'Request: Stove Assistance',
    'Concern: Unpleasant odor in the room',
    'Other (Please specify)'
  ],
  'Repairs/Maintenance': [
    'Aircon: Unit is leaking water',
    'Aircon: Unit is not cooling / Too warm',
    'Heater: Water heater not working',
    'Plumbing: Clogged toilet or drain',
    'Plumbing: No hot water / Low water pressure',
    'Electrical: Light bulb needs replacement',
    'Electrical: Power outlet not working',
    'Hardware: Door lock / Keycard scanner issue',
    'Other (Please specify)'
  ],
  'Front Office': [
    'Request Electric Car (E-Car)',
    'Keycard Not Working',
    'Inquire about Late Check-Out',
    'Noise complaint (Neighboring room / Hallway)',
    'Lost Items',
    'Other (Please specify)'
  ]
};

// Resolution codes
export const resolutionCodes = [
  'Fixed',
  'Replaced',
  'No Issue Found',
  'Escalated to Job Order',
  'Guest Unavailable',
  'Item Delivered',
  'Service Completed'
];

// Helper to generate ticket number
let ticketCounter = 1;
export const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const number = String(ticketCounter++).padStart(5, '0');
  return `TKT-${year}-${number}`;
};

// Helper to calculate elapsed time in minutes
export const calculateElapsedTime = (createdAt) => {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
};

// Helper to get SLA status
export const getSLAStatus = (ticket) => {
  if (ticket.status === 'resolved') return 'completed';
  
  const elapsed = calculateElapsedTime(ticket.createdAt);
  if (elapsed >= 15) return 'escalated';
  if (elapsed >= 10) return 'warning';
  return 'normal';
};
