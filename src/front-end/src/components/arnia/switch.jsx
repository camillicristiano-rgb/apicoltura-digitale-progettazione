export default function Switch({ checked, onChange, disabled }) {
  return (
    <button
      className={`ar-switch ${checked ? "ar-switch-on" : ""} ${disabled ? "ar-switch-dis" : ""}`}
      onClick={onChange}
      disabled={disabled}
      type="button"
      aria-pressed={checked}
      title={checked ? "Acceso" : "Spento"}
    >
      <span className="ar-switch-dot" />
    </button>
  );
}
