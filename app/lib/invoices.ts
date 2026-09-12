"use client";

import { supabase } from "@/app/lib/supabaseClient";

export type InvoiceType = "sale" | "purchase" | "repair";
export type InvoiceStatus = "issued" | "void";

export const INVOICE_TYPES: InvoiceType[] = ["sale", "purchase", "repair"];
export const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  sale: "بيع",
  purchase: "شراء",
  repair: "تصليح",
};

export type Invoice = {
  id: string;
  shop_id: string;
  number: number;
  type: InvoiceType;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  status: InvoiceStatus;
  staff_id: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  shop_item_id: string | null;
  description: string;
  weight: number | null;
  karat: string | null;
  price_per_gram: number | null;
  making_fee: number;
  quantity: number;
  line_total: number;
};

export type InvoiceItemInput = {
  shop_item_id: string | null;
  description: string;
  weight: number | null;
  karat: string | null;
  price_per_gram: number | null;
  making_fee: number;
  quantity: number;
  line_total: number;
};

export type InvoiceInput = {
  type: InvoiceType;
  customer_name: string | null;
  customer_phone: string | null;
  staff_id: string | null;
  discount: number;
  notes: string | null;
  items: InvoiceItemInput[];
};

// حساب مجموع البند: (وزن × سعر الغرام + أجرة الصناعة) × الكمية
export function lineTotal(it: {
  weight: number | null;
  price_per_gram: number | null;
  making_fee: number;
  quantity: number;
}): number {
  const base = (Number(it.weight) || 0) * (Number(it.price_per_gram) || 0) + (Number(it.making_fee) || 0);
  return base * (Number(it.quantity) || 1);
}

export async function getMyInvoices(shopUserId: string): Promise<Invoice[]> {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("shop_id", shopUserId)
    .order("created_at", { ascending: false });
  return (data as Invoice[]) ?? [];
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const { data } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId);
  return (data as InvoiceItem[]) ?? [];
}

// إنشاء فاتورة + بنودها، وخصم قطع المخزون المباعة (لفواتير البيع)
export async function createInvoice(
  shopUserId: string,
  input: InvoiceInput
): Promise<{ invoice: Invoice | null; error: string | null }> {
  const subtotal = input.items.reduce((s, it) => s + (Number(it.line_total) || 0), 0);
  const total = Math.max(0, subtotal - (Number(input.discount) || 0));

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      shop_id: shopUserId,
      type: input.type,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      staff_id: input.staff_id,
      subtotal,
      discount: Number(input.discount) || 0,
      total,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (invErr || !inv) return { invoice: null, error: invErr?.message ?? "insert failed" };

  const invoice = inv as Invoice;

  const rows = input.items.map((it) => ({
    invoice_id: invoice.id,
    shop_item_id: it.shop_item_id,
    description: it.description,
    weight: it.weight,
    karat: it.karat,
    price_per_gram: it.price_per_gram,
    making_fee: Number(it.making_fee) || 0,
    quantity: Number(it.quantity) || 1,
    line_total: Number(it.line_total) || 0,
  }));

  if (rows.length > 0) {
    const { error: itemsErr } = await supabase.from("invoice_items").insert(rows);
    if (itemsErr) return { invoice, error: itemsErr.message };
  }

  // خصم المخزون: قطع البيع المرتبطة → مُباعة
  if (input.type === "sale") {
    const soldIds = input.items.map((i) => i.shop_item_id).filter(Boolean) as string[];
    if (soldIds.length > 0) {
      await supabase
        .from("shop_items")
        .update({ status: "sold", updated_at: new Date().toISOString() })
        .in("id", soldIds);
    }
  }

  return { invoice, error: null };
}

// إلغاء فاتورة (لا تُحذف — للتدقيق)
export async function voidInvoice(id: string) {
  return supabase.from("invoices").update({ status: "void" }).eq("id", id);
}

// حركة مخزون مشتقّة من بنود الفواتير (بيع=خروج، شراء=دخول) — الملغاة مستبعدة
export type StockMovement = {
  id: string;
  direction: "in" | "out";
  reason: InvoiceType;
  description: string;
  weight: number | null;
  karat: string | null;
  quantity: number;
  invoiceNumber: number;
  createdAt: string;
};

export async function getStockMovements(shopUserId: string): Promise<StockMovement[]> {
  // RLS يقصر invoice_items على المالك؛ نضمّن الفاتورة للحصول على النوع/الرقم/التاريخ
  const { data } = await supabase
    .from("invoice_items")
    .select(
      "id, description, weight, karat, quantity, invoice:invoices!inner(number, type, status, shop_id, created_at)"
    );
  type Row = {
    id: string;
    description: string;
    weight: number | null;
    karat: string | null;
    quantity: number;
    invoice: { number: number; type: InvoiceType; status: InvoiceStatus; shop_id: string; created_at: string };
  };
  const rows = (data as unknown as Row[]) ?? [];
  return rows
    .filter(
      (r) =>
        r.invoice &&
        r.invoice.shop_id === shopUserId &&
        r.invoice.status === "issued" &&
        (r.invoice.type === "sale" || r.invoice.type === "purchase")
    )
    .map((r) => ({
      id: r.id,
      direction: r.invoice.type === "sale" ? ("out" as const) : ("in" as const),
      reason: r.invoice.type,
      description: r.description,
      weight: r.weight,
      karat: r.karat,
      quantity: r.quantity,
      invoiceNumber: r.invoice.number,
      createdAt: r.invoice.created_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
