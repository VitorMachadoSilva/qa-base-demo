import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Link2,
  MessageSquarePlus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Siren,
  Trash2,
  UserRound
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { Inspector, StatePanel } from './components/QualityPrimitives.jsx';
import { api } from './services/api.js';
import {
  deadlineStateLabels,
  demandCriticalityLabels,
  demandDeadlineLabel,
  demandImpactLabel,
  demandStatusLabels,
  demandTypeLabels,
  formatDemandDate,
  relatedRecordLabel,
  toDateInputValue
} from './utils/productionDemands.js';

const emptySummary = {
  total: 0,
  active: 0,
  overdue: 0,
  noDate: 0,
  highCriticality: 0,
  closed: 0
};

const initialFilters = {
  q: '',
  type: 'All',
  status: 'All',
  criticality: 'All',
  qaOwner: '',
  deadlineState: 'All'
};

function todayInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyDemandForm(type = 'MF') {
  return {
    type,
    code: '',
    sourceUrl: '',
    title: '',
    description: '',
    supportContact: '',
    qaOwner: '',
    status: 'Open',
    registeredAt: todayInput(),
    dueDate: '',
    criticality: 'Medium',
    affectedUsersCount: '1',
    validationBriefId: '',
    runId: '',
    milestoneId: '',
    linkedAdId: ''
  };
}

function formFromDemand(demand) {
  return {
    type: demand.type,
    code: demand.code,
    sourceUrl: demand.sourceUrl || '',
    title: demand.title,
    description: demand.description || '',
    supportContact: demand.supportContact,
    qaOwner: demand.qaOwner,
    status: demand.status,
    registeredAt: toDateInputValue(demand.registeredAt),
    dueDate: demand.type === 'AD' ? toDateInputValue(demand.dueDate) : '',
    criticality: demand.criticality || 'Medium',
    affectedUsersCount: String(demand.affectedUsersCount || 1),
    validationBriefId: String(demand.validationBriefId || ''),
    runId: String(demand.runId || ''),
    milestoneId: String(demand.milestoneId || ''),
    linkedAdId: String(demand.linkedAdId || '')
  };
}

function numberOrNull(value) {
  return value ? Number(value) : null;
}

function demandPayload(form, isEditing) {
  const payload = {
    type: form.type,
    code: form.code,
    sourceUrl: form.sourceUrl || null,
    title: form.title,
    description: form.description || null,
    supportContact: form.supportContact,
    qaOwner: form.qaOwner,
    registeredAt: form.registeredAt,
    dueDate: form.type === 'AD' ? form.dueDate || null : null,
    criticality: form.type === 'AD' ? form.criticality : null,
    affectedUsersCount:
      form.type === 'AD' ? numberOrNull(form.affectedUsersCount) : null,
    validationBriefId: numberOrNull(form.validationBriefId),
    runId: numberOrNull(form.runId),
    milestoneId: numberOrNull(form.milestoneId),
    linkedAdId: form.type === 'MF' ? numberOrNull(form.linkedAdId) : null
  };

  if (isEditing) {
    payload.status = form.status;
  }

  return payload;
}

