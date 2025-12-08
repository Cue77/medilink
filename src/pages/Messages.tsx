import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, UserCircleIcon, PaperAirplaneIcon, Bars3Icon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { formatDoctorName } from '../utils/format';
import { translations, type Language } from '../lib/translations';

type DBMessage = {
  id: number;
  contact_name: string;
  role: string;
  text: string;
  is_from_user: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
};

type Contact = {
  id: string; // Doctor's UUID or 'system'
  name: string;
  role: string;
  avatar_url?: string;
};

const Messages = () => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false); // Mobile toggle
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<any>(null); // Store user profile for role checks
  const [lang, setLang] = useState<Language>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const t = translations[lang];

  // Fetch Contacts (Doctors for Patients, Patients for Doctors)
  useEffect(() => {
    const fetchContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get User Role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      const isDoctor = profileData?.role === 'doctor';

      let loadedContacts: Contact[] = [];

      if (isDoctor) {
        // DOCTOR VIEW: Fetch Patients
        const { data: appointments } = await supabase
          .from('appointments')
          .select('user_id, user:profiles!appointments_user_id_fkey(full_name, avatar_url)')
          .eq('doctor_id', user.id)
          .neq('user_id', user.id) // Exclude self
          .in('status', ['approved', 'completed']);

        // Unique Patients
        const uniquePatients = new Map();
        appointments?.forEach((a: any) => {
          if (a.user_id && !uniquePatients.has(a.user_id)) {
            uniquePatients.set(a.user_id, {
              id: a.user_id,
              name: a.user?.full_name || 'Unknown Patient',
              role: 'Patient',
              avatar_url: a.user?.avatar_url
            });
          }
        });
        loadedContacts = Array.from(uniquePatients.values());

      } else {
        // PATIENT VIEW: Fetch Doctors (Existing Logic)
        const { data: appointments } = await supabase
          .from('appointments')
          .select('doctor_id')
          .eq('user_id', user.id)
          .in('status', ['approved', 'completed'])
          .not('doctor_id', 'is', null);

        const doctorIds = Array.from(new Set(appointments?.map(a => a.doctor_id).filter(id => id) || []));

        if (doctorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, role, avatar_url')
            .in('id', doctorIds);

          if (profiles) {
            loadedContacts = profiles.map(p => ({
              id: p.id,
              name: p.full_name || 'Unknown Doctor',
              role: 'General Practitioner',
              avatar_url: p.avatar_url
            }));
          }
        }
        // Add Support for Patients
        if (loadedContacts.length === 0) {
          loadedContacts.push({ id: 'system', name: 'MediLink Support', role: 'System Admin' });
        }
      }

      setContacts(loadedContacts);
      if (loadedContacts.length > 0) {
        setSelectedContact(loadedContacts[0]);
      }
    };

    fetchContacts();
  }, []);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedContact) return;

    // Get Role again (optimization: store in state)
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
    const isDoctor = profile?.role === 'doctor';

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (isDoctor) {
      // Doctor sees messages FROM this patient (user_id = patient_id)
      // AND messages sent TO this doctor (contact_name = doctor_name)
      // OR messages sent BY this doctor TO this patient (user_id = patient_id, is_from_user = false)

      // Simplified: Messages belong to the Patient's "thread".
      // We filter by the Patient's ID (which is selectedContact.id)
      // AND ensure the contact_name matches the Doctor (me) OR it's a system message?
      // Actually, the 'messages' table is structured as: user_id (patient), contact_name (doctor).

      query = query
        .eq('user_id', selectedContact.id) // The Patient
        .eq('contact_name', profile?.full_name); // The Doctor (Me)
    } else {
      // Patient View
      query = query
        .eq('user_id', user.id)
        .eq('contact_name', selectedContact.name);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Error fetching messages');
    } else {
      setMessages(data || []);

      // Mark as read if there are unread messages from the other party
      const unreadIds = data
        ?.filter(m => {
          // If I am doctor, unread are from user (is_from_user = true)
          // If I am patient, unread are from doctor (is_from_user = false)
          const isFromOther = isDoctor ? m.is_from_user : !m.is_from_user;
          return isFromOther && !m.read;
        })
        .map(m => m.id);

      if (unreadIds && unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedContact) {
      setLoading(true);
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !selectedContact) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let attachmentUrl = null;
    let attachmentType = null;

    // 1. Upload File if selected
    if (selectedFile) {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, selectedFile);

      if (uploadError) {
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      attachmentUrl = publicUrl;
      attachmentType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      setUploading(false);
    }

    const textToSend = inputText;
    setInputText('');
    setSelectedFile(null);

    const isDoctor = profile?.role === 'doctor';

    // 2. Optimistic Update
    const optimisticMsg: DBMessage = {
      id: Date.now(),
      contact_name: selectedContact.name,
      role: selectedContact.role,
      text: textToSend,
      is_from_user: !isDoctor, // Correctly set based on role
      created_at: new Date().toISOString(),
      attachment_url: attachmentUrl || undefined,
      attachment_type: attachmentType || undefined
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // 3. Send to Supabase
    // If Doctor, user_id should be the PATIENT'S ID (selectedContact.id)
    // If Patient, user_id is MY ID (user.id)

    // We already have profile from state, but let's be safe and use the one we have or fetch if needed.
    // Actually, we can just use the 'isDoctor' variable we just computed.

    const payload = {
      user_id: isDoctor ? selectedContact.id : user.id, // The "Thread Owner" is always the Patient
      contact_name: isDoctor ? profile?.full_name : selectedContact.name, // The "Other Party" is always the Doctor
      role: isDoctor ? 'General Practitioner' : selectedContact.role, // Role of the "Other Party" (Doctor)
      text: textToSend,
      is_from_user: !isDoctor, // True if Patient, False if Doctor
      attachment_url: attachmentUrl,
      attachment_type: attachmentType
    };

    const { error } = await supabase.from('messages').insert([payload]);

    if (error) {
      toast.error('Failed to send');
    } else {
      toast.success('Message sent securely', { icon: '🔒' });
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in pb-20 md:pb-0 relative">

      {/* MOBILE MENU TOGGLE */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden absolute top-4 left-4 z-30 p-2 bg-white rounded-full shadow-md text-slate-600"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* SIDEBAR (CONTACT LIST) */}
      <div className={`
        absolute md:relative z-20 w-64 h-full bg-white rounded-3xl shadow-soft border border-slate-100 flex flex-col transition-transform duration-300
        ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">{t.messages}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => { setSelectedContact(contact); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedContact?.id === contact.id
                ? 'bg-primary text-white shadow-md'
                : 'hover:bg-slate-50 text-slate-600'
                }`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${selectedContact?.id === contact.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt={contact.name} className="h-full w-full object-cover" />
                ) : (
                  <UserCircleIcon className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">
                  {['General Practitioner', 'doctor', 'Doctor'].includes(contact.role) ? formatDoctorName(contact.name) : contact.name}
                </p>
                <p className={`text-xs truncate ${selectedContact?.id === contact.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  {contact.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT INTERFACE */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden relative">

        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-3 bg-white z-10 pl-16 md:pl-6">
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                {selectedContact.avatar_url ? (
                  <img src={selectedContact.avatar_url} alt={selectedContact.name} className="h-full w-full object-cover" />
                ) : (
                  <UserCircleIcon className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base md:text-lg leading-tight">
                  {['General Practitioner', 'doctor', 'Doctor'].includes(selectedContact.role) ? formatDoctorName(selectedContact.name) : selectedContact.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedContact.role}</p>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loading && <p className="text-center text-slate-400 text-sm">Loading secure messages...</p>}

              {!loading && messages.length === 0 && (
                <div className="text-center mt-10 text-slate-400">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Say hello!</p>
                </div>
              )}

              {messages.map((msg) => {
                // Determine if the message is from "Me"
                // Patient View: Me = is_from_user (true)
                // Doctor View: Me = !is_from_user (false)

                const isMe = (profile?.role === 'doctor' && !msg.is_from_user) ||
                  (profile?.role !== 'doctor' && msg.is_from_user);

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                      }`}>
                      {msg.attachment_url && (
                        <div className="mb-2">
                          {msg.attachment_type === 'image' ? (
                            <img src={msg.attachment_url} alt="Attachment" className="rounded-lg max-h-48 object-cover border border-white/20" />
                          ) : (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
                              <PaperClipIcon className="h-4 w-4" />
                              <span className="underline">View Attachment</span>
                            </a>
                          )}
                        </div>
                      )}
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
              {selectedFile && (
                <div className="flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-lg w-fit">
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">{selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="relative flex gap-2 items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors"
                  title="Attach File"
                  aria-label="Attach File"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${['General Practitioner', 'doctor', 'Doctor'].includes(selectedContact.role) ? formatDoctorName(selectedContact.name) : selectedContact.name}...`}
                  className="flex-1 pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !selectedFile) || uploading}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200 flex items-center justify-center"
                >
                  {uploading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">{t.openInbox}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;