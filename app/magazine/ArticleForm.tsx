'use client';

import { useState } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { useT } from '@/app/lib/i18n';

export type ArticleCategory =
  | 'news'
  | 'analysis'
  | 'learn'
  | 'investment'
  | 'markets';

export interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  coverImageUrl: string | null;
  published: boolean;
}

// value = مفتاح القسم في قاعدة البيانات (قيد CHECK)، label = العرض العربي
export const CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: 'news', label: 'أخبار' },
  { value: 'analysis', label: 'تحليل السوق' },
  { value: 'learn', label: 'تعلم الذهب' },
  { value: 'investment', label: 'الاستثمار' },
  { value: 'markets', label: 'أسواق ومحلات' },
];

const EMPTY_FORM: ArticleFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'news',
  coverImageUrl: null,
  published: false,
};

interface ArticleFormProps {
  // إن مُرِّر id فالوضع "تعديل" (PUT)، وإلا "إنشاء" (POST)
  initial?: (Partial<ArticleFormData> & { id?: string }) | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ArticleForm({ initial, onClose, onSaved }: ArticleFormProps) {
  const { t } = useT();
  const isEdit = Boolean(initial?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<ArticleFormData>({
    ...EMPTY_FORM,
    ...initial,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w؀-ۿ\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      // في وضع التعديل لا نلمس الـslug تلقائياً حفاظاً على الروابط
      slug: isEdit ? prev.slug : generateSlug(title),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'magazine-covers');

    try {
      const response = await fetch('/api/magazine/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, coverImageUrl: data.url }));
        setMessage(t.m_img_ok);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(t.m_img_fail);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(t.m_img_err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/magazine/articles', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: initial!.id, ...form } : form),
      });

      if (response.ok) {
        setMessage(
          isEdit
            ? t.m_updated
            : form.published
            ? t.m_published
            : t.m_draft_saved
        );
        setTimeout(() => {
          setMessage('');
          onSaved?.();
          onClose();
        }, 1200);
      } else {
        setMessage(t.m_save_fail);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage(t.m_save_err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gold2/30">
        {/* Header */}
        <div className="sticky top-0 bg-dark border-b border-gold2/30 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gold2">
            {isEdit ? t.form_edit : t.form_new}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gold2 transition"
            aria-label={t.close}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div className="bg-gold2/10 border border-gold2/30 text-gold2 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gold2 mb-2">
              {t.f_title} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              placeholder={t.f_title_ph}
              className="w-full bg-dark border border-gold2/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-gold2 focus:outline-none transition"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gold2 mb-2">
              {t.f_slug}
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full bg-dark border border-gold2/30 rounded-lg px-4 py-2 text-white text-sm focus:border-gold2 focus:outline-none transition"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold text-gold2 mb-2">
              {t.f_cover}
            </label>
            <div className="flex items-center gap-4">
              {form.coverImageUrl ? (
                <div className="relative w-24 h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.coverImageUrl}
                    alt="cover"
                    className="w-full h-full object-cover rounded-lg border border-gold2/30"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, coverImageUrl: null })}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex-1 border-2 border-dashed border-gold2/30 rounded-lg p-6 text-center cursor-pointer hover:border-gold2 transition">
                  {uploadingImage ? (
                    <Loader className="w-6 h-6 text-gold2 mx-auto animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gold2 mx-auto mb-2" />
                      <p className="text-sm text-gold2">{t.f_upload}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG · PNG · WebP · GIF
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gold2 mb-2">
              {t.f_category} *
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ArticleCategory,
                })
              }
              className="w-full bg-dark border border-gold2/30 rounded-lg px-4 py-2 text-white focus:border-gold2 focus:outline-none transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t.categories[cat.value]}
                </option>
              ))}
            </select>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gold2 mb-2">
              {t.f_excerpt} *
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder={t.f_excerpt_ph}
              rows={3}
              className="w-full bg-dark border border-gold2/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-gold2 focus:outline-none transition resize-none"
              required
            />
          </div>

          {/* Content (Markdown) */}
          <div>
            <label className="block text-sm font-semibold text-gold2 mb-2">
              {t.f_content} *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={t.f_content_ph}
              rows={10}
              className="w-full bg-dark border border-gold2/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-gold2 focus:outline-none transition resize-none font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-2">{t.f_img_hint}</p>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              id="published"
              className="w-4 h-4 rounded border-gold2/30 bg-dark cursor-pointer"
            />
            <label htmlFor="published" className="text-sm text-gold2 cursor-pointer">
              {isEdit ? t.f_published : t.f_publish_now}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gold2 hover:bg-gold1 disabled:bg-gray-600 text-dark font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                {t.b_saving}
              </>
            ) : isEdit ? (
              t.b_save_edits
            ) : form.published ? (
              t.b_publish
            ) : (
              t.b_save_draft
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
