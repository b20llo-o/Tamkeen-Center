/* =========================================================================
   إعداد اتصال Supabase — منظومة مركز تمكين
   anon key مفتاح عام آمن للاستخدام في المتصفح (الحماية من RLS).
   لا تضع هنا مفتاح service_role أبدًا.
   يتطلب تحميل مكتبة supabase-js (UMD) قبل هذا الملف.
   ========================================================================= */
window.TAMKEEN_SUPABASE_URL = "https://lizeshrnwkxxkvclwitf.supabase.co";
window.TAMKEEN_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpemVzaHJud2t4eGt2Y2x3aXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzA3NTYsImV4cCI6MjA5NTgwNjc1Nn0.AxcbazAZdiOOvXRApbQzk-MMMFOTwwUY4asEONhSxUg";

window.tamkeenSupabase = window.supabase.createClient(
  window.TAMKEEN_SUPABASE_URL,
  window.TAMKEEN_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: "tamkeen_auth" } }
);

// تحويل مفتاح الدخول (مثل T100) إلى البريد الداخلي المستخدم في Supabase Auth
window.tamkeenKeyToEmail = (key) => `${String(key || "").trim().toLowerCase()}@tamkeen.local`;
