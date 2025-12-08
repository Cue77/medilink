import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, BellIcon } from '@heroicons/react/24/outline';
import { translations, type Language } from '../lib/translations';
import { formatDoctorName } from '../utils/format';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');

  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [lang, setLang] = useState<Language>('en');
  const [stats, setStats] = useState({ records: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang) setLang(savedLang);

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch Profile for Avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, language')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || 'User');
        setLang(profile.language as Language || 'en');
      } else if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      }

      // 3. Fetch Next Appointment with Doctor Name
      const { data: appts, error } = await supabase
        .from('appointments')
        .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name, clinic_name)')
        .eq('user_id', user.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1);

      if (error) console.error('Error fetching next appointment:', error);
      if (appts && appts.length > 0) {
        setNextAppointment(appts[0]);
      }

      // 4. Fetch Stats
      const { count: recordCount } = await supabase
        .from('records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_from_user', false); // Count messages FROM doctor

      setStats({
        records: recordCount || 0,
        messages: messageCount || 0
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  const t = translations[lang];

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const localeMap: Record<Language, string> = { 'en': 'en-GB', 'es': 'es-ES', 'ar': 'ar-EG' };
  const date = new Date().toLocaleDateString(localeMap[lang], dateOptions);

  const isRTL = lang === 'ar';

  return (
    <div className={`animate-fade-in space-y-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{date}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{t.welcome}, {userName}</h1>
        </div>
        <div className="relative group cursor-pointer" onClick={() => navigate('/messages')}>
          <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
            <BellIcon className="h-6 w-6 text-slate-400 group-hover:text-primary" />
            {stats.messages > 0 && (
              <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </div>
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-dark to-primary p-8 shadow-xl shadow-primary/20 overflow-hidden text-white min-h-[200px] flex flex-col justify-center">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-bold mb-2">{t.upcoming}</h2>

          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
              <div className="flex gap-4">
                <div className="h-8 w-24 bg-white/20 rounded-lg"></div>
                <div className="h-8 w-24 bg-white/20 rounded-lg"></div>
              </div>
            </div>
          ) : nextAppointment ? (
            <>
              <p className="text-primary-light mb-6 font-medium">
                {nextAppointment.doctor?.full_name ? formatDoctorName(nextAppointment.doctor.full_name) : nextAppointment.type} • {nextAppointment.doctor?.clinic_name || 'Clinic Room 3'}
              </p>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold">
                  {new Date(nextAppointment.date).toLocaleDateString(localeMap[lang], { day: 'numeric', month: 'long' })}
                </div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold">
                  {new Date(nextAppointment.date).toLocaleTimeString(localeMap[lang], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="text-primary-light font-medium">No upcoming appointments.</p>
              <button
                onClick={() => navigate('/appointments')}
                className="bg-white text-primary px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Book Now
              </button>
            </div>
          )}
        </div>
        <div className={`absolute top-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl ${isRTL ? 'left-0 -ml-10' : 'right-0'}`}></div>
        <div className={`absolute bottom-0 w-40 h-40 bg-primary-light opacity-20 rounded-full blur-2xl mix-blend-overlay ${isRTL ? 'left-20' : 'right-20'}`}></div>
      </div>

      {/* ACTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div
          onClick={() => navigate('/records')}
          className="group bg-white p-6 rounded-3xl shadow-soft border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t.records}</h3>
            <p className="text-slate-500 text-sm mt-1">{stats.records} {t.latestResult}</p>
          </div>
          <div className={`h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-secondary group-hover:text-white transition-colors ${isRTL ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>

        <div
          onClick={() => navigate('/messages')}
          className="group bg-white p-6 rounded-3xl shadow-soft border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t.messages}</h3>
            <p className="text-slate-500 text-sm mt-1">{stats.messages} {t.unread}</p>
          </div>
          <div className={`h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-colors ${isRTL ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>

        <button
          onClick={() => navigate('/appointments')}
          className="md:col-span-2 bg-white p-5 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 flex items-center justify-center gap-2 font-semibold hover:scale-[1.02] active:scale-[0.98]"
        >
          <CalendarDaysIcon className="h-5 w-5" />
          {t.bookNew}
        </button>

      </div>
    </div>
  );
};

export default Dashboard;