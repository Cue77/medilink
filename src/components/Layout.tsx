import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  CalendarDaysIcon as CalendarSolid,
  DocumentTextIcon as DocumentSolid,
  ChatBubbleOvalLeftEllipsisIcon as ChatSolid,
  UserCircleIcon as UserSolid,
  StarIcon as StarSolid,
  ShieldCheckIcon as ShieldSolid,
  UserGroupIcon as UserGroupSolid
} from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabaseClient';
import NotificationListener from './NotificationListener';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  // Fetch role on load
  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role) {
        setRole(user.user_metadata.role);
      }
    };
    getRole();
  }, []);

  // Navigation for Patients
  const patientNav = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, activeIcon: HomeSolid },
    { name: 'Schedule', href: '/appointments', icon: CalendarDaysIcon, activeIcon: CalendarSolid },
    { name: 'Records', href: '/records', icon: DocumentTextIcon, activeIcon: DocumentSolid },
    { name: 'Messages', href: '/messages', icon: ChatBubbleOvalLeftEllipsisIcon, activeIcon: ChatSolid },
    { name: 'AI Triage', href: '/triage', icon: ShieldCheckIcon, activeIcon: ShieldSolid },
    { name: 'Feedback', href: '/feedback', icon: StarIcon, activeIcon: StarSolid },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon, activeIcon: UserSolid },
  ];

  // Navigation for Doctors
  const doctorNav = [
    { name: 'Dashboard', href: '/doctor-dashboard', icon: HomeIcon, activeIcon: HomeSolid }, // CHANGED THIS LINE
    { name: 'Patients', href: '/doctor-dashboard', icon: UserGroupIcon, activeIcon: UserGroupSolid },
    { name: 'Messages', href: '/messages', icon: ChatBubbleOvalLeftEllipsisIcon, activeIcon: ChatSolid },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon, activeIcon: UserSolid },
  ];

  const navigation = role === 'doctor' ? doctorNav : patientNav;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100/50 flex justify-center font-sans">
      <NotificationListener />

      {/* MAX WIDTH CONTAINER */}
      <div className="w-full max-w-md md:max-w-5xl bg-white min-h-screen shadow-2xl shadow-slate-200/50 flex relative overflow-hidden">

        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex flex-col w-64 border-r border-slate-100 bg-white/50 backdrop-blur-sm p-6 z-10">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${role === 'doctor' ? 'from-green-600 to-green-800' : 'from-primary to-primary-dark'} flex items-center justify-center shadow-md shadow-blue-500/20`}>
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">
              {role === 'doctor' ? 'MediLink GP' : 'MediLink'}
            </span>
          </div>

          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = isActive ? item.activeIcon : item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`flex w-full items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 ${isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors mt-auto group"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 group-hover:translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 h-screen overflow-y-auto bg-slate-50/50 scroll-smooth relative">
          <main className="pb-24 md:pb-10 pt-6 px-4 md:px-10 max-w-3xl mx-auto">
            <Outlet />
          </main>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl shadow-glass z-50 px-2 py-3 flex justify-between items-center overflow-x-auto scrollbar-hide">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className="relative flex flex-col items-center justify-center w-14 h-12 flex-shrink-0 mx-1"
              >
                {isActive && (
                  <span className="absolute inset-0 bg-primary/10 rounded-xl scale-90 transition-transform duration-300" />
                )}
                <Icon className={`h-6 w-6 z-10 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Layout;