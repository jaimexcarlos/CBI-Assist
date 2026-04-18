import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  guestLogin, getTickets, createTicket, submitRating,
  CATEGORIES, onEvent
} from '../utils/mockApi';

export default function GuestPortal() {
  const { token, user, roomNumber, setAuth, clearAuth } = useAuthStore();
  const isGuest = user?.role === 'guest';

  if (!token || !isGuest) return <GuestLogin onLogin={setAuth} />;
  return <GuestDashboard roomNumber={roomNumber} onLogout={clearAuth} userId={user?.id} />;
}

// ── Login ──────────────────────────────────────────────────────────────────
function GuestLogin({ onLogin }) {
  const [room, setRoom] = useState('');
  const [pin, setPin]   = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = guestLogin(room, pin);
      onLogin(r.token, r.user, r.roomNumber);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-bg-offset flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏝️</div>
          <h1 className="text-3xl font-semibold text-primary-blue mb-1">Guest Portal</h1>
          <p className="text-gray-500 text-sm">Club Balai Isabel</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
            <input inputMode="numeric" value={room} onChange={e=>setRoom(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="e.g. 101" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Enter PIN" required />
          </div>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}
          <button type="submit" disabled={busy}
            className="w-full bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">
            {busy ? 'Checking…' : 'Access Portal'}
          </button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-1">Demo credentials:</p>
          <p>Room <strong>101</strong> · PIN <strong>1234</strong></p>
          <p>Room <strong>102</strong> · PIN <strong>5678</strong></p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function GuestDashboard({ roomNumber, onLogout }) {
  const [tickets, setTickets]       = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [ratingTicket, setRating]   = useState(null);
  const { user } = useAuthStore();

  const load = useCallback(() => {
    setTickets(getTickets('guest', roomNumber));
  }, [roomNumber]);

  useEffect(() => {
    load();
    const off1 = onEvent('ticket:created',        load);
    const off2 = onEvent('ticket:status_changed', load);
    const interval = setInterval(load, 5000);
    return () => { off1(); off2(); clearInterval(interval); };
  }, [load]);

  const active   = tickets.filter(t => t.status !== 'resolved');
  const resolved = tickets.filter(t => t.status === 'resolved');

  return (
    <div className="min-h-screen bg-bg-offset">
      <header className="bg-primary-blue text-white px-4 py-4 shadow">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Guest Portal</h1>
            <p className="text-sm text-white/80">Room {roomNumber}</p>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full bg-secondary-green text-white py-4 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-lg">
            <span>＋</span> New Service Request
          </button>
        )}

        {showForm && (
          <CreateForm roomNumber={roomNumber}
            onClose={() => setShowForm(false)}
            onDone={() => { setShowForm(false); load(); }} />
        )}

        {active.length > 0 && (
          <section>
            <h2 className="font-semibold text-lg mb-3">Active Requests</h2>
            <div className="space-y-3">{active.map(t => <TicketCard key={t.id} ticket={t} />)}</div>
          </section>
        )}

        {resolved.length > 0 && (
          <section>
            <h2 className="font-semibold text-lg mb-3">Completed</h2>
            <div className="space-y-3">
              {resolved.map(t => (
                <TicketCard key={t.id} ticket={t}
                  onRate={!t.rating ? () => setRating(t) : null} />
              ))}
            </div>
          </section>
        )}

        {tickets.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500">No requests yet. Tap the button above to get started.</p>
          </div>
        )}
      </div>

      {ratingTicket && (
        <RatingModal ticket={ratingTicket}
          onClose={() => setRating(null)}
          onDone={() => { setRating(null); load(); }} />
      )}
    </div>
  );
}

// ── Ticket Card ────────────────────────────────────────────────────────────
const STATUS_LABEL = { submitted:'Submitted', acknowledged:'Acknowledged', en_route:'Staff En Route', resolved:'Resolved' };
const STATUS_COLOR = { submitted:'bg-blue-100 text-blue-800', acknowledged:'bg-yellow-100 text-yellow-800', en_route:'bg-purple-100 text-purple-800', resolved:'bg-green-100 text-green-800' };

