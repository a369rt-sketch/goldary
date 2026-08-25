import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCaller } from '@/app/lib/authServer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// خريطة الترجمة الصوتية عربي→لاتيني (روابط ASCII تعمل على التوجيه، بخلاف العربي المُرمَّز)
const AR_TO_LATIN: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ٱ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j',
  ح: 'h', خ: 'kh', د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's',
  ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l',
  م: 'm', ن: 'n', ه: 'h', و: 'w', ي: 'y', ى: 'a', ة: 'h', ء: '', ئ: 'y', ؤ: 'w',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5',
  '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

function slugify(input: string): string {
  const transliterated = Array.from(input)
    .map((ch) => (ch in AR_TO_LATIN ? AR_TO_LATIN[ch] : ch))
    .join('');
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeSlug(provided: string | undefined | null, title: string): string {
  const fromProvided = provided ? slugify(provided) : '';
  if (fromProvided) return fromProvided;
  const fromTitle = slugify(title);
  if (fromTitle) return fromTitle;
  return `article-${Date.now().toString(36)}`;
}

type Status = 'draft' | 'pending' | 'approved' | 'rejected';
const VALID: Status[] = ['draft', 'pending', 'approved', 'rejected'];

// يحدّد الحالة النهائية حسب الدور: المساهم لا يتجاوز pending، الأدمن يقدر يعتمد.
function resolveStatus(requested: unknown, isAdmin: boolean): Status {
  const s = (VALID as string[]).includes(requested as string)
    ? (requested as Status)
    : 'draft';
  if (isAdmin) return s === 'approved' ? 'approved' : s === 'pending' ? 'pending' : 'draft';
  return s === 'pending' ? 'pending' : 'draft'; // مساهم: draft أو pending فقط
}

// GET — قائمة المقالات حسب الدور: الأدمن يرى الكل (مع فلتر ?status)، المساهم يرى مقالاته فقط.
export async function GET(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (caller.isAdmin) {
      const status = request.nextUrl.searchParams.get('status');
      if (status && (VALID as string[]).includes(status)) {
        query = query.eq('status', status);
      }
    } else {
      query = query.eq('author_id', caller.user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 });
    }
    return NextResponse.json({ articles: data, isAdmin: caller.isAdmin });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — إنشاء مقال. المساهم → pending/draft، الأدمن → approved/draft.
export async function POST(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, excerpt, content, category, coverImageUrl } = body;

    if (!title || !excerpt || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const status = resolveStatus(body.status, caller.isAdmin);
    const published = status === 'approved';

    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          title,
          slug: makeSlug(slug, title),
          excerpt,
          content,
          category,
          cover_image_url: coverImageUrl,
          status,
          author_id: caller.user.id,
          author_name: caller.user.email ?? null,
          published,
          published_at: published ? new Date().toISOString() : null,
        },
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
    }
    return NextResponse.json({ success: true, article: data[0], status });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — تحديث مقال. المساهم يعدّل مقالاته فقط ولا يتجاوز pending؛ الأدمن يعدّل أي مقال.
export async function PUT(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, slug, excerpt, content, category, coverImageUrl } = body;

    if (!id) return NextResponse.json({ error: 'Missing article id' }, { status: 400 });
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('articles')
      .select('published_at, author_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }
    if (!existing) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    // تفويض: أدمن أو صاحب المقال فقط
    if (!caller.isAdmin && existing.author_id !== caller.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = resolveStatus(body.status, caller.isAdmin);
    const published = status === 'approved';
    const published_at = published
      ? existing.published_at ?? new Date().toISOString()
      : null;

    const { data, error } = await supabase
      .from('articles')
      .update({
        title,
        slug: makeSlug(slug, title),
        excerpt,
        content,
        category,
        cover_image_url: coverImageUrl,
        status,
        published,
        published_at,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }
    return NextResponse.json({ success: true, article: data[0], status });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — موافقة/رفض (أدمن فقط): { id, action: 'approve' | 'reject' }
export async function PATCH(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user || !caller.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action } = await request.json();
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const approve = action === 'approve';
    const { data: existing } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .maybeSingle();

    const { data, error } = await supabase
      .from('articles')
      .update({
        status: approve ? 'approved' : 'rejected',
        published: approve,
        published_at: approve
          ? existing?.published_at ?? new Date().toISOString()
          : null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
    return NextResponse.json({ success: true, article: data[0] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — الأدمن يحذف أي مقال؛ المساهم يحذف مقالاته فقط. ?id=<uuid>
export async function DELETE(request: NextRequest) {
  try {
    const caller = await getCaller(request);
    if (!caller.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing article id' }, { status: 400 });

    if (!caller.isAdmin) {
      const { data: existing } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', id)
        .maybeSingle();
      if (!existing || existing.author_id !== caller.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
