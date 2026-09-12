"use client";

// رسم خطّي بسيط (SVG) — نقاط {x: وقت ms, y: قيمة}. متجاوب عبر viewBox.
export default function LineChart({
  points,
  color = "#f2d27b",
  height = 220,
  yFmt = (n: number) => String(Math.round(n)),
  xFmt = (ms: number) => new Date(ms).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
  emptyText = "بيانات غير كافية لعرض المنحنى",
}: {
  points: { x: number; y: number }[];
  color?: string;
  height?: number;
  yFmt?: (n: number) => string;
  xFmt?: (ms: number) => string;
  emptyText?: string;
}) {
  if (points.length < 2) {
    return <div className="muted" style={{ padding: "24px 0", textAlign: "center" }}>{emptyText}</div>;
  }

  const W = 640;
  const H = height;
  const padX = 44;
  const padY = 22;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const px = (x: number) => padX + ((x - minX) / spanX) * (W - 2 * padX);
  const py = (y: number) => H - padY - ((y - minY) / spanY) * (H - 2 * padY);

  const lineD = points.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ");
  const areaD = `${padX},${(H - padY).toFixed(1)} ${lineD} ${(W - padX).toFixed(1)},${(H - padY).toFixed(1)}`;

  // علامات المحور السيني: البداية/الوسط/النهاية
  const midX = points[Math.floor(points.length / 2)].x;
  const xticks = [minX, midX, maxX];
  // علامات المحور الصادي: min/mid/max
  const yticks = [minY, (minY + maxY) / 2, maxY];

  const gid = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* خطوط شبكة أفقية + تسميات Y */}
      {yticks.map((v, i) => (
        <g key={i}>
          <line
            x1={padX}
            y1={py(v)}
            x2={W - padX}
            y2={py(v)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <text x={padX - 6} y={py(v) + 3} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)">
            {yFmt(v)}
          </text>
        </g>
      ))}

      {/* المساحة + الخط */}
      <polygon points={areaD} fill={`url(#${gid})`} />
      <polyline points={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* النقطة الأخيرة */}
      <circle cx={px(maxX)} cy={py(ys[ys.length - 1])} r="3.5" fill={color} />

      {/* تسميات X */}
      {xticks.map((x, i) => (
        <text
          key={i}
          x={px(x)}
          y={H - 5}
          textAnchor={i === 0 ? "start" : i === xticks.length - 1 ? "end" : "middle"}
          fontSize="10"
          fill="rgba(255,255,255,0.55)"
        >
          {xFmt(x)}
        </text>
      ))}
    </svg>
  );
}
