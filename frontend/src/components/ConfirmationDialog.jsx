import {
  AlertTriangle,
  PencilLine,
  ShieldAlert,
  X
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

const ConfirmationContext = createContext(null);

function defaultTitle(mode, danger) {
  if (mode === 'input') return 'Editar informação';
  return danger ? 'Confirmar ação permanente' : 'Confirmar ação';
}

export function ConfirmationProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);
  const previousFocusRef = useRef(null);

  const request = useCallback((options) => {
    if (resolverRef.current) {
      return Promise.resolve(options.mode === 'input' ? null : false);
    }

    previousFocusRef.current = document.activeElement;

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        cancelLabel: 'Cancelar',
        confirmLabel: options.mode === 'input' ? 'Salvar' : 'Confirmar',
        danger: false,
        initialValue: '',
        inputLabel: 'Nome',
        message: '',
        mode: 'confirm',
        ...options,
        title: options.title || defaultTitle(options.mode, options.danger)
      });
    });
  }, []);

  const settle = useCallback((value) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(value);

    window.requestAnimationFrame(() => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    });
  }, []);

  const value = {
    confirmAction: useCallback(
      (options = {}) => request({ ...options, mode: 'confirm' }),
      [request]
    ),
    requestText: useCallback(
      (options = {}) => request({ ...options, mode: 'input' }),
      [request]
    )
  };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      {dialog && <ConfirmationModal dialog={dialog} onSettle={settle} />}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);

  if (!context) {
    throw new Error('useConfirmation deve ser usado dentro de ConfirmationProvider');
  }

  return context;
}

function ConfirmationModal({ dialog, onSettle }) {
  const [inputValue, setInputValue] = useState(dialog.initialValue || '');
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const isInput = dialog.mode === 'input' || Boolean(dialog.verificationText);
  const normalizedValue = inputValue.trim();
  const canConfirm = dialog.verificationText
    ? inputValue === dialog.verificationText
    : !isInput || normalizedValue.length > 0;
  const Icon = dialog.danger
    ? ShieldAlert
    : dialog.mode === 'input'
      ? PencilLine
      : AlertTriangle;

  function cancel() {
    onSettle(dialog.mode === 'input' ? null : false);
  }

  function confirm() {
    if (!canConfirm) return;
    onSettle(dialog.mode === 'input' ? normalizedValue : true);
  }

  useEffect(() => {
    const modal = modalRef.current;
    const initialControl =
      inputRef.current ||
      modal?.querySelector('[data-dialog-primary]') ||
      modal?.querySelector('button');
    initialControl?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
        return;
      }

      if (event.key !== 'Tab') return;

      const controls = Array.from(
        modal?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)'
        ) || []
      );
      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="modal-backdrop confirmation-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <form
        aria-describedby="confirmation-description"
        aria-labelledby="confirmation-title"
        aria-modal="true"
        className={`modal confirmation-modal ${dialog.danger ? 'danger' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          confirm();
        }}
        ref={modalRef}
        role="dialog"
      >
        <header className="modal-header confirmation-header">
          <div className="confirmation-heading">
            <span className="confirmation-icon" aria-hidden="true">
              <Icon size={19} />
            </span>
            <div>
              <span className="eyebrow">
                {dialog.danger ? 'Ação permanente' : 'Confirmação'}
              </span>
              <h2 id="confirmation-title">{dialog.title}</h2>
            </div>
          </div>
          <button
            aria-label="Fechar confirmação"
            className="icon-button"
            title="Fechar"
            type="button"
            onClick={cancel}
          >
            <X size={17} />
          </button>
        </header>

        <p className="confirmation-description" id="confirmation-description">
          {dialog.message}
        </p>

        {dialog.verificationText && (
          <p className="confirmation-verification-copy">
            Digite <strong>{dialog.verificationText}</strong> para confirmar.
          </p>
        )}

        {isInput && (
          <label className="field confirmation-field">
            {dialog.inputLabel}
            <input
              autoComplete="off"
              ref={inputRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
          </label>
        )}

        <div className="modal-actions confirmation-actions">
          <button className="ghost-button" type="button" onClick={cancel}>
            {dialog.cancelLabel}
          </button>
          <button
            className={dialog.danger ? 'danger-button' : 'primary-button'}
            data-dialog-primary
            disabled={!canConfirm}
            type="submit"
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