function TicketCard({ ticket, onRate }) {
  const steps = ['submitted','acknowledged','en_route','resolved'];
  const idx   = steps.indexOf(ticket.status);
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold">{ticket.ticketNumber}</p>
          <p className="text-sm text-gray-500">{ticket.category}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[ticket.status]}`}>
          {STATUS_LABEL[ticket.status]}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{ticket.subCategory} — {ticket.description}</p>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-3">
        {steps.map((s,i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`h-2 flex-1 rounded-full transition-colors ${i <= idx ? 'bg-primary-blue' : 'bg-gray-200'}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        {steps.map(s => <span key={s}>{STATUS_LABEL[s].split(' ')[0]}</span>)}
      </div>

      <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
        <span>{ticket.elapsedTime} min ago</span>
        {ticket.urgency === 'scheduled' && ticket.scheduledTime && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            🕐 {new Date(ticket.scheduledTime).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
          </span>
        )}
        {onRate && (
          <button onClick={onRate} className="text-primary-blue font-medium hover:underline">Rate Service ⭐</button>
        )}
        {ticket.rating && <span className="text-secondary-green">⭐ Rated {ticket.rating.stars}/5</span>}
      </div>
    </div>
  );
}

// ── Create Form ────────────────────────────────────────────────────────────
function CreateForm({ roomNumber, onClose, onDone }) {
  const [cat, setCat]           = useState('');
  const [sub, setSub]           = useState('');
  const [otherDetail, setOther] = useState('');
  const [desc, setDesc]         = useState('');
  const [urgency, setUrgency]   = useState('immediate');
  const [schedTime, setSchedTime] = useState('');
  const [err, setErr]           = useState('');
  const [busy, setBusy]         = useState(false);

  const subs = cat ? CATEGORIES[cat] : [];
  const isOther = sub?.includes('Other');

  const submit = (e) => {
    e.preventDefault();
    if (isOther && !otherDetail.trim()) { setErr('Please describe your specific concern.'); return; }
    if (urgency === 'scheduled' && !schedTime) { setErr('Please select a scheduled time.'); return; }
    setBusy(true); setErr('');
    try {
      createTicket({ roomNumber, category: cat, subCategory: sub, otherDetail, description: desc, urgency, scheduledTime: schedTime });
      onDone();
    } catch(e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold">New Service Request</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
      </div>

      {/* Category grid */}
      <p className="text-sm font-medium text-gray-700 mb-2">Type of Concern *</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.keys(CATEGORIES).map(c => (
          <button key={c} type="button" onClick={() => { setCat(c); setSub(''); setOther(''); }}
            className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${cat===c ? 'border-primary-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            {c}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {cat && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category *</label>
            <select value={sub} onChange={e=>{ setSub(e.target.value); setOther(''); }} required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue">
              <option value="">Select…</option>
              {subs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* "Other" free-text field */}
        {isOther && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Please describe your concern *</label>
            <input value={otherDetail} onChange={e=>setOther(e.target.value)} required
              placeholder="Type your specific concern here…"
              className="w-full px-4 py-3 border border-primary-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Details <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} maxLength={500}
            placeholder="Any extra information for our staff… (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none text-sm" />
          <p className="text-xs text-gray-400 mt-1 text-right">{desc.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
          <div className="flex gap-4 mb-3">
            {[['immediate','⚡ Handle Immediately'],['scheduled','🕐 Schedule for Later']].map(([v,l]) => (
              <label key={v} className={`flex-1 flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-colors ${urgency===v ? 'border-primary-blue bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" value={v} checked={urgency===v} onChange={()=>setUrgency(v)} className="accent-primary-blue" />
                <span className="text-sm font-medium">{l}</span>
              </label>
            ))}
          </div>
          {urgency === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time *</label>
              <input type="datetime-local" value={schedTime} onChange={e=>setSchedTime(e.target.value)} required
                min={new Date().toISOString().slice(0,16)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm" />
              <p className="text-xs text-gray-400 mt-1">e.g. schedule housekeeping while you're out for dinner</p>
            </div>
          )}
        </div>

        {err && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{err}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" disabled={!cat || !sub || busy}
            className="flex-1 bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm">
            {busy ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Rating Modal ───────────────────────────────────────────────────────────
function RatingModal({ ticket, onClose, onDone }) {
  const [stars, setStars]     = useState(0);
  const [comment, setComment] = useState('');
  const [err, setErr]         = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!stars) { setErr('Please select a star rating.'); return; }
    try {
      submitRating(ticket.id, stars, comment);
      onDone();
    } catch(e) { setErr(e.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-1">Rate Your Service</h2>
        <p className="text-sm text-gray-500 mb-5">{ticket.ticketNumber} · {ticket.subCategory}</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex justify-center gap-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} type="button" onClick={() => setStars(s)}
                className="text-4xl transition-transform hover:scale-110 focus:outline-none">
                {s <= stars ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3} maxLength={200}
            placeholder="Optional comments…"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none text-sm" />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
