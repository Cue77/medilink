import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { DocumentTextIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { translations, type Language } from '../lib/translations';
import { formatDoctorName } from '../utils/format';

const Records = ({ userId }: { userId?: string }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [lang, setLang] = useState<Language>('en');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang) setLang(savedLang);
    fetchRecords();
  }, [userId]);

  const t = translations[lang];

  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/');

    setCurrentUserId(user.id);

    // Use passed userId (for doctors) or current user's id
    const targetId = userId || user.id;

    const { data } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', targetId)
      .order('date', { ascending: false });

    if (data) setRecords(data);
  };

  const categories = ['All', 'Results', 'Letters', 'Scans'];

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find doctors who have approved appointments with this user
      const { data: appointments } = await supabase
        .from('appointments')
        .select('doctor_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (appointments && appointments.length > 0) {
        // Get unique doctor IDs
        const doctorIds = Array.from(new Set(appointments.map(a => a.doctor_id).filter(id => id)));

        if (doctorIds.length > 0) {
          const { data: doctorProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, clinic_name')
            .in('id', doctorIds);

          if (doctorProfiles) setDoctors(doctorProfiles);
        }
      }
    };
    fetchDoctors();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('Scans');

  const handleUploadSubmit = async () => {
    if (!fileToUpload) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to upload');
      setUploading(false);
      return;
    }

    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical-records')
        .getPublicUrl(filePath);

      // 3. Insert into Database
      // Find doctor name if selected
      const docName = doctors.find(d => d.id === selectedDoctor)?.full_name;

      // Fetch current user's profile to get their name
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const currentUserName = currentUserProfile?.full_name || user.user_metadata?.full_name;

      // Logic: If userId is present, it's a doctor uploading -> 'Uploaded by Dr. Name'
      // If no userId, it's a patient. If they selected a doctor -> 'For Dr. X', else 'Uploaded by Patient'
      const doctorLabel = userId
        ? (currentUserName ? `Uploaded by ${formatDoctorName(currentUserName)}` : 'Uploaded by Doctor')
        : (docName ? `For Dr. ${docName}` : 'Uploaded by Patient');

      const { error: dbError } = await supabase
        .from('records')
        .insert({
          user_id: userId || currentUserId,
          type: selectedCategory, // Use selected category
          doctor: doctorLabel,
          diagnosis: fileToUpload.name,
          details: `${fileToUpload.name} (${Date.now()})`, // Unique value for PK constraint
          status: 'Available', // Satisfy 'status' column
          date: new Date().toISOString(),
          file_url: publicUrl
        });

      if (dbError) throw dbError;

      toast.success('Record uploaded successfully!');
      fetchRecords();
      setIsModalOpen(false);
      setFileToUpload(null);
      setSelectedDoctor('');
      setSelectedCategory('Scans');

    } catch (error: any) {
      toast.error('Error uploading record: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 relative">

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800">Upload Record</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Select File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
              >
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Doctor Selection: Always show for everyone now, to allow tagging/referrals */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                {userId ? 'Tag a Doctor (Optional - e.g. for Referral)' : 'Assign to Doctor (Optional)'}
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- {userId ? 'No Specific Doctor' : 'General Record'} --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>Dr. {doc.full_name} ({doc.clinic_name || 'General Practice'})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!fileToUpload || uploading}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {uploading ? 'Uploading...' : 'Upload'}
                {!uploading && <ArrowDownTrayIcon className="h-4 w-4 rotate-180" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-800">{t.records}</h1>
          <p className="text-slate-500 text-sm">Securely encrypted end-to-end</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="h-4 w-4 rotate-180" />
          Upload
        </button>
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
              {record.file_url && (
                <a href={record.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </a>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Records;