import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const { token } = useAuthStore.getState();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }
  
  // Auth
  async guestLogin(roomNumber, pin) {
    return this.request('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ roomNumber, pin })
    });
  }
  
  async staffLogin(username, password) {
    return this.request('/auth/staff', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }
  
  // Tickets
  async getTickets() {
    return this.request('/tickets');
  }
  
  async getTicket(id) {
    return this.request(`/tickets/${id}`);
  }
  
  async createTicket(ticketData) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }
  
  async claimTicket(id) {
    return this.request(`/tickets/${id}/claim`, {
      method: 'PATCH'
    });
  }
  
  async updateTicketStatus(id, status) {
    return this.request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
  
  async resolveTicket(id, resolutionCode, resolutionNotes) {
    return this.request(`/tickets/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionCode, resolutionNotes })
    });
  }
  
  async addNote(ticketId, content) {
    return this.request(`/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
  
  async submitRating(ticketId, stars, comment) {
    return this.request(`/tickets/${ticketId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ stars, comment })
    });
  }
  
  // Metadata
  async getMetadata() {
    return this.request('/metadata/categories');
  }
  
  // Analytics
  async getKPIs() {
    return this.request('/metrics/kpis');
  }
  
  async getDepartmentalBreakdown() {
    return this.request('/metrics/departmental');
  }
  
  async getStaffPerformance() {
    return this.request('/metrics/staff-performance');
  }
}

export const api = new ApiClient();
