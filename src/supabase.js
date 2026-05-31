/* =========================================================================
   إعداد اتصال Supabase — منظومة مركز تمكين
   تم تحديثه ليتوافق مع نظام كبسولات الحزم (ES Modules) لـ Vite و Vercel.
   ========================================================================= */
import { createClient } from '@supabase/supabase-js';

// الإعدادات الأساسية لقاعدة البيانات
export const TAMKEEN_SUPABASE_URL = "https://lizeshrnwkxxkvclwitf.supabase.co";
export const TAMKEEN_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpemVzaHJud2t4eGt2Y2x3aXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzA3NTYsImV4cCI6MjA5NTgwNjc1Nn0.AxcbazAZdiOOvXRApbQzk-MMMFOTwwUY4asEONhSxUg";

// إنشاء كائن الاتصال بـ Supabase بشكل قياسي ومباشر
export const tamkeenSupabase = createClient(
  TAMKEEN_SUPABASE_URL,
  TAMKEEN_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: "tamkeen_auth" } }
);

// تحويل مفتاح الدخول إلى البريد الداخلي
export const tamkeenKeyToEmail = (key) => `${String(key || "").trim().toLowerCase()}@tamkeen.local`;

// 💡 الحفاظ على حقن الكائنات في الـ window لتجنب انهيار بقية ملفات المشروع (مثل data.js و core.jsx)
window.TAMKEEN_SUPABASE_URL = TAMKEEN_SUPABASE_URL;
window.TAMKEEN_SUPABASE_ANON_KEY = TAMKEEN_SUPABASE_ANON_KEY;
window.supabase = { createClient }; // لمنع أي ملف آخر يبحث عن window.supabase من الانهيار
window.tamkeenSupabase = tamkeenSupabase;
window.tamkeenKeyToEmail = tamkeenKeyToEmail;
