import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { users, guestSessions } from './data.js';

const JWT_SECRET = 'balai-assist-secret-key-change-in-production';

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Authenticate guest
export const authenticateGuest = (roomNumber, pin) => {
  const session = guestSessions.find(
    s => s.roomNumber === roomNumber && s.isActive
  );
  
  if (!session) {
    return { success: false, message: 'Invalid room number or room is not occupied' };
  }
  
  const pinValid = bcrypt.compareSync(pin, session.pin);
  if (!pinValid) {
    return { success: false, message: 'Invalid PIN' };
  }
  
  const token = jwt.sign(
    {
      id: session.id,
      roomNumber: session.roomNumber,
      role: 'guest'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return {
    success: true,
    token,
    roomNumber: session.roomNumber
  };
};

// Authenticate staff/executive
export const authenticateStaff = (username, password) => {
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return { success: false, message: 'Invalid username or password' };
  }
  
  const passwordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordValid) {
    return { success: false, message: 'Invalid username or password' };
  }
  
  const token = generateToken(user);
  
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }
  };
};

// Middleware to verify authentication
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

// Middleware to check role
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
