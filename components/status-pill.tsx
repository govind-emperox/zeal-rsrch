type StatusPillProps = {
  status: string;
  label?: string;
};

export function StatusPill({ status, label }: StatusPillProps) {
  return (
    <span className={`status-pill status-${status}`}>
      <span className="status-dot" />
      {label ?? status}
    </span>
  );
}