export function ProductionDemandsWorkspace({
  onNavigate,
  onNotify,
  onOpenRun,
  project
}) {
  const { confirmAction } = useConfirmation();
  const [demands, setDemands] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [filters, setFilters] = useState(initialFilters);
  const [briefs, setBriefs] = useState([]);
  const [runs, setRuns] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [adOptions, setAdOptions] = useState([]);
  const [panel, setPanel] = useState(null);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setPanel(null);
    setSelectedDemand(null);
    setFilters(initialFilters);
    loadContext();
  }, [project.id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadDemands(), 180);
    return () => window.clearTimeout(timeout);
  }, [
    project.id,
    filters.q,
    filters.type,
    filters.status,
    filters.criticality,
    filters.qaOwner,
    filters.deadlineState
  ]);

  useEffect(() => {
    if (!panel) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        closePanel();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [panel]);

  async function loadContext() {
    try {
      setIsLoading(true);
      setLoadError('');
      const [nextSummary, nextBriefs, nextRuns, nextMilestones, nextAds] =
        await Promise.all([
          api.getProductionDemandSummary(project.id),
          api.listValidationBriefs(project.id),
          api.listRuns(project.id),
          api.listMilestones(project.id),
          api.listProductionDemands(project.id, { type: 'AD' })
        ]);
      setSummary(nextSummary);
      setBriefs(nextBriefs);
      setRuns(nextRuns);
      setMilestones(nextMilestones);
      setAdOptions(nextAds);
      await loadDemands();
    } catch (error) {
      setLoadError(error.message);
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDemands() {
    try {
      setLoadError('');
      const data = await api.listProductionDemands(project.id, filters);
      setDemands(data);
    } catch (error) {
      setLoadError(error.message);
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshSummaryAndOptions() {
    const [nextSummary, nextAds] = await Promise.all([
      api.getProductionDemandSummary(project.id),
      api.listProductionDemands(project.id, { type: 'AD' })
    ]);
    setSummary(nextSummary);
    setAdOptions(nextAds);
  }

  async function refreshAfterMutation(demandId, keepPanel = true) {
    await Promise.all([loadDemands(), refreshSummaryAndOptions()]);

    if (demandId && keepPanel) {
      const detail = await api.getProductionDemand(demandId);
      setSelectedDemand(detail);
      setPanel({ mode: 'detail', demandId });
    }
  }

  async function openDemand(demandId) {
    try {
      setPanel({ mode: 'loading', demandId });
      const detail = await api.getProductionDemand(demandId);
      setSelectedDemand(detail);
      setPanel({ mode: 'detail', demandId });
    } catch (error) {
      setPanel(null);
      onNotify(error.message, true);
    }
  }

  function openCreate(type = 'MF') {
    setSelectedDemand(null);
    setPanel({ mode: 'create', form: emptyDemandForm(type), error: '' });
  }

  function openEdit() {
    setPanel({
      mode: 'edit',
      demandId: selectedDemand.id,
      form: formFromDemand(selectedDemand),
      error: ''
    });
  }

  function closePanel() {
    setPanel(null);
    setSelectedDemand(null);
  }

  async function saveDemand(form) {
    const isEditing = panel.mode === 'edit';

    try {
      const saved = isEditing
        ? await api.updateProductionDemand(
            panel.demandId,
            demandPayload(form, true)
          )
        : await api.createProductionDemand(project.id, demandPayload(form, false));
      onNotify(isEditing ? 'Demanda atualizada.' : 'Demanda criada.');
      setSelectedDemand(saved);
      await refreshAfterMutation(saved.id);
    } catch (error) {
      setPanel((current) => ({ ...current, form, error: error.message }));
    }
  }

  async function deleteDemand() {
    const confirmed = await confirmAction({
      title: `Excluir ${selectedDemand.type} ${selectedDemand.code}?`,
      message: 'Todo o histórico e as anotações desta demanda também serão removidos.',
      confirmLabel: 'Excluir demanda',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteProductionDemand(selectedDemand.id);
      onNotify('Demanda excluída.');
      closePanel();
      await Promise.all([loadDemands(), refreshSummaryAndOptions()]);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function addNote(data) {
    try {
      await api.createProductionDemandNote(selectedDemand.id, data);
      onNotify('Anotação adicionada.');
      await refreshAfterMutation(selectedDemand.id);
    } catch (error) {
      onNotify(error.message, true);
      throw error;
    }
  }

  async function deleteNote(activity) {
    const confirmed = await confirmAction({
      title: 'Excluir esta anotação?',
      message: 'A anotação será removida permanentemente do histórico da demanda.',
      confirmLabel: 'Excluir anotação',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteProductionDemandNote(activity.id);
      onNotify('Anotação excluída.');
      await refreshAfterMutation(selectedDemand.id);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function closeDemand(data) {
    try {
      await api.closeProductionDemand(selectedDemand.id, data);
      onNotify(`${selectedDemand.type} encerrada.`);
      await refreshAfterMutation(selectedDemand.id);
    } catch (error) {
      setPanel((current) => ({ ...current, error: error.message, form: data }));
    }
  }

  async function reopenDemand(reason) {
    try {
      await api.reopenProductionDemand(selectedDemand.id, { reason });
      onNotify('Demanda reaberta.');
      await refreshAfterMutation(selectedDemand.id);
    } catch (error) {
      setPanel((current) => ({ ...current, error: error.message, reason }));
    }
  }

  function applySummaryFilter(kind) {
    if (kind === 'overdue') {
      setFilters({ ...initialFilters, deadlineState: 'Overdue' });
    } else if (kind === 'noDate') {
      setFilters({ ...initialFilters, deadlineState: 'NoDate' });
    } else if (kind === 'highCriticality') {
      setFilters({ ...initialFilters, type: 'AD', criticality: 'High' });
    } else {
      setFilters(initialFilters);
    }
  }

  const hasFilters = useMemo(
    () =>
      Object.entries(filters).some(
        ([key, value]) => value && value !== 'All' && !(key === 'q' && !value.trim())
      ),
    [filters]
  );

  return (
    <>
      <section className="production-demand-workspace">
        <header className="demand-command-band">
          <div>
            <span className="eyebrow">Operação de qualidade</span>
            <h2>AD e MF em produção</h2>
            <p>Prazo, impacto e histórico em uma fila única por projeto.</p>
          </div>
          <div className="demand-command-actions">
            <button className="ghost-button" type="button" onClick={() => openCreate('AD')}>
              <Plus size={16} />
              Nova AD
            </button>
            <button className="primary-button" type="button" onClick={() => openCreate('MF')}>
              <Plus size={16} />
              Novo MF
            </button>
          </div>
        </header>

        <div className="demand-summary-strip" aria-label="Resumo das demandas">
          <SummaryCell
            active={!hasFilters}
            label="Ativas"
            value={summary.active}
            onClick={() => applySummaryFilter('active')}
          />
          <SummaryCell
            active={filters.deadlineState === 'Overdue'}
            kind="danger"
            label="Atrasadas"
            value={summary.overdue}
            onClick={() => applySummaryFilter('overdue')}
          />
          <SummaryCell
            active={filters.deadlineState === 'NoDate'}
            label="Sem data"
            value={summary.noDate}
            onClick={() => applySummaryFilter('noDate')}
          />
          <SummaryCell
            active={filters.type === 'AD' && filters.criticality === 'High'}
            kind="warning"
            label="AD crítica alta"
            value={summary.highCriticality}
            onClick={() => applySummaryFilter('highCriticality')}
          />
        </div>

        <div className="demand-filter-strip">
          <label className="search-box demand-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar código, título, contato ou responsável"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
          </label>
          <FilterSelect
            label="Tipo"
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
            options={[
              ['All', 'Todos'],
              ['AD', 'AD'],
              ['MF', 'MF']
            ]}
          />
          <FilterSelect
            label="Estado"
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              ['All', 'Todos'],
              ...Object.entries(demandStatusLabels)
            ]}
          />
          <FilterSelect
            label="Prazo"
            value={filters.deadlineState}
            onChange={(value) => setFilters({ ...filters, deadlineState: value })}
            options={[
              ['All', 'Todos'],
              ...Object.entries(deadlineStateLabels)
            ]}
          />
          <FilterSelect
            label="Criticidade"
            value={filters.criticality}
            onChange={(value) => setFilters({ ...filters, criticality: value })}
            options={[
              ['All', 'Todas'],
              ...Object.entries(demandCriticalityLabels)
            ]}
          />
          {hasFilters && (
            <button
              className="plain-icon demand-clear-filters"
              type="button"
              title="Limpar filtros"
              aria-label="Limpar filtros"
              onClick={() => setFilters(initialFilters)}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        <div className="demand-owner-filter">
          <UserRound size={14} />
          <input
            aria-label="Filtrar por responsável de QA"
            placeholder="Responsável de QA"
            value={filters.qaOwner}
            onChange={(event) =>
              setFilters({ ...filters, qaOwner: event.target.value })
            }
          />
          <span>{demands.length} no recorte</span>
        </div>

        <section className="demand-ledger data-ledger" aria-label="Demandas de produção">
          <div className="demand-ledger-head" aria-hidden="true">
            <span>Demanda</span>
            <span>Estado</span>
            <span>Impacto</span>
            <span>Responsável</span>
            <span>Prazo</span>
            <span />
          </div>

          {loadError ? (
            <StatePanel
              kind="error"
              title="Não foi possível carregar as demandas"
              description={loadError}
              action={
                <button className="ghost-button" type="button" onClick={loadContext}>
                  <RefreshCw size={16} />
                  Tentar novamente
                </button>
              }
            />
          ) : isLoading ? (
            <StatePanel kind="loading" title="Carregando demandas" />
          ) : demands.length === 0 ? (
            <StatePanel
              title={hasFilters ? 'Nenhuma demanda neste recorte' : 'Nenhuma demanda registrada'}
              description={
                hasFilters
                  ? 'Ajuste os filtros para ampliar a fila.'
                  : 'Registre a primeira AD ou MF recebida do suporte.'
              }
              action={
                hasFilters ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setFilters(initialFilters)}
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <button className="ghost-button" type="button" onClick={() => openCreate('MF')}>
                    <Plus size={16} />
                    Criar demanda
                  </button>
                )
              }
            />
          ) : (
            demands.map((demand) => (
              <button
                className={`demand-ledger-row deadline-${demand.deadlineState.toLowerCase()}`}
                key={demand.id}
                type="button"
                onClick={() => openDemand(demand.id)}
              >
                <span className="demand-identity">
                  <span className={`demand-type demand-type-${demand.type.toLowerCase()}`}>
                    {demand.type}
                  </span>
                  <span>
                    <strong>{demand.code}</strong>
                    <small>{demand.title}</small>
                  </span>
                </span>
                <span className={`demand-status demand-status-${demand.status.toLowerCase()}`}>
                  {demandStatusLabels[demand.status]}
                </span>
                <span className="demand-impact">{demandImpactLabel(demand)}</span>
                <span className="demand-owner">{demand.qaOwner}</span>
                <span className="demand-deadline">
                  <strong>{formatDemandDate(demand.dueDate)}</strong>
                  <small>{demandDeadlineLabel(demand)}</small>
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            ))
          )}
        </section>
      </section>

      {panel && (
        <Inspector
          className="demand-inspector"
          modal
          title={panelTitle(panel, selectedDemand)}
          onClose={closePanel}
        >
          {panel.mode === 'loading' && (
            <StatePanel kind="loading" title="Abrindo demanda" />
          )}
          {(panel.mode === 'create' || panel.mode === 'edit') && (
            <DemandForm
              adOptions={adOptions}
              briefs={briefs}
              error={panel.error}
              form={panel.form}
              isEditing={panel.mode === 'edit'}
              milestones={milestones}
              onCancel={() =>
                panel.mode === 'edit'
                  ? setPanel({ mode: 'detail', demandId: panel.demandId })
                  : closePanel()
              }
              onSubmit={saveDemand}
              runs={runs}
            />
          )}
          {panel.mode === 'detail' && selectedDemand && (
            <DemandDetail
              demand={selectedDemand}
              onAddNote={addNote}
              onClose={() =>
                setPanel({
                  mode: 'close',
                  demandId: selectedDemand.id,
                  form: closeFormFor(selectedDemand),
                  error: ''
                })
              }
              onDelete={deleteDemand}
              onDeleteNote={deleteNote}
              onEdit={openEdit}
              onNavigate={onNavigate}
              onOpenDemand={openDemand}
              onOpenRun={onOpenRun}
              onReopen={() =>
                setPanel({
                  mode: 'reopen',
                  demandId: selectedDemand.id,
                  reason: '',
                  error: ''
                })
              }
            />
          )}
          {panel.mode === 'close' && selectedDemand && (
            <CloseDemandForm
              demand={selectedDemand}
              error={panel.error}
              form={panel.form}
              onCancel={() =>
                setPanel({ mode: 'detail', demandId: selectedDemand.id })
              }
              onSubmit={closeDemand}
            />
          )}
          {panel.mode === 'reopen' && selectedDemand && (
            <ReopenDemandForm
              demand={selectedDemand}
              error={panel.error}
              initialReason={panel.reason}
              onCancel={() =>
                setPanel({ mode: 'detail', demandId: selectedDemand.id })
              }
              onSubmit={reopenDemand}
            />
          )}
        </Inspector>
      )}
    </>
  );
}

function panelTitle(panel, demand) {
  if (panel.mode === 'create') {
    return 'Nova demanda';
  }
  if (panel.mode === 'edit') {
    return 'Editar demanda';
  }
  if (panel.mode === 'close') {
    return `Encerrar ${demand?.type || 'demanda'}`;
  }
  if (panel.mode === 'reopen') {
    return 'Reabrir demanda';
  }
  return demand ? `${demand.type} ${demand.code}` : 'Demanda';
}

function SummaryCell({ active, kind = '', label, onClick, value }) {
  return (
    <button
      className={`demand-summary-cell ${kind} ${active ? 'active' : ''}`}
      type="button"
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function FilterSelect({ label, onChange, options, value }) {
  return (
    <label className="demand-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function DemandForm({
  adOptions,
  briefs,
  error,
  form: initialForm,
  isEditing,
  milestones,
  onCancel,
  onSubmit,
  runs
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeType(type) {
    if (isEditing) {
      return;
    }

    setForm((current) => ({
      ...current,
      type,
      dueDate: '',
      criticality: type === 'AD' ? current.criticality || 'Medium' : 'Medium',
      affectedUsersCount:
        type === 'AD' ? current.affectedUsersCount || '1' : '1',
      linkedAdId: ''
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="demand-form" onSubmit={handleSubmit}>
      {error && <div className="inline-error" role="alert">{error}</div>}

      <fieldset className="demand-type-fieldset" disabled={isEditing}>
        <legend>Tipo da demanda</legend>
        <div className="segmented-control demand-type-control">
          {['MF', 'AD'].map((type) => (
            <button
              className={form.type === type ? 'active' : ''}
              key={type}
              type="button"
              aria-pressed={form.type === type}
              onClick={() => changeType(type)}
            >
              {type}
              <small>{demandTypeLabels[type]}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="demand-form-grid">
        <label className="field">
          Código
          <input
            autoFocus
            required
            maxLength={50}
            value={form.code}
            onChange={(event) => update('code', event.target.value)}
          />
        </label>
        {isEditing && (
          <label className="field">
            Estado
            <select
              value={form.status}
              onChange={(event) => update('status', event.target.value)}
            >
              {Object.entries(demandStatusLabels)
                .filter(([value]) => value !== 'Closed')
                .map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
          </label>
        )}
        <label className="field field-span-2">
          Título
          <input
            required
            minLength={3}
            maxLength={200}
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
          />
        </label>
        <label className="field field-span-2">
          Descrição
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
          />
        </label>
        <label className="field">
          Contato do suporte
          <input
            required
            value={form.supportContact}
            onChange={(event) => update('supportContact', event.target.value)}
          />
        </label>
        <label className="field">
          Responsável de QA
          <input
            required
            value={form.qaOwner}
            onChange={(event) => update('qaOwner', event.target.value)}
          />
        </label>
        <label className="field">
          Registro formal
          <input
            required
            type="date"
            value={form.registeredAt}
            onChange={(event) => update('registeredAt', event.target.value)}
          />
        </label>
        {form.type === 'AD' ? (
          <label className="field">
            Data alvo
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => update('dueDate', event.target.value)}
            />
          </label>
        ) : (
          <div className="demand-calculated-deadline">
            <CalendarClock size={16} />
            <span>
              <strong>Prazo automático</strong>
              20 dias corridos após o registro.
            </span>
          </div>
        )}
        {form.type === 'AD' && (
          <>
            <label className="field">
              Criticidade
              <select
                value={form.criticality}
                onChange={(event) => update('criticality', event.target.value)}
              >
                {Object.entries(demandCriticalityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Quantidade afetada
              <input
                required
                min={1}
                type="number"
                value={form.affectedUsersCount}
                onChange={(event) => update('affectedUsersCount', event.target.value)}
              />
            </label>
          </>
        )}
        <label className="field field-span-2">
          Link de origem
          <input
            type="url"
            placeholder="https://..."
            value={form.sourceUrl}
            onChange={(event) => update('sourceUrl', event.target.value)}
          />
        </label>
      </div>

      <section className="demand-form-section">
        <header>
          <span className="eyebrow">Contexto de qualidade</span>
          <h3>Vínculos opcionais</h3>
        </header>
        <div className="demand-form-grid">
          <RelationSelect
            label="Ficha de validação"
            value={form.validationBriefId}
            onChange={(value) => update('validationBriefId', value)}
            records={briefs}
          />
          <RelationSelect
            label="Run"
            value={form.runId}
            onChange={(value) => update('runId', value)}
            records={runs}
          />
          <RelationSelect
            label="Milestone"
            value={form.milestoneId}
            onChange={(value) => update('milestoneId', value)}
            records={milestones}
          />
          {form.type === 'MF' && (
            <RelationSelect
              label="AD definitiva"
              value={form.linkedAdId}
              onChange={(value) => update('linkedAdId', value)}
              records={adOptions}
              format={(record) => `${record.code} · ${record.title}`}
            />
          )}
        </div>
      </section>

      <div className="modal-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit">
          <CheckCircle2 size={16} />
          {isEditing ? 'Salvar alterações' : 'Criar demanda'}
        </button>
      </div>
    </form>
  );
}

function RelationSelect({ format = relatedRecordLabel, label, onChange, records, value }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Sem vínculo</option>
        {records.map((record) => (
          <option key={record.id} value={record.id}>
            {format(record)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DemandDetail({
  demand,
  onAddNote,
  onClose,
  onDelete,
  onDeleteNote,
  onEdit,
  onNavigate,
  onOpenDemand,
  onOpenRun,
  onReopen
}) {
  const [note, setNote] = useState({ content: '', author: '' });
  const [noteError, setNoteError] = useState('');
  const isClosed = demand.status === 'Closed';

  async function submitNote(event) {
    event.preventDefault();
    setNoteError('');

    try {
      await onAddNote({
        content: note.content,
        author: note.author || null
      });
      setNote({ content: '', author: note.author });
    } catch (error) {
      setNoteError(error.message);
    }
  }

  return (
    <div className="demand-detail">
      <header className="demand-detail-hero">
        <div className="demand-detail-identity">
          <span className={`demand-type demand-type-${demand.type.toLowerCase()}`}>
            {demand.type}
          </span>
          <div>
            <span className="case-id">{demand.code}</span>
            <h2>{demand.title}</h2>
          </div>
        </div>
        <div className="demand-detail-actions">
          {isClosed ? (
            <button className="ghost-button compact" type="button" onClick={onReopen}>
              <RotateCcw size={15} />
              Reabrir
            </button>
          ) : (
            <>
              <button className="ghost-button compact" type="button" onClick={onEdit}>
                <Pencil size={15} />
                Editar
              </button>
              <button className="primary-button compact" type="button" onClick={onClose}>
                <CheckCircle2 size={15} />
                Encerrar
              </button>
            </>
          )}
          {!isClosed && (
            <button
              className="icon-button danger"
              type="button"
              title="Excluir demanda"
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {isClosed && (
        <div className="demand-locked-banner">
          <CheckCircle2 size={17} />
          <span>
            <strong>Demanda encerrada</strong>
            Reabra para alterar dados ou remover este registro.
          </span>
        </div>
      )}

      <dl className="demand-facts">
        <DemandFact label="Estado" value={demandStatusLabels[demand.status]} />
        <DemandFact label="Prazo" value={`${formatDemandDate(demand.dueDate)} · ${demandDeadlineLabel(demand)}`} />
        <DemandFact label="Contato" value={demand.supportContact} />
        <DemandFact label="QA responsável" value={demand.qaOwner} />
        <DemandFact label="Registro" value={formatDemandDate(demand.registeredAt)} />
        <DemandFact label="Impacto" value={demandImpactLabel(demand)} />
      </dl>

      {demand.description && (
        <section className="demand-detail-section">
          <span className="eyebrow">Descrição</span>
          <p>{demand.description}</p>
        </section>
      )}

      {demand.sourceUrl && (
        <a className="demand-source-link" href={demand.sourceUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          Abrir origem
        </a>
      )}

      <ResolutionSection demand={demand} />

      <section className="demand-detail-section">
        <span className="eyebrow">Contexto conectado</span>
        <h3>Vínculos</h3>
        <div className="demand-link-list">
          {demand.validationBrief && (
            <LinkButton
              icon={FileCheck2}
              label="Ficha"
              value={demand.validationBrief.title}
              onClick={() => onNavigate('validations')}
            />
          )}
          {demand.run && (
            <LinkButton
              icon={Siren}
              label="Run"
              value={demand.run.name}
              onClick={() => onOpenRun(demand.run.id)}
            />
          )}
          {demand.milestone && (
            <LinkButton
              icon={CalendarClock}
              label="Milestone"
              value={demand.milestone.name}
              onClick={() => onNavigate('planning')}
            />
          )}
          {demand.linkedAd && (
            <LinkButton
              icon={Link2}
              label="AD definitiva"
              value={`${demand.linkedAd.code} · ${demand.linkedAd.title}`}
              onClick={() => onOpenDemand(demand.linkedAd.id)}
            />
          )}
          {demand.relatedMfs?.map((relatedMf) => (
            <LinkButton
              icon={Link2}
              key={relatedMf.id}
              label="MF relacionada"
              value={`${relatedMf.code} · ${relatedMf.title}`}
              onClick={() => onOpenDemand(relatedMf.id)}
            />
          ))}
          {!demand.validationBrief &&
            !demand.run &&
            !demand.milestone &&
            !demand.linkedAd &&
            !demand.relatedMfs?.length && (
              <p className="demand-muted-copy">Nenhum vínculo registrado.</p>
            )}
        </div>
      </section>

      <section className="demand-detail-section">
        <span className="eyebrow">Registro contínuo</span>
        <h3>Linha do tempo</h3>
        <form className="demand-note-form" onSubmit={submitNote}>
          {noteError && <div className="inline-error" role="alert">{noteError}</div>}
          <textarea
            required
            rows={3}
            placeholder="Adicionar observação"
            value={note.content}
            onChange={(event) => setNote({ ...note, content: event.target.value })}
          />
          <div>
            <input
              aria-label="Autor da anotação"
              placeholder="Autor (opcional)"
              value={note.author}
              onChange={(event) => setNote({ ...note, author: event.target.value })}
            />
            <button className="ghost-button compact" type="submit">
              <MessageSquarePlus size={15} />
              Adicionar
            </button>
          </div>
        </form>
        <div className="demand-timeline">
          {[...demand.activities].reverse().map((activity) => (
            <article className={`demand-activity activity-${activity.kind.toLowerCase()}`} key={activity.id}>
              <span className="demand-activity-marker" aria-hidden="true" />
              <div>
                <header>
                  <strong>{activityLabel(activity.kind)}</strong>
                  <time>{formatActivityDate(activity.createdAt)}</time>
                </header>
                <p>{activity.message}</p>
                {activity.author && <small>Por {activity.author}</small>}
              </div>
              {activity.kind === 'Note' && !isClosed && (
                <button
                  className="plain-icon danger"
                  type="button"
                  title="Excluir anotação"
                  onClick={() => onDeleteNote(activity)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function DemandFact({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ResolutionSection({ demand }) {
  if (!demand.closedAt && !demand.closureReason) {
    return null;
  }

  return (
    <section className="demand-detail-section demand-resolution">
      <span className="eyebrow">Último encerramento</span>
      <h3>{demand.type === 'MF' ? 'Solução paliativa' : 'Correção em produção'}</h3>
      <p>
        {demand.type === 'MF'
          ? demand.workaroundSummary
          : demand.resolutionSummary}
      </p>
      <dl className="demand-resolution-facts">
        <DemandFact
          label="Data"
          value={formatDemandDate(
            demand.type === 'MF'
              ? demand.workaroundDeliveredAt
              : demand.productionReleasedAt
          )}
        />
        {demand.productionVersion && (
          <DemandFact label="Versão" value={demand.productionVersion} />
        )}
        <DemandFact label="Motivo" value={demand.closureReason} />
      </dl>
    </section>
  );
}

function LinkButton({ icon: Icon, label, onClick, value }) {
  return (
    <button className="demand-link-item" type="button" onClick={onClick}>
      <Icon size={16} />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <ChevronRight size={15} />
    </button>
  );
}

function closeFormFor(demand) {
  return demand.type === 'MF'
    ? {
        workaroundSummary: demand.workaroundSummary || '',
        workaroundDeliveredAt: todayInput(),
        closureReason: ''
      }
    : {
        resolutionSummary: demand.resolutionSummary || '',
        productionVersion: demand.productionVersion || '',
        productionReleasedAt: todayInput(),
        closureReason: ''
      };
}

function CloseDemandForm({ demand, error, form: initialForm, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialForm);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      productionVersion: form.productionVersion || null
    });
  }

  return (
    <form className="demand-close-form" onSubmit={handleSubmit}>
      <div className="demand-close-intro">
        {demand.type === 'MF' ? <Siren size={20} /> : <CheckCircle2 size={20} />}
        <div>
          <span className="eyebrow">{demand.code}</span>
          <h3>
            {demand.type === 'MF'
              ? 'Confirmar solução paliativa'
              : 'Confirmar correção em produção'}
          </h3>
          <p>
            {demand.type === 'MF'
              ? 'O MF encerra quando a paliativa foi entregue e registrada.'
              : 'A AD encerra somente quando a versão corrigida chegou à produção.'}
          </p>
        </div>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {demand.type === 'MF' ? (
        <>
          <label className="field">
            Solução paliativa
            <textarea
              autoFocus
              required
              rows={5}
              value={form.workaroundSummary}
              onChange={(event) => update('workaroundSummary', event.target.value)}
            />
          </label>
          <label className="field">
            Data da entrega
            <input
              required
              type="date"
              value={form.workaroundDeliveredAt}
              onChange={(event) => update('workaroundDeliveredAt', event.target.value)}
            />
          </label>
        </>
      ) : (
        <>
          <label className="field">
            Resumo da correção
            <textarea
              autoFocus
              required
              rows={5}
              value={form.resolutionSummary}
              onChange={(event) => update('resolutionSummary', event.target.value)}
            />
          </label>
          <div className="demand-form-grid">
            <label className="field">
              Versão
              <input
                value={form.productionVersion}
                onChange={(event) => update('productionVersion', event.target.value)}
              />
            </label>
            <label className="field">
              Data em produção
              <input
                required
                type="date"
                value={form.productionReleasedAt}
                onChange={(event) => update('productionReleasedAt', event.target.value)}
              />
            </label>
          </div>
        </>
      )}
      <label className="field">
        Motivo do encerramento
        <textarea
          required
          rows={3}
          value={form.closureReason}
          onChange={(event) => update('closureReason', event.target.value)}
        />
      </label>
      <div className="modal-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit">
          <CheckCircle2 size={16} />
          Encerrar {demand.type}
        </button>
      </div>
    </form>
  );
}

function ReopenDemandForm({ demand, error, initialReason, onCancel, onSubmit }) {
  const [reason, setReason] = useState(initialReason || '');

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(reason);
  }

  return (
    <form className="demand-close-form" onSubmit={handleSubmit}>
      <div className="demand-close-intro">
        <RotateCcw size={20} />
        <div>
          <span className="eyebrow">{demand.code}</span>
          <h3>Retomar acompanhamento</h3>
          <p>O estado voltará para Em andamento e o encerramento anterior continuará no histórico.</p>
        </div>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <label className="field">
        Motivo da reabertura
        <textarea
          autoFocus
          required
          minLength={3}
          rows={5}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <div className="modal-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit">
          <RotateCcw size={16} />
          Reabrir demanda
        </button>
      </div>
    </form>
  );
}

function activityLabel(kind) {
  return {
    Created: 'Demanda criada',
    Updated: 'Dados atualizados',
    DeadlineChanged: 'Prazo atualizado',
    StatusChanged: 'Estado alterado',
    LinkChanged: 'Vínculo atualizado',
    Closed: 'Demanda encerrada',
    Reopened: 'Demanda reaberta',
    Note: 'Anotação'
  }[kind] || kind;
}

function formatActivityDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}
