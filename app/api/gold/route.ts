import { NextResponse } from "next/server";

export async function GET() {
  const usdToIqd = Number(process.env.NEXT_PUBLIC_USD_TO_IQD || 1310);

  try {
    // =========================
    // PRIMARY API (GoldAPI)
    // =========================

    const apiKey = process.env.GOLD_API_KEY;

    const primaryResponse = await fetch(
      "https://www.goldapi.io/api/XAU/USD",
      {
        headers: {
          "x-access-token": apiKey || "",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (primaryResponse.ok) {
      const data = await primaryResponse.json();

      const ounceUsd = data.price;

      const gram24Usd = ounceUsd / 31.1035;

      const gram24IQD = gram24Usd * usdToIqd;
      const gram22IQD = gram24IQD * (22 / 24);
      const gram21IQD = gram24IQD * (21 / 24);

      return NextResponse.json({
        source: "GoldAPI",

        ounceUsd,
        usdToIqd,

        price_gram_24k: Math.round(gram24IQD),
        price_gram_22k: Math.round(gram22IQD),
        price_gram_21k: Math.round(gram21IQD),

        updatedAt: new Date().toISOString(),
      });
    }

    // =========================
    // FALLBACK API
    // =========================

    console.log("GoldAPI failed. Switching to fallback API...");

    const fallbackResponse = await fetch(
      "https://api.gold-api.com/price/XAU",
      {
        cache: "no-store",
      }
    );

    if (!fallbackResponse.ok) {
      throw new Error("Fallback API failed");
    }

    const fallbackData = await fallbackResponse.json();

    const ounceUsd = fallbackData.price;

    const gram24Usd = ounceUsd / 31.1035;

    const gram24IQD = gram24Usd * usdToIqd;
    const gram22IQD = gram24IQD * (22 / 24);
    const gram21IQD = gram24IQD * (21 / 24);

    return NextResponse.json({
      source: "Fallback Gold API",

      ounceUsd,
      usdToIqd,

      price_gram_24k: Math.round(gram24IQD),
      price_gram_22k: Math.round(gram22IQD),
      price_gram_21k: Math.round(gram21IQD),

      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "All gold APIs failed",
      },
      { status: 500 }
    );
  }
}