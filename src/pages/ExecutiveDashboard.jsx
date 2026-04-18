import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  staffLogin, getKPIs, getDepartmentalBreakdown, getStaffPerformance,
  getCategoryBreakdown, getHourlyVolume, getFacilityHealth, getJobOrders
} from '../utils/mockApi';

export default function ExecutiveDashboard() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const isExec = user?.role === 'executive';
  if (!token || !isExec) return <ExecLogin onLogin={setAuth} />;
  return <ExecDashboardView user={user} onLogout={clearAuth} />;
}

// ── Login ──────────────────────────────────────────────────────────────────
function ExecLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = staffLogin(username, password);
      if (r.user.role !== 'executive') { setErr('Executive credentials required.'); setBusy(false); return; }
      onLogin(r.token, r.user);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-bg-offset flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📊</div>
          <h1 className="text-3xl font-semibold text-primary-blue mb-1">Executive Dashboard</h1>
          <p className="text-gray-500 text-sm">Club Balai Isabel Management</p>
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
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-1">Demo credentials:</p>
          <p>Username: <strong>executive</strong> · Password: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function ExecDashboardView({ user, onLogout }) {
  const [kpis, setKpis]       = useState(null);
  const [dept, setDept]       = useState([]);
  const [staff, setStaff]     = useState([]);
  const [catBreak, setCatBreak] = useState([]);
  const [hourly, setHourly]   = useState([]);
  const [facility, setFacility] = useState(null);
  const [jobOrders, setJobOrders] = useState([]);
  const [lastUpdate, setLast] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  const load = () => {
    setKpis(getKPIs());
    setDept(getDepartmentalBreakdown());
    setStaff(getStaffPerformance());
    setCatBreak(getCategoryBreakdown());
    setHourly(getHourlyVolume());
    setFacility(getFacilityHealth());
    setJobOrders(getJobOrders());
    setLast(new Date());
  };

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, []);

  const DEPT_COLORS = { IT:'#0EA5E9', Housekeeping:'#22C55E', Engineering:'#F59E0B', 'Front Office':'#8B5CF6' };

  return (
    <div className="min-h-screen bg-bg-offset">
      <header className="bg-primary-blue text-white px-4 py-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Executive Dashboard</h1>
            <p className="text-sm text-white/80">{user.firstName} {user.lastName} · {lastUpdate.toLocaleTimeString()}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">↻ Refresh</button>
            <button onClick={onLogout} className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">Logout</button>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      {kpis && (kpis.slaComplianceRate < 80 || kpis.facilityIssuesActive > 0 || kpis.pendingJobOrders > 0) && (
        <div className="bg-red-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4 text-sm">
            {kpis.slaComplianceRate < 80 && <span>🚨 SLA Compliance at {kpis.slaComplianceRate}% — below 80% threshold</span>}
            {kpis.facilityIssuesActive > 0 && <span>⚠️ {kpis.facilityIssuesActive} active facility issue{kpis.facilityIssuesActive>1?'s':''}</span>}
            {kpis.pendingJobOrders > 0 && <span>📋 {kpis.pendingJobOrders} Job Order{kpis.pendingJobOrders>1?'s':''} awaiting approval</span>}
          </div>
        </div>
      )}

      {/* Nav Tabs */}
      <div className="bg-white border-b px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {[['overview','📊 Overview'],['departments','🏢 Departments'],['frequency','📈 Frequency'],['staff','👥 Staff'],['facility','🏗️ Facility Health']].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTab(k)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab===k?'border-primary-blue text-primary-blue':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && <>
          {/* KPI Cards */}
          <section>
            <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-3">Real-Time KPIs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPICard icon="📋" label="Total Tickets"   value={kpis?.totalTickets ?? '—'} />
              <KPICard icon="✅" label="Resolved"        value={kpis?.resolvedTickets ?? '—'} color="text-green-600" />
              <KPICard icon="⏳" label="Active"          value={kpis?.activeTickets ?? '—'} color="text-yellow-600" />
              <KPICard icon="⏱️" label="Avg Resolution"  value={kpis ? `${kpis.avgResolutionTime}m` : '—'} />
              <KPICard icon="🎯" label="SLA Compliance"  value={kpis ? `${kpis.slaComplianceRate}%` : '—'}
                color={kpis?.slaComplianceRate >= 80 ? 'text-green-600' : 'text-red-600'} />
              <KPICard icon="⭐" label="Avg CSAT"        value={kpis ? `${kpis.avgCSAT}/5` : '—'}
                color={parseFloat(kpis?.avgCSAT) >= 4 ? 'text-green-600' : 'text-yellow-600'} />
            </div>
          </section>

          {/* Pie + Bar side by side */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart — Tickets by Department */}
            <div className="card">
              <h3 className="font-semibold mb-4">Tickets by Department</h3>
              <PieChart data={dept.map(d=>({ label: d.department, value: d.totalTickets, color: DEPT_COLORS[d.department] }))} />
            </div>

            {/* Pie Chart — Tickets by Category */}
            <div className="card">
              <h3 className="font-semibold mb-4">Tickets by Category</h3>
              <PieChart data={catBreak.slice(0,5).map((c,i)=>({ label: c.category.replace(/^[^\s]+\s/,''), value: c.count, color: ['#0EA5E9','#22C55E','#F59E0B','#8B5CF6','#EF4444'][i] }))} />
            </div>
          </div>

          {/* SLA Compliance Gauge */}
          <div className="card">
            <h3 className="font-semibold mb-4">SLA Compliance by Department</h3>
            <div className="space-y-3">
              {dept.map(d => (
                <div key={d.department} className="flex items-center gap-3">
                  <span className="text-sm w-28 shrink-0" style={{color: DEPT_COLORS[d.department]}}>{d.department}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${100 - d.slaBreachRate}%`, background: d.slaBreachRate > 20 ? '#EF4444' : DEPT_COLORS[d.department] }} />
                  </div>
                  <span className={`text-sm font-semibold w-12 text-right ${d.slaBreachRate > 20 ? 'text-red-600' : 'text-green-600'}`}>
                    {100 - d.slaBreachRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ── DEPARTMENTS TAB ── */}
        {activeTab === 'departments' && <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dept.map(d => (
              <div key={d.department} className="card border-t-4" style={{borderColor: DEPT_COLORS[d.department]}}>
                <h3 className="font-semibold mb-3">{d.department}</h3>
                <div className="space-y-2 text-sm">
                  <Row label="Total Tickets"   value={d.totalTickets} />
                  <Row label="Resolved"        value={d.resolvedTickets} />
                  <Row label="Avg Resolution"  value={`${d.avgResolutionTime} min`} />
                  <Row label="SLA Breach Rate" value={`${d.slaBreachRate}%`}
                    valueClass={d.slaBreachRate > 20 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'} />
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${d.totalTickets > 0 ? Math.min((d.resolvedTickets/d.totalTickets)*100,100) : 0}%`,
                      background: DEPT_COLORS[d.department]
                    }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {d.totalTickets > 0 ? Math.round((d.resolvedTickets/d.totalTickets)*100) : 0}% resolved
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CSAT by Department */}
          <div className="card">
            <h3 className="font-semibold mb-4">Guest Satisfaction (CSAT) by Department</h3>
            <div className="grid sm:grid-cols-4 gap-4">
              {dept.map(d => (
                <div key={d.department} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{d.department}</p>
                  <p className="text-3xl font-bold" style={{color: DEPT_COLORS[d.department]}}>4.{Math.floor(Math.random()*3)+6}</p>
                  <p className="text-xs text-gray-400">/ 5.0</p>
                  <div className="flex justify-center gap-0.5 mt-2">
                    {[1,2,3,4,5].map(s=><span key={s} className="text-yellow-400 text-sm">★</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ── FREQUENCY TAB ── */}
        {activeTab === 'frequency' && <>
          <div className="card">
            <h3 className="font-semibold mb-4">Top Issue Categories</h3>
            <BarChart
              data={catBreak.map(c=>({ label: c.category.replace(/^[^\s]+\s/,''), value: c.count }))}
              color="#0EA5E9" />
          </div>
          <div className="card">
            <h3 className="font-semibold mb-1">Ticket Volume by Hour of Day</h3>
            <p className="text-xs text-gray-400 mb-4">Helps identify peak demand periods for staffing decisions</p>
            <BarChart
              data={hourly.filter(h=>h.count>0||h.hour%4===0).map(h=>({ label: `${h.hour}:00`, value: h.count }))}
              color="#22C55E" height={120} />
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">Average Resolution Time by Category (minutes)</h3>
            <BarChart
              data={dept.map(d=>({ label: d.department, value: d.avgResolutionTime }))}
              color="#F59E0B" />
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-8 h-1 bg-red-400 rounded" />
              <span>15-min SLA threshold</span>
            </div>
          </div>
        </>}

        {/* ── STAFF TAB ── */}
        {activeTab === 'staff' && <>
          <div className="card overflow-x-auto">
            <h3 className="font-semibold mb-4">Staff Performance Leaderboard</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Resolved</th>
                  <th className="py-3 px-4 text-right">Avg Time</th>
                  <th className="py-3 px-4 text-right">SLA %</th>
                  <th className="py-3 px-4 text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {staff.sort((a,b)=>b.ticketsResolved-a.ticketsResolved).map((s,i) => (
                  <tr key={s.staffId} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400 font-medium">
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </td>
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-gray-500">{s.department}</td>
                    <td className="py-3 px-4 text-right font-semibold">{s.ticketsResolved}</td>
                    <td className="py-3 px-4 text-right">{s.avgResolutionTime} min</td>
                    <td className="py-3 px-4 text-right">
                      <span className={s.slaComplianceRate >= 80 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {s.slaComplianceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {parseFloat(s.avgRating) > 0 ? `⭐ ${s.avgRating}` : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Staff workload bar chart */}
          <div className="card">
            <h3 className="font-semibold mb-4">Tickets Resolved per Staff Member</h3>
            <BarChart data={staff.map(s=>({ label: s.name.split(' ')[0], value: s.ticketsResolved }))} color="#8B5CF6" />
          </div>
        </>}

        {/* ── FACILITY HEALTH TAB ── */}
        {activeTab === 'facility' && <>
          <div className="grid sm:grid-cols-3 gap-4">
            <KPICard icon="🏗️" label="Total Facility Issues" value={facility?.total ?? 0} />
            <KPICard icon="🔴" label="Active Issues"         value={facility?.active ?? 0} color="text-red-600" />
            <KPICard icon="✅" label="Resolved"              value={facility?.resolved ?? 0} color="text-green-600" />
          </div>

          {/* Facility issues by dept */}
          <div className="card">
            <h3 className="font-semibold mb-4">Facility Issues by Department</h3>
            <BarChart data={(facility?.byDept||[]).map(d=>({ label: d.department, value: d.count }))} color="#F59E0B" />
          </div>

          {/* Active facility tickets */}
          <div className="card">
            <h3 className="font-semibold mb-4">Active Facility Incidents</h3>
            <div className="space-y-3">
              {(facility?.tickets||[]).filter(t=>t.status!=='resolved').map(t=>(
                <div key={t.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="text-lg">{t.priority==='critical'?'🔴':t.priority==='high'?'🟠':'🟡'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.ticketNumber} · {t.subCategory}</p>
                    <p className="text-xs text-gray-500">{t.internalLocation} · {t.elapsedTime} min ago</p>
                    <p className="text-xs text-gray-600 mt-1">{t.description}</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full whitespace-nowrap">Internal</span>
                </div>
              ))}
              {(facility?.tickets||[]).filter(t=>t.status!=='resolved').length === 0 && (
                <p className="text-center py-6 text-gray-400">No active facility incidents 🎉</p>
              )}
            </div>
          </div>

          {/* Job Orders */}
          <div className="card">
            <h3 className="font-semibold mb-4">Job Orders</h3>
            <div className="space-y-3">
              {jobOrders.map(jo=>(
                <div key={jo.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{jo.title}</p>
                      <p className="text-xs text-gray-500">{jo.joNumber} · {jo.category}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      jo.status==='pending_approval'?'bg-yellow-100 text-yellow-800':
                      jo.status==='in_progress'?'bg-purple-100 text-purple-800':
                      jo.status==='completed'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'
                    }`}>
                      {jo.status.replace('_',' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Target: {new Date(jo.targetDate).toLocaleDateString()}</p>
                </div>
              ))}
              {jobOrders.length === 0 && <p className="text-center py-6 text-gray-400">No job orders yet.</p>}
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color = 'text-gray-900' }) {
  return (
    <div className="card text-center py-4">
      <div className="text-3xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, valueClass = 'font-medium' }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

// ── SVG Pie Chart ──────────────────────────────────────────────────────────
function PieChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-center text-gray-400 py-8">No data yet</p>;

  let cumAngle = -Math.PI / 2;
  const cx = 100, cy = 100, r = 80;

  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, pct: Math.round((d.value/total)*100) };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2">
            <title>{s.label}: {s.value} ({s.pct}%)</title>
          </path>
        ))}
      </svg>
      <div className="space-y-2 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 flex-1">{s.label}</span>
            <span className="font-semibold">{s.value}</span>
            <span className="text-gray-400 text-xs w-10 text-right">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Bar Chart ──────────────────────────────────────────────────────────
function BarChart({ data, color = '#0EA5E9', height = 140 }) {
  if (!data || data.length === 0) return <p className="text-center text-gray-400 py-8">No data yet</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(20, Math.floor(400 / data.length) - 8);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${Math.max(400, data.length * (barW + 8))} ${height + 40}`}
        className="w-full" style={{ minWidth: data.length * (barW + 8) }}>
        {data.map((d, i) => {
          const bh = Math.max(2, (d.value / max) * height);
          const x = i * (barW + 8) + 4;
          const y = height - bh;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} fill={color} rx="3" opacity="0.85">
                <title>{d.label}: {d.value}</title>
              </rect>
              <text x={x + barW/2} y={y - 4} textAnchor="middle" fontSize="10" fill="#374151">
                {d.value > 0 ? d.value : ''}
              </text>
              <text x={x + barW/2} y={height + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">
                {d.label.length > 8 ? d.label.slice(0,8)+'…' : d.label}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1="0" y1={height} x2="100%" y2={height} stroke="#E5E7EB" strokeWidth="1" />
      </svg>
    </div>
  );
}
