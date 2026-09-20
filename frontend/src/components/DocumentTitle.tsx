import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Zero Bite — Climate Intelligence for a Malaria-Free Rwanda',
  '/about': 'About — Zero Bite',
  '/dashboards': 'Dashboards — Zero Bite',
  '/contact': 'Contact — Zero Bite',
  '/login': 'Login — Zero Bite',
  '/public': 'Public Risk Portal — Zero Bite',
  '/national': 'National Dashboard — Zero Bite',
  '/district': 'District Dashboard — Zero Bite',
  '/worker': 'Worker Dashboard — Zero Bite',
  '/alerts': 'Alerts Center — Zero Bite',
  '/districts': 'District List — Zero Bite',
  '/reports': 'Reports — Zero Bite',
  '/settings': 'Settings — Zero Bite',
};

export default function DocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    document.title = pageTitles[location.pathname] ?? 'Zero Bite';
  }, [location.pathname]);

  return null;
}
