import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DocumentTitle from './components/DocumentTitle';
import PublicLayout from './layouts/PublicLayout';
import MainDashboardLayout from './layouts/MainDashboardLayout';
import Landing from './pages/Landing/Landing';
import About from './pages/About/About';
import Dashboards from './pages/Dashboards/Dashboards';
import Contact from './pages/Contact/Contact';
import Privacy from './pages/Privacy/Privacy';
import Terms from './pages/Terms/Terms';
import Help from './pages/Help/Help';
import Login from './pages/Login/Login';
import NotFound from './pages/NotFound/NotFound';
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
      <DocumentTitle />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="*" element={<NotFound />} />
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
      </Routes>
    </BrowserRouter>
  );
}
