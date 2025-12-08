import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { DocumentTextIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { translations, type Language } from '../lib/translations';

const Records = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang) setLang(savedLang);
    fetchRecords();
  }, []);

  const t = translations[lang];

  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/');
    const { data } = await supabase.from('records').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (data) setRecords(data);
  };

  const categories = ['All', 'Results', 'Letters', 'Scans'];

  return (
    <div className="space-y-6 animate-slide-up pb-20">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">{t.records}</h1>
        <p className="text-slate-500 text-sm">Securely encrypted end-to-end</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filter === cat
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-4">
        {records.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm">No records found.</p>

          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">

              <div className="flex items-center gap-4">
                {/* Icon Box */}
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>

                {/* Text Info */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">{record.diagnosis}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-600">{record.doctor}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="p-2 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Records;