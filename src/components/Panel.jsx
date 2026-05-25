export function Panel({ children, className = "" }) {
  return <div className={`panel ${className}`}>{children}</div>;
}
