import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import PublicLayout from './PublicLayout';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import PrincipalMessage from './PrincipalMessage';
import AcademicPrograms from './AcademicPrograms';
import FacultyPage from './FacultyPage';
import AdmissionsPage from './AdmissionsPage';
import FeeInformation from './FeeInformation';
import ResultsPortal from './ResultsPortal';
import NoticesPage from './NoticesPage';
import EventsGallery from './EventsGallery';
import ContactUs from './ContactUs';
import OnlineAdmissionForm from './OnlineAdmissionForm';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Website Routes */}
      <Route path="/public" element={<PublicLayout><HomePage API={API} /></PublicLayout>} />
      <Route path="/public/about" element={<PublicLayout><AboutPage API={API} /></PublicLayout>} />
      <Route path="/public/principal" element={<PublicLayout><PrincipalMessage API={API} /></PublicLayout>} />
      <Route path="/public/academics" element={<PublicLayout><AcademicPrograms API={API} /></PublicLayout>} />
      <Route path="/public/faculty" element={<PublicLayout><FacultyPage API={API} /></PublicLayout>} />
      <Route path="/public/admissions" element={<PublicLayout><AdmissionsPage /></PublicLayout>} />
      <Route path="/public/fees" element={<PublicLayout><FeeInformation API={API} /></PublicLayout>} />
      <Route path="/public/results" element={<PublicLayout><ResultsPortal API={API} /></PublicLayout>} />
      <Route path="/public/notices" element={<PublicLayout><NoticesPage API={API} /></PublicLayout>} />
      <Route path="/public/events" element={<PublicLayout><EventsGallery API={API} /></PublicLayout>} />
      <Route path="/public/contact" element={<PublicLayout><ContactUs API={API} /></PublicLayout>} />
      <Route path="/public/apply" element={<PublicLayout><OnlineAdmissionForm API={API} /></PublicLayout>} />

      {/* Admin Portal Routes */}
      <Route path="/admin/*" element={<App />} />

      {/* Redirect default home to public site */}
      <Route path="/" element={<Navigate to="/public" replace />} />
    </Routes>
  );
};

export default AppRouter;
