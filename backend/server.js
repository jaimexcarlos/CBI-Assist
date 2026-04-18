import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  tickets,
  ticketNotes,
  ticketRatings,
  jobOrders,
  users,
  categoryToDepartment,
  subCategories,
  resolutionCodes,
  generateTicketNumber,
  calculateElapsedTime,
  getSLAStatus
} from './data.js';
import {
  authenticateGuest,
  authenticateStaff,
  authMiddleware,
  requireRole,
  verifyToken
} from './auth.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ============================================================================
// Authentication Routes
// ============================================================================

app.post('/api/auth/guest', (req, res) => {
  const { roomNumber, pin } = req.body;
  const result = authenticateGuest(roomNumber, pin);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json({ error: result.message });
  }
});

app.post('/api/auth/staff', (req, res) => {
  const { username, password } = req.body;
  const result = authenticateStaff(username, password);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json({ error: result.message });
  }
});

// ============================================================================
// Ticket Routes
// ============================================================================

// Create ticket
app.post('/api/tickets', authMiddleware, (req, res) => {
  const {
    category,
    subCategory,
    description,
    urgency,
    isProxyRequest,
    roomNumber: proxyRoomNumber
  } = req.body;
  
  // Determine room number
  let roomNumber;
  if (req.user.role === 'guest') {
    roomNumber = req.user.roomNumber;
  } else if (isProxyRequest && proxyRoomNumber) {
    roomNumber = proxyRoomNumber;
  } else {
    return res.status(400).json({ error: 'Room number required' });
  }
  
  // Route to department
  const department = categoryToDepartment[category];
  
  const ticket = {
    id: `ticket-${Date.now()}`,
    ticketNumber: generateTicketNumber(),
    roomNumber,
    guestSessionId: req.user.role === 'guest' ? req.user.id : null,
    category,
    subCategory,
    description,
    urgency: urgency || 'immediate',
    status: 'submitted',
    department,
    assignedTo: null,
    resolutionCode: null,
    resolutionTime: null,
    photos: [],
    isProxyRequest: isProxyRequest || false,
    proxyCreatedBy: isProxyRequest ? req.user.id : null,
    isInternalIncident: false,
    priority: null,
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    enRouteAt: null,
    resolvedAt: null,
    updatedAt: new Date().toISOString()
  };
  
  tickets.push(ticket);
  
  // Broadcast to department channel
  io.to(`department:${department}`).emit('ticket:created', ticket);
  
  // Broadcast to room channel if guest ticket
  if (req.user.role === 'guest') {
    io.to(`room:${roomNumber}`).emit('ticket:created', ticket);
  }
  
  res.status(201).json(ticket);
});

// Get tickets
app.get('/api/tickets', authMiddleware, (req, res) => {
  let filteredTickets = [...tickets];
  
  // Filter by role
  if (req.user.role === 'guest') {
    filteredTickets = filteredTickets.filter(t => t.roomNumber === req.user.roomNumber);
  } else if (req.user.role.startsWith('staff_') && req.user.role !== 'staff_front_office') {
    filteredTickets = filteredTickets.filter(t => t.department === req.user.department);
  }
  // Executives and Front Office see all tickets
  
  // Add SLA status and elapsed time
  filteredTickets = filteredTickets.map(ticket => ({
    ...ticket,
    elapsedTime: calculateElapsedTime(ticket.createdAt),
    slaStatus: getSLAStatus(ticket)
  }));
  
  res.json(filteredTickets);
});

// Get single ticket
app.get('/api/tickets/:id', authMiddleware, (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  // Check permissions
  if (req.user.role === 'guest' && ticket.roomNumber !== req.user.roomNumber) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (req.user.role.startsWith('staff_') && 
      req.user.role !== 'staff_front_office' && 
      ticket.department !== req.user.department) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const enrichedTicket = {
    ...ticket,
    elapsedTime: calculateElapsedTime(ticket.createdAt),
    slaStatus: getSLAStatus(ticket),
    notes: ticketNotes.filter(n => n.ticketId === ticket.id),
    rating: ticketRatings.find(r => r.ticketId === ticket.id)
  };
  
  res.json(enrichedTicket);
});

// Claim ticket
app.patch('/api/tickets/:id/claim', authMiddleware, requireRole('staff_it', 'staff_housekeeping', 'staff_engineering', 'staff_front_office'), (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  if (ticket.assignedTo) {
    return res.status(400).json({ error: 'Ticket already claimed' });
  }
  
  ticket.assignedTo = req.user.id;
  ticket.status = 'acknowledged';
  ticket.acknowledgedAt = new Date().toISOString();
  ticket.updatedAt = new Date().toISOString();
  
  // Broadcast update
  io.to(`department:${ticket.department}`).emit('ticket:claimed', ticket);
  io.to(`room:${ticket.roomNumber}`).emit('ticket:status_changed', ticket);
  
  res.json(ticket);
});

