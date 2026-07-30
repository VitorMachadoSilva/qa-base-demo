import {
  ArrowDown,
  ArrowUp,
  CheckSquare2,
  ChevronRight,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Tags,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { Inspector } from './components/QualityPrimitives.jsx';
import { RunDialog } from './RunDialog.jsx';
import { api } from './services/api.js';

const emptySuiteForm = { name: '', description: '', parentId: null };
const emptyStep = { action: '', expectedResult: '' };
const emptyCaseForm = {
  title: '',
  preconditions: '',
  testSteps: [emptyStep],
  suiteId: null,
  priority: 'Medium',
  type: 'Functional',
  severity: 'Normal',
  automationStatus: 'Manual',
  componentIds: []
};

const priorityLabels = {
  Low: 'Baixa',
  Medium: 'Média',
  High: 'Alta',
  Critical: 'Crítica'
};

const typeLabels = {
  Functional: 'Funcional',
  Regression: 'Regressão',
  Smoke: 'Smoke',
  Exploratory: 'Exploratório',
  Integration: 'Integração',
  EndToEnd: 'Ponta a ponta',
  Performance: 'Performance',
  Security: 'Segurança',
  Usability: 'Usabilidade',
  Accessibility: 'Acessibilidade'
};

const severityLabels = {
  Low: 'Baixa',
  Normal: 'Normal',
  High: 'Alta',
  Critical: 'Crítica'
};

const automationLabels = {
  Manual: 'Manual',
  ToAutomate: 'A automatizar',
  Automated: 'Automatizado'
};

export function TestRepository({ project, onNotify, onRunCreated }) {
  const { confirmAction, requestText } = useConfirmation();
  const [suites, setSuites] = useState([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [components, setComponents] = useState([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  const [type, setType] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [automationStatus, setAutomationStatus] = useState('All');
  const [componentId, setComponentId] = useState('All');
  const [isLoadingSuites, setIsLoadingSuites] = useState(true);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [suiteDialog, setSuiteDialog] = useState(null);
  const [caseDialog, setCaseDialog] = useState(null);
  const [componentDialog, setComponentDialog] = useState(false);
  const [runDialog, setRunDialog] = useState(null);
  const [collapsedSuiteIds, setCollapsedSuiteIds] = useState(() => new Set());

  const selectedSuite = suites.find((suite) => suite.id === selectedSuiteId) || null;
  const suitesByParent = useMemo(() => groupSuitesByParent(suites), [suites]);
  const allVisibleSelected =
    testCases.length > 0 && testCases.every((testCase) => selectedCaseIds.includes(testCase.id));

  useEffect(() => {
    loadSuites();
  }, [project.id]);

  useEffect(() => {
    if (!selectedSuiteId) {
      setTestCases([]);
      return;
    }

    const timeout = window.setTimeout(() => loadCases(), 180);
    return () => window.clearTimeout(timeout);
  }, [
    automationStatus,
    componentId,
    priority,
    project.id,
    query,
    selectedSuiteId,
    severity,
    type
  ]);

  async function loadSuites(preferredSuiteId) {
    try {
      setIsLoadingSuites(true);
      const [data, componentData] = await Promise.all([
        api.listSuites(project.id),
        api.listTestComponents(project.id)
      ]);
      setSuites(data);
      setComponents(componentData);
      setSelectedSuiteId((currentId) => {
        const nextId = preferredSuiteId || currentId;
        return data.some((suite) => suite.id === nextId) ? nextId : data[0]?.id || null;
      });
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoadingSuites(false);
    }
  }

  async function loadCases() {
    try {
      setIsLoadingCases(true);
      const data = await api.listProjectTestCases(project.id, {
        q: query.trim(),
        suiteId: selectedSuiteId,
        priority,
        type,
        severity,
        automationStatus,
        componentId
      });
      setTestCases(data);
      setSelectedCaseIds((currentIds) =>
        currentIds.filter((id) => data.some((testCase) => testCase.id === id))
      );
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoadingCases(false);
    }
  }

  async function handleSuiteSubmit(event) {
    event.preventDefault();

    try {
      if (suiteDialog.suite) {
        await api.updateSuite(suiteDialog.suite.id, suiteDialog.form);
        onNotify('Suíte atualizada.');
        await loadSuites(suiteDialog.suite.id);
      } else {
        const createdSuite = await api.createSuite(project.id, suiteDialog.form);
        onNotify('Suíte criada.');
        await loadSuites(createdSuite.id);
      }
      setSuiteDialog(null);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleDeleteSuite(suite) {
    const childCount = getDescendantIds(suites, suite.id).size;
    const confirmed = await confirmAction({
      title: `Excluir a suíte ${suite.name}?`,
      message: `${childCount ? `${childCount} sub-suíte(s) e todos os casos vinculados` : 'Todos os casos vinculados'} também serão removidos.`,
      confirmLabel: 'Excluir suíte',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteSuite(suite.id);
      onNotify('Suíte excluída.');
      await loadSuites();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleCaseSubmit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...caseDialog.form,
        suiteId: Number(caseDialog.form.suiteId)
      };

      if (caseDialog.testCase) {
        await api.updateTestCase(caseDialog.testCase.id, payload);
        onNotify('Caso de teste atualizado.');
      } else {
        await api.createTestCase(payload.suiteId, payload);
        onNotify('Caso de teste criado.');
      }
      setCaseDialog(null);
      await loadCases();
      await loadSuites(selectedSuiteId);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function handleDeleteCase(testCase) {
    const confirmed = await confirmAction({
      title: `Excluir o caso ${testCase.title}?`,
      message: 'O caso será removido permanentemente do repositório.',
      confirmLabel: 'Excluir caso',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteTestCase(testCase.id);
      onNotify('Caso de teste excluído.');
      await loadCases();
      await loadSuites(selectedSuiteId);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  function openCreateSuite(parentId = selectedSuiteId) {
    setSuiteDialog({
      suite: null,
      form: { ...emptySuiteForm, parentId: parentId || null }
    });
  }

  function openEditSuite(suite) {
    setSuiteDialog({
      suite,
      form: {
        name: suite.name,
        description: suite.description || '',
        parentId: suite.parentId
      }
    });
  }

  function openCreateCase() {
    setCaseDialog({
      testCase: null,
      form: {
        ...emptyCaseForm,
        testSteps: [{ ...emptyStep }],
        suiteId: selectedSuiteId
      }
    });
  }

  function openEditCase(testCase) {
    setCaseDialog({
      testCase,
      form: {
        title: testCase.title,
        preconditions: testCase.preconditions || '',
        testSteps: testCase.testSteps?.length
          ? testCase.testSteps.map((step) => ({
              action: step.action,
              expectedResult: step.expectedResult
            }))
          : [
              {
                action: testCase.steps,
                expectedResult: testCase.expectedResult
              }
            ],
        suiteId: testCase.suiteId,
        priority: testCase.priority,
        type: testCase.type,
        severity: testCase.severity,
        automationStatus: testCase.automationStatus,
        componentIds: testCase.components?.map((component) => component.id) || []
      }
    });
  }

  function updateCaseForm(field, value) {
    setCaseDialog((current) => ({
      ...current,
      form: { ...current.form, [field]: value }
    }));
  }

  function updateStep(index, field, value) {
    setCaseDialog((current) => ({
      ...current,
      form: {
        ...current.form,
        testSteps: current.form.testSteps.map((step, stepIndex) =>
          stepIndex === index ? { ...step, [field]: value } : step
        )
      }
    }));
  }

  function addStep() {
    setCaseDialog((current) => ({
      ...current,
      form: {
        ...current.form,
        testSteps: [...current.form.testSteps, { ...emptyStep }]
      }
    }));
  }

  function moveStep(index, direction) {
    setCaseDialog((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.form.testSteps.length) {
        return current;
      }

      const steps = [...current.form.testSteps];
      [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
      return { ...current, form: { ...current.form, testSteps: steps } };
    });
  }

  function removeStep(index) {
    if (caseDialog.form.testSteps.length === 1) {
      onNotify('O caso precisa ter pelo menos um passo.', true);
      return;
    }

    setCaseDialog((current) => {
      return {
        ...current,
        form: {
          ...current.form,
          testSteps: current.form.testSteps.filter((_, stepIndex) => stepIndex !== index)
        }
      };
    });
  }

  function toggleCase(testCaseId) {
    setSelectedCaseIds((currentIds) =>
      currentIds.includes(testCaseId)
        ? currentIds.filter((id) => id !== testCaseId)
        : [...currentIds, testCaseId]
    );
  }

  function toggleAllVisible() {
    setSelectedCaseIds(allVisibleSelected ? [] : testCases.map((testCase) => testCase.id));
  }

  async function createComponent(name) {
    try {
      await api.createTestComponent(project.id, { name });
      onNotify('Componente criado.');
      await loadSuites(selectedSuiteId);
      return true;
    } catch (error) {
      onNotify(error.message, true);
      return false;
    }
  }

  async function renameComponent(component) {
    const name = await requestText({
      title: 'Renomear componente',
      message: 'Atualize o nome usado para organizar os casos de teste.',
      inputLabel: 'Nome do componente',
      initialValue: component.name,
      confirmLabel: 'Salvar nome'
    });
    if (!name || name === component.name) {
      return;
    }

    try {
      await api.updateTestComponent(component.id, {
        name,
        description: component.description,
        position: component.position
      });
      onNotify('Componente atualizado.');
      await Promise.all([loadSuites(selectedSuiteId), loadCases()]);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function moveComponent(component, direction) {
    try {
      await api.updateTestComponent(component.id, {
        name: component.name,
        description: component.description,
        position: component.position + direction
      });
      await loadSuites(selectedSuiteId);
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteComponent(component) {
    const assignedCount = component._count?.testCases || 0;
    const confirmed = await confirmAction({
      title: `Excluir o componente ${component.name}?`,
      message: assignedCount
        ? `A associação com ${assignedCount} caso(s) será removida. Os casos continuarão no repositório.`
        : 'O componente será removido permanentemente.',
      confirmLabel: 'Excluir componente',
      danger: true
    });
    if (!confirmed) {
      return;
    }

    try {
      await api.deleteTestComponent(component.id);
      const wasActiveFilter = String(component.id) === String(componentId);
      if (wasActiveFilter) {
        setComponentId('All');
      }
      onNotify('Componente excluído.');
      await loadSuites(selectedSuiteId);
      if (!wasActiveFilter) {
        await loadCases();
      }
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  const blockedParentIds = suiteDialog?.suite
    ? getDescendantIds(suites, suiteDialog.suite.id)
    : new Set();

  return (
    <div className="repository-layout">
      <aside className="suite-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Estrutura</span>
            <h2>Suítes</h2>
          </div>
          <div className="row-actions">
            <button
              className="icon-button"
              type="button"
              title="Gerenciar componentes"
              onClick={() => setComponentDialog(true)}
            >
              <Tags size={17} />
            </button>
            <button
              className="icon-button"
              type="button"
              title="Criar suíte"
              onClick={() => openCreateSuite()}
            >
              <FolderPlus size={17} />
            </button>
          </div>
        </div>

        {isLoadingSuites ? (
          <div className="compact-empty">Carregando suítes...</div>
        ) : suites.length === 0 ? (
          <div className="compact-empty">
            <Folder size={28} />
            <strong>Nenhuma suíte</strong>
            <span>Crie uma suíte para organizar os primeiros casos.</span>
            <button className="ghost-button" type="button" onClick={() => openCreateSuite(null)}>
              <FolderPlus size={16} />
              Criar suíte
            </button>
          </div>
        ) : (
          <div className="suite-list">
            {(suitesByParent.get(null) || []).map((suite) => (
              <SuiteBranch
                key={suite.id}
                suite={suite}
                suitesByParent={suitesByParent}
                selectedSuiteId={selectedSuiteId}
                collapsedSuiteIds={collapsedSuiteIds}
                onCreateChild={openCreateSuite}
                onDelete={handleDeleteSuite}
                onEdit={openEditSuite}
                onSelect={setSelectedSuiteId}
                onToggle={(suiteId) =>
                  setCollapsedSuiteIds((current) => {
                    const next = new Set(current);
                    if (next.has(suiteId)) next.delete(suiteId);
                    else next.add(suiteId);
                    return next;
                  })
                }
              />
            ))}
          </div>
        )}
      </aside>

      <section className="repository-content">
        <div className="repository-toolbar command-bar">
          <div>
            <span className="eyebrow">Repositório de testes</span>
            <h2>{selectedSuite?.name || 'Selecione uma suíte'}</h2>
            {selectedSuite?.description && <p>{selectedSuite.description}</p>}
          </div>
          <div className="toolbar-actions">
            {selectedCaseIds.length > 0 && (
              <>
                <span className="selection-count">
                  <CheckSquare2 size={15} />
                  {selectedCaseIds.length} selecionado(s)
                </span>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    setRunDialog({
                      testCaseIds: [...selectedCaseIds]
                    })
                  }
                >
                  <PlayCircle size={17} />
                  Criar execução
                </button>
              </>
            )}
            <button
              className="primary-button"
              type="button"
              disabled={!selectedSuite}
              onClick={openCreateCase}
            >
              <FilePlus2 size={17} />
              Novo caso
            </button>
          </div>
        </div>

        {selectedSuite && (
          <div className="filter-bar operational-strip">
            <label className="search-box wide">
              <Search size={16} />
              <input
                type="search"
                placeholder="Buscar título, pré-condição ou passo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <FilterSelect
              label="Prioridade"
              value={priority}
              options={priorityLabels}
              onChange={setPriority}
            />
            <FilterSelect label="Tipo" value={type} options={typeLabels} onChange={setType} />
            <FilterSelect
              label="Severidade"
              value={severity}
              options={severityLabels}
              onChange={setSeverity}
            />
            <FilterSelect
              label="Automação"
              value={automationStatus}
              options={automationLabels}
              onChange={setAutomationStatus}
            />
            <label className="select-field">
              <span>Componente</span>
              <select
                value={componentId}
                onChange={(event) => setComponentId(event.target.value)}
              >
                <option value="All">Todos</option>
                {components.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {!selectedSuite ? (
          <div className="empty-state">
            <strong>O repositório começa por uma suíte.</strong>
            <span>Use a coluna à esquerda para criar ou selecionar uma.</span>
          </div>
        ) : isLoadingCases ? (
          <div className="empty-state">Carregando casos...</div>
        ) : testCases.length === 0 ? (
          <div className="empty-state">
            <strong>{hasActiveFilters(query, priority, type, severity, automationStatus, componentId) ? 'Nenhum caso corresponde aos filtros.' : 'Nenhum caso nesta suíte.'}</strong>
            <span>
              {hasActiveFilters(query, priority, type, severity, automationStatus, componentId)
                ? 'Ajuste a busca ou remova um dos filtros.'
                : 'Adicione o primeiro cenário que precisa ser validado.'}
            </span>
            {!hasActiveFilters(query, priority, type, severity, automationStatus, componentId) && (
              <button className="primary-button" type="button" onClick={openCreateCase}>
                <FilePlus2 size={17} />
                Criar caso
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap data-ledger">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-cell">
                    <input
                      aria-label="Selecionar casos visíveis"
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                    />
                  </th>
                  <th>ID</th>
                  <th>Caso de teste</th>
                  <th>Prioridade</th>
                  <th>Severidade</th>
                  <th>Tipo</th>
                  <th>Automação</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {testCases.map((testCase) => (
                  <tr
                    className={`case-row ${
                      selectedCaseIds.includes(testCase.id) ? 'selected' : ''
                    }`}
                    key={testCase.id}
                  >
                    <td className="checkbox-cell">
                      <input
                        aria-label={`Selecionar ${testCase.title}`}
                        type="checkbox"
                        checked={selectedCaseIds.includes(testCase.id)}
                        onChange={() => toggleCase(testCase.id)}
                      />
                    </td>
                    <td className="case-id" aria-label={`Caso TC-${testCase.id}`}>
                      TC-{testCase.id}
                    </td>
                    <td>
                      <strong>{testCase.title}</strong>
                      <span className="cell-detail">
                        {testCase.testSteps?.length || 1} passo(s) · {testCase.suite?.name}
                      </span>
                      {testCase.components?.length > 0 && (
                        <span className="component-chip-row">
                          {testCase.components.map((component) => (
                            <span className="component-chip" key={component.id}>
                              {component.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge priority-${testCase.priority.toLowerCase()}`}>
                        {priorityLabels[testCase.priority]}
                      </span>
                    </td>
                    <td>{severityLabels[testCase.severity]}</td>
                    <td>{typeLabels[testCase.type]}</td>
                    <td>{automationLabels[testCase.automationStatus]}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          title="Editar caso"
                          onClick={() => openEditCase(testCase)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          title="Excluir caso"
                          onClick={() => handleDeleteCase(testCase)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {suiteDialog && (
        <Dialog
          title={suiteDialog.suite ? 'Editar suíte' : 'Nova suíte'}
          onClose={() => setSuiteDialog(null)}
        >
          <form onSubmit={handleSuiteSubmit}>
            <label className="field">
              Nome
              <input
                autoFocus
                minLength={3}
                required
                value={suiteDialog.form.name}
                onChange={(event) =>
                  setSuiteDialog({
                    ...suiteDialog,
                    form: { ...suiteDialog.form, name: event.target.value }
                  })
                }
              />
            </label>
            <label className="field">
              Suíte pai
              <select
                value={suiteDialog.form.parentId || ''}
                onChange={(event) =>
                  setSuiteDialog({
                    ...suiteDialog,
                    form: {
                      ...suiteDialog.form,
                      parentId: event.target.value ? Number(event.target.value) : null
                    }
                  })
                }
              >
                <option value="">Raiz do projeto</option>
                {suites
                  .filter(
                    (suite) =>
                      suite.id !== suiteDialog.suite?.id && !blockedParentIds.has(suite.id)
                  )
                  .map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {getSuitePath(suites, suite.id)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Descrição
              <textarea
                rows={3}
                value={suiteDialog.form.description}
                onChange={(event) =>
                  setSuiteDialog({
                    ...suiteDialog,
                    form: { ...suiteDialog.form, description: event.target.value }
                  })
                }
              />
            </label>
            <DialogActions onCancel={() => setSuiteDialog(null)} />
          </form>
        </Dialog>
      )}

      {caseDialog && (
        <Dialog
          size="inspector"
          title={caseDialog.testCase ? 'Editar caso de teste' : 'Novo caso de teste'}
          onClose={() => setCaseDialog(null)}
        >
          <form onSubmit={handleCaseSubmit}>
            <label className="field">
              Título
              <input
                autoFocus
                minLength={5}
                required
                value={caseDialog.form.title}
                onChange={(event) => updateCaseForm('title', event.target.value)}
              />
            </label>

            <div className="form-grid">
              <FormSelect
                className="field-span-2"
                label="Suíte"
                value={caseDialog.form.suiteId}
                options={suites.map((suite) => ({
                  value: suite.id,
                  label: getSuitePath(suites, suite.id)
                }))}
                onChange={(value) => updateCaseForm('suiteId', Number(value))}
              />
              <FormSelect
                label="Prioridade"
                value={caseDialog.form.priority}
                options={labelMapToOptions(priorityLabels)}
                onChange={(value) => updateCaseForm('priority', value)}
              />
              <FormSelect
                label="Severidade"
                value={caseDialog.form.severity}
                options={labelMapToOptions(severityLabels)}
                onChange={(value) => updateCaseForm('severity', value)}
              />
              <FormSelect
                label="Tipo"
                value={caseDialog.form.type}
                options={labelMapToOptions(typeLabels)}
                onChange={(value) => updateCaseForm('type', value)}
              />
              <FormSelect
                label="Automação"
                value={caseDialog.form.automationStatus}
                options={labelMapToOptions(automationLabels)}
                onChange={(value) => updateCaseForm('automationStatus', value)}
              />
            </div>

            <fieldset className="component-selector">
              <legend>Componentes</legend>
              {components.length === 0 ? (
                <span className="field-help">
                  Nenhum componente cadastrado. O caso pode ser salvo normalmente.
                </span>
              ) : (
                <div className="component-check-list">
                  {components.map((component) => (
                    <label key={component.id}>
                      <input
                        type="checkbox"
                        checked={caseDialog.form.componentIds.includes(component.id)}
                        onChange={() =>
                          updateCaseForm(
                            'componentIds',
                            caseDialog.form.componentIds.includes(component.id)
                              ? caseDialog.form.componentIds.filter(
                                  (id) => id !== component.id
                                )
                              : [...caseDialog.form.componentIds, component.id]
                          )
                        }
                      />
                      <span>{component.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <label className="field">
              Pré-condições
              <textarea
                rows={3}
                placeholder="O que precisa estar preparado antes da execução?"
                value={caseDialog.form.preconditions}
                onChange={(event) => updateCaseForm('preconditions', event.target.value)}
              />
            </label>

            <div className="steps-heading">
              <div>
                <span className="field-label">Passos do teste</span>
                <small>Ação e resultado esperado são registrados separadamente.</small>
              </div>
              <button className="ghost-button" type="button" onClick={addStep}>
                <Plus size={16} />
                Adicionar passo
              </button>
            </div>

            <div className="step-list">
              {caseDialog.form.testSteps.map((step, index) => (
                <div className="step-editor" key={index}>
                  <span className="step-number">{index + 1}</span>
                  <label className="field">
                    Ação
                    <textarea
                      rows={3}
                      required
                      value={step.action}
                      onChange={(event) => updateStep(index, 'action', event.target.value)}
                    />
                  </label>
                  <label className="field">
                    Resultado esperado
                    <textarea
                      rows={3}
                      required
                      value={step.expectedResult}
                      onChange={(event) =>
                        updateStep(index, 'expectedResult', event.target.value)
                      }
                    />
                  </label>
                  <div className="step-actions">
                    <button
                      className="plain-icon"
                      type="button"
                      title="Mover passo para cima"
                      disabled={index === 0}
                      onClick={() => moveStep(index, -1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      className="plain-icon"
                      type="button"
                      title="Mover passo para baixo"
                      disabled={index === caseDialog.form.testSteps.length - 1}
                      onClick={() => moveStep(index, 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      className="plain-icon danger"
                      type="button"
                      title="Remover passo"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <DialogActions onCancel={() => setCaseDialog(null)} />
          </form>
        </Dialog>
      )}

      {componentDialog && (
        <ComponentDialog
          components={components}
          onClose={() => setComponentDialog(false)}
          onCreate={createComponent}
          onDelete={deleteComponent}
          onMove={moveComponent}
          onRename={renameComponent}
        />
      )}

      {runDialog && (
        <RunDialog
          projectId={project.id}
          scope={runDialog}
          onClose={() => setRunDialog(null)}
          onNotify={onNotify}
          onCreated={(runId) => {
            setRunDialog(null);
            setSelectedCaseIds([]);
            onRunCreated(runId);
          }}
        />
      )}
    </div>
  );
}

function ComponentDialog({
  components,
  onClose,
  onCreate,
  onDelete,
  onMove,
  onRename
}) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    try {
      setIsSaving(true);
      const created = await onCreate(name);
      if (created) {
        setName('');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog title="Componentes funcionais" onClose={onClose}>
      <form className="inline-create" onSubmit={handleCreate}>
        <input
          autoFocus
          minLength={2}
          placeholder="Novo componente"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button className="primary-button" disabled={isSaving} type="submit">
          <Plus size={16} />
          Adicionar
        </button>
      </form>

      <div className="component-manager-list">
        {components.length === 0 ? (
          <div className="compact-empty">Nenhum componente cadastrado.</div>
        ) : (
          components.map((component, index) => (
            <div className="component-manager-row" key={component.id}>
              <span>
                <strong>{component.name}</strong>
                <small>{component._count?.testCases || 0} caso(s)</small>
              </span>
              <div className="row-actions">
                <button
                  className="plain-icon"
                  disabled={index === 0}
                  title="Mover para cima"
                  type="button"
                  onClick={() => onMove(component, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="plain-icon"
                  disabled={index === components.length - 1}
                  title="Mover para baixo"
                  type="button"
                  onClick={() => onMove(component, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="plain-icon"
                  title="Renomear componente"
                  type="button"
                  onClick={() => onRename(component)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="plain-icon danger"
                  title="Excluir componente"
                  type="button"
                  onClick={() => onDelete(component)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}

function SuiteBranch({
  suite,
  suitesByParent,
  selectedSuiteId,
  collapsedSuiteIds,
  onCreateChild,
  onDelete,
  onEdit,
  onSelect,
  onToggle,
  depth = 0
}) {
  const children = suitesByParent.get(suite.id) || [];
  const isSelected = suite.id === selectedSuiteId;
  const isCollapsed = collapsedSuiteIds.has(suite.id);

  return (
    <>
      <div
        className={`suite-item ${isSelected ? 'active' : ''}`}
        style={{ '--suite-depth': depth }}
      >
        {children.length > 0 ? (
          <button
            aria-label={isCollapsed ? `Expandir ${suite.name}` : `Recolher ${suite.name}`}
            aria-expanded={!isCollapsed}
            className={`suite-toggle ${isCollapsed ? 'collapsed' : ''}`}
            type="button"
            title={isCollapsed ? 'Expandir sub-suÃ­tes' : 'Recolher sub-suÃ­tes'}
            onClick={() => onToggle(suite.id)}
          >
            <ChevronRight size={13} />
          </button>
        ) : (
          <span className="suite-toggle-spacer" />
        )}
        <button className="suite-select" type="button" onClick={() => onSelect(suite.id)}>
          {isSelected ? <FolderOpen size={17} /> : <Folder size={17} />}
          <span>
            <strong>{suite.name}</strong>
            <small>{suite._count?.testCases || 0} casos</small>
          </span>
        </button>
        <div className="suite-actions">
          <button
            className="plain-icon"
            type="button"
            title="Criar sub-suíte"
            onClick={() => onCreateChild(suite.id)}
          >
            <FolderPlus size={14} />
          </button>
          <button
            className="plain-icon"
            type="button"
            title="Editar suíte"
            onClick={() => onEdit(suite)}
          >
            <Pencil size={14} />
          </button>
          <button
            className="plain-icon danger"
            type="button"
            title="Excluir suíte"
            onClick={() => onDelete(suite)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {!isCollapsed && children.map((child) => (
        <SuiteBranch
          key={child.id}
          suite={child}
          suitesByParent={suitesByParent}
          selectedSuiteId={selectedSuiteId}
          collapsedSuiteIds={collapsedSuiteIds}
          onCreateChild={onCreateChild}
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function FilterSelect({ label, onChange, options, value }) {
  const fieldId = useId();

  return (
    <label className="select-field" htmlFor={fieldId}>
      <span>{label}</span>
      <select id={fieldId} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="All">Todos</option>
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function FormSelect({ className = '', label, onChange, options, value }) {
  const fieldId = useId();

  return (
    <label className={`field ${className}`} htmlFor={fieldId}>
      {label}
      <select
        id={fieldId}
        required
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Dialog({ children, onClose, size, title }) {
  if (size === 'inspector') {
    return (
      <Inspector className="case-inspector" title={title} onClose={onClose}>
        {children}
      </Inspector>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`modal ${size === 'large' ? 'modal-large' : ''}`}
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

function DialogActions({ onCancel }) {
  return (
    <div className="modal-actions">
      <button className="ghost-button" type="button" onClick={onCancel}>
        Cancelar
      </button>
      <button className="primary-button" type="submit">
        Salvar
      </button>
    </div>
  );
}

function groupSuitesByParent(suites) {
  const grouped = new Map();

  suites.forEach((suite) => {
    const parentId = suite.parentId || null;
    grouped.set(parentId, [...(grouped.get(parentId) || []), suite]);
  });

  return grouped;
}

function getDescendantIds(suites, suiteId) {
  const descendants = new Set();
  const pending = [suiteId];

  while (pending.length) {
    const parentId = pending.shift();

    suites
      .filter((suite) => suite.parentId === parentId)
      .forEach((suite) => {
        descendants.add(suite.id);
        pending.push(suite.id);
      });
  }

  return descendants;
}

function getSuitePath(suites, suiteId) {
  const path = [];
  let currentSuite = suites.find((suite) => suite.id === suiteId);

  while (currentSuite) {
    path.unshift(currentSuite.name);
    currentSuite = suites.find((suite) => suite.id === currentSuite.parentId);
  }

  return path.join(' / ');
}

function hasActiveFilters(query, ...filters) {
  return Boolean(query.trim()) || filters.some((filter) => filter !== 'All');
}

function labelMapToOptions(labels) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
