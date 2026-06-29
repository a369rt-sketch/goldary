import GoldTicker from "../components/GoldTicker";

export default function CollectionPage() {
  return (
    <main className="container">
      <GoldTicker currency="USD" />

      <div className="row-between">
        <h1 className="title">Collection</h1>
        <a href="/" className="btn-secondary">Back</a>
      </div>

      <p className="muted">A starter gallery. We’ll connect real products later.</p>

      <div className="grid">
        {[
          { name: "Classic Ring", tag: "18K / Minimal" },
          { name: "Earrings Set", tag: "21K / Daily" },
          { name: "Necklace", tag: "22K / Gift" },
          { name: "Bracelet", tag: "24K / Premium" },
        ].map((p) => (
          <div key={p.name} className="card">
            <div className="thumb" />
            <div className="card-body">
              <div className="card-title">{p.name}</div>
              <div className="muted small">{p.tag}</div>
              <button className="btn-primary small-btn">Ask / Order</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
