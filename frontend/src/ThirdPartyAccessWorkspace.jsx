import {
  CalendarClock,
  Check,
  ContactRound,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundX,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { Inspector, StatePanel } from './components/QualityPrimitives.jsx';
import { api } from './services/api.js';

const systems = ['Teams', 'GitLab', 'VPN', 'Jira', 'Confluence'];
const stateLabels = {
  Active: 'Ativo',
  Expiring: 'A vencer',
  Expired: 'Vencido',
  Closed: 'Encerrado'
};

function dateInput(value = new Date()) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function addMonths(value, months = 3) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();

  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      Math.min(day, lastDay)
    )
  )
    .toISOString()
    .slice(0, 10);
}

function emptyForm() {
  const approvedAt = dateInput();
  return {
    name: '',
    company: '',
    role: '',
    contact: '',
    internalOwner: '',
    notes: '',
    approvedAt,
    expiresAt: addMonths(approvedAt),
    systems: []
  };
}

function identityForm(record) {
  return {
    name: record.name,
    company: record.company,
    role: record.role,
    contact: record.contact || '',
    internalOwner: record.internalOwner,
    notes: record.notes || ''
  };
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
    : 'Não informado';
}

function expiryCopy(record) {
  if (record.state === 'Closed') {
    return 'Ciclo encerrado';
  }
  if (record.state === 'Expired') {
    return `${record.daysOverdue} dia${record.daysOverdue === 1 ? '' : 's'} em atraso`;
  }
  if (record.daysRemaining === 0) {
    return 'Vence hoje';
  }
  return `${record.daysRemaining} dia${record.daysRemaining === 1 ? '' : 's'} restante${record.daysRemaining === 1 ? '' : 's'}`;
}

