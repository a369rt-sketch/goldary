import { NextResponse } from "next/server";

export async function GET() {
  // TODO لاحقاً: اربطي ounce_usd من مصدر عالمي
  // TODO لاحقاً: اربطي usd_to_iqd من مصدر محلي/يدوي لوحة تحكم
  const data = {
    ounce_usd: 2034.12,
    usd_to_iqd: {
      baghdad: 150500,
      basra: 151000,
      najaf: 150750,
      karbala: 150750,
      mosul: 150400,
      erbil: 150000,
      sulaymaniyah: 149800,
      kirkuk: 150300,
      diwaniyah: 150650,
      dhiqar: 150800,
      maysan: 150700,
      wasit: 150600,
      babylon: 150600,
      diyala: 150500,
      anbar: 150450,
      salahaddin: 150450,
      kuth: 150600,
      samawa: 150700,
    },
    // سبريدات “مثال” قابلة للتعديل:
    spreads: {
      buy: 0.0,      // شراء من الزبون (اقل)
      sell_new: 0.02, // بيع جديد (اعلى 2%)
      sell_used: 0.01 // بيع مستعمل (اعلى 1%)
    },
    updatedAt: new Date().toISOString(),
    source: "manual_seed"
  };

  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
