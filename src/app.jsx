import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// استيراد الملفات الأخرى ليتعرف عليها Vite ويقوم ببنائها معاً
import './supabase.js';
import './data.js';
import './ui.jsx';
import './public.jsx';
import './auth.jsx';
import './dash-common.jsx';
import './student.jsx';
import './teacher.jsx';
import './mgmt-tools.jsx';
import './management.jsx';

// جلب الكائنات من الـ window كما يتوقعها كودك الأصلي ولكن بعد ضمان تحميل الملفات أعلاه
const { theme, L } = window.TC || { theme: { cream: '#F4EFE3', line: '#D8CCB0', primary: '#8C6F47', muted: '#706048' }, L: () => {} };
const { PublicSite } = window.Public || {};
const { AuthFlow } = window.Auth || {};
const { StudentDashboard, TeacherDashboard, ManagementDashboard } = window.Dashboards || {};
const TCData = window.TCData;

const LANG_KEY = 'tamkeen_lang_v1';

function Splash({ text }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18, background:theme.cream }}>
      <div style={{ width:46, height:46, borderRadius:'50%', border:`3px solid ${theme.line}`, borderTopColor:theme.primary, animation:'tcSpin .8s linear infinite' }} />
      <p style={{ fontFamily:'Cairo, sans-serif', fontSize:14, color:theme.muted }}>{text}</p>
      <style>{'@keyframes tcSpin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'ar');
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('public'); // public | auth | dashboard
  const [publicPage, setPublicPage] = useState('home');
  const [authStart, setAuthStart] = useState('initial');

  const t = typeof L === 'function' ? L(lang) : (key) => key;
  const setLang = (l) => setLangState(l);
  const uid = user ? user.accessKey : null;

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  // استعادة الجلسة عند الإقلاع
  useEffect(() => {
    let active = true;
    if (!TCData) {
      console.error('TCData is not defined on window');
      setBooting(false);
      return;
    }
    (async () => {
      try {
        const u = await TCData.getSessionUser();
        if (active && u) {
          const d = await TCData.loadDB();
          if (!active) return;
          setUser(u); setDb(d); setView('dashboard');
        }
      } catch (e) { console.error('bootstrap', e); }
      if (active) setBooting(false);
    })();
    return () => { active = false; };
  }, []);

  const reload = async () => { 
    if(TCData) {
      try { setDb(await TCData.loadDB()); } catch (e) { console.error('reload', e); } 
    }
  };

  const run = (fn) => async (...args) => {
    try {
      const r = await fn(...args);
      if (r && r.error) { alert(r.error.message || r.error); return; }
    } catch (e) { alert((e && e.message) || String(e)); }
    await reload();
  };

  const handleLogin = async (accessKey, password, role) => {
    if (!TCData) return { error: 'Database context missing' };
    const res = await TCData.signIn(accessKey, password);
    if (res.error) return { error: typeof t === 'function' ? t('badCreds') : 'خطأ في البيانات' };
    const u = await TCData.getSessionUser();
    if (!u) return { error: typeof t === 'function' ? t('badCreds') : 'خطأ في البيانات' };
    const ok =
      (role === 'admin' && (u.role === 'management' || u.role === 'director')) ||
      (role === 'teacher' && u.role === 'teacher') ||
      (role === 'student' && u.role === 'student');
    if (!ok) { await TCData.signOut(); return { error: typeof t === 'function' ? t('roleMismatch') : 'نوع الحساب غير متطابق' }; }
    const d = await TCData.loadDB();
    setUser(u); setDb(d); setView('dashboard');
    return { ok: true };
  };

  const handleLogout = async () => {
    if(TCData) await TCData.signOut();
    setUser(null); setDb(null); setView('public'); setPublicPage('home');
  };
  const goHome = () => { setView('public'); setPublicPage('home'); };
  const handleRegister = () => {};

  const notYet = () => alert(lang === 'ar'
    ? 'إنشاء/حذف الحسابات يتطلب دالة الخادم (Edge Function) — سنفعّلها في المرحلة التالية.'
    : 'Creating/deleting accounts needs the server function (Edge Function) — coming in the next phase.');

  const actions = {
    markRead: TCData ? run(TCData.markRead) : () => {},
    deleteAssignment: TCData ? run(TCData.deleteAssignment) : () => {},
    uploadCloud: TCData ? run((ownerId, file) => TCData.uploadCloudFile(ownerId, file)) : () => {},
    removeCloudItem: TCData ? run((id, path) => TCData.removeCloudItem(id, path)) : () => {},
    clearCloud: TCData ? run((ownerId) => TCData.clearCloud(ownerId)) : () => {},
    downloadCloud: async (path) => {
      if(!TCData) return;
      try { const url = await TCData.getDownloadUrl(path); if (url) window.open(url, '_blank'); }
      catch (e) { alert((e && e.message) || String(e)); }
    },
    addGrade: TCData ? run((studentId, g, by) => TCData.addGrade(studentId, g, by || uid)) : () => {},
    editGrade: TCData ? run(TCData.editGrade) : () => {},
    deleteGrade: TCData ? run(TCData.deleteGrade) : () => {},
    assignHomework: TCData ? run((studentId, hw, by) => TCData.assignHomework(studentId, hw, by || uid)) : () => {},
    updateBehavior: async (studentId, score) => {
      if(!TCData) return;
      const v = Math.max(0, Math.min(100, score || 0));
      setDb((prev) => prev ? { ...prev, behaviorScores: { ...prev.behaviorScores, [studentId]: v } } : prev);
      try { await TCData.updateBehavior(studentId, v, uid); } catch (e) { console.error(e); }
    },
    addUser: notYet,
    deleteUser: notYet,
    addDelegation: TCData ? run((teacherId, del, by) => {
      let studentIds = del.studentIds;
      if (del.type !== 'students') {
        studentIds = del.className
          ? (db ? db.users.filter((u) => u.role === 'student' && u.academicYear && u.academicYear.includes(del.className)).map((u) => u.accessKey) : [])
          : [];
      }
      return TCData.addDelegation({
        teacher_id: teacherId, type: del.type,
        title: del.type === 'students' ? (lang === 'ar' ? 'توكيل طلاب' : 'Student delegation') : del.title,
        description: del.description || '', subject_name: del.subjectName || '', class_name: del.className || '',
        student_ids: studentIds || [], status: 'active', assigned_by: by || uid,
      });
    }) : () => {},
    removeDelegation: TCData ? run(TCData.removeDelegation) : () => {},
    addSchedule: TCData ? run((s, by) => TCData.addSchedule(s, by || uid)) : () => {},
    deleteSchedule: (id) => {
      if (!confirm(lang === 'ar' ? 'حذف هذا الجدول؟' : 'Delete this schedule?')) return;
      return TCData ? run(TCData.deleteSchedule)(id) : () => {};
    },
    createAnnouncement: TCData ? run((a, by) => TCData.createAnnouncement(a, by || uid)) : () => {},
    deleteAnnouncement: TCData ? run(TCData.deleteAnnouncement) : () => {},
    shareItems: TCData ? run((items, recipientIds, by) => TCData.shareItems(items, recipientIds, by || uid)) : () => {},
  };

  if (booting) return <Splash text={lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'} />;

  const renderDashboard = () => {
    if (!user || !db || !ManagementDashboard) return <Splash text={lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'} />;
    const common = { user, lang, setLang, db, actions, onLogout: handleLogout, onHome: goHome };
    if (user.role === 'student' && StudentDashboard) return <StudentDashboard {...common} />;
    if (user.role === 'teacher' && TeacherDashboard) return <TeacherDashboard {...common} />;
    return <ManagementDashboard {...common} />;
  };

  if (view === 'dashboard' && user) return renderDashboard();
  
  if (view === 'auth' && AuthFlow) return (
    <AuthFlow lang={lang} setLang={setLang} startStage={authStart}
      onBack={() => { setView('public'); }}
      onLogin={handleLogin} onRegister={handleRegister} />
  );
  
  if (PublicSite) return (
    <PublicSite lang={lang} setLang={setLang} page={publicPage} setPage={setPublicPage}
      onLogin={() => { setAuthStart('initial'); setView('auth'); }}
      onRegister={() => { setAuthStart('student-register'); setView('auth'); }} />
  );

  return <Splash text="تأكد من تحميل كافة المكونات البرمجية للموقع" />;
}

// تشغيل التطبيق وربطه بمجلد الـ HTML
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
