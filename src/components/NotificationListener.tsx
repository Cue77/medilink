import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const NotificationListener = () => {
    useEffect(() => {
        let channel: any;
        let pollingInterval: any;

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get User Role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', user.id)
                .single();

            // --- HELPER: Handle New Data ---
            const handleNewMessage = (newMsg: any) => {
                let isForMe = false;
                let title = 'New Message';

                if (profile?.role === 'doctor') {
                    if (newMsg.is_from_user && newMsg.contact_name === profile.full_name) {
                        isForMe = true;
                        title = 'New Patient Message';
                    }
                } else {
                    if (newMsg.user_id === user.id && !newMsg.is_from_user) {
                        isForMe = true;
                        title = `New Message from ${newMsg.contact_name}`;
                    }
                }

                if (isForMe) {
                    toast(title, {
                        icon: '💬',
                        duration: 5000,
                        style: { borderRadius: '10px', background: '#333', color: '#fff', cursor: 'pointer' },
                    });
                }
            };

            const handleAppointmentUpdate = (newData: any, oldData: any) => {
                if (newData.status !== oldData.status) {
                    toast(`Appointment ${newData.status}`, {
                        icon: newData.status === 'approved' ? '✅' : 'info',
                        duration: 5000,
                        style: { borderRadius: '10px', background: '#333', color: '#fff' },
                    });
                }
            };

            // --- STRATEGY 2: POLLING (Fallback) ---
            const startPolling = async () => {
                if (pollingInterval) return; // Already polling

                toast('Switched to Auto-Refresh Mode', { icon: '🔄', id: 'realtime-status' });

                // 1. Get baseline state (don't alert on existing data)
                let lastMessageId = 0;
                const { data: latestMsg } = await supabase
                    .from('messages')
                    .select('id')
                    .order('id', { ascending: false })
                    .limit(1)
                    .single();

                if (latestMsg) lastMessageId = latestMsg.id;

                let lastCheckTime = new Date().toISOString();

                pollingInterval = setInterval(async () => {
                    // A. Poll for New Messages
                    const { data: newMessages } = await supabase
                        .from('messages')
                        .select('*')
                        .gt('id', lastMessageId);

                    if (newMessages && newMessages.length > 0) {
                        // Update baseline
                        lastMessageId = newMessages[newMessages.length - 1].id;

                        // Check if any are for me
                        newMessages.forEach(msg => handleNewMessage(msg));
                    }

                    // B. Poll for Appointment Updates
                    // Only for patients for now, matching previous logic
                    if (profile?.role !== 'doctor') {
                        const { data: updatedAppointments } = await supabase
                            .from('appointments')
                            .select('*')
                            .eq('user_id', user.id)
                            .gt('updated_at', lastCheckTime);

                        if (updatedAppointments && updatedAppointments.length > 0) {
                            lastCheckTime = new Date().toISOString();
                            updatedAppointments.forEach(appt => {
                                // We don't have 'old' data here easily, so we just say "Status Updated"
                                toast(`Appointment Updated: ${appt.status}`, {
                                    icon: '📅',
                                    duration: 5000,
                                    style: { borderRadius: '10px', background: '#333', color: '#fff' },
                                });
                            });
                        }
                    }
                }, 5000); // Poll every 5 seconds
            };

            // --- STRATEGY 1: REALTIME (Preferred) ---
            channel = supabase.channel('global-notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                    handleNewMessage(payload.new);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `user_id=eq.${user.id}` }, (payload) => {
                    handleAppointmentUpdate(payload.new, payload.old);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        toast.success('Live Notifications Active', { id: 'realtime-status' });
                    }

                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        startPolling(); // Fallback
                    }
                });
        };

        setupSubscription();

        return () => {
            if (channel) supabase.removeChannel(channel);
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, []);

    return null;
};

export default NotificationListener;
