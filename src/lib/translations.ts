// src/lib/translations.ts

export const translations = {
  en: {
    greeting: "Good Morning",
    welcome: "Hello",
    schedule: "Schedule",
    records: "Medical Records",
    messages: "Messages",
    bookNew: "Book New Appointment",
    nextVisit: "Next Visit",
    latestResult: "Latest Result",
    unread: "Unread",
    search: "Search records...",
    upcoming: "Upcoming Appointment",
    accessRecords: "Access Records",
    openInbox: "Open Inbox"
  },
  es: {
    greeting: "Buenos Días",
    welcome: "Hola",
    schedule: "Calendario",
    records: "Expedientes Médicos",
    messages: "Mensajes",
    bookNew: "Reservar Nueva Cita",
    nextVisit: "Próxima Visita",
    latestResult: "Último Resultado",
    unread: "No leído",
    search: "Buscar registros...",
    upcoming: "Próxima Cita",
    accessRecords: "Ver Expedientes",
    openInbox: "Abrir Buzón"
  },
  ar: {
    greeting: "صباح الخير",
    welcome: "مرحبا",
    schedule: "الجدول",
    records: "السجلات الطبية",
    messages: "الرسائل",
    bookNew: "حجز موعد جديد",
    nextVisit: "الزيارة التالية",
    latestResult: "أحدث نتيجة",
    unread: "غير مقروء",
    search: "بحث في السجلات...",
    upcoming: "الموعد القادم",
    accessRecords: "الوصول للسجلات",
    openInbox: "فتح صندوق الوارد"
  }
};

export type Language = 'en' | 'es' | 'ar';