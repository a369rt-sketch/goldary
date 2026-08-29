import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aurum by Goldary — ادّخري بذكاء. استثمري بذهب",
  description:
    "Aurum by Goldary — أداة تخطيط وتعليم مالي لادّخار الذهب: حدّدي هدفك، تابعي تقدّمك، واعرفي متى يكفي رصيدك لشراء الذهب. ليست نصيحة استثمارية.",
};

export default function AurumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
