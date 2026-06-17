import ReturnCalculator from "@/app/components/ReturnCalculator";

export default function ReturnCalculatorPage() {
  return (
    <main className="container" dir="rtl">
      <div className="row-between">
        <h1 className="title">حاسبة العائد الاستثماري</h1>
        <a href="/" className="btn-secondary">رجوع</a>
      </div>

      <p className="lead muted">
        احسب ربح أو خسارة ذهبك حسب السعر الحالي للعيار
      </p>

      <ReturnCalculator />
    </main>
  );
}
