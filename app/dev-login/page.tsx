import { notFound } from "next/navigation";
import DevLoginForm from "./DevLoginForm";

// دخول تطويري فقط — يعيد 404 في الإنتاج (لا يوجد المسار أصلاً على Vercel).
export default function DevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <DevLoginForm />;
}
