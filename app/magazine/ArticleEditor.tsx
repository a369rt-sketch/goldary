'use client';

import { useState } from 'react';
import { useT } from '@/app/lib/i18n';
import { useAuthRole } from '@/app/lib/useAuth';
import ArticleForm from './ArticleForm';

// زر عائم على صفحة المجلة — يظهر للمستخدمين المسجّلين فقط.
// الأدمن يرى "اكتب مقال جديد" (نشر مباشر)، المساهم يرى "إرسال مقال" (للمراجعة).
export default function ArticleEditor() {
  const { t } = useT();
  const { loading, userId, isAdmin } = useAuthRole();
  const [isOpen, setIsOpen] = useState(false);

  // لا نعرض الزر لغير المسجّلين
  if (loading || !userId) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gold2 hover:bg-gold1 text-dark px-6 py-3 rounded-full font-semibold shadow-lg transition z-40"
      >
        {isAdmin ? t.new_article : t.submit_article}
      </button>
    );
  }

  return (
    <ArticleForm
      onClose={() => setIsOpen(false)}
      onSaved={() => window.location.reload()}
    />
  );
}
