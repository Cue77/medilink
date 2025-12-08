import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://stwchnopiqcrcbjxtnrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0d2Nobm9waXFjcmNianh0bnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTA2ODUsImV4cCI6MjA3OTI4NjY4NX0.uLg3BcYgkvdDEzYalN213unzfPvhA1cZ-yNuApVRRFg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    console.log('--- Debugging Data ---');

    // 1. Fetch all appointments with doctor details (As Admin/Service Role bypass if possible, or just raw query)
    // Since we are using the anon key, we are subject to RLS.
    // Let's try to fetch appointments for a specific known patient ID to see if RLS allows it or if we need to sign in.

    const targetPatientId = '3f88b5c8-6ead-4d37-87d3-0efdf3021ee2'; // Ezra (Patient)

    console.log(`Fetching appointments for patient: ${targetPatientId}`);

    const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name)')
        .eq('user_id', targetPatientId);

    if (apptError) console.error('Error fetching appointments:', apptError);
    else console.log('Appointments:', JSON.stringify(appointments, null, 2));

    // 2. Fetch all profiles
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*');

    if (profError) console.error('Error fetching profiles:', profError);
    else console.log('Profiles:', JSON.stringify(profiles, null, 2));
}

debugData();
