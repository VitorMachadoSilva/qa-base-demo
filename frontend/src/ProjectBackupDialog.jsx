import {
  ArchiveRestore,
  DatabaseBackup,
  FileCheck2,
  LoaderCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const countLabels = {
  suites: 'Suites',
  testCases: 'Casos',
  testPlans: 'Planos',
  runs: 'Execucoes',
  validationBriefs: 'Fichas',
  productionDemands: 'AD/MF'
};

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

export function ProjectBackupDialog({
  backup,
  error,
  isImporting,
  name,
  onClose,
  onConfirm,
  onNameChange
}) {
  const modalRef = useRef(null);
  const canRestore = name.trim().length >= 3 && !isImporting;

  useEffect(() => {
    const modal = modalRef.current;
    const previousFocus = document.activeElement;
    modal?.querySelector('input')?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isImporting) {
        event.preventDefault();
        onClose();
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isImporting, onClose]);

  return (
    <div
      className="modal-backdrop backup-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isImporting) onClose();
      }}
    >
      <form
        aria-labelledby="backup-dialog-title"
        aria-modal="true"
        className="modal backup-modal"
        onSubmit={(event) => {
          event.preventDefault();
          if (canRestore) onConfirm();
        }}
        ref={modalRef}
        role="dialog"
      >
        <header className="modal-header backup-modal-header">
          <div className="backup-heading">
            <span className="backup-heading-icon" aria-hidden="true">
              <DatabaseBackup size={20} />
            </span>
            <div>
              <span className="eyebrow">Backup verificado</span>
              <h2 id="backup-dialog-title">Restaurar projeto</h2>
            </div>
          </div>
          <button
            aria-label="Fechar"
            className="icon-button"
            disabled={isImporting}
            title="Fechar"
            type="button"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </header>

        <div className="backup-source-strip">
          <FileCheck2 size={18} />
          <div>
            <strong>{backup.sourceProjectName}</strong>
            <span>
              {formatDate(backup.exportedAt)} · {formatSize(backup.sizeBytes)} · v
              {backup.version}
            </span>
          </div>
          <ShieldCheck size={18} aria-label="Integridade confirmada" />
        </div>

        <div className="backup-count-grid" aria-label="Conteudo do backup">
          {Object.entries(countLabels).map(([key, label]) => (
            <div className="backup-count" key={key}>
              <span>{label}</span>
              <strong>{backup.counts[key] || 0}</strong>
            </div>
          ))}
        </div>

        <div className="backup-checksum">
          <span>SHA-256</span>
          <code title={backup.checksum}>{backup.checksum}</code>
        </div>

        <label className="field">
          Nome do novo projeto
          <input
            minLength={3}
            required
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>

        <div className="backup-warning">
          <ArchiveRestore size={17} />
          <span>
            Um novo projeto sera criado. Nenhum projeto existente sera substituido.
          </span>
        </div>

        {error && (
          <div className="form-error backup-error" role="alert">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="ghost-button"
            disabled={isImporting}
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="primary-button" disabled={!canRestore} type="submit">
            {isImporting ? (
              <>
                <LoaderCircle className="spin" size={17} />
                Restaurando
              </>
            ) : (
              <>
                <ArchiveRestore size={17} />
                Restaurar projeto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
