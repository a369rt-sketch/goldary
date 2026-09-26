// يحمّل أنماط وخطوط المجلة لكل مسارات /magazine فقط.
// الهيدر/الفوتر العام مخفيان لهذه المسارات (SiteChrome)، والمجلة تتحكّم بواجهتها.
import "./magazine.css";

export default function MagazineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
