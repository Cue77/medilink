import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CalendarIcon, ClockIcon, VideoCameraIcon, MapPinIcon, TrashIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast'; // Import Toast
import confetti from 'canvas-confetti';
import { translations, type Language } from '../lib/translations';
import { formatDoctorName } from '../utils/format';

const Appointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const t = translations[lang];

  // Dynamic Slot Generation
  const generateAvailableSlots = () => {
    const slots = [];
    const today = new Date();
    // Generate slots for the next 3 days
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      // Create a morning and afternoon slot
      const morning = new Date(date);
      morning.setHours(9, 0, 0, 0);

      const afternoon = new Date(date);
      afternoon.setHours(14, 30, 0, 0);

      slots.push({
        date: morning.toISOString(),
        label: morning.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        time: '09:00 AM'
      });

      slots.push({
        date: afternoon.toISOString(),
        label: afternoon.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        time: '02:30 PM'
      });
    }
    return slots.slice(0, 3); // Return top 3
  };

  const [recommendedSlots, setRecommendedSlots] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
    setRecommendedSlots(generateAvailableSlots());
  }, []);

  const fetchAppointments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/');
    const { data } = await supabase
      .from('appointments')
      .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name, clinic_name, clinic_address)')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    if (data) setMyAppointments(data);
  };

  const bookAppointment = async (dateString: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('appointments').insert([{ user_id: user.id, date: dateString, type: 'GP Consultation', status: 'pending' }]);

      if (!error) {
        // Trigger Confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Appointment Booked Successfully!', { icon: '📅' });
        fetchAppointments();
      } else {
        toast.error('Booking failed: ' + error.message);
      }
    }
    setLoading(false);
  };

  const cancelAppointment = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) {
      toast.success('Appointment cancelled');
      fetchAppointments();
    } else {
      toast.error("Error cancelling: " + error.message);
    }
  };

  const rescheduleAppointment = async (id: number) => {
    const newDate = prompt("Enter new date (YYYY-MM-DD):", "2025-12-01");
    if (newDate) {
      const { error } = await supabase
        .from('appointments')
        .update({ date: `${newDate}T09:00:00` })
        .eq('id', id);

      if (!error) {
        toast.success('Reschedule confirmed', { icon: '✅' });
        fetchAppointments();
      } else {
        toast.error('Reschedule failed');
      }
    }
  };

  const handleManualBooking = async () => {
    const dateInput = prompt("Enter appointment date and time (YYYY-MM-DD HH:MM):", "2025-12-10 10:00");
    if (dateInput) {
      // Basic validation or formatting could go here
      // For now, we assume the user enters a valid ISO-like string or close to it
      // We append seconds to make it a valid timestamp for Supabase if needed, 
      // or just pass it if the backend handles it. 
      // Let's ensure it's ISO format for the DB: YYYY-MM-DDTHH:MM:SS
      const formattedDate = dateInput.replace(' ', 'T') + ':00';
      await bookAppointment(formattedDate);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.schedule}</h1>
          <p className="text-slate-500 text-sm">Manage your visits and bookings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManualBooking}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            {t.bookNew}
          </button>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'past' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* SUGGESTION CARD */}
      {activeTab === 'upcoming' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-1 shadow-lg shadow-primary/20">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-[20px] text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  Recommended Slots
                </h2>
                <p className="text-primary-light text-sm">Based on your usual availability</p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {recommendedSlots.map((slot, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => bookAppointment(slot.date)}
                  className="flex-shrink-0 group bg-white/10 hover:bg-white text-white hover:text-primary border border-white/20 rounded-xl p-3 transition-all duration-300 min-w-[120px] text-center"
                >
                  <p className="text-xs font-medium opacity-80 group-hover:opacity-100 mb-1">{slot.label}</p>
                  <p className="text-lg font-bold">{slot.time}</p>
                  <div className="mt-2 text-[10px] bg-white/20 group-hover:bg-primary/10 group-hover:text-primary rounded-full px-2 py-0.5 inline-block">
                    Book Now
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE LIST */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Your Timeline</h3>

        {myAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No appointments found</p>
          </div>
        ) : (
          myAppointments.map((appt) => (
            <div key={appt.id} className="group relative bg-white p-5 rounded-2xl shadow-soft border border-slate-100 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 sm:items-center">

              <div className="flex gap-4 flex-1">
                {/* Date Box */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center h-16 w-16 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                  <span className="text-xs font-bold text-slate-400 group-hover:text-primary/70 uppercase">
                    {new Date(appt.date).toLocaleString('en-GB', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-slate-800 group-hover:text-primary">
                    {new Date(appt.date).getDate()}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">
                        {appt.doctor?.full_name ? formatDoctorName(appt.doctor.full_name) : appt.type}
                      </h4>
                      {appt.doctor?.full_name && <p className="text-xs text-slate-500">{appt.type}</p>}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {appt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {new Date(appt.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {appt.doctor?.clinic_name || 'Pending Assignment'}
                      {appt.doctor?.clinic_address && <span className="text-xs text-slate-400 ml-1">({appt.doctor.clinic_address})</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {activeTab === 'upcoming' && (
                <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                  {appt.status === 'approved' && (
                    <a
                      href={`https://meet.jit.si/medilink-${appt.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                    >
                      <VideoCameraIcon className="h-3 w-3" />
                      Join Call
                    </a>
                  )}
                  <button
                    onClick={() => rescheduleAppointment(appt.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Reschedule
                  </button>
                  <button
                    onClick={() => cancelAppointment(appt.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleManualBooking}
        className="md:hidden fixed bottom-24 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Appointments;