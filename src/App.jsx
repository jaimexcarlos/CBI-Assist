import { Routes, Route, Navigate } from 'react-router-dom';
import GuestPortal from './pages/GuestPortal';
import StaffDashboard from './pages/StaffDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/guest/*" element={<GuestPortal />} />
      <Route path="/staff/*" element={<StaffDashboard />} />
      <Route path="/executive/*" element={<ExecutiveDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
