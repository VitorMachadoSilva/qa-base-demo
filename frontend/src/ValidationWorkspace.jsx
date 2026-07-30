import {
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { StatePanel, StatusMark } from './components/QualityPrimitives.jsx';
import {
  FormattedText,
  RichTextEditor,
  richTextToPlainText
} from './components/RichTextEditor.jsx';
import { api } from './services/api.js';

const briefStatusLabels = {
  Draft: 'Rascunho',
  InProgress: 'Em validação',
  Blocked: 'Bloqueada',
  Completed: 'Concluída'
};

const checkStatusLabels = {
  Untested: 'Não testado',
  Passed: 'Passou',
  Failed: 'Falhou',
  Blocked: 'Bloqueado',
  Skipped: 'Ignorado'
};

const noteKindLabels = {
  Note: 'Nota',
  Question: 'Dúvida',
  Risk: 'Risco',
  Evidence: 'Evidência'
};

const emptyBriefForm = {
  title: '',
  folderId: '',
  sourceUrl: '',
  objective: '',
  scope: '',
  generalNotes: '',
  status: 'Draft'
};

export function ValidationWorkspace({ onNotify, project }) {
  const { confirmAction } = useConfirmation();
  const [folders, setFolders] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [suites, setSuites] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedBriefId, setSelectedBriefId] = useState(null);
  const [brief, setBrief] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [folderDialog, setFolderDialog] = useState(null);
  const [briefDialog, setBriefDialog] = useState(null);
  const [promotionDialog, setPromotionDialog] = useState(null);
  const [metadataForm, setMetadataForm] = useState(emptyBriefForm);
  const [criterionText, setCriterionText] = useState('');
  const [checkForm, setCheckForm] = useState({ title: '', expectedResult: '' });
  const [noteForm, setNoteForm] = useState({ kind: 'Note', content: '' });
  const [collapsedFolderIds, setCollapsedFolderIds] = useState(() => new Set());
  const [metadataSaveState, setMetadataSaveState] = useState('saved');
  const metadataFormRef = useRef(metadataForm);
  const metadataSaveTimerRef = useRef(null);
  const metadataSaveSequenceRef = useRef(0);
  const lastSavedMetadataRef = useRef('');
  const briefRef = useRef(brief);

  const orderedFolders = useMemo(() => flattenFolders(folders), [folders]);
  const visibleFolders = useMemo(
    () => flattenFolders(folders, collapsedFolderIds),
    [folders, collapsedFolderIds]
  );
  const selectedFolderRecord =
    folders.find((folder) => folder.id === Number(selectedFolder)) || null;
  const blockedFolderIds = folderDialog?.folder
    ? getDescendantIds(folders, folderDialog.folder.id)
    : new Set();

  useEffect(() => {
    loadStructure();
  }, [project.id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadBriefs(), 160);
    return () => window.clearTimeout(timeout);
  }, [project.id, query, selectedFolder, status]);

  useEffect(() => {
    if (!selectedBriefId) {
      setBrief(null);
      return;
    }

    loadBrief(selectedBriefId);
  }, [selectedBriefId]);

  useEffect(() => {
    briefRef.current = brief;
  }, [brief]);

  useEffect(() => {
    if (!brief?.id) {
      setMetadataForm(emptyBriefForm);
      metadataFormRef.current = emptyBriefForm;
      lastSavedMetadataRef.current = '';
      return;
    }

    const nextForm = {
      title: brief.title,
      folderId: brief.folderId || '',
      sourceUrl: brief.sourceUrl || '',
      objective: brief.objective || '',
      scope: brief.scope || '',
      generalNotes: brief.generalNotes || '',
      status: brief.status
    };
    setMetadataForm(nextForm);
    metadataFormRef.current = nextForm;
    lastSavedMetadataRef.current = JSON.stringify(metadataPayload(nextForm));
    setMetadataSaveState('saved');
  }, [brief?.id]);

  useEffect(() => {
    metadataFormRef.current = metadataForm;
    if (!brief?.id) return undefined;

    const serialized = JSON.stringify(metadataPayload(metadataForm));
    if (serialized === lastSavedMetadataRef.current) {
      setMetadataSaveState('saved');
      return undefined;
    }

    setMetadataSaveState('dirty');
    window.clearTimeout(metadataSaveTimerRef.current);
    metadataSaveTimerRef.current = window.setTimeout(() => {
      persistMetadata();
    }, 900);

    return () => window.clearTimeout(metadataSaveTimerRef.current);
  }, [metadataForm, brief?.id]);

  async function loadStructure() {
    try {
      const [folderData, suiteData] = await Promise.all([
        api.listValidationFolders(project.id),
        api.listSuites(project.id)
      ]);
      setFolders(folderData);
      setSuites(suiteData);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function loadBriefs(preferredBriefId) {
    try {
      setIsLoading(true);
      const data = await api.listValidationBriefs(project.id, {
        q: query.trim(),
        folderId: selectedFolder === 'all' ? '' : selectedFolder,
        status
      });
      setBriefs(data);
      setSelectedBriefId((currentId) => {
        const nextId = preferredBriefId || currentId;
        return data.some((item) => item.id === nextId) ? nextId : data[0]?.id || null;
      });
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBrief(id) {
    try {
      setIsLoadingBrief(true);
      setBrief(await api.getValidationBrief(id));
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoadingBrief(false);
    }
  }

  async function refresh(preferredBriefId = selectedBriefId) {
    await Promise.all([loadStructure(), loadBriefs(preferredBriefId)]);

    if (preferredBriefId) {
      await loadBrief(preferredBriefId);
    }
  }

  function applyBriefUpdate(updatedBrief) {
    briefRef.current = updatedBrief;
    setBrief(updatedBrief);
    setBriefs((current) =>
      current.map((item) =>
        item.id === updatedBrief.id
          ? {
              ...item,
              title: updatedBrief.title,
              folderId: updatedBrief.folderId,
              folder: updatedBrief.folder,
              sourceUrl: updatedBrief.sourceUrl,
              status: updatedBrief.status,
              summary: updatedBrief.summary
            }
          : item
      )
    );
  }

  function updateBriefContent(updater) {
    if (!briefRef.current) return;
    const updated = updater(briefRef.current);
    const summarized = { ...updated, summary: summarizeBrief(updated) };
    briefRef.current = summarized;
    setBrief(summarized);
    setBriefs((items) =>
      items.map((item) =>
        item.id === summarized.id
          ? { ...item, status: summarized.status, summary: summarized.summary }
          : item
      )
    );
  }

  async function persistMetadata({ notify = false } = {}) {
    if (!brief?.id) return;

    window.clearTimeout(metadataSaveTimerRef.current);
    const payload = metadataPayload(metadataFormRef.current);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedMetadataRef.current) {
      setMetadataSaveState('saved');
      return;
    }

    const sequence = ++metadataSaveSequenceRef.current;
    setMetadataSaveState('saving');

    try {
      const updated = await api.updateValidationBrief(brief.id, payload);
      if (sequence !== metadataSaveSequenceRef.current) return;

      lastSavedMetadataRef.current = serialized;
      applyBriefUpdate(updated);
      setMetadataSaveState(
        JSON.stringify(metadataPayload(metadataFormRef.current)) === serialized
          ? 'saved'
          : 'dirty'
      );
      if (notify) onNotify('Ficha atualizada.');
    } catch (error) {
      if (sequence === metadataSaveSequenceRef.current) {
        setMetadataSaveState('error');
      }
      onNotify(error.message, true);
    }
  }

  function openCreateFolder(parentId = selectedFolderRecord?.id || null) {
    setFolderDialog({
      folder: null,
      form: { name: '', parentId }
    });
  }

  function openEditFolder(folder) {
    setFolderDialog({
      folder,
      form: { name: folder.name, parentId: folder.parentId || null }
    });
  }

  function toggleFolder(folderId) {
    setCollapsedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  async function handleFolderSubmit(event) {
    event.preventDefault();

    try {
      if (folderDialog.folder) {
        await api.updateValidationFolder(folderDialog.folder.id, folderDialog.form);
        onNotify('Pasta atualizada.');
      } else {
        const created = await api.createValidationFolder(project.id, folderDialog.form);
        setSelectedFolder(String(created.id));
        onNotify('Pasta criada.');
      }

      setFolderDialog(null);
      await loadStructure();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleDeleteFolder(folder) {
    const confirmed = await confirmAction({
      title: `Excluir a pasta ${folder.name}?`,
      message:
        'As subpastas também serão removidas. As fichas serão preservadas em "Sem pasta".',
      confirmLabel: 'Excluir pasta',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteValidationFolder(folder.id);
      setSelectedFolder('all');
      onNotify('Pasta excluída; as fichas foram preservadas.');
      await refresh();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  function openCreateBrief() {
    setBriefDialog({
      form: {
        ...emptyBriefForm,
        folderId: selectedFolderRecord?.id || ''
      }
    });
  }

  async function handleBriefCreate(event) {
    event.preventDefault();

    try {
      const created = await api.createValidationBrief(project.id, {
        ...briefDialog.form,
        folderId: briefDialog.form.folderId ? Number(briefDialog.form.folderId) : null,
        criteria: [],
        checks: []
      });
      setBriefDialog(null);
      setSelectedFolder('all');
      onNotify('Ficha de validação criada.');
      await loadBriefs(created.id);
      setSelectedBriefId(created.id);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleMetadataSubmit(event) {
    event.preventDefault();
    await persistMetadata({ notify: true });
  }

  async function handleDeleteBrief() {
    const confirmed = await confirmAction({
      title: `Excluir a ficha ${brief.title}?`,
      message: 'Objetivos, critérios, testes e anotações desta ficha serão removidos.',
      confirmLabel: 'Excluir ficha',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteValidationBrief(brief.id);
      onNotify('Ficha excluída.');
      setBrief(null);
      setSelectedBriefId(null);
      await loadBriefs();
      await loadStructure();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleCriterionCreate(event) {
    event.preventDefault();

    try {
      const created = await api.createValidationCriterion(brief.id, {
        text: criterionText
      });
      setCriterionText('');
      updateBriefContent((current) => ({
        ...current,
        criteria: [...current.criteria, created].sort(
          (left, right) => left.position - right.position
        )
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function toggleCriterion(criterion) {
    try {
      const updated = await api.updateValidationCriterion(criterion.id, {
        text: criterion.text,
        isMet: !criterion.isMet
      });
      updateBriefContent((current) => ({
        ...current,
        criteria: current.criteria.map((item) =>
          item.id === updated.id ? updated : item
        )
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteCriterion(criterion) {
    try {
      await api.deleteValidationCriterion(criterion.id);
      updateBriefContent((current) => ({
        ...current,
        criteria: current.criteria.filter((item) => item.id !== criterion.id)
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleCheckCreate(event) {
    event.preventDefault();

    try {
      const created = await api.createValidationCheck(brief.id, checkForm);
      setCheckForm({ title: '', expectedResult: '' });
      onNotify('Teste adicionado à ficha.');
      updateBriefContent((current) => ({
        ...current,
        checks: [...current.checks, created].sort(
          (left, right) => left.position - right.position
        )
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function updateCheck(check, form) {
    try {
      const updated = await api.updateValidationCheck(check.id, form);
      onNotify('Resultado registrado.');
      updateBriefContent((current) => ({
        ...current,
        checks: current.checks.map((item) =>
          item.id === updated.id ? updated : item
        )
      }));
      return updated;
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteCheck(check) {
    const confirmed = await confirmAction({
      title: `Remover o teste ${check.title}?`,
      message: 'Este teste será removido da ficha de validação.',
      confirmLabel: 'Remover teste',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteValidationCheck(check.id);
      updateBriefContent((current) => ({
        ...current,
        checks: current.checks.filter((item) => item.id !== check.id)
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleNoteCreate(event) {
    event.preventDefault();
    if (!richTextToPlainText(noteForm.content)) {
      onNotify('Escreva o conteúdo da anotação.', true);
      return;
    }

    try {
      const created = await api.createValidationNote(brief.id, noteForm);
      setNoteForm({ kind: 'Note', content: '' });
      updateBriefContent((current) => ({
        ...current,
        notes: [created, ...current.notes]
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteNote(note) {
    try {
      await api.deleteValidationNote(note.id);
      updateBriefContent((current) => ({
        ...current,
        notes: current.notes.filter((item) => item.id !== note.id)
      }));
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handlePromotion(event) {
    event.preventDefault();

    try {
      await api.promoteValidationCheck(promotionDialog.check.id, {
        ...promotionDialog.form,
        suiteId: Number(promotionDialog.form.suiteId)
      });
      setPromotionDialog(null);
      onNotify('Teste promovido para o repositório.');
      await refresh(brief.id);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  return (
    <div className="validation-workspace">
      <aside className="validation-folders">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Organização livre</span>
            <h2>Pastas</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            title="Criar pasta"
            onClick={() => openCreateFolder()}
          >
            <FolderPlus size={17} />
          </button>
        </div>

        <nav className="validation-folder-list" aria-label="Pastas de validação">
          <FolderFilter
            active={selectedFolder === 'all'}
            icon={Archive}
            label="Todas as fichas"
            onClick={() => setSelectedFolder('all')}
          />
          <FolderFilter
            active={selectedFolder === 'unfiled'}
            icon={FolderOpen}
            label="Sem pasta"
            onClick={() => setSelectedFolder('unfiled')}
          />
          {visibleFolders.map(({ folder, depth }) => (
            <div
              className={`validation-folder-row ${
                selectedFolder === String(folder.id) ? 'active' : ''
              }`}
              key={folder.id}
              style={{ '--folder-depth': depth }}
            >
              {folder._count?.children > 0 ? (
                <button
                  aria-label={
                    collapsedFolderIds.has(folder.id)
                      ? `Expandir ${folder.name}`
                      : `Recolher ${folder.name}`
                  }
                  aria-expanded={!collapsedFolderIds.has(folder.id)}
                  className={`validation-folder-toggle ${
                    collapsedFolderIds.has(folder.id) ? 'collapsed' : ''
                  }`}
                  type="button"
                  title={
                    collapsedFolderIds.has(folder.id)
                      ? 'Expandir subpastas'
                      : 'Recolher subpastas'
                  }
                  onClick={() => toggleFolder(folder.id)}
                >
                  <ChevronRight size={13} />
                </button>
              ) : (
                <span className="validation-folder-toggle-spacer" />
              )}
              <button
                className="validation-folder-select"
                type="button"
                onClick={() => setSelectedFolder(String(folder.id))}
              >
                <Folder size={16} />
                <span>
                  <strong>{folder.name}</strong>
                  <small>{folder._count?.briefs || 0}</small>
                </span>
              </button>
              <div>
                <button
                  className="plain-icon"
                  type="button"
                  title="Criar subpasta"
                  onClick={() => openCreateFolder(folder.id)}
                >
                  <FolderPlus size={13} />
                </button>
                <button
                  className="plain-icon"
                  type="button"
                  title="Editar pasta"
                  onClick={() => openEditFolder(folder)}
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="plain-icon danger"
                  type="button"
                  title="Excluir pasta"
                  onClick={() => handleDeleteFolder(folder)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <section className="validation-ledger">
        <header className="validation-ledger-header">
          <div>
            <span className="eyebrow">Trabalho em foco</span>
            <h2>{selectedFolderRecord?.name || 'Fichas de validação'}</h2>
          </div>
          <button className="primary-button" type="button" onClick={openCreateBrief}>
            <Plus size={17} />
            Nova ficha
          </button>
        </header>

        <div className="validation-filters">
          <label className="search-box">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar ficha"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="All">Todos os status</option>
            {Object.entries(briefStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="validation-brief-list">
          {isLoading ? (
            <StatePanel kind="loading" title="Carregando fichas" />
          ) : briefs.length === 0 ? (
            <StatePanel
              title="Nenhuma ficha neste recorte"
              description="Crie uma ficha para organizar a próxima validação."
              action={
                <button className="ghost-button" type="button" onClick={openCreateBrief}>
                  <Plus size={16} />
                  Criar ficha
                </button>
              }
            />
          ) : (
            briefs.map((item) => (
              <button
                className={`validation-brief-item ${
                  item.id === selectedBriefId ? 'active' : ''
                }`}
                key={item.id}
                type="button"
                onClick={() => setSelectedBriefId(item.id)}
              >
                <span className={`brief-state brief-state-${item.status.toLowerCase()}`}>
                  {briefStatusLabels[item.status]}
                </span>
                <strong>{item.title}</strong>
                <span className="validation-brief-meta">
                  {item.folder?.name || 'Sem pasta'}
                  <span>{item.summary.progressPercentage}% executado</span>
                </span>
                <span className="brief-progress" aria-hidden="true">
                  <span style={{ width: `${item.summary.progressPercentage}%` }} />
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="validation-detail">
        {!selectedBriefId ? (
          <StatePanel
            title="Selecione uma ficha"
            description="Objetivos, critérios, testes e notas aparecem aqui."
          />
        ) : isLoadingBrief || !brief ? (
          <StatePanel kind="loading" title="Abrindo ficha" />
        ) : (
          <>
            <header className="validation-detail-header">
              <div>
                <span className="case-id">VAL-{brief.id}</span>
                <h2>{brief.title}</h2>
                <div className="validation-detail-summary">
                  <span>{brief.summary.criteriaMet}/{brief.summary.criteriaTotal} critérios</span>
                  <span>{brief.summary.executed}/{brief.summary.checksTotal} testes executados</span>
                  {brief.sourceUrl && (
                    <a href={brief.sourceUrl} target="_blank" rel="noreferrer">
                      <Link2 size={14} />
                      Abrir card
                    </a>
                  )}
                </div>
              </div>
              <button
                className="icon-button danger"
                type="button"
                title="Excluir ficha"
                onClick={handleDeleteBrief}
              >
                <Trash2 size={16} />
              </button>
            </header>

            <form className="validation-section brief-metadata" onSubmit={handleMetadataSubmit}>
              <div className="validation-section-heading">
                <div>
                  <span className="eyebrow">Contexto</span>
                  <h3>Intenção da validação</h3>
                </div>
                <button
                  className={`ghost-button compact autosave-state state-${metadataSaveState}`}
                  disabled={metadataSaveState === 'saving'}
                  type="submit"
                >
                  {metadataSaveState === 'saving' ? (
                    <LoaderCircle className="spin" size={15} />
                  ) : (
                    <Check size={15} />
                  )}
                  {metadataSaveState === 'saving'
                    ? 'Salvando'
                    : metadataSaveState === 'saved'
                      ? 'Salvo'
                      : metadataSaveState === 'error'
                        ? 'Tentar novamente'
                        : 'Salvar agora'}
                </button>
              </div>
              <div className="form-grid">
                <label className="field field-span-2">
                  Título
                  <input
                    required
                    minLength={3}
                    value={metadataForm.title}
                    onChange={(event) =>
                      setMetadataForm({ ...metadataForm, title: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  Status
                  <select
                    value={metadataForm.status}
                    onChange={(event) =>
                      setMetadataForm({ ...metadataForm, status: event.target.value })
                    }
                  >
                    {Object.entries(briefStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Pasta
                  <select
                    value={metadataForm.folderId}
                    onChange={(event) =>
                      setMetadataForm({ ...metadataForm, folderId: event.target.value })
                    }
                  >
                    <option value="">Sem pasta</option>
                    {orderedFolders.map(({ folder, depth }) => (
                      <option key={folder.id} value={folder.id}>
                        {'  '.repeat(depth)}
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field field-span-2">
                  Link do card
                  <input
                    type="url"
                    placeholder="https://..."
                    value={metadataForm.sourceUrl}
                    onChange={(event) =>
                      setMetadataForm({ ...metadataForm, sourceUrl: event.target.value })
                    }
                  />
                </label>
                <RichTextEditor
                  label="Objetivo"
                  minHeight={88}
                  value={metadataForm.objective}
                  onChange={(objective) =>
                    setMetadataForm((current) => ({ ...current, objective }))
                  }
                />
                <RichTextEditor
                  label="Escopo"
                  minHeight={88}
                  value={metadataForm.scope}
                  onChange={(scope) =>
                    setMetadataForm((current) => ({ ...current, scope }))
                  }
                />
                <RichTextEditor
                  fieldClassName="field-span-2"
                  label="Notas gerais"
                  minHeight={88}
                  value={metadataForm.generalNotes}
                  onChange={(generalNotes) =>
                    setMetadataForm((current) => ({ ...current, generalNotes }))
                  }
                />
              </div>
            </form>

            <section className="validation-section">
              <div className="validation-section-heading">
                <div>
                  <span className="eyebrow">Condições</span>
                  <h3>Critérios de aceite</h3>
                </div>
                <span className="section-counter">
                  {brief.summary.criteriaMet}/{brief.summary.criteriaTotal}
                </span>
              </div>
              <div className="criterion-list">
                {brief.criteria.map((criterion) => (
                  <div className={`criterion-item ${criterion.isMet ? 'met' : ''}`} key={criterion.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={criterion.isMet}
                        onChange={() => toggleCriterion(criterion)}
                      />
                      <span>{criterion.text}</span>
                    </label>
                    <button
                      className="plain-icon danger"
                      type="button"
                      title="Remover critério"
                      onClick={() => deleteCriterion(criterion)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <form className="inline-create" onSubmit={handleCriterionCreate}>
                <input
                  required
                  placeholder="Adicionar critério de aceite"
                  value={criterionText}
                  onChange={(event) => setCriterionText(event.target.value)}
                />
                <button className="icon-button" type="submit" title="Adicionar critério">
                  <Plus size={16} />
                </button>
              </form>
            </section>

            <section className="validation-section">
              <div className="validation-section-heading">
                <div>
                  <span className="eyebrow">Checklist executável</span>
                  <h3>Testes da ficha</h3>
                </div>
                <span className="section-counter">{brief.summary.progressPercentage}%</span>
              </div>
              <div className="validation-check-list">
                {brief.checks.map((check) => (
                  <ValidationCheck
                    check={check}
                    key={check.id}
                    onDelete={() => deleteCheck(check)}
                    onPromote={() =>
                      setPromotionDialog({
                        check,
                        form: {
                          suiteId: suites[0]?.id || '',
                          title: check.title,
                          expectedResult: check.expectedResult
                        }
                      })
                    }
                    onSave={(form) => updateCheck(check, form)}
                  />
                ))}
              </div>
              <form className="check-create" onSubmit={handleCheckCreate}>
                <label className="field">
                  Novo teste
                  <input
                    required
                    placeholder="O que será verificado?"
                    value={checkForm.title}
                    onChange={(event) =>
                      setCheckForm({ ...checkForm, title: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  Resultado esperado
                  <input
                    required
                    placeholder="Qual comportamento confirma o sucesso?"
                    value={checkForm.expectedResult}
                    onChange={(event) =>
                      setCheckForm({ ...checkForm, expectedResult: event.target.value })
                    }
                  />
                </label>
                <button className="ghost-button" type="submit">
                  <Plus size={16} />
                  Adicionar teste
                </button>
              </form>
            </section>

            <section className="validation-section">
              <div className="validation-section-heading">
                <div>
                  <span className="eyebrow">Registro contínuo</span>
                  <h3>Anotações</h3>
                </div>
                <span className="section-counter">{brief.notes.length}</span>
              </div>
              <form className="note-create" onSubmit={handleNoteCreate}>
                <select
                  aria-label="Tipo da anotação"
                  value={noteForm.kind}
                  onChange={(event) =>
                    setNoteForm({ ...noteForm, kind: event.target.value })
                  }
                >
                  {Object.entries(noteKindLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <RichTextEditor
                  ariaLabel="Conteúdo da anotação"
                  minHeight={70}
                  placeholder="Registre uma descoberta, dúvida, risco ou evidência..."
                  value={noteForm.content}
                  onChange={(content) =>
                    setNoteForm((current) => ({ ...current, content }))
                  }
                />
                <button className="icon-button" type="submit" title="Adicionar anotação">
                  <Plus size={16} />
                </button>
              </form>
              <div className="validation-note-list">
                {brief.notes.map((note) => (
                  <article className={`validation-note note-${note.kind.toLowerCase()}`} key={note.id}>
                    <header>
                      <strong>{noteKindLabels[note.kind]}</strong>
                      <time>{formatDateTime(note.createdAt)}</time>
                      <button
                        className="plain-icon danger"
                        type="button"
                        title="Excluir anotação"
                        onClick={() => deleteNote(note)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </header>
                    <FormattedText value={note.content} />
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </section>

      {folderDialog && (
        <Dialog
          title={folderDialog.folder ? 'Editar pasta' : 'Nova pasta'}
          onClose={() => setFolderDialog(null)}
        >
          <form onSubmit={handleFolderSubmit}>
            <label className="field">
              Nome
              <input
                autoFocus
                required
                minLength={2}
                value={folderDialog.form.name}
                onChange={(event) =>
                  setFolderDialog({
                    ...folderDialog,
                    form: { ...folderDialog.form, name: event.target.value }
                  })
                }
              />
            </label>
            <label className="field">
              Pasta pai
              <select
                value={folderDialog.form.parentId || ''}
                onChange={(event) =>
                  setFolderDialog({
                    ...folderDialog,
                    form: {
                      ...folderDialog.form,
                      parentId: event.target.value ? Number(event.target.value) : null
                    }
                  })
                }
              >
                <option value="">Raiz do projeto</option>
                {orderedFolders
                  .filter(
                    ({ folder }) =>
                      folder.id !== folderDialog.folder?.id &&
                      !blockedFolderIds.has(folder.id)
                  )
                  .map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {'  '.repeat(depth)}
                      {folder.name}
                    </option>
                  ))}
              </select>
            </label>
            <DialogActions onCancel={() => setFolderDialog(null)} />
          </form>
        </Dialog>
      )}

      {briefDialog && (
        <Dialog title="Nova ficha de validação" onClose={() => setBriefDialog(null)} wide>
          <form onSubmit={handleBriefCreate}>
            <div className="form-grid">
              <label className="field field-span-2">
                Título
                <input
                  autoFocus
                  required
                  minLength={3}
                  placeholder="Ex.: Validar recuperação de senha"
                  value={briefDialog.form.title}
                  onChange={(event) =>
                    setBriefDialog({
                      form: { ...briefDialog.form, title: event.target.value }
                    })
                  }
                />
              </label>
              <label className="field">
                Pasta
                <select
                  value={briefDialog.form.folderId}
                  onChange={(event) =>
                    setBriefDialog({
                      form: { ...briefDialog.form, folderId: event.target.value }
                    })
                  }
                >
                  <option value="">Sem pasta</option>
                  {orderedFolders.map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {'  '.repeat(depth)}
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Link do card
                <input
                  type="url"
                  placeholder="https://..."
                  value={briefDialog.form.sourceUrl}
                  onChange={(event) =>
                    setBriefDialog({
                      form: { ...briefDialog.form, sourceUrl: event.target.value }
                    })
                  }
                />
              </label>
              <label className="field">
                Objetivo
                <textarea
                  rows={4}
                  placeholder="Qual risco ou mudança precisa ser validada?"
                  value={briefDialog.form.objective}
                  onChange={(event) =>
                    setBriefDialog({
                      form: { ...briefDialog.form, objective: event.target.value }
                    })
                  }
                />
              </label>
              <label className="field">
                Escopo
                <textarea
                  rows={4}
                  placeholder="O que está dentro e fora desta validação?"
                  value={briefDialog.form.scope}
                  onChange={(event) =>
                    setBriefDialog({
                      form: { ...briefDialog.form, scope: event.target.value }
                    })
                  }
                />
              </label>
            </div>
            <DialogActions onCancel={() => setBriefDialog(null)} label="Criar ficha" />
          </form>
        </Dialog>
      )}

      {promotionDialog && (
        <Dialog title="Promover para caso reutilizável" onClose={() => setPromotionDialog(null)}>
          {suites.length === 0 ? (
            <StatePanel
              title="Crie uma suíte primeiro"
              description="O caso reutilizável precisa de uma suíte no repositório."
            />
          ) : (
            <form onSubmit={handlePromotion}>
              <label className="field">
                Suíte de destino
                <select
                  required
                  value={promotionDialog.form.suiteId}
                  onChange={(event) =>
                    setPromotionDialog({
                      ...promotionDialog,
                      form: { ...promotionDialog.form, suiteId: event.target.value }
                    })
                  }
                >
                  {suites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {getFolderPath(suites, suite.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Título do caso
                <input
                  required
                  minLength={5}
                  value={promotionDialog.form.title}
                  onChange={(event) =>
                    setPromotionDialog({
                      ...promotionDialog,
                      form: { ...promotionDialog.form, title: event.target.value }
                    })
                  }
                />
              </label>
              <label className="field">
                Resultado esperado
                <textarea
                  required
                  rows={3}
                  value={promotionDialog.form.expectedResult}
                  onChange={(event) =>
                    setPromotionDialog({
                      ...promotionDialog,
                      form: {
                        ...promotionDialog.form,
                        expectedResult: event.target.value
                      }
                    })
                  }
                />
              </label>
              <DialogActions
                onCancel={() => setPromotionDialog(null)}
                label="Promover teste"
              />
            </form>
          )}
        </Dialog>
      )}
    </div>
  );
}

function ValidationCheck({ check, onDelete, onPromote, onSave }) {
  const [form, setForm] = useState({
    title: check.title,
    expectedResult: check.expectedResult,
    actualResult: check.actualResult || '',
    notes: check.notes || '',
    status: check.status
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: check.title,
      expectedResult: check.expectedResult,
      actualResult: check.actualResult || '',
      notes: check.notes || '',
      status: check.status
    });
  }, [check]);

  async function save(nextForm = form) {
    if (isSaving) return;
    setIsSaving(true);
    await onSave(nextForm);
    setIsSaving(false);
  }

  return (
    <details className={`validation-check check-${check.status.toLowerCase()}`}>
      <summary>
        <StatusMark
          label={checkStatusLabels[check.status]}
          state={check.status.toLowerCase()}
        />
        <span>
          <strong>{check.title}</strong>
          <FormattedText className="validation-check-preview" value={check.expectedResult} />
        </span>
        {check.testCase && (
          <span className="promoted-mark" title={`Caso TC-${check.testCase.id}`}>
            <Sparkles size={13} />
            TC-{check.testCase.id}
          </span>
        )}
      </summary>
      <form
        className="validation-check-editor"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="field">
          Status
          <select
            value={form.status}
            disabled={isSaving}
            onChange={(event) => {
              const nextForm = { ...form, status: event.target.value };
              setForm(nextForm);
              save(nextForm);
            }}
          >
            {Object.entries(checkStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Teste
          <input
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </label>
        <RichTextEditor
          fieldClassName="field-span-2"
          label="Resultado esperado"
          minHeight={72}
          value={form.expectedResult}
          onChange={(expectedResult) =>
            setForm((current) => ({ ...current, expectedResult }))
          }
        />
        <RichTextEditor
          label="Resultado observado"
          minHeight={88}
          value={form.actualResult}
          onChange={(actualResult) =>
            setForm((current) => ({ ...current, actualResult }))
          }
        />
        <RichTextEditor
          label="Notas da execução"
          minHeight={88}
          value={form.notes}
          onChange={(notes) => setForm((current) => ({ ...current, notes }))}
        />
        <div className="validation-check-actions">
          <button
            className="ghost-button"
            type="button"
            disabled={Boolean(check.testCase)}
            onClick={onPromote}
          >
            {check.testCase ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
            {check.testCase ? 'No repositório' : 'Promover'}
          </button>
          <button className="icon-button danger" type="button" title="Remover teste" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
            {isSaving ? 'Salvando' : 'Registrar'}
          </button>
        </div>
      </form>
    </details>
  );
}

function FolderFilter({ active, icon: Icon, label, onClick }) {
  return (
    <button
      className={`validation-folder-filter ${active ? 'active' : ''}`}
      type="button"
      onClick={onClick}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

function Dialog({ children, onClose, title, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`modal ${wide ? 'modal-large' : ''}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" title="Fechar" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function DialogActions({ label = 'Salvar', onCancel }) {
  return (
    <div className="modal-actions">
      <button className="ghost-button" type="button" onClick={onCancel}>
        Cancelar
      </button>
      <button className="primary-button" type="submit">
        {label}
      </button>
    </div>
  );
}

function flattenFolders(folders, collapsedIds = new Set()) {
  const result = [];

  function visit(parentId, depth) {
    folders
      .filter((folder) => (folder.parentId || null) === parentId)
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      .forEach((folder) => {
        result.push({ folder, depth });
        if (!collapsedIds.has(folder.id)) {
          visit(folder.id, depth + 1);
        }
      });
  }

  visit(null, 0);
  return result;
}

function getFolderPath(items, itemId) {
  const path = [];
  let current = items.find((item) => item.id === itemId);

  while (current) {
    path.unshift(current.name);
    current = items.find((item) => item.id === current.parentId);
  }

  return path.join(' / ');
}

function getDescendantIds(items, itemId) {
  const descendants = new Set();
  const pending = [itemId];

  while (pending.length) {
    const parentId = pending.shift();

    items
      .filter((item) => item.parentId === parentId)
      .forEach((item) => {
        descendants.add(item.id);
        pending.push(item.id);
      });
  }

  return descendants;
}

function metadataPayload(form) {
  return {
    ...form,
    folderId: form.folderId ? Number(form.folderId) : null
  };
}

function summarizeBrief(brief) {
  const criteria = brief.criteria || [];
  const checks = brief.checks || [];
  const summary = {
    criteriaTotal: criteria.length,
    criteriaMet: criteria.filter((criterion) => criterion.isMet).length,
    checksTotal: checks.length,
    executed: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: 0,
    progressPercentage: 0
  };

  checks.forEach((check) => {
    const key = check.status.toLowerCase();
    if (key in summary) summary[key] += 1;
  });

  summary.executed = summary.checksTotal - summary.untested;
  summary.progressPercentage = summary.checksTotal
    ? Math.round((summary.executed / summary.checksTotal) * 100)
    : 0;
  return summary;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}
