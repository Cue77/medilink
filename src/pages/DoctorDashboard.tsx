import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserGroupIcon, ClockIcon, CheckCircleIcon, XCircleIcon, VideoCameraIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { formatDoctorName } from '../utils/format';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('Doctor'); // State for name
  const [doctorAvatar, setDoctorAvatar] = useState<string | null>(null);


  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Doctor Name & Avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.role !== 'doctor') {
          toast.error('Access Denied: Doctors Only');
          return;
        }

        if (profile.full_name) {
          setDoctorName(formatDoctorName(profile.full_name));
        }
        setDoctorAvatar(profile.avatar_url);
      }

      // 2. Fetch Appointments
      // We must specify !appointments_user_id_fkey because there are now TWO links to profiles (user_id and doctor_id)
      const { data, error } = await supabase
        .from('appointments')
        .select('*, user:profiles!appointments_user_id_fkey(full_name)')
        .or(`doctor_id.eq.${user.id},status.eq.pending`)
        .neq('user_id', user.id) // Exclude appointments where the doctor is the patient
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Error loading appointments');
      }

      if (data) setAppointments(data);
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const updateStatus = async (id: string, newStatus: 'approved' | 'cancelled') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If approving, we CLAIM the appointment (set doctor_id)
      // If cancelling, we just update status
      const updates: any = { status: newStatus };
      if (newStatus === 'approved') {
        updates.doctor_id = user.id;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAppointments(prev => prev.map(appt =>
        appt.id === id ? { ...appt, status: newStatus, doctor_id: newStatus === 'approved' ? user.id : appt.doctor_id } : appt
      ));

      toast.success(`Appointment ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeclineClick = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <p className="font-bold text-slate-800">Decline Appointment?</p>
        <p className="text-xs text-slate-500">Skip to keep it for others, or Reject to cancel it.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              // Skip: Remove locally only
              setAppointments(prev => prev.filter(a => a.id !== id));
              toast.dismiss(t.id);
              toast.success('Skipped for now');
            }}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => {
              // Reject: Update DB
              updateStatus(id, 'cancelled');
              toast.dismiss(t.id);
            }}
            className="flex-1 px-3 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    ), { duration: 8000, icon: '🤔', style: { maxWidth: '400px' } });
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {doctorName} 👨‍⚕️</h1>
          <p className="text-slate-500">Here is your schedule for today.</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
          {doctorAvatar ? (
            <img src={doctorAvatar} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg">
              DR
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{appointments.length}</h3>
              <p className="text-sm text-slate-500">Total Patients</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => window.location.href = '/doctor/records'}
          className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Records</h3>
              <p className="text-sm text-slate-500">Search & Upload</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Upcoming Appointments</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {appointments.map((appt) => (
            <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                  P
                </div>
                <div>
                  {/* Note: This relies on the join working, might show 'Unknown' if join fails */}
                  <p className="font-bold text-slate-900">{appt.user?.full_name || 'Patient #' + appt.user_id.slice(0, 4)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">{appt.type}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${appt.status === 'approved' ? 'bg-green-100 text-green-700' :
                      appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                  <ClockIcon className="h-4 w-4" />
                  {new Date(appt.date).toLocaleString()}
                </div>

                {/* Action Buttons */}
                {appt.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(appt.id, 'approved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Approve & Claim"
                      aria-label="Approve Appointment"
                    >
                      <CheckCircleIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleDeclineClick(appt.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Decline"
                      aria-label="Decline Appointment"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>
                )}

                {/* Locked Indicator & Video Call */}
                {appt.status === 'approved' && appt.doctor_id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/records/${appt.user_id}`, '_blank')}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      title="View Patient Records"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                    </button>
                    <a
                      href={`https://meet.jit.si/medilink-${appt.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      title="Start Video Consultation"
                    >
                      <VideoCameraIcon className="h-4 w-4" />
                      Start Call
                    </a>
                    <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <span className="font-bold">Locked</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {appointments.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400">No upcoming appointments found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;