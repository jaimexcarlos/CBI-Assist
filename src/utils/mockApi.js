// ============================================================================
// Mock API - All data lives in memory, no backend needed
// ============================================================================

const ROOMS = {
  '101': '1234', '102': '5678', '201': '9012', '202': '3456',
};

const STAFF_USERS = {
  it_staff:           { id: 'u1', firstName: 'Marco',  lastName: 'Reyes',     role: 'staff_it',           department: 'IT',           password: 'password123' },
  housekeeping_staff: { id: 'u2', firstName: 'Ana',    lastName: 'Santos',    role: 'staff_housekeeping', department: 'Housekeeping', password: 'password123' },
  engineering_staff:  { id: 'u3', firstName: 'Jose',   lastName: 'Cruz',      role: 'staff_engineering',  department: 'Engineering',  password: 'password123' },
  frontoffice_staff:  { id: 'u4', firstName: 'Maria',  lastName: 'Dela Cruz', role: 'staff_front_office', department: 'Front Office', password: 'password123' },
  executive:          { id: 'u5', firstName: 'Carlos', lastName: 'Mendoza',   role: 'executive',          department: null,           password: 'admin123' },
};

export const CATEGORIES = {
  '📶 Wi-Fi & Connectivity': ['Cannot connect to Wi-Fi', 'Wi-Fi dropping/unstable', 'Slow connection', 'Other (please specify)'],
  '📺 TV & Entertainment':   ['TV will not turn on', 'Remote not working', 'Cannot log into Smart TV apps', 'Request HDMI/AV Cable', 'Other (please specify)'],
  '🧹 Housekeeping':         ['Extra Bath Towels', 'Extra Pillows', 'Extra Mattress', 'Extra Bedsheets', 'Extra Soap', 'Extra Coffee', 'Extra Bottled Water', 'Refill Water Dispenser', 'Borrow Hair Dryer', 'Borrow Flat Iron', 'Luggage Assistance', 'Stove Assistance', 'Unpleasant odor in room', 'Other (please specify)'],
  '🔧 Repairs & Maintenance':['Aircon leaking water', 'Aircon not cooling', 'Water heater not working', 'Clogged toilet/drain', 'No hot water / Low pressure', 'Light bulb replacement', 'Power outlet not working', 'Door lock / Keycard issue', 'Other (please specify)'],
  '🛎️ Front Office':         ['Request Electric Car (E-Car)', 'Keycard Not Working', 'Late Check-Out Inquiry', 'Noise Complaint', 'Lost Items', 'Other (please specify)'],
};

export const CATEGORY_DEPT = {
  '📶 Wi-Fi & Connectivity': 'IT',
  '📺 TV & Entertainment':   'IT',
  '🧹 Housekeeping':         'Housekeeping',
  '🔧 Repairs & Maintenance':'Engineering',
  '🛎️ Front Office':         'Front Office',
};

export const RESOLUTION_CODES = ['Fixed', 'Replaced', 'No Issue Found', 'Escalated to Job Order', 'Guest Unavailable', 'Item Delivered'];

export const JO_CATEGORIES = ['Furniture Repair', 'Custom Fabrication', 'Preventative Maintenance', 'Civil Works'];

export const INTERNAL_CATEGORIES = {
  'IT / Tech':        ['Printer offline', 'Network issue', 'Computer not working', 'Phone line issue', 'Other'],
  'Facilities':       ['Back-office aircon leaking', 'Back-office aircon not cooling', 'Electrical issue', 'Plumbing issue', 'Other'],
  'Housekeeping':     ['Supply room issue', 'Equipment malfunction', 'Other'],
  'Engineering':      ['Generator issue', 'Water pump issue', 'Structural concern', 'Other'],
};