export function ThirdPartyAccessWorkspace({ onNotify }) {
  const { confirmAction } = useConfirmation();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    state: 'All',
    system: 'All',
    company: '',
    internalOwner: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [inspector, setInspector] = useState(null);
  const [detail, setDetail] = useState(null);

  const hasFilters = Object.values(filters).some(
    (value) => value && value !== 'All'
  );

  useEffect(() => {
    loadData();
  }, [filters.state, filters.system]);

  useEffect(() => {
    const timer = window.setTimeout(loadRecords, 250);
    return () => window.clearTimeout(timer);
  }, [filters.q, filters.company, filters.internalOwner]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        closeInspector();
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  async function loadRecords() {
    try {
      setRecords(await api.listThirdParties(filters));
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadData() {
    setIsLoading(true);
    try {
      const [nextRecords, nextSummary] = await Promise.all([
        api.listThirdParties(filters),
        api.getThirdPartySummary()
      ]);
      setRecords(nextRecords);
      setSummary(nextSummary);
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function openDetail(id) {
    setInspector({ mode: 'detail', id });
    setDetail(null);
    try {
      setDetail(await api.getThirdParty(id));
    } catch (error) {
      onNotify(error.message, true);
      closeInspector();
    }
  }

  function closeInspector() {
    setInspector(null);
    setDetail(null);
  }

  async function refreshDetail(id, message) {
    const [nextDetail] = await Promise.all([api.getThirdParty(id), loadData()]);
    setDetail(nextDetail);
    setInspector({ mode: 'detail', id });
    if (message) {
      onNotify(message);
    }
  }

  async function execute(action) {
    try {
      return await action();
    } catch (error) {
      onNotify(error.message, true);
      return null;
    }
  }

  const inspectorTitle = {
    create: 'Novo acesso de terceiro',
    detail: 'Ficha do terceiro',
    edit: 'Editar terceiro',
    renew: 'Renovar acessos',
    close: 'Encerrar acessos'
  }[inspector?.mode];

  return (
    <>
      <section className="third-party-workspace">
        <header className="access-command-band">
          <div>
            <span className="eyebrow">Governança de acessos</span>
            <h2>Terceiros autorizados</h2>
            <p>Controle ciclos, responsáveis e expirações sem perder o histórico.</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => setInspector({ mode: 'create' })}
          >
            <Plus size={17} />
            Cadastrar terceiro
          </button>
        </header>

        <div className="access-summary-strip" aria-label="Resumo dos acessos">
          <SummaryItem
            active={filters.state === 'All'}
            label="Total"
            value={summary?.total ?? 0}
            onClick={() => setFilters((current) => ({ ...current, state: 'All' }))}
          />
          <SummaryItem
            active={filters.state === 'Active'}
            label="Ativos"
            value={summary?.active ?? 0}
            onClick={() => setFilters((current) => ({ ...current, state: 'Active' }))}
          />
          <SummaryItem
            active={filters.state === 'Expiring'}
            kind="warning"
            label="A vencer"
            value={summary?.expiring ?? 0}
            onClick={() => setFilters((current) => ({ ...current, state: 'Expiring' }))}
          />
          <SummaryItem
            active={filters.state === 'Expired'}
            kind="danger"
            label="Vencidos"
            value={summary?.expired ?? 0}
            onClick={() => setFilters((current) => ({ ...current, state: 'Expired' }))}
          />
          <SummaryItem
            active={filters.state === 'Closed'}
            label="Encerrados"
            value={summary?.closed ?? 0}
            onClick={() => setFilters((current) => ({ ...current, state: 'Closed' }))}
          />
        </div>

        <div className="access-filter-strip">
          <label className="search-box access-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar pessoa, empresa ou função"
              value={filters.q}
              onChange={(event) =>
                setFilters((current) => ({ ...current, q: event.target.value }))
              }
            />
          </label>
          <FilterSelect
            label="Estado"
            value={filters.state}
            onChange={(state) => setFilters((current) => ({ ...current, state }))}
          >
            <option value="All">Todos</option>
            {Object.entries(stateLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Sistema"
            value={filters.system}
            onChange={(system) => setFilters((current) => ({ ...current, system }))}
          >
            <option value="All">Todos</option>
            {systems.map((system) => (
              <option key={system}>{system}</option>
            ))}
          </FilterSelect>
          <label className="access-text-filter">
            <span>Empresa</span>
            <input
              value={filters.company}
              onChange={(event) =>
                setFilters((current) => ({ ...current, company: event.target.value }))
              }
              placeholder="Todas"
            />
          </label>
          <label className="access-text-filter">
            <span>Responsável</span>
            <input
              value={filters.internalOwner}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  internalOwner: event.target.value
                }))
              }
              placeholder="Todos"
            />
          </label>
          {hasFilters && (
            <button
              className="plain-icon access-clear-filters"
              type="button"
              title="Limpar filtros"
              aria-label="Limpar filtros"
              onClick={() =>
                setFilters({
                  q: '',
                  state: 'All',
                  system: 'All',
                  company: '',
                  internalOwner: ''
                })
              }
            >
              <X size={16} />
            </button>
          )}
        </div>

        <section className="access-ledger data-ledger" aria-label="Acessos de terceiros">
          <div className="access-ledger-head" aria-hidden="true">
            <span>Terceiro</span>
            <span>Acessos</span>
            <span>Responsável interno</span>
            <span>Vencimento</span>
          </div>
          {isLoading ? (
            <StatePanel kind="loading" title="Carregando acessos" />
          ) : records.length === 0 ? (
            <StatePanel
              title={hasFilters ? 'Nenhum acesso corresponde aos filtros' : 'Nenhum terceiro cadastrado'}
              description={
                hasFilters
                  ? 'Ajuste os filtros para ampliar a busca.'
                  : 'Cadastre o primeiro ciclo de acesso da equipe.'
              }
              action={
                !hasFilters ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setInspector({ mode: 'create' })}
                  >
                    <Plus size={17} />
                    Cadastrar terceiro
                  </button>
                ) : null
              }
            />
          ) : (
            records.map((record) => (
              <button
                className={`access-ledger-row access-state-${record.state.toLowerCase()}`}
                key={record.id}
                type="button"
                onClick={() => openDetail(record.id)}
              >
                <span className="access-identity">
                  <span className="access-avatar">{record.name.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <strong>{record.name}</strong>
                    <small>{record.company} · {record.role}</small>
                  </span>
                </span>
                <span className="access-system-list">
                  {record.systems.map((system) => (
                    <span key={system}>{system}</span>
                  ))}
                </span>
                <span className="access-owner">{record.internalOwner}</span>
                <span className="access-expiry">
                  <strong>{formatDate(record.currentCycle?.expiresAt)}</strong>
                  <small className={`access-state-label state-${record.state.toLowerCase()}`}>
                    {stateLabels[record.state]} · {expiryCopy(record)}
                  </small>
                </span>
              </button>
            ))
          )}
        </section>
      </section>

      {inspector && (
        <Inspector
          className="access-inspector"
          modal
          onClose={closeInspector}
          title={inspectorTitle}
        >
          {inspector.mode === 'create' && (
            <AccessForm
              onCancel={closeInspector}
              onSubmit={async (form) => {
                const created = await execute(() => api.createThirdParty(form));
                if (!created) return;
                closeInspector();
                await loadData();
                onNotify('Terceiro cadastrado.');
              }}
            />
          )}
          {inspector.mode === 'detail' && !detail && (
            <StatePanel kind="loading" title="Abrindo ficha" />
          )}
          {inspector.mode === 'detail' && detail && (
            <AccessDetail
              record={detail}
              onCloseAccess={() => setInspector({ mode: 'close', id: detail.id })}
              onDelete={async () => {
                const confirmed = await confirmAction({
                  title: `Excluir ${detail.name}?`,
                  message:
                    'Todo o histórico de acessos e atividades deste terceiro também será removido permanentemente.',
                  confirmLabel: 'Excluir terceiro',
                  danger: true
                });

                if (!confirmed) return;

                const removed = await execute(async () => {
                  await api.deleteThirdParty(detail.id);
                  return true;
                });
                if (!removed) return;

                closeInspector();
                await loadData();
                onNotify('Terceiro excluído.');
              }}
              onDeleteNote={async (id) => {
                const removed = await execute(async () => {
                  await api.deleteThirdPartyNote(id);
                  return true;
                });
                if (!removed) return;
                await refreshDetail(detail.id, 'Anotação removida.');
              }}
              onEdit={() => setInspector({ mode: 'edit', id: detail.id })}
              onNote={async (data) => {
                const created = await execute(() =>
                  api.createThirdPartyNote(detail.id, data)
                );
                if (!created) return false;
                await refreshDetail(detail.id, 'Anotação registrada.');
                return true;
              }}
              onRenew={() => setInspector({ mode: 'renew', id: detail.id })}
            />
          )}
          {inspector.mode === 'edit' && detail && (
            <AccessForm
              initial={identityForm(detail)}
              isEditing
              onCancel={() => setInspector({ mode: 'detail', id: detail.id })}
              onSubmit={async (form) => {
                const updated = await execute(() =>
                  api.updateThirdParty(detail.id, form)
                );
                if (!updated) return;
                await refreshDetail(detail.id, 'Cadastro atualizado.');
              }}
            />
          )}
          {inspector.mode === 'renew' && detail && (
            <RenewForm
              record={detail}
              onCancel={() => setInspector({ mode: 'detail', id: detail.id })}
              onSubmit={async (form) => {
                const renewed = await execute(() =>
                  api.renewThirdPartyAccess(detail.id, form)
                );
                if (!renewed) return;
                await refreshDetail(detail.id, 'Acessos renovados.');
              }}
            />
          )}
          {inspector.mode === 'close' && detail && (
            <CloseForm
              onCancel={() => setInspector({ mode: 'detail', id: detail.id })}
              onSubmit={async (form) => {
                const closed = await execute(() =>
                  api.closeThirdPartyAccess(detail.id, form)
                );
                if (!closed) return;
                closeInspector();
                await loadData();
                onNotify('Acessos encerrados.');
              }}
            />
          )}
        </Inspector>
      )}
    </>
  );
}

function SummaryItem({ active, kind = '', label, onClick, value }) {
  return (
    <button
      className={`access-summary-cell ${kind} ${active ? 'active' : ''}`}
      type="button"
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function FilterSelect({ children, label, onChange, value }) {
  return (
    <label className="access-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function AccessForm({ initial, isEditing = false, onCancel, onSubmit }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSaving(false);
    }
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeApproval(approvedAt) {
    setForm((current) => ({
      ...current,
      approvedAt,
      expiresAt: addMonths(approvedAt)
    }));
  }

  return (
    <form className="access-form" onSubmit={submit}>
      <section className="access-form-section">
        <header>
          <span className="eyebrow">Identificação</span>
          <h3>Dados do terceiro</h3>
        </header>
        <div className="access-form-grid">
          <Field label="Nome" required value={form.name} onChange={(value) => setField('name', value)} />
          <Field label="Empresa" required value={form.company} onChange={(value) => setField('company', value)} />
          <Field label="Função" required value={form.role} onChange={(value) => setField('role', value)} />
          <Field label="Contato" value={form.contact} onChange={(value) => setField('contact', value)} />
          <Field label="Responsável interno" required value={form.internalOwner} onChange={(value) => setField('internalOwner', value)} />
          <label className="field field-span-2">
            Observações
            <textarea rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} />
          </label>
        </div>
      </section>

      {!isEditing && (
        <section className="access-form-section">
          <header>
            <span className="eyebrow">Ciclo de acesso</span>
            <h3>Vigência e sistemas</h3>
          </header>
          <div className="access-form-grid">
            <label className="field">
              Data de aprovação
              <input required type="date" value={form.approvedAt} onChange={(event) => changeApproval(event.target.value)} />
            </label>
            <label className="field">
              Vencimento
              <input required max={addMonths(form.approvedAt)} min={form.approvedAt} type="date" value={form.expiresAt} onChange={(event) => setField('expiresAt', event.target.value)} />
              <small>Máximo: {formatDate(addMonths(form.approvedAt))}</small>
            </label>
          </div>
          <SystemPicker
            selected={form.systems}
            onChange={(nextSystems) => setField('systems', nextSystems)}
          />
        </section>
      )}

      <div className="modal-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" disabled={isSaving} type="submit">
          <Check size={17} />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, onChange, required = false, value }) {
  return (
    <label className="field">
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SystemPicker({ onChange, selected }) {
  function toggle(system) {
    onChange(
      selected.includes(system)
        ? selected.filter((item) => item !== system)
        : [...selected, system]
    );
  }

  return (
    <fieldset className="access-systems">
      <legend>Sistemas autorizados</legend>
      <div>
        {systems.map((system) => (
          <label className={selected.includes(system) ? 'selected' : ''} key={system}>
            <input
              checked={selected.includes(system)}
              onChange={() => toggle(system)}
              type="checkbox"
            />
            <span>{system}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AccessDetail({
  onCloseAccess,
  onDelete,
  onDeleteNote,
  onEdit,
  onNote,
  onRenew,
  record
}) {
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const currentOpen = record.cycles.some((cycle) => !cycle.closedAt);

  return (
    <div className="access-detail">
      <header className="access-detail-hero">
        <div className="access-detail-avatar">{record.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <span className={`access-state-label state-${record.state.toLowerCase()}`}>
            {stateLabels[record.state]}
          </span>
          <h2>{record.name}</h2>
          <p>{record.company} · {record.role}</p>
        </div>
      </header>

      <div className="access-detail-actions">
        <button className="ghost-button" type="button" onClick={onEdit}>
          <Pencil size={16} /> Editar
        </button>
        {currentOpen && (
          <>
            <button className="ghost-button" type="button" onClick={onRenew}>
              <RefreshCw size={16} /> Renovar
            </button>
            <button className="ghost-button danger" type="button" onClick={onCloseAccess}>
              <UserRoundX size={16} /> Encerrar
            </button>
          </>
        )}
        {!currentOpen && (
          <button
            className="plain-icon danger access-delete-party"
            type="button"
            title="Excluir terceiro"
            aria-label={`Excluir ${record.name}`}
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <dl className="access-facts">
        <div><dt>Contato</dt><dd>{record.contact || 'Não informado'}</dd></div>
        <div><dt>Responsável interno</dt><dd>{record.internalOwner}</dd></div>
        <div><dt>Aprovação atual</dt><dd>{formatDate(record.currentCycle?.approvedAt)}</dd></div>
        <div><dt>Vencimento</dt><dd>{formatDate(record.currentCycle?.expiresAt)}</dd></div>
      </dl>

      <section className="access-detail-section">
        <h3><ShieldCheck size={17} /> Acessos do ciclo</h3>
        <div className="access-system-list detail">
          {record.systems.map((system) => <span key={system}>{system}</span>)}
        </div>
        {record.notes && <p className="access-general-notes">{record.notes}</p>}
      </section>

      <section className="access-detail-section">
        <h3><History size={17} /> Histórico de vigências</h3>
        <div className="access-cycle-list">
          {record.cycles.map((cycle) => (
            <article key={cycle.id}>
              <CalendarClock size={17} />
              <div>
                <strong>{formatDate(cycle.approvedAt)} a {formatDate(cycle.expiresAt)}</strong>
                <span>{cycle.grants.map((grant) => grant.system).join(', ')}</span>
                {cycle.closureReason && <small>{cycle.closureReason}</small>}
              </div>
              <span>{cycle.closedAt ? (cycle.closureKind === 'Renewed' ? 'Renovado' : 'Encerrado') : 'Atual'}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="access-detail-section">
        <h3><ContactRound size={17} /> Anotações e atividades</h3>
        <form
          className="access-note-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const saved = await onNote({ content: note, author: author || null });
            if (saved) setNote('');
          }}
        >
          <textarea required rows={3} placeholder="Registrar contexto ou acompanhamento" value={note} onChange={(event) => setNote(event.target.value)} />
          <div>
            <input placeholder="Autor (opcional)" value={author} onChange={(event) => setAuthor(event.target.value)} />
            <button className="ghost-button" type="submit"><Plus size={16} /> Adicionar</button>
          </div>
        </form>
        <div className="access-activity-list">
          {[...record.activities].reverse().map((activity) => (
            <article key={activity.id}>
              <span className={`activity-dot kind-${activity.kind.toLowerCase()}`} />
              <div>
                <header>
                  <strong>{activity.kind === 'Note' ? activity.author || 'Anotação' : 'QaBase'}</strong>
                  <time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(activity.createdAt))}</time>
                </header>
                <p>{activity.message}</p>
              </div>
              {activity.kind === 'Note' && (
                <button className="plain-icon danger" type="button" title="Excluir anotação" onClick={() => onDeleteNote(activity.id)}>
                  <Trash2 size={15} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RenewForm({ onCancel, onSubmit, record }) {
  const approvedAt = dateInput();
  const [form, setForm] = useState({
    approvedAt,
    expiresAt: addMonths(approvedAt),
    systems: record.systems,
    author: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({ ...form, author: form.author || null });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="access-form" onSubmit={submit}>
      <div className="access-renew-intro">
        <RefreshCw size={21} />
        <div><h3>Novo ciclo para {record.name}</h3><p>O ciclo atual será preservado no histórico.</p></div>
      </div>
      <div className="access-form-grid">
        <label className="field">Data de aprovação<input required type="date" value={form.approvedAt} onChange={(event) => {
          const approved = event.target.value;
          setForm((current) => ({ ...current, approvedAt: approved, expiresAt: addMonths(approved) }));
        }} /></label>
        <label className="field">Vencimento<input required min={form.approvedAt} max={addMonths(form.approvedAt)} type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} /></label>
        <label className="field field-span-2">Responsável pela renovação<input value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} /></label>
      </div>
      <SystemPicker selected={form.systems} onChange={(next) => setForm((current) => ({ ...current, systems: next }))} />
      <div className="modal-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" disabled={isSaving} type="submit"><RefreshCw size={16} /> {isSaving ? 'Renovando...' : 'Confirmar renovação'}</button>
      </div>
    </form>
  );
}

function CloseForm({ onCancel, onSubmit }) {
  const [reason, setReason] = useState('');
  const [author, setAuthor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      className="access-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSaving(true);
        try {
          await onSubmit({ reason, author: author || null });
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="access-close-intro">
        <UserRoundX size={22} />
        <div><h3>Encerrar ciclo atual</h3><p>O registro e todo o histórico continuarão disponíveis.</p></div>
      </div>
      <label className="field">Motivo do encerramento<textarea autoFocus required minLength={3} rows={5} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      <label className="field">Responsável pela ação<input value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
      <div className="modal-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="danger-button" disabled={isSaving} type="submit"><UserRoundX size={16} /> {isSaving ? 'Encerrando...' : 'Encerrar acessos'}</button>
      </div>
    </form>
  );
}
