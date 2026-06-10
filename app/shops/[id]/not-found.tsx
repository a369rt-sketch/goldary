export default function ShopNotFound() {
  return (
    <main className="container" dir="rtl">
      <div className="card" style={{ textAlign: "center" }}>
        <h1 className="title" style={{ fontSize: 40 }}>المحل غير موجود</h1>
        <p className="lead muted">
          عذراً، هذا المحل غير متوفر أو تم حذفه.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <a href="/shops" className="btn-primary">رجوع لقائمة المحلات</a>
        </div>
      </div>
    </main>
  );
}
