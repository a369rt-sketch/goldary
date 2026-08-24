'use client';

import { useState } from 'react';
import ArticleForm from './ArticleForm';

// زر عائم لفتح فورم "مقال جديد" على صفحة المجلة.
export default function ArticleEditor() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gold2 hover:bg-gold1 text-dark px-6 py-3 rounded-full font-semibold shadow-lg transition z-40"
      >
        ✍️ اكتب مقال جديد
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
