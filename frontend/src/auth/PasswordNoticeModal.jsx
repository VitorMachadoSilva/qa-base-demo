import { KeyRound, UserRound, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function PasswordNoticeModal({
  isSaving,
  onDismiss,
  onOpenAccount
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const firstControl = dialog?.querySelector('button');
    firstControl?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSaving) {
        onDismiss();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving]);

  function keepFocusInside(event) {
    if (event.key !== 'Tab') {
      return;
    }

    const controls = Array.from(
      event.currentTarget.querySelectorAll('button:not(:disabled)')
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

  return (
    <div
      className="modal-backdrop auth-notice-backdrop"
      role="presentation"
      onMouseDown={() => !isSaving && onDismiss()}
    >
      <section
        aria-labelledby="password-notice-title"
        aria-modal="true"
        className="modal password-notice-modal"
        onKeyDown={keepFocusInside}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <div className="modal-header">
          <div className="password-notice-heading">
            <span className="password-notice-icon">
              <KeyRound size={19} />
            </span>
            <div>
              <span className="eyebrow">Novidade de segurança</span>
              <h2 id="password-notice-title">Sua senha agora pode ser alterada</h2>
            </div>
          </div>
          <button
            className="icon-button"
            disabled={isSaving}
            type="button"
            title="Fechar"
            aria-label="Fechar aviso"
            onClick={onDismiss}
          >
            <X size={17} />
          </button>
        </div>

        <p>
          Acesse <strong>Minha conta</strong> pelo novo ícone abaixo das
          notificações sempre que precisar atualizar sua senha.
        </p>

        <div className="modal-actions">
          <button
            className="ghost-button"
            disabled={isSaving}
            type="button"
            onClick={onDismiss}
          >
            Entendi
          </button>
          <button
            className="primary-button"
            disabled={isSaving}
            type="button"
            onClick={onOpenAccount}
          >
            <UserRound size={17} />
            Abrir Minha conta
          </button>
        </div>
      </section>
    </div>
  );
}