// --- In-memory state ---
let tickets = [
  {
    id: 't-seed-1', ticketNumber: 'TKT-2026-00001', roomNumber: '101',
    category: '📶 Wi-Fi & Connectivity', subCategory: 'Cannot connect to Wi-Fi',
    description: 'Cannot connect to the resort Wi-Fi since this morning.',
    urgency: 'immediate', scheduledTime: null,
    status: 'submitted', department: 'IT',
    assignedTo: null, resolutionCode: null, resolutionTime: null,
    isProxyRequest: false, isInternalIncident: false, priority: null,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    acknowledgedAt: null, enRouteAt: null, resolvedAt: null,
  },
  {
    id: 't-seed-2', ticketNumber: 'TKT-2026-00002', roomNumber: '102',
    category: '🧹 Housekeeping', subCategory: 'Extra Bath Towels',
    description: '',
    urgency: 'immediate', scheduledTime: null,
    status: 'acknowledged', department: 'Housekeeping',
    assignedTo: 'u2', resolutionCode: null, resolutionTime: null,
    isProxyRequest: false, isInternalIncident: false, priority: null,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    enRouteAt: null, resolvedAt: null,
  },
  {
    id: 't-seed-3', ticketNumber: 'TKT-2026-00003', roomNumber: '201',
    category: '🔧 Repairs & Maintenance', subCategory: 'Aircon not cooling',
    description: 'The aircon has been running but the room is still very warm.',
    urgency: 'immediate', scheduledTime: null,
    status: 'en_route', department: 'Engineering',
    assignedTo: 'u3', resolutionCode: null, resolutionTime: null,
    isProxyRequest: false, isInternalIncident: false, priority: null,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 11 * 60000).toISOString(),
    enRouteAt: new Date(Date.now() - 5 * 60000).toISOString(),
    resolvedAt: null,
  },
  // Seed internal incident
  {
    id: 't-seed-4', ticketNumber: 'INT-2026-00001', roomNumber: null,
    category: 'IT / Tech', subCategory: 'Printer offline',
    description: 'Front desk receipt printer is offline. Cannot print guest receipts.',
    urgency: 'immediate', scheduledTime: null,
    status: 'submitted', department: 'IT',
    assignedTo: null, resolutionCode: null, resolutionTime: null,
    isProxyRequest: false, isInternalIncident: true,
    internalLocation: 'Front Office — Reception Desk',
    priority: 'high',
    createdAt: new Date(Date.now() - 6 * 60000).toISOString(),
    acknowledgedAt: null, enRouteAt: null, resolvedAt: null,
  },
];

let ticketNotes = [];
let ticketRatings = [];
let ticketCounter = 5;

// Job Orders
let jobOrders = [
  {
    id: 'jo-seed-1', joNumber: 'JO-2026-00001',
    title: 'Re-upholster Lobby Chairs',
    category: 'Furniture Repair',
    specifications: 'Re-upholster 8 lobby chairs with dark brown faux leather. Foam padding to be replaced as well.',
    targetDate: '2026-05-15',
    status: 'in_progress',
    createdBy: 'u5', assignedTo: 'u3',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    attachments: [],
  },
  {
    id: 'jo-seed-2', joNumber: 'JO-2026-00002',
    title: 'Custom Luggage Cart Fabrication',
    category: 'Custom Fabrication',
    specifications: 'Weld and build a new heavy-duty luggage cart for the main lobby. Dimensions: 120cm x 60cm x 90cm. Material: stainless steel frame with rubber wheels.',
    targetDate: '2026-05-30',
    status: 'pending_approval',
    createdBy: 'u5', assignedTo: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
    attachments: [],
  },
];
let joCounter = 3;

// --- Helpers ---
function elapsed(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}
function slaStatus(ticket) {
  if (ticket.status === 'resolved') return 'normal';
  const mins = elapsed(ticket.createdAt);
  if (mins >= 15) return 'escalated';
  if (mins >= 10) return 'warning';
  return 'normal';
}
function enrich(ticket) {
  return {
    ...ticket,
    elapsedTime: elapsed(ticket.createdAt),
    slaStatus: slaStatus(ticket),
    notes: ticketNotes.filter(n => n.ticketId === ticket.id).map(n => ({
      ...n,
      author: Object.values(STAFF_USERS).find(u => u.id === n.userId)
        ? `${Object.values(STAFF_USERS).find(u => u.id === n.userId).firstName} ${Object.values(STAFF_USERS).find(u => u.id === n.userId).lastName}`
        : 'Staff',
    })),
    rating: ticketRatings.find(r => r.ticketId === ticket.id) || null,
  };
}

// Event bus
const listeners = {};
export function onEvent(event, cb) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
  return () => { listeners[event] = listeners[event].filter(f => f !== cb); };
}
function emit(event, data) {
  (listeners[event] || []).forEach(cb => cb(data));
}

// --- Auth ---
export function guestLogin(roomNumber, pin) {
  if (ROOMS[roomNumber] && ROOMS[roomNumber] === pin) {
    return { success: true, token: `guest-${roomNumber}`, roomNumber, user: { role: 'guest', roomNumber } };
  }
  throw new Error('Invalid room number or PIN. Try Room 101, PIN 1234.');
}

export function staffLogin(username, password) {
  const user = STAFF_USERS[username];
  if (user && user.password === password) {
    return { success: true, token: `staff-${username}`, user: { ...user } };
  }
  throw new Error('Invalid username or password.');
}

// --- Tickets ---
export function getTickets(userRole, roomNumber, department) {
  // Guests only see their own, non-internal tickets
  if (userRole === 'guest') return tickets.filter(t => t.roomNumber === roomNumber && !t.isInternalIncident).map(enrich);
  // Front office & executive see all
  if (userRole === 'staff_front_office' || userRole === 'executive') return tickets.map(enrich);
  // Other staff see their dept tickets
  return tickets.filter(t => t.department === department).map(enrich);
}

