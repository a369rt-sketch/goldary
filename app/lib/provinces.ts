export type ProvinceFactor = {
  province_key: string;
  province_name: string;
  buy_factor: number;
  sell_new_factor: number;
  sell_used_factor: number;
};

export const provinces = [
  { key: "baghdad", name: "بغداد" },
  { key: "basra", name: "البصرة" },
  { key: "erbil", name: "أربيل" },
  { key: "najaf", name: "النجف" },
  { key: "karbala", name: "كربلاء" },
  { key: "babel", name: "بابل" },
  { key: "diyala", name: "ديالى" },
  { key: "kirkuk", name: "كركوك" },
  { key: "mosul", name: "نينوى" },
  { key: "sulaymaniyah", name: "السليمانية" },
  { key: "dhiqar", name: "ذي قار" },
  { key: "maysan", name: "ميسان" },
  { key: "wasit", name: "واسط" },
  { key: "anbar", name: "الأنبار" },
  { key: "qadisiyyah", name: "القادسية" },
  { key: "muthanna", name: "المثنى" },
  { key: "duhok", name: "دهوك" },
  { key: "saladin", name: "صلاح الدين" },
];