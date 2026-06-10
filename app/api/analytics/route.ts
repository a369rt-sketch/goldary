import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error } = await supabase.from("user_calculations").insert([
      {
        province: body.province,
        karat: body.karat,
        operation_type: body.operation_type,
        item_condition: body.item_condition,
        weight: body.weight,
        manufacturing_fee: body.manufacturing_fee,
        profit_percent: body.profit_percent,
        market_factor: body.market_factor,
        calculated_price: body.calculated_price,
        currency: body.currency,
        user_modified: body.user_modified,
        session_id: body.session_id,
      },
    ]);

    if (error) {
      console.error(error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}