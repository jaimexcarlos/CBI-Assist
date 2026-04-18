import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  staffLogin, getTickets, getTicket, claimTicket, updateStatus,
  resolveTicket, addNote, createTicket, createInternalIncident,
  createJobOrder, getJobOrders, updateJobOrderStatus,
  CATEGORIES, RESOLUTION_CODES, INTERNAL_CATEGORIES, JO_CATEGORIES, onEvent
} from '../utils/mockApi';

export default function StaffDashboard() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const isStaff = user?.role?.startsWith('staff_');
  if (!token || !isStaff) return <StaffLogin onLogin={setAuth} />;
  return <StaffDashboardView user={user} onLogout={clearAuth} />;
}

// ── Login ──────────────────────────────────────────────────────────────────
function StaffLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = staffLogin(username, password);
      if (r.user.role === 'executive') { setErr('Use the Executive Dashboard for executive login.'); setBusy(false); return; }
      onLogin(r.token, r.user);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-bg-offset flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👥</div>
          <h1 className="text-3xl font-semibold text-primary-blue mb-1">Staff Dashboard</h1>
          <p className="text-gray-500 text-sm">Club Balai Isabel Operations</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Enter username" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Enter password" required />
          </div>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}
          <button type="submit" disabled={busy}
            className="w-full bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600 space-y-1">
          <p className="font-medium mb-1">Demo accounts (password: <code>password123</code>):</p>
          <p><strong>it_staff</strong> — IT Department</p>
          <p><strong>housekeeping_staff</strong> — Housekeeping</p>
          <p><strong>engineering_staff</strong> — Engineering</p>
          <p><strong>frontoffice_staff</strong> — Front Office (God View)</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
const TABS = [
  { key:'idle',    label:'Idle / New',       color:'bg-blue-500',   activeText:'text-white' },
  { key:'pending', label:'Pending',           color:'bg-yellow-500', activeText:'text-white' },
  { key:'urgent',  label:'🚨 Urgent',         color:'bg-red-500',    activeText:'text-white' },
  { key:'closed',  label:'Closed Today',      color:'bg-green-500',  activeText:'text-white' },
];

