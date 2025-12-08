import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient'); // Role State

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const clinicName = formData.get('clinicName') as string;
    const clinicAddress = formData.get('clinicAddress') as string;

    const phoneNumber = formData.get('phoneNumber') as string;
    const nhsNumber = formData.get('nhsNumber') as string;
    const address = formData.get('address') as string;
    const accessCode = formData.get('accessCode') as string;

    // Validate Doctor Access Code
    if (role === 'doctor' && accessCode !== 'MEDILINK-GP') {
      setError('Invalid Access Code. Please contact admin.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role, // Save role to metadata
            phone_number: phoneNumber,
            nhs_number: nhsNumber,
            address: address,
            clinic_name: role === 'doctor' ? clinicName : null,
            clinic_address: role === 'doctor' ? clinicAddress : null
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        // Auto-login successful (Email confirmation disabled)
        toast.success('Account created! Welcome to MediLink.');
        if (role === 'doctor') {
          navigate('/doctor-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else if (data.user) {
        // Email confirmation required (or just created)
        toast.success('Account created!');
        navigate('/');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-3xl shadow-glass max-w-md w-full mx-4 animate-slide-up">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create Account</h2>
          <p className="text-slate-500 mt-2 text-sm">Join MediLink today</p>
        </div>

        <form className="space-y-4" onSubmit={handleSignUp}>

          {/* ROLE TOGGLE */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'patient' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
            >
              Doctor (GP)
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
            <input name="fullName" type="text" required className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="John Doe" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</label>
            <input name="email" type="email" required className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="name@example.com" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <input name="password" type="password" required minLength={6} className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="••••••••" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
            <input name="phoneNumber" type="tel" className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="07700 900000" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">NHS Number (Optional)</label>
            <input name="nhsNumber" type="text" className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="123 456 7890" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Address</label>
            <input name="address" type="text" className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="123 High St, London" />
          </div>

          {role === 'doctor' && (
            <>
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Clinic Name</label>
                <input name="clinicName" type="text" required className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="City Health Center" />
              </div>
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Clinic Address</label>
                <input name="clinicAddress" type="text" required className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none" placeholder="123 Medical Blvd, London" />
              </div>
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Access Code</label>
                <input name="accessCode" type="password" required className="block w-full px-4 py-3 rounded-xl bg-slate-50 focus:ring-primary/10 outline-none border-2 border-primary/20" placeholder="Enter Admin Code" />
              </div>
            </>
          )}

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70">
            {loading ? 'Creating Account...' : `Sign Up as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/" className="font-bold text-primary hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;