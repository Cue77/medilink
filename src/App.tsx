import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard'; // Import the Doctor Dashboard
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import SymptomChecker from './pages/SymptomChecker';

function App() {
  return (
    <Router>
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
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/records" element={<Records />} />
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