function StaffDashboardView({ user, onLogout }) {
  const [tickets, setTickets]         = useState([]);
  const [tab, setTab]                 = useState('idle');
  const [selected, setSelected]       = useState(null);
  const [showProxy, setShowProxy]     = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [showJO, setShowJO]           = useState(false);
  const [showJOList, setShowJOList]   = useState(false);

  const load = useCallback(() => {
    setTickets(getTickets(user.role, user.roomNumber, user.department));
  }, [user]);

  useEffect(() => {
    load();
    const offs = ['ticket:created','ticket:status_changed','ticket:claimed','ticket:note_added'].map(e => onEvent(e, load));
    const iv = setInterval(load, 5000);
    return () => { offs.forEach(f=>f()); clearInterval(iv); };
  }, [load]);

  const idle    = tickets.filter(t => t.status === 'submitted' && !t.assignedTo);
  const pending = tickets.filter(t => ['acknowledged','en_route'].includes(t.status));
  const urgent  = tickets.filter(t => t.slaStatus === 'escalated' && t.status !== 'resolved');
  const closed  = tickets.filter(t => t.status === 'resolved');
  const counts  = { idle: idle.length, pending: pending.length, urgent: urgent.length, closed: closed.length };
  const current = { idle, pending, urgent, closed }[tab];

  return (
    <div className="min-h-screen bg-bg-offset">
      <header className="bg-primary-blue text-white px-4 py-4 shadow">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Staff Dashboard</h1>
            <p className="text-sm text-white/80">{user.firstName} {user.lastName} · {user.department}</p>
          </div>
          <div className="flex gap-2">
            {user.role === 'staff_front_office' && (
              <button onClick={() => setShowProxy(true)}
                className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">
                + Proxy Request
              </button>
            )}
            <button onClick={() => setShowInternal(true)}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">
              ⚠️ Internal Incident
            </button>
            {(user.role === 'staff_front_office' || user.role === 'staff_engineering' || user.role === 'executive') && (
              <button onClick={() => setShowJO(true)}
                className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">
                📋 New Job Order
              </button>
            )}
            <button onClick={() => setShowJOList(true)}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">
              📁 Job Orders
            </button>
            <button onClick={onLogout}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${tab===t.key ? `${t.color} text-white` : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>
              {t.label}
              {counts[t.key] > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tab===t.key ? 'bg-white/30' : 'bg-gray-100'}`}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ticket grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {current.map(t => (
            <StaffTicketCard key={t.id} ticket={t} onClick={() => setSelected(t)} />
          ))}
        </div>
        {current.length === 0 && (
          <div className="card text-center py-12 mt-2">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-500">No tickets in this queue</p>
          </div>
        )}
      </div>

      {selected && (
        <TicketModal ticket={selected} user={user}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); load(); }} />
      )}
      {showProxy && (
        <ProxyModal user={user}
          onClose={() => setShowProxy(false)}
          onDone={() => { setShowProxy(false); load(); }} />
      )}
      {showInternal && (
        <InternalIncidentModal user={user}
          onClose={() => setShowInternal(false)}
          onDone={() => { setShowInternal(false); load(); }} />
      )}
      {showJO && (
        <JobOrderModal user={user}
          onClose={() => setShowJO(false)}
          onDone={() => setShowJO(false)} />
      )}
      {showJOList && (
        <JobOrderListModal
          onClose={() => setShowJOList(false)} />
      )}
    </div>
  );
}

// ── Ticket Card ────────────────────────────────────────────────────────────
function StaffTicketCard({ ticket, onClick }) {
  const slaColor = { normal:'text-green-600', warning:'text-yellow-600', escalated:'text-red-600' };
  return (
    <div onClick={onClick}
      className={`card cursor-pointer hover:shadow-lg transition-all ${ticket.slaStatus==='escalated' ? 'border-2 border-red-400' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-sm">{ticket.ticketNumber}</p>
          <p className="text-xs text-gray-500">Room {ticket.roomNumber}</p>
        </div>
        <span className={`text-sm font-semibold ${slaColor[ticket.slaStatus]}`}>{ticket.elapsedTime}m</span>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-0.5">{ticket.category}</p>
      <p className="text-xs text-gray-500 mb-2">{ticket.subCategory}</p>
      <p className="text-xs text-gray-400 line-clamp-2">{ticket.description}</p>
      {ticket.isProxyRequest && <span className="mt-2 inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Proxy</span>}
      {ticket.slaStatus === 'escalated' && <span className="mt-2 inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-1">SLA Breach</span>}
    </div>
  );
}

// ── Ticket Detail Modal ────────────────────────────────────────────────────
function TicketModal({ ticket: initial, user, onClose, onUpdate }) {
  const [ticket, setTicket]   = useState(() => getTicket(initial.id) || initial);
  const [note, setNote]       = useState('');
  const [rescode, setRescode] = useState('');
  const [resnote, setResnote] = useState('');
  const [busy, setBusy]       = useState(false);

  const refresh = () => setTicket(getTicket(initial.id) || initial);

  const claim = () => { setBusy(true); try { claimTicket(ticket.id, user.id); refresh(); onUpdate(); } finally { setBusy(false); } };
  const enRoute = () => { updateStatus(ticket.id, 'en_route'); refresh(); onUpdate(); };
  const resolve = () => {
    if (!rescode) return;
    resolveTicket(ticket.id, rescode, resnote, user.id);
    onUpdate();
  };
  const submitNote = () => {
    if (!note.trim()) return;
    addNote(ticket.id, note, user.id);
    setNote('');
    refresh();
  };

  const STATUS_LABEL = { submitted:'Submitted', acknowledged:'Acknowledged', en_route:'Staff En Route', resolved:'Resolved' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card max-w-xl w-full my-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-semibold">{ticket.ticketNumber}</h2>
            <p className="text-sm text-gray-500">Room {ticket.roomNumber} · {ticket.department}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
          <div><p className="text-gray-400 text-xs">Category</p><p className="font-medium">{ticket.category}</p></div>
          <div><p className="text-gray-400 text-xs">Sub-Category</p><p className="font-medium">{ticket.subCategory}</p></div>
          <div><p className="text-gray-400 text-xs">Status</p><p className="font-medium capitalize">{STATUS_LABEL[ticket.status]}</p></div>
          <div><p className="text-gray-400 text-xs">Elapsed</p><p className={`font-medium ${ticket.slaStatus==='escalated'?'text-red-600':ticket.slaStatus==='warning'?'text-yellow-600':'text-green-600'}`}>{ticket.elapsedTime} min</p></div>
          <div className="col-span-2"><p className="text-gray-400 text-xs">Description</p><p>{ticket.description}</p></div>
        </div>

        {/* Actions */}
        {ticket.status !== 'resolved' && (
          <div className="space-y-3 mb-5">
            {!ticket.assignedTo && (
              <button onClick={claim} disabled={busy}
                className="w-full bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">
                Claim Ticket
              </button>
            )}
            {ticket.assignedTo && ticket.status === 'acknowledged' && (
              <button onClick={enRoute}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Mark as En Route
              </button>
            )}
            {ticket.assignedTo && (
              <div className="space-y-2">
                <select value={rescode} onChange={e=>setRescode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm">
                  <option value="">Select resolution code…</option>
                  {RESOLUTION_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea value={resnote} onChange={e=>setResnote(e.target.value)} rows={2}
                  placeholder="Resolution notes (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm resize-none" />
                <button onClick={resolve} disabled={!rescode}
                  className="w-full bg-secondary-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
                  ✓ Resolve Ticket
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 text-sm">Internal Notes <span className="text-gray-400 font-normal">(not visible to guest)</span></h3>
          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {ticket.notes?.length > 0
              ? ticket.notes.map(n => (
                  <div key={n.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.author} · {new Date(n.createdAt).toLocaleTimeString()}</p>
                  </div>
                ))
              : <p className="text-sm text-gray-400">No notes yet.</p>
            }
          </div>
          {ticket.status !== 'resolved' && (
            <div className="flex gap-2">
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} maxLength={500}
                placeholder="Add internal note…"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm resize-none" />
              <button onClick={submitNote} disabled={!note.trim()}
                className="px-4 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm">
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Proxy Request Modal ────────────────────────────────────────────────────
function ProxyModal({ user, onClose, onDone }) {
  const [room, setRoom]   = useState('');
  const [cat, setCat]     = useState('');
  const [sub, setSub]     = useState('');
  const [desc, setDesc]   = useState('');
  const [err, setErr]     = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (desc.length < 10) { setErr('Description must be at least 10 characters.'); return; }
    try {
      createTicket({ roomNumber: room, category: cat, subCategory: sub, description: desc, urgency: 'immediate', isProxyRequest: true });
      onDone();
    } catch(e) { setErr(e.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Create Proxy Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
            <input value={room} onChange={e=>setRoom(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
              placeholder="e.g. 101" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={cat} onChange={e=>{setCat(e.target.value);setSub('');}} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm">
              <option value="">Select…</option>
              {Object.keys(CATEGORIES).map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {cat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category *</label>
              <select value={sub} onChange={e=>setSub(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm">
                <option value="">Select…</option>
                {CATEGORIES[cat].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} maxLength={500} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm resize-none"
              placeholder="Describe the request…" />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Internal Incident Modal ────────────────────────────────────────────────
function InternalIncidentModal({ user, onClose, onDone }) {
  const [location, setLocation] = useState('');
  const [cat, setCat]           = useState('');
  const [sub, setSub]           = useState('');
  const [desc, setDesc]         = useState('');
  const [priority, setPriority] = useState('medium');
  const [err, setErr]           = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!location.trim()) { setErr('Please enter the location.'); return; }
    if (!desc.trim()) { setErr('Please describe the issue.'); return; }
    try {
      createInternalIncident({ location, category: cat, subCategory: sub, description: desc, priority, reportedBy: user.id });
      onDone();
    } catch(e) { setErr(e.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card max-w-md w-full my-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">⚠️ Internal Incident Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-gray-500 mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          For back-of-house issues that don't affect a specific guest room. These are tracked separately from guest analytics under <strong>Facility Health</strong>.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Area *</label>
            <input value={location} onChange={e=>setLocation(e.target.value)} required
              placeholder="e.g. Front Office — Reception Desk"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={cat} onChange={e=>{setCat(e.target.value);setSub('');}} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm">
              <option value="">Select…</option>
              {Object.keys(INTERNAL_CATEGORIES).map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {cat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type *</label>
              <select value={sub} onChange={e=>setSub(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm">
                <option value="">Select…</option>
                {INTERNAL_CATEGORIES[cat].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} required
              placeholder="Describe the issue in detail…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {[['low','🟢 Low'],['medium','🟡 Medium'],['high','🟠 High'],['critical','🔴 Critical']].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>setPriority(v)}
                  className={`py-2 rounded-lg text-xs font-medium border-2 transition-colors ${priority===v?'border-primary-blue bg-blue-50':'border-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm">
              Submit Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Job Order Modal ────────────────────────────────────────────────────────
function JobOrderModal({ user, onClose, onDone }) {
  const [title, setTitle]       = useState('');
  const [cat, setCat]           = useState('');
  const [specs, setSpecs]       = useState('');
  const [targetDate, setTarget] = useState('');
  const [err, setErr]           = useState('');
  const [done, setDone]         = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !cat || !specs.trim() || !targetDate) { setErr('All fields are required.'); return; }
    try {
      const jo = createJobOrder({ title, category: cat, specifications: specs, targetDate, createdBy: user.id });
      setDone(jo);
    } catch(e) { setErr(e.message); }
  };

  if (done) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-sm w-full text-center py-8">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-lg font-semibold mb-1">Job Order Created</h2>
        <p className="text-sm text-gray-500 mb-1">{done.joNumber}</p>
        <p className="text-sm text-gray-600 mb-5">Submitted for approval. Engineering will be notified once approved.</p>
        <button onClick={onDone} className="bg-primary-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">Done</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card max-w-lg w-full my-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">📋 New Job Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-gray-500 mb-5 bg-purple-50 border border-purple-200 rounded-lg p-3">
          For major repairs, fabrication, or heavy maintenance. Job Orders operate on a timeline of days or weeks — not the standard 15-minute SLA.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} required
              placeholder="e.g. Re-upholster Lobby Chairs"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Category *</label>
            <div className="grid grid-cols-2 gap-2">
              {JO_CATEGORIES.map(c=>(
                <button key={c} type="button" onClick={()=>setCat(c)}
                  className={`p-3 rounded-lg border-2 text-sm text-left transition-colors ${cat===c?'border-primary-blue bg-blue-50':'border-gray-200 hover:border-gray-300'}`}>
                  {c==='Furniture Repair'?'🪑':c==='Custom Fabrication'?'🔨':c==='Preventative Maintenance'?'🔧':'🏗️'} {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Specifications *</label>
            <textarea value={specs} onChange={e=>setSpecs(e.target.value)} rows={4} required
              placeholder="Include exact dimensions, materials, colors, or any reference details…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date *</label>
            <input type="date" value={targetDate} onChange={e=>setTarget(e.target.value)} required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Attachments</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-400 hover:border-primary-blue transition-colors cursor-pointer">
              📎 Click to upload reference images<br/>
              <span className="text-xs">(prototype — upload not functional)</span>
            </div>
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
              Submit Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Job Order List Modal ───────────────────────────────────────────────────
const JO_STATUS_LABEL = { pending_approval:'Pending Approval', approved:'Approved', in_progress:'In Progress', on_hold:'On Hold', completed:'Completed' };
const JO_STATUS_COLOR = { pending_approval:'bg-yellow-100 text-yellow-800', approved:'bg-blue-100 text-blue-800', in_progress:'bg-purple-100 text-purple-800', on_hold:'bg-gray-100 text-gray-700', completed:'bg-green-100 text-green-800' };

function JobOrderListModal({ onClose }) {
  const [jos, setJos] = useState(getJobOrders());

  const advance = (id, current) => {
    const next = { pending_approval:'approved', approved:'in_progress', in_progress:'completed' }[current];
    if (next) { updateJobOrderStatus(id, next); setJos(getJobOrders()); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="card max-w-2xl w-full my-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">📁 Job Orders</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          {jos.map(jo => (
            <div key={jo.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{jo.title}</p>
                  <p className="text-xs text-gray-500">{jo.joNumber} · {jo.category}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${JO_STATUS_COLOR[jo.status]}`}>
                  {JO_STATUS_LABEL[jo.status]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{jo.specifications}</p>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Target: {new Date(jo.targetDate).toLocaleDateString()}</span>
                {jo.status !== 'completed' && (
                  <button onClick={() => advance(jo.id, jo.status)}
                    className="text-primary-blue font-medium hover:underline">
                    → Advance Status
                  </button>
                )}
              </div>
            </div>
          ))}
          {jos.length === 0 && <p className="text-center py-8 text-gray-400">No job orders yet.</p>}
        </div>
      </div>
    </div>
  );
}