// Update ticket status
app.patch('/api/tickets/:id/status', authMiddleware, requireRole('staff_it', 'staff_housekeeping', 'staff_engineering', 'staff_front_office'), (req, res) => {
  const { status } = req.body;
  const ticket = tickets.find(t => t.id === req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  
  if (status === 'en_route' && !ticket.enRouteAt) {
    ticket.enRouteAt = new Date().toISOString();
  }
  
  // Broadcast update
  io.to(`department:${ticket.department}`).emit('ticket:status_changed', ticket);
  io.to(`room:${ticket.roomNumber}`).emit('ticket:status_changed', ticket);
  
  res.json(ticket);
});

// Resolve ticket
app.patch('/api/tickets/:id/resolve', authMiddleware, requireRole('staff_it', 'staff_housekeeping', 'staff_engineering', 'staff_front_office'), (req, res) => {
  const { resolutionCode, resolutionNotes } = req.body;
  const ticket = tickets.find(t => t.id === req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  ticket.status = 'resolved';
  ticket.resolutionCode = resolutionCode;
  ticket.resolvedAt = new Date().toISOString();
  ticket.updatedAt = new Date().toISOString();
  
  // Calculate resolution time
  const createdTime = new Date(ticket.createdAt).getTime();
  const resolvedTime = new Date(ticket.resolvedAt).getTime();
  ticket.resolutionTime = Math.floor((resolvedTime - createdTime) / 60000); // minutes
  
  // Add resolution note if provided
  if (resolutionNotes) {
    const note = {
      id: `note-${Date.now()}`,
      ticketId: ticket.id,
      userId: req.user.id,
      content: `Resolution: ${resolutionNotes}`,
      createdAt: new Date().toISOString()
    };
    ticketNotes.push(note);
  }
  
  // Broadcast update
  io.to(`department:${ticket.department}`).emit('ticket:resolved', ticket);
  io.to(`room:${ticket.roomNumber}`).emit('ticket:status_changed', ticket);
  
  res.json(ticket);
});

// Add note to ticket
app.post('/api/tickets/:id/notes', authMiddleware, requireRole('staff_it', 'staff_housekeeping', 'staff_engineering', 'staff_front_office'), (req, res) => {
  const { content } = req.body;
  const ticket = tickets.find(t => t.id === req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  const note = {
    id: `note-${Date.now()}`,
    ticketId: ticket.id,
    userId: req.user.id,
    content,
    createdAt: new Date().toISOString()
  };
  
  ticketNotes.push(note);
  
  // Get user info
  const user = users.find(u => u.id === req.user.id);
  const enrichedNote = {
    ...note,
    author: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
  };
  
  // Broadcast to department
  io.to(`department:${ticket.department}`).emit('ticket:note_added', { ticketId: ticket.id, note: enrichedNote });
  
  res.status(201).json(enrichedNote);
});

// Submit rating
app.post('/api/tickets/:id/rating', authMiddleware, requireRole('guest'), (req, res) => {
  const { stars, comment } = req.body;
  const ticket = tickets.find(t => t.id === req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  if (ticket.roomNumber !== req.user.roomNumber) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (ticket.status !== 'resolved') {
    return res.status(400).json({ error: 'Can only rate resolved tickets' });
  }
  
  // Check if already rated
  const existingRating = ticketRatings.find(r => r.ticketId === ticket.id);
  if (existingRating) {
    return res.status(400).json({ error: 'Ticket already rated' });
  }
  
  const rating = {
    id: `rating-${Date.now()}`,
    ticketId: ticket.id,
    stars,
    comment: comment || null,
    createdAt: new Date().toISOString()
  };
  
  ticketRatings.push(rating);
  
  res.status(201).json(rating);
});

// ============================================================================
// Metadata Routes
// ============================================================================

app.get('/api/metadata/categories', (req, res) => {
  res.json({
    categories: Object.keys(categoryToDepartment),
    subCategories,
    resolutionCodes
  });
});

// ============================================================================
// Analytics Routes
// ============================================================================

app.get('/api/metrics/kpis', authMiddleware, requireRole('executive', 'staff_front_office'), (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTickets = tickets.filter(t => new Date(t.createdAt) >= today);
  const resolvedToday = todayTickets.filter(t => t.status === 'resolved');
  
  const avgResolutionTime = resolvedToday.length > 0
    ? resolvedToday.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / resolvedToday.length
    : 0;
  
  const slaCompliant = resolvedToday.filter(t => (t.resolutionTime || 0) <= 15).length;
  const slaComplianceRate = resolvedToday.length > 0
    ? (slaCompliant / resolvedToday.length) * 100
    : 100;
  
  const ratingsToday = ticketRatings.filter(r => {
    const ticket = tickets.find(t => t.id === r.ticketId);
    return ticket && new Date(ticket.resolvedAt) >= today;
  });
  
  const avgCSAT = ratingsToday.length > 0
    ? ratingsToday.reduce((sum, r) => sum + r.stars, 0) / ratingsToday.length
    : 0;
  
  res.json({
    totalTickets: todayTickets.length,
    resolvedTickets: resolvedToday.length,
    activeTickets: todayTickets.filter(t => t.status !== 'resolved').length,
    avgResolutionTime: Math.round(avgResolutionTime),
    slaComplianceRate: Math.round(slaComplianceRate),
    avgCSAT: avgCSAT.toFixed(1)
  });
});

app.get('/api/metrics/departmental', authMiddleware, requireRole('executive', 'staff_front_office'), (req, res) => {
  const departments = ['IT', 'Housekeeping', 'Engineering', 'Front Office'];
  
  const breakdown = departments.map(dept => {
    const deptTickets = tickets.filter(t => t.department === dept);
    const resolved = deptTickets.filter(t => t.status === 'resolved');
    
    const avgResTime = resolved.length > 0
      ? resolved.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / resolved.length
      : 0;
    
    const breached = resolved.filter(t => (t.resolutionTime || 0) > 15).length;
    const breachRate = resolved.length > 0 ? (breached / resolved.length) * 100 : 0;
    
    return {
      department: dept,
      totalTickets: deptTickets.length,
      resolvedTickets: resolved.length,
      avgResolutionTime: Math.round(avgResTime),
      slaBreachRate: Math.round(breachRate)
    };
  });
  
  res.json(breakdown);
});

app.get('/api/metrics/staff-performance', authMiddleware, requireRole('executive', 'staff_front_office'), (req, res) => {
  const staffUsers = users.filter(u => u.role.startsWith('staff_'));
  
  const performance = staffUsers.map(user => {
    const userTickets = tickets.filter(t => t.assignedTo === user.id && t.status === 'resolved');
    
    const avgResTime = userTickets.length > 0
      ? userTickets.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / userTickets.length
      : 0;
    
    const slaCompliant = userTickets.filter(t => (t.resolutionTime || 0) <= 15).length;
    const slaRate = userTickets.length > 0 ? (slaCompliant / userTickets.length) * 100 : 100;
    
    const userRatings = userTickets
      .map(t => ticketRatings.find(r => r.ticketId === t.id))
      .filter(r => r);
    
    const avgRating = userRatings.length > 0
      ? userRatings.reduce((sum, r) => sum + r.stars, 0) / userRatings.length
      : 0;
    
    return {
      staffId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      department: user.department,
      ticketsResolved: userTickets.length,
      avgResolutionTime: Math.round(avgResTime),
      slaComplianceRate: Math.round(slaRate),
      avgRating: avgRating.toFixed(1)
    };
  });
  
  res.json(performance);
});

// ============================================================================
// WebSocket Connection Handling
// ============================================================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Authenticate socket connection
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  
  if (!user) {
    socket.disconnect();
    return;
  }
  
  // Subscribe to appropriate channels based on role
  if (user.role === 'guest') {
    socket.join(`room:${user.roomNumber}`);
    console.log(`Guest joined room:${user.roomNumber}`);
  } else if (user.role.startsWith('staff_')) {
    socket.join(`department:${user.department}`);
    console.log(`Staff joined department:${user.department}`);
  } else if (user.role === 'executive') {
    socket.join('metrics');
    console.log('Executive joined metrics channel');
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================================================
// SLA Timer (runs every 30 seconds)
// ============================================================================

setInterval(() => {
  tickets.forEach(ticket => {
    if (ticket.status !== 'resolved') {
      const slaStatus = getSLAStatus(ticket);
      
      if (slaStatus === 'escalated' && ticket.slaStatus !== 'escalated') {
        ticket.slaStatus = 'escalated';
        
        // Broadcast escalation
        io.to(`department:${ticket.department}`).emit('ticket:escalated', ticket);
        
        console.log(`Ticket ${ticket.ticketNumber} escalated - SLA breach`);
      }
    }
  });
}, 30000);

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`✅ Balai Assist Backend running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket server ready`);
  console.log(`\n📊 Demo Credentials:`);
  console.log(`   Guest: Room 101, PIN 1234`);
  console.log(`   Staff IT: it_staff / password123`);
  console.log(`   Staff Housekeeping: housekeeping_staff / password123`);
  console.log(`   Staff Engineering: engineering_staff / password123`);
  console.log(`   Front Office: frontoffice_staff / password123`);
  console.log(`   Executive: executive / admin123\n`);
});
