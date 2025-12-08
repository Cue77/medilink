import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check Role and Redirect accordingly
      if (data.user?.user_metadata?.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Glassmorphism Card */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-3xl shadow-glass max-w-md w-full mx-4 animate-slide-up">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-dark text-white shadow-lg shadow-blue-500/30 mb-4">
            <span className="font-bold text-2xl">M</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Access your NHS portal securely or{' '}
            <Link to="/signup" className="font-bold text-primary hover:text-primary-dark hover:underline transition-colors">
              create an account
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none font-medium text-slate-700"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1 mb-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary-dark">
                Forgot Password?
              </Link>
            </div>
            <input 
              name="password" 
              type="password" 
              required 
              className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 outline-none font-medium text-slate-700"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-400">
          Protected by NHS Secure Login
        </p>
      </div>
    </div>
  );
};

export default Login;