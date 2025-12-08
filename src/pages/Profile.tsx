import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { supabase } from '../lib/supabaseClient';
import { BellIcon, ShieldCheckIcon, GlobeAltIcon, ArrowRightOnRectangleIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { type Language } from '../lib/translations';

interface SettingItem {
  icon: any;
  title: string;
  desc: string;
  toggle: boolean;
  action?: string;
  onClick?: () => void;
}

const Profile = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('Loading...');
  const [fullName, setFullName] = useState('Patient');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [nhsNumber, setNhsNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [role, setRole] = useState('patient');
  const [currentLang, setCurrentLang] = useState<Language>('en');

  useEffect(() => {
    // Fetch User Data
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || 'Unknown');

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role, clinic_name, clinic_address, nhs_number')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || user.user_metadata?.full_name || 'Patient');
          setAvatarUrl(profile.avatar_url);
          setRole(profile.role || 'patient');
          setClinicName(profile.clinic_name || '');
          setClinicAddress(profile.clinic_address || '');
          setNhsNumber(profile.nhs_number || '');
        }
      }
    };
    fetchProfile();

    const saved = localStorage.getItem('appLanguage');
    if (saved === 'en' || saved === 'es' || saved === 'ar') {
      setCurrentLang(saved as Language);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Language;
    setCurrentLang(next);
    localStorage.setItem('appLanguage', next);
    window.location.reload();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        toast.success('Profile picture updated!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates: any = { full_name: newName, nhs_number: nhsNumber };
      if (role === 'doctor') {
        updates.clinic_name = clinicName;
        updates.clinic_address = clinicAddress;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setFullName(newName);
      setIsEditing(false);
      toast.success('Profile updated successfully!');

      // Update metadata if needed, but profile table is primary
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const settings: SettingItem[] = [
    {
      icon: BellIcon,
      title: 'Push Notifications',
      desc: 'Receive updates about appointments',
      toggle: true
    },
    {
      icon: GlobeAltIcon,
      title: 'Language',
      desc: 'Select your preferred language',
      toggle: false,
      // Custom render for dropdown
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy & Security',
      desc: '2FA and Password',
      toggle: false,
      action: 'Manage'
    },
  ];

  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex items-center gap-4">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200 flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-white text-xs font-bold">
            Change
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <div className="overflow-hidden flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                autoFocus
              />
              <button
                onClick={handleUpdateProfile}
                className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 truncate">{fullName}</h2>
              <button
                onClick={() => { setNewName(fullName); setIsEditing(true); }}
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-slate-500 text-sm truncate">{email}</p>

          {isEditing ? (
            <input
              type="text"
              value={nhsNumber}
              onChange={(e) => setNhsNumber(e.target.value)}
              placeholder="NHS Number"
              className="mt-2 block w-full text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <p className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit mt-1">
              NHS Number: {nhsNumber || 'Not Set'}
            </p>
          )}

          {role === 'doctor' && (
            <div className="mt-4 space-y-2">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Clinic Name"
                    className="block w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
                  />
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="Clinic Address"
                    className="block w-full text-sm border border-slate-200 rounded-lg px-2 py-1"
                  />
                </>
              ) : (
                <div className="text-sm text-slate-600">
                  <p className="font-semibold">{clinicName || 'No Clinic Name Set'}</p>
                  <p>{clinicAddress || 'No Address Set'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">App Settings</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {settings.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>

              {item.title === 'Language' ? (
                <select
                  value={currentLang}
                  onChange={handleLanguageChange}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none"
                >
                  <option value="en">English (UK)</option>
                  <option value="es">Español</option>
                  <option value="ar">العربية</option>
                </select>
              ) : item.toggle ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              ) : (
                <button
                  onClick={item.onClick}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {item.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 p-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
        Log Out Securely
      </button>
    </div>
  );
};

export default Profile;