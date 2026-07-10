import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navbar
    brand: 'Smart Queue',
    home: 'Home',
    clinics: 'Clinics',
    dashboard: 'Dashboard',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    language: 'العربية',
    
    // Landing Page
    heroTitle: 'Book Your Clinic Visit from Home',
    heroSubtitle: 'Skip the long waits. Join the queue remotely and arrive just in time for your appointment.',
    getStarted: 'Get Started',
    bookTicket: 'Book a Ticket',
    loginRegister: 'Login / Register',
    
    // Features
    featuresTitle: 'Why Choose Smart Queue?',
    feature1Title: 'Real-Time Tracking',
    feature1Desc: 'Watch your position in the queue update live. Know exactly when it\'s your turn.',
    feature2Title: 'Remote Booking',
    feature2Desc: 'Book your spot from anywhere. No need to stand in line at the clinic.',
    feature3Title: 'Wait Time Estimation',
    feature3Desc: 'Get accurate estimates of your waiting time so you can plan your day.',
    
    // Auth
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Sign in to manage your queue',
    registerTitle: 'Create Account',
    registerSubtitle: 'Join Smart Queue today',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    loginAsPatient: 'Login as Patient',
    loginAsAdmin: 'Login as Admin/Staff',
    noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?',
    signUp: 'Sign Up',
    signIn: 'Sign In',
    
    // Clinics
    clinicsTitle: 'Available Clinics',
    clinicsSubtitle: 'Choose a clinic to book your visit',
    open: 'Open',
    closed: 'Closed',
    bookNow: 'Book Now',
    patientsWaiting: 'patients waiting',
    estimatedWait: 'Estimated wait',
    minutes: 'min',
    
    // Booking
    bookingTitle: 'Confirm Your Booking',
    currentQueue: 'Current Queue',
    waitingPatients: 'Waiting Patients',
    estWaitTime: 'Estimated Wait Time',
    confirmBooking: 'Confirm Booking',
    bookingSuccess: 'Booking Confirmed!',
    yourTicket: 'Your ticket number is',
    viewTicket: 'View My Ticket',
    
    // Ticket
    ticketTitle: 'Your Ticket',
    yourNumber: 'Your Number',
    nowServing: 'Now Serving',
    estimatedWaitTime: 'Estimated Wait',
    position: 'Your Position',
    inQueue: 'in queue',
    ticketStatus: 'Status',
    waiting: 'Waiting',
    yourTurn: 'It\'s Your Turn!',
    served: 'Served',
    pleaseWait: 'Please wait for your number to be called',
    goToCounter: 'Please go to the counter now!',
    
    // Admin
    adminTitle: 'Admin Dashboard',
    totalToday: 'Total Today',
    currentlyWaiting: 'Currently Waiting',
    servedToday: 'Served Today',
    manageQueues: 'Manage Queues',
    openQueue: 'Open Queue',
    closeQueue: 'Close Queue',
    manageQueue: 'Manage',
    createQueue: 'Create Today\'s Queue',
    queueStatus: 'Queue Status',
    
    // Queue Management
    queueManagement: 'Queue Management',
    nextPatient: 'Next Patient',
    currentlyServing: 'Currently Serving',
    waitingList: 'Waiting List',
    ticketNumber: 'Ticket #',
    patientName: 'Patient Name',
    timeJoined: 'Time Joined',
    status: 'Status',
    noPatients: 'No patients in the queue',
    patientCalled: 'Patient Called!',
    
    // Footer
    footerText: '© 2026 Smart Queue System. All rights reserved.',
    footerDesc: 'Making healthcare visits easier for everyone.',
  },
  ar: {
    // Navbar
    brand: 'الطابور الذكي',
    home: 'الرئيسية',
    clinics: 'العيادات',
    dashboard: 'لوحة التحكم',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    register: 'إنشاء حساب',
    language: 'English',
    
    // Landing Page
    heroTitle: 'احجز موعد عيادتك من المنزل',
    heroSubtitle: 'تجاوز الانتظار الطويل. انضم للطابور عن بُعد وتواجد في الوقت المناسب.',
    getStarted: 'ابدأ الآن',
    bookTicket: 'احجز تذكرة',
    loginRegister: 'تسجيل الدخول / إنشاء حساب',
    
    // Features
    featuresTitle: 'لماذا تختار الطابور الذكي؟',
    feature1Title: 'تتبع مباشر',
    feature1Desc: 'تابع ترتيبك في الطابور مباشرة. اعرف بالضبط متى يحين دورك.',
    feature2Title: 'حجز عن بُعد',
    feature2Desc: 'احجز مكانك من أي مكان. لا حاجة للوقوف في الطابور.',
    feature3Title: 'تقدير وقت الانتظار',
    feature3Desc: 'احصل على تقدير دقيق لوقت الانتظار لتخطط يومك.',
    
    // Auth
    loginTitle: 'مرحباً بعودتك',
    loginSubtitle: 'سجل دخولك لإدارة طابورك',
    registerTitle: 'إنشاء حساب جديد',
    registerSubtitle: 'انضم للطابور الذكي اليوم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    loginAsPatient: 'دخول كمريض',
    loginAsAdmin: 'دخول كمسؤول',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    signUp: 'إنشاء حساب',
    signIn: 'تسجيل الدخول',
    
    // Clinics
    clinicsTitle: 'العيادات المتاحة',
    clinicsSubtitle: 'اختر عيادة لحجز موعدك',
    open: 'مفتوح',
    closed: 'مغلق',
    bookNow: 'احجز الآن',
    patientsWaiting: 'مريض بالانتظار',
    estimatedWait: 'وقت الانتظار المتوقع',
    minutes: 'دقيقة',
    
    // Booking
    bookingTitle: 'تأكيد الحجز',
    currentQueue: 'الطابور الحالي',
    waitingPatients: 'المرضى بالانتظار',
    estWaitTime: 'وقت الانتظار المتوقع',
    confirmBooking: 'تأكيد الحجز',
    bookingSuccess: 'تم تأكيد الحجز!',
    yourTicket: 'رقم تذكرتك هو',
    viewTicket: 'عرض تذكرتي',
    
    // Ticket
    ticketTitle: 'تذكرتك',
    yourNumber: 'رقمك',
    nowServing: 'يتم خدمة الآن',
    estimatedWaitTime: 'وقت الانتظار المتوقع',
    position: 'ترتيبك',
    inQueue: 'في الطابور',
    ticketStatus: 'الحالة',
    waiting: 'بالانتظار',
    yourTurn: 'حان دورك!',
    served: 'تمت الخدمة',
    pleaseWait: 'يرجى الانتظار حتى يتم استدعاء رقمك',
    goToCounter: 'يرجى التوجه للكاونتر الآن!',
    
    // Admin
    adminTitle: 'لوحة التحكم',
    totalToday: 'الإجمالي اليوم',
    currentlyWaiting: 'بالانتظار حالياً',
    servedToday: 'تمت خدمتهم',
    manageQueues: 'إدارة الطوابير',
    openQueue: 'فتح الطابور',
    closeQueue: 'إغلاق الطابور',
    manageQueue: 'إدارة',
    createQueue: 'إنشاء طابور اليوم',
    queueStatus: 'حالة الطابور',
    
    // Queue Management
    queueManagement: 'إدارة الطابور',
    nextPatient: 'المريض التالي',
    currentlyServing: 'يتم خدمة حالياً',
    waitingList: 'قائمة الانتظار',
    ticketNumber: 'رقم التذكرة',
    patientName: 'اسم المريض',
    timeJoined: 'وقت الانضمام',
    status: 'الحالة',
    noPatients: 'لا يوجد مرضى في الطابور',
    patientCalled: 'تم استدعاء المريض!',
    
    // Footer
    footerText: '© 2026 نظام الطابور الذكي. جميع الحقوق محفوظة.',
    footerDesc: 'نجعل زيارات الرعاية الصحية أسهل للجميع.',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('sq-lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('sq-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');
  const isRTL = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
