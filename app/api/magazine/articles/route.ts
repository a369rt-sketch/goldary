import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — كل المقالات (مسودات + منشورة) لصفحة "مقالاتي".
// يستخدم service role فيتجاوز RLS الذي يمنع anon من رؤية المسودات.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to load articles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ articles: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      content,
      category,
      coverImageUrl,
      published,
    } = body;

    // Validate required fields
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert article
    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          excerpt,
          content,
          category,
          cover_image_url: coverImageUrl,
          published,
          published_at: published ? new Date().toISOString() : null,
        },
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, article: data[0] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT — تحديث مقال موجود.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      slug,
      excerpt,
      content,
      category,
      coverImageUrl,
      published,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing article id' }, { status: 400 });
    }
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // نحافظ على تاريخ النشر الأصلي: نضبطه فقط عند النشر لأول مرة.
    const { data: existing, error: fetchError } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      );
    }
    if (!existing) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const published_at = published
      ? existing.published_at ?? new Date().toISOString()
      : null;

    const { data, error } = await supabase
      .from('articles')
      .update({
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        excerpt,
        content,
        category,
        cover_image_url: coverImageUrl,
        published,
        published_at,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, article: data[0] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE — حذف مقال بالـid: /api/magazine/articles?id=<uuid>
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing article id' }, { status: 400 });
    }

    const { error } = await supabase.from('articles').delete().eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete article' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
