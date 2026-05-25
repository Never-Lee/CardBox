export function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}
