import {
  Ban,
  CheckCircle2,
  Circle,
  LoaderCircle,
  MinusCircle,
  X,
  XCircle
} from 'lucide-react';

const resultIcons = {
  passed: CheckCircle2,
  failed: XCircle,
  blocked: Ban,
  skipped: MinusCircle,
  untested: Circle
};

export function CommandBar({ children, className = '', primary }) {
  return (
    <div className={`command-bar ${className}`}>
      <div className="command-bar-tools">{children}</div>
      {primary && <div className="command-bar-primary">{primary}</div>}
    </div>
  );
}

export function OperationalStrip({ children, label }) {
  return (
    <section className="operational-strip" aria-label={label}>
      {children}
    </section>
  );
}

export function DataLedger({ children, className = '', label }) {
  return (
    <div className={`data-ledger ${className}`} role="region" aria-label={label}>
      {children}
    </div>
  );
}

export function StatusMark({ label, state = 'untested' }) {
  const Icon = resultIcons[state] || Circle;

  return (
    <span className={`status-mark status-${state}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

export function StatePanel({ action, description, kind = 'empty', title }) {
  const isLoading = kind === 'loading';

  return (
    <div className={`state-panel state-${kind}`} aria-live="polite">
      {isLoading && <LoaderCircle className="state-spinner" size={20} aria-hidden="true" />}
      <strong>{title}</strong>
      {description && <span>{description}</span>}
      {action}
    </div>
  );
}

export function Inspector({ children, className = '', modal = false, onClose, title }) {
  return (
    <div
      className="inspector-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <aside
        className={`inspector ${className}`}
        aria-label={title}
        aria-modal={modal || undefined}
        role={modal ? 'dialog' : undefined}
      >
        <header className="inspector-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" title="Fechar" onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="inspector-body">{children}</div>
      </aside>
    </div>
  );
}

export function Overlay({ children, onClose, title, wide = false }) {
  return (
    <div className="modal-backdrop overlay-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal overlay ${wide ? 'overlay-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
