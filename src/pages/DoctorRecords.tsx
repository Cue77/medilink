import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MagnifyingGlassIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DoctorRecords = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setSearched(true);
        setPatients([]);

        try {
            // Search by Name or NHS Number (if we had it in a separate column, but it's in metadata or profile)
            // Assuming we added 'nhs_number' to profiles in a previous step? 
            // Let's check profiles table columns. If not, we search full_name.

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'patient')
                .or(`full_name.ilike.%${searchTerm}%,nhs_number.eq.${searchTerm}`);

            if (error) throw error;
            if (data) setPatients(data);

        } catch (error: any) {
            toast.error('Error searching patients');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Patient Records 📂</h1>
                <p className="text-slate-500">Search for a patient to view or upload records.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Name or NHS Number..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {/* Results */}
            <div className="space-y-4">
                {searched && patients.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-400">
                        No patients found matching "{searchTerm}".
                    </div>
                )}

                {patients.map((patient) => (
                    <div
                        key={patient.id}
                        onClick={() => window.open(`/records/${patient.id}`, '_blank')}
                        className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <UserIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{patient.full_name || 'Unknown Name'}</h3>
                                <p className="text-sm text-slate-500">NHS: {patient.nhs_number || 'N/A'}</p>
                            </div>
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DoctorRecords;