export function getTicket(id) {
  const t = tickets.find(t => t.id === id);
  return t ? enrich(t) : null;
}

export function createTicket({ roomNumber, category, subCategory, otherDetail, description, urgency, scheduledTime, isProxyRequest }) {
  const finalSub = subCategory?.includes('Other') && otherDetail ? `Other: ${otherDetail}` : subCategory;
  const ticket = {
    id: `t-${Date.now()}`,
    ticketNumber: `TKT-2026-${String(ticketCounter++).padStart(5, '0')}`,
    roomNumber,
    category,
    subCategory: finalSub,
    description: description || '',
    urgency: urgency || 'immediate',
    scheduledTime: urgency === 'scheduled' ? scheduledTime : null,
    status: 'submitted',
    department: CATEGORY_DEPT[category] || 'Front Office',
    assignedTo: null, resolutionCode: null, resolutionTime: null,
    isProxyRequest: !!isProxyRequest, isInternalIncident: false, priority: null,
    createdAt: new Date().toISOString(),
    acknowledgedAt: null, enRouteAt: null, resolvedAt: null,
  };
  tickets.push(ticket);
  emit('ticket:created', enrich(ticket));
  return enrich(ticket);
}

export function createInternalIncident({ location, category, subCategory, description, priority, reportedBy }) {
  const ticket = {
    id: `t-${Date.now()}`,
    ticketNumber: `INT-2026-${String(ticketCounter++).padStart(5, '0')}`,
    roomNumber: null,
    category, subCategory,
    description,
    urgency: 'immediate', scheduledTime: null,
    status: 'submitted',
    department: category === 'IT / Tech' ? 'IT' : category === 'Facilities' ? 'Engineering' : category === 'Housekeeping' ? 'Housekeeping' : 'Engineering',
    assignedTo: null, resolutionCode: null, resolutionTime: null,
    isProxyRequest: false, isInternalIncident: true,
    internalLocation: location,
    priority: priority || 'medium',
    createdAt: new Date().toISOString(),
    acknowledgedAt: null, enRouteAt: null, resolvedAt: null,
  };
  tickets.push(ticket);
  emit('ticket:created', enrich(ticket));
  return enrich(ticket);
}

export function claimTicket(id, staffId) {
  const t = tickets.find(t => t.id === id);
  if (!t) throw new Error('Ticket not found');
  if (t.assignedTo) throw new Error('Already claimed');
  t.assignedTo = staffId;
  t.status = 'acknowledged';
  t.acknowledgedAt = new Date().toISOString();
  emit('ticket:status_changed', enrich(t));
  return enrich(t);
}

export function updateStatus(id, status) {
  const t = tickets.find(t => t.id === id);
  if (!t) throw new Error('Ticket not found');
  t.status = status;
  if (status === 'en_route' && !t.enRouteAt) t.enRouteAt = new Date().toISOString();
  emit('ticket:status_changed', enrich(t));
  return enrich(t);
}

export function resolveTicket(id, resolutionCode, resolutionNotes, staffId) {
  const t = tickets.find(t => t.id === id);
  if (!t) throw new Error('Ticket not found');
  t.status = 'resolved';
  t.resolutionCode = resolutionCode;
  t.resolvedAt = new Date().toISOString();
  t.resolutionTime = elapsed(t.createdAt);
  if (resolutionNotes) {
    ticketNotes.push({ id: `n-${Date.now()}`, ticketId: id, userId: staffId, content: `Resolution: ${resolutionNotes}`, createdAt: new Date().toISOString() });
  }
  emit('ticket:status_changed', enrich(t));
  return enrich(t);
}

export function addNote(ticketId, content, staffId) {
  const note = { id: `n-${Date.now()}`, ticketId, userId: staffId, content, createdAt: new Date().toISOString() };
  ticketNotes.push(note);
  emit('ticket:note_added', { ticketId });
  return note;
}

export function submitRating(ticketId, stars, comment) {
  if (ticketRatings.find(r => r.ticketId === ticketId)) throw new Error('Already rated');
  const rating = { id: `r-${Date.now()}`, ticketId, stars, comment: comment || null, createdAt: new Date().toISOString() };
  ticketRatings.push(rating);
  return rating;
}

// --- Job Orders ---
export function getJobOrders() { return [...jobOrders]; }

export function createJobOrder({ title, category, specifications, targetDate, createdBy }) {
  const jo = {
    id: `jo-${Date.now()}`,
    joNumber: `JO-2026-${String(joCounter++).padStart(5, '0')}`,
    title, category, specifications, targetDate,
    status: 'pending_approval',
    createdBy, assignedTo: null,
    createdAt: new Date().toISOString(),
    attachments: [],
  };
  jobOrders.push(jo);
  emit('jo:created', jo);
  return jo;
}

export function updateJobOrderStatus(id, status) {
  const jo = jobOrders.find(j => j.id === id);
  if (!jo) throw new Error('Job order not found');
  jo.status = status;
  emit('jo:updated', jo);
  return jo;
}

// --- Analytics ---
export function getKPIs() {
  const today = new Date(); today.setHours(0,0,0,0);
  // Guest tickets only (exclude internal incidents for CSAT)
  const guestTickets = tickets.filter(t => !t.isInternalIncident);
  const todayT = guestTickets.filter(t => new Date(t.createdAt) >= today);
  const resolved = todayT.filter(t => t.status === 'resolved');
  const avgRes = resolved.length ? resolved.reduce((s,t) => s + (t.resolutionTime||0), 0) / resolved.length : 0;
  const slaOk = resolved.filter(t => (t.resolutionTime||0) <= 15).length;
  const ratings = ticketRatings.filter(r => { const t = tickets.find(x => x.id === r.ticketId); return t && t.resolvedAt && new Date(t.resolvedAt) >= today; });
  const avgCSAT = ratings.length ? ratings.reduce((s,r) => s + r.stars, 0) / ratings.length : 4.7;

  // Facility health (internal incidents)
  const internalTickets = tickets.filter(t => t.isInternalIncident);
  const internalActive = internalTickets.filter(t => t.status !== 'resolved').length;

  return {
    totalTickets: todayT.length || guestTickets.length,
    resolvedTickets: resolved.length || guestTickets.filter(t => t.status === 'resolved').length,
    activeTickets: guestTickets.filter(t => t.status !== 'resolved').length,
    avgResolutionTime: Math.round(avgRes) || 11,
    slaComplianceRate: resolved.length ? Math.round((slaOk/resolved.length)*100) : 87,
    avgCSAT: avgCSAT.toFixed(1),
    facilityIssuesActive: internalActive,
    pendingJobOrders: jobOrders.filter(j => j.status === 'pending_approval').length,
  };
}

export function getDepartmentalBreakdown() {
  return ['IT','Housekeeping','Engineering','Front Office'].map(dept => {
    const dt = tickets.filter(t => t.department === dept && !t.isInternalIncident);
    const res = dt.filter(t => t.status === 'resolved');
    const avgRes = res.length ? res.reduce((s,t) => s+(t.resolutionTime||0),0)/res.length : 0;
    const breached = res.filter(t => (t.resolutionTime||0) > 15).length;
    return {
      department: dept,
      totalTickets: dt.length,
      resolvedTickets: res.length,
      avgResolutionTime: Math.round(avgRes)||8,
      slaBreachRate: res.length ? Math.round((breached/res.length)*100) : 0,
    };
  });
}

export function getCategoryBreakdown() {
  const guestTickets = tickets.filter(t => !t.isInternalIncident);
  const counts = {};
  guestTickets.forEach(t => { counts[t.category] = (counts[t.category]||0) + 1; });
  return Object.entries(counts).map(([cat, count]) => ({ category: cat, count })).sort((a,b) => b.count - a.count);
}

export function getHourlyVolume() {
  const hours = Array.from({length:24},(_,i)=>({ hour: i, count: 0 }));
  tickets.forEach(t => {
    const h = new Date(t.createdAt).getHours();
    hours[h].count++;
  });
  return hours;
}

export function getFacilityHealth() {
  const internal = tickets.filter(t => t.isInternalIncident);
  return {
    total: internal.length,
    active: internal.filter(t => t.status !== 'resolved').length,
    resolved: internal.filter(t => t.status === 'resolved').length,
    byDept: ['IT','Housekeeping','Engineering','Front Office'].map(dept => ({
      department: dept,
      count: internal.filter(t => t.department === dept).length,
    })),
    tickets: internal.map(enrich),
  };
}

export function getStaffPerformance() {
  return Object.entries(STAFF_USERS).filter(([,u]) => u.role.startsWith('staff_')).map(([,user]) => {
    const ut = tickets.filter(t => t.assignedTo === user.id && t.status === 'resolved');
    const avgRes = ut.length ? ut.reduce((s,t) => s+(t.resolutionTime||0),0)/ut.length : 0;
    const slaOk = ut.filter(t => (t.resolutionTime||0) <= 15).length;
    const ratings = ut.map(t => ticketRatings.find(r => r.ticketId === t.id)).filter(Boolean);
    const avgRating = ratings.length ? ratings.reduce((s,r) => s+r.stars,0)/ratings.length : 0;
    return {
      staffId: user.id, name: `${user.firstName} ${user.lastName}`,
      department: user.department, ticketsResolved: ut.length,
      avgResolutionTime: Math.round(avgRes)||0,
      slaComplianceRate: ut.length ? Math.round((slaOk/ut.length)*100) : 100,
      avgRating: avgRating.toFixed(1),
    };
  });
}
