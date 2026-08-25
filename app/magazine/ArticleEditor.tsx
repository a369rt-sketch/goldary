'use client';

import { useState } from 'react';
import { useT } from '@/app/lib/i18n';
import ArticleForm from './ArticleForm';

// زر عائم لفتح فورم "مقال جديد" على صفحة المجلة.
export default function ArticleEditor() {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gold2 hover:bg-gold1 text-dark px-6 py-3 rounded-full font-semibold shadow-lg transition z-40"
      >
        {t.new_article}
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
