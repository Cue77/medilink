import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard'; // Import the Doctor Dashboard
import DoctorRecords from './pages/DoctorRecords';
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import SymptomChecker from './pages/SymptomChecker';
import { useParams } from 'react-router-dom';

const RecordsWrapper = () => {
  const { userId } = useParams();
  return <Records userId={userId} />;
};

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      {/* This component renders the pop-up notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes - Wrapped in the App Shell (Layout) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} /> {/* Doctor Route */}
          <Route path="/doctor/records" element={<DoctorRecords />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:userId" element={<RecordsWrapper />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/triage" element={<SymptomChecker />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;