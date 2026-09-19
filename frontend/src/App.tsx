import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import MainDashboardLayout from './layouts/MainDashboardLayout';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import NationalDashboard from './pages/NationalDashboard/NationalDashboard';

import DistrictDashboard from './pages/DistrictDashboard/DistrictDashboard';
import WorkerDashboard from './pages/WorkerDashboard/WorkerDashboard';
import PublicDashboard from './pages/PublicDashboard/PublicDashboard';
import AlertsCenter from './pages/AlertsCenter/AlertsCenter';
import DistrictList from './pages/DistrictList/DistrictList';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public" element={<PublicDashboard />} />
        </Route>

        {/* Authenticated Dashboard Routes */}
        <Route element={<MainDashboardLayout />}>
          <Route path="/national" element={<NationalDashboard />} />
          <Route path="/district" element={<DistrictDashboard />} />
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/alerts" element={<AlertsCenter />} />
          <Route path="/districts" element={<DistrictList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
