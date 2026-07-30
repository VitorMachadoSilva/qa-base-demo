import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Filter,
  GitBranch,
  ListChecks,
  Link2,
  LockKeyhole,
  PlayCircle,
  Save,
  SkipForward,
  UserRound,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { api } from './services/api.js';

const statusOptions = [
  { value: 'Passed', label: 'Passou', icon: Check, tone: 'passed' },
  { value: 'Failed', label: 'Falhou', icon: XCircle, tone: 'failed' },
  { value: 'Blocked', label: 'Bloqueado', icon: Ban, tone: 'blocked' },
  { value: 'Skipped', label: 'Ignorado', icon: SkipForward, tone: 'skipped' },
  { value: 'Untested', label: 'Não testado', icon: CircleDashed, tone: 'untested' }
];

const statusLabels = Object.fromEntries(statusOptions.map((option) => [option.value, option.label]));

export function TestRuns({
  initialRunId,
  onInitialRunHandled,
  onNotify,
  onOpenRepository,
  project
}) {
  const { confirmAction } = useConfirmation();
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [contextFilters, setContextFilters] = useState({
    testPlanId: 'All',
    milestoneId: 'All',
    environmentId: 'All',
    configurationOptionId: 'All'
  });
  const [filterOptions, setFilterOptions] = useState({
    plans: [],
    milestones: [],
    environments: [],
    groups: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resultForm, setResultForm] = useState({
    status: 'Untested',
    actualResult: '',
    comment: '',
    evidence: '',
    defectLink: '',
    executor: '',
    durationSeconds: ''
  });

  const currentCase = activeRun?.cases.find(
    (testCase) => testCase.runTestCaseId === currentCaseId
  );
  const filteredCases = useMemo(() => {
    if (!activeRun) {
      return [];
    }

    return statusFilter === 'All'
      ? activeRun.cases
      : activeRun.cases.filter((testCase) => testCase.status === statusFilter);
  }, [activeRun, statusFilter]);
  const queueGroups = useMemo(() => {
    const groups = [];

    filteredCases.forEach((testCase) => {
      const key = testCase.section?.id || 'adhoc';
      let group = groups.find((item) => item.key === key);
      if (!group) {
        group = {
          key,
          name: testCase.section?.name || 'Casos selecionados',
          cases: []
        };
        groups.push(group);
      }
      group.cases.push(testCase);
    });

    return groups;
  }, [filteredCases]);

  useEffect(() => {
    setActiveRun(null);
    setCurrentCaseId(null);
    setContextFilters({
      testPlanId: 'All',
      milestoneId: 'All',
      environmentId: 'All',
      configurationOptionId: 'All'
    });
    loadFilterOptions();
  }, [project.id]);

  useEffect(() => {
    loadRuns();
  }, [project.id, contextFilters]);

  useEffect(() => {
    if (initialRunId) {
      openRun(initialRunId);
      onInitialRunHandled();
    }
  }, [initialRunId]);

  useEffect(() => {
    if (!currentCase) {
      return;
    }

    setResultForm({
      status: currentCase.status,
      actualResult: currentCase.actualResult || '',
      comment: currentCase.comment || '',
      evidence: currentCase.evidence || '',
      defectLink: currentCase.defectLink || '',
      executor: currentCase.executor || '',
      durationSeconds: currentCase.durationSeconds ?? ''
    });
  }, [currentCaseId, currentCase?.status, currentCase?.updatedAt]);

  async function loadRuns() {
    try {
      setIsLoading(true);
      setRuns(await api.listRuns(project.id, contextFilters));
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFilterOptions() {
    try {
      const [plans, milestones, environments, groups] = await Promise.all([
        api.listTestPlans(project.id),
        api.listMilestones(project.id),
        api.listEnvironments(project.id),
        api.listConfigurationGroups(project.id)
      ]);
      setFilterOptions({ plans, milestones, environments, groups });
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function openRun(runId, preferredCaseId) {
    try {
      setIsLoading(true);
      const run = await api.getRun(runId);
      setActiveRun(run);
      setStatusFilter('All');
      setCurrentCaseId(
        preferredCaseId ||
          run.cases.find(
            (testCase) => testCase.status === 'Untested' && testCase.dependencyReady
          )?.runTestCaseId ||
          run.cases[0]?.runTestCaseId ||
          null
      );
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveResult(event, advance = false) {
    event.preventDefault();

    if (!currentCase || activeRun.status === 'Completed') {
      return;
    }

    try {
      setIsSaving(true);
      await api.updateRunCase(currentCase.runTestCaseId, {
        status: resultForm.status,
        actualResult: resultForm.actualResult || null,
        comment: resultForm.comment || null,
        evidence: resultForm.evidence || null,
        defectLink: resultForm.defectLink || null,
        executor: resultForm.executor || null,
        durationSeconds:
          resultForm.durationSeconds === '' ? null : Number(resultForm.durationSeconds)
      });

      const updatedRun = await api.getRun(activeRun.id);
      const nextCase = advance
        ? updatedRun.cases.find(
            (testCase) =>
              testCase.status === 'Untested' &&
              testCase.dependencyReady &&
              testCase.runTestCaseId !== currentCase.runTestCaseId
          )
        : null;

      setActiveRun(updatedRun);
      setCurrentCaseId(nextCase?.runTestCaseId || currentCase.runTestCaseId);
      onNotify('Resultado salvo.');
      await loadRuns();
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompleteRun() {
    const confirmed = await confirmAction({
      title: 'Concluir esta execução?',
      message: 'Os resultados serão preservados e ficarão somente para leitura.',
      confirmLabel: 'Concluir execução'
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.completeRun(activeRun.id);
      await openRun(activeRun.id, currentCaseId);
      await loadRuns();
      onNotify('Execução concluída.');
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  function handleStatusFilter(nextStatus) {
    setStatusFilter(nextStatus);
    const nextCase =
      nextStatus === 'All'
        ? activeRun.cases[0]
        : activeRun.cases.find((testCase) => testCase.status === nextStatus);
    setCurrentCaseId(nextCase?.runTestCaseId || null);
  }

  if (activeRun) {
    return (
      <section className="run-workspace">
        <div className="run-header">
          <div className="run-title">
            <button
              className="icon-button"
              type="button"
              title="Voltar para execuções"
              onClick={() => {
                setActiveRun(null);
                setCurrentCaseId(null);
                loadRuns();
              }}
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <span className="eyebrow">Execução TC-{activeRun.id}</span>
              <h2>{activeRun.name}</h2>
            </div>
          </div>
          <div className="run-header-actions">
            <span className={`run-state ${activeRun.status.toLowerCase()}`}>
              {activeRun.status === 'Completed' ? <LockKeyhole size={14} /> : <PlayCircle size={14} />}
              {activeRun.status === 'Completed' ? 'Concluída' : 'Ativa'}
            </span>
            {activeRun.status !== 'Completed' && (
              <button className="ghost-button" type="button" onClick={handleCompleteRun}>
                <LockKeyhole size={16} />
                Concluir
              </button>
            )}
          </div>
        </div>

        <div className="operational-strip execution-context-strip">
          <RunContext context={activeRun.context} />
        </div>

        <RunSummary
          summary={activeRun.summary}
          selectedStatus={statusFilter}
          onSelectStatus={handleStatusFilter}
        />

        <div className="run-layout">
          <aside className="run-queue">
            <div className="queue-heading">
              <span>Fila de casos</span>
              <strong>{filteredCases.length}</strong>
            </div>
            <div className="queue-list">
              {queueGroups.map((group) => (
                <div className="queue-section" key={group.key}>
                  <div className="queue-section-heading">
                    <strong>{group.name}</strong>
                    <span>{group.cases.length}</span>
                  </div>
                  {group.cases.map((testCase) => (
                    <button
                      className={`queue-item ${
                        testCase.runTestCaseId === currentCaseId ? 'active' : ''
                      } ${!testCase.dependencyReady ? 'dependency-pending' : ''}`}
                      key={testCase.runTestCaseId}
                      type="button"
                      onClick={() => setCurrentCaseId(testCase.runTestCaseId)}
                    >
                      <span className={`status-dot ${testCase.status.toLowerCase()}`} />
                      <span>
                        <small>
                          #{testCase.position} · {statusLabels[testCase.status]}
                        </small>
                        <strong>{testCase.title}</strong>
                        {!testCase.dependencyReady && (
                          <small className="dependency-label">
                            <LockKeyhole size={11} />
                            Aguardando pré-requisito
                          </small>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <main className="run-case">
            {currentCase ? (
              <>
                <div className="case-heading">
                  <div>
                    <span className="eyebrow">
                      {currentCase.section
                        ? `${currentCase.section.name} · posição ${currentCase.position}`
                        : `TC-${currentCase.testCaseId || 'snapshot'}`}
                    </span>
                    <h2>{currentCase.title}</h2>
                  </div>
                  <span className={`badge result-${currentCase.status.toLowerCase()}`}>
                    {statusLabels[currentCase.status]}
                  </span>
                </div>

                {currentCase.transitionInstructions && (
                  <div className="execution-transition">
                    <GitBranch size={17} />
                    <span>
                      <small>Transição do fluxo</small>
                      <strong>{currentCase.transitionInstructions}</strong>
                    </span>
                  </div>
                )}

                {currentCase.dependency && (
                  <div
                    className={`dependency-context ${
                      currentCase.dependencyReady ? 'ready' : 'pending'
                    }`}
                  >
                    {currentCase.dependencyReady ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <LockKeyhole size={17} />
                    )}
                    <span>
                      <small>Pré-requisito</small>
                      <strong>{currentCase.dependency.title}</strong>
                      <span>
                        {currentCase.dependencyReady
                          ? `Resultado: ${statusLabels[currentCase.dependency.status]}`
                          : 'Execute este caso antes de registrar o resultado atual.'}
                      </span>
                    </span>
                  </div>
                )}

                {currentCase.preconditions && (
                  <section className="case-block">
                    <h3>Pré-condições</h3>
                    <p>{currentCase.preconditions}</p>
                  </section>
                )}

                <section className="case-block">
                  <h3>Passos</h3>
                  <div className="execution-steps">
                    {currentCase.testSteps.map((step, index) => (
                      <div className="execution-step" key={`${step.position}-${index}`}>
                        <span>{index + 1}</span>
                        <div>
                          <strong>Ação</strong>
                          <p>{step.action}</p>
                        </div>
                        <div>
                          <strong>Resultado esperado</strong>
                          <p>{step.expectedResult}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <form className="result-form" onSubmit={handleSaveResult}>
                  <fieldset
                    disabled={
                      activeRun.status === 'Completed' ||
                      isSaving ||
                      !currentCase.dependencyReady
                    }
                  >
                    <legend>Resultado</legend>
                    <label className="field">
                      Resultado observado
                      <textarea
                        rows={3}
                        value={resultForm.actualResult}
                        onChange={(event) =>
                          setResultForm({ ...resultForm, actualResult: event.target.value })
                        }
                      />
                    </label>
                    <div className="result-grid">
                      <label className="field">
                        Comentário
                        <textarea
                          rows={3}
                          value={resultForm.comment}
                          onChange={(event) =>
                            setResultForm({ ...resultForm, comment: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        Executor
                        <span className="input-with-icon">
                          <UserRound size={15} />
                          <input
                            value={resultForm.executor}
                            onChange={(event) =>
                              setResultForm({
                                ...resultForm,
                                executor: event.target.value
                              })
                            }
                          />
                        </span>
                      </label>
                      <label className="field">
                        Duração em segundos
                        <input
                          min={0}
                          type="number"
                          value={resultForm.durationSeconds}
                          onChange={(event) =>
                            setResultForm({
                              ...resultForm,
                              durationSeconds: event.target.value
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        Evidência
                        <input
                          placeholder="Caminho, referência ou descrição"
                          value={resultForm.evidence}
                          onChange={(event) =>
                            setResultForm({
                              ...resultForm,
                              evidence: event.target.value
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        Link do defeito
                        <span className="input-with-icon">
                          <Link2 size={15} />
                          <input
                            type="url"
                            placeholder="https://..."
                            value={resultForm.defectLink}
                            onChange={(event) =>
                              setResultForm({
                                ...resultForm,
                                defectLink: event.target.value
                              })
                            }
                          />
                        </span>
                      </label>
                    </div>

                    <div className="result-dock">
                      <div className="status-control" aria-label="Selecionar resultado">
                        {statusOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              aria-pressed={resultForm.status === option.value}
                              className={`status-button ${option.tone} ${
                                resultForm.status === option.value ? 'active' : ''
                              }`}
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setResultForm({ ...resultForm, status: option.value })
                              }
                            >
                              <Icon size={16} />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {activeRun.status !== 'Completed' && (
                        <div className="result-actions">
                          <button className="ghost-button" type="submit">
                            <Save size={16} />
                            Salvar
                          </button>
                          <button
                            className="primary-button"
                            type="button"
                            onClick={(event) => handleSaveResult(event, true)}
                          >
                            Salvar e próximo
                            <SkipForward size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </fieldset>
                </form>
              </>
            ) : (
              <div className="empty-state">
                <strong>Nenhum caso neste filtro.</strong>
                <span>Selecione outro indicador para continuar.</span>
              </div>
            )}
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="content-section run-history-workspace">
      <div className="section-header command-bar">
        <div>
          <h2>Histórico de execuções</h2>
          <p>Abra uma execução para continuar de onde parou ou revisar os resultados.</p>
        </div>
        <button className="primary-button" type="button" onClick={onOpenRepository}>
          <ListChecks size={17} />
          Selecionar casos
        </button>
      </div>

      <div className="run-filter-bar operational-strip">
        <span className="filter-label">
          <Filter size={15} />
          Filtrar
        </span>
        <ContextFilter
          label="Plano"
          value={contextFilters.testPlanId}
          onChange={(value) =>
            setContextFilters({ ...contextFilters, testPlanId: value })
          }
          options={filterOptions.plans}
        />
        <ContextFilter
          label="Milestone"
          value={contextFilters.milestoneId}
          onChange={(value) =>
            setContextFilters({ ...contextFilters, milestoneId: value })
          }
          options={filterOptions.milestones}
        />
        <ContextFilter
          label="Ambiente"
          value={contextFilters.environmentId}
          onChange={(value) =>
            setContextFilters({ ...contextFilters, environmentId: value })
          }
          options={filterOptions.environments}
        />
        <label className="select-field">
          Configuração
          <select
            value={contextFilters.configurationOptionId}
            onChange={(event) =>
              setContextFilters({
                ...contextFilters,
                configurationOptionId: event.target.value
              })
            }
          >
            <option value="All">Todas</option>
            {filterOptions.groups.map((group) => (
              <optgroup key={group.id} label={group.name}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {Object.values(contextFilters).some((value) => value !== 'All') && (
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              setContextFilters({
                testPlanId: 'All',
                milestoneId: 'All',
                environmentId: 'All',
                configurationOptionId: 'All'
              })
            }
          >
            Limpar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="empty-state">Carregando execuções...</div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <PlayCircle size={30} />
          <strong>Nenhuma execução criada.</strong>
          <span>Selecione casos no repositório para iniciar seu primeiro ciclo.</span>
          <button className="primary-button" type="button" onClick={onOpenRepository}>
            <ListChecks size={17} />
            Abrir repositório
          </button>
        </div>
      ) : (
        <div className="run-list data-ledger" role="region" aria-label="Histórico de execuções">
          <div className="run-list-head" aria-hidden="true">
            <span>Execução</span>
            <span>Contexto</span>
            <span>Progresso</span>
            <span>Falhas</span>
            <span>Estado</span>
          </div>
          {runs.map((run) => (
            <button className="run-list-item" key={run.id} type="button" onClick={() => openRun(run.id)}>
              <span className="run-list-main">
                <code>RUN-{run.id}</code>
                <strong>{run.name}</strong>
                <small>
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  }).format(new Date(run.createdAt))}
                </small>
              </span>
              <RunContextInline context={run.context} />
              <span className="run-progress">
                <span>
                  <small>{run.summary.completionPercentage}% concluído</small>
                  <strong>{run.summary.executed}/{run.summary.total}</strong>
                </span>
                <span className="progress-track">
                  <span style={{ width: `${run.summary.completionPercentage}%` }} />
                </span>
              </span>
              <span className="run-failures">
                <XCircle size={15} />
                {run.summary.failed}
              </span>
              <span className={`run-state ${run.status.toLowerCase()}`}>
                {run.status === 'Completed' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <PlayCircle size={14} />
                )}
                {run.status === 'Completed' ? 'Concluída' : 'Ativa'}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ContextFilter({ label, onChange, options, value }) {
  return (
    <label className="select-field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="All">Todos</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function RunContext({ context }) {
  const items = contextItems(context);

  if (items.length === 0) {
    return (
      <div className="run-context empty">
        <span>Execução avulsa sem contexto registrado</span>
      </div>
    );
  }

  return (
    <div className="run-context" aria-label="Contexto capturado">
      {items.map((item) => (
        <span key={`${item.label}-${item.value}`}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

function RunContextInline({ context }) {
  const items = contextItems(context);
  if (items.length === 0) {
    return <span className="context-inline muted">Avulsa · sem contexto</span>;
  }
  return (
    <span className="context-inline">
      {items.map((item) => item.value).join(' · ')}
    </span>
  );
}

function contextItems(context) {
  if (!context) {
    return [];
  }

  return [
    context.testPlan ? { label: 'Plano', value: context.testPlan.name } : null,
    context.milestone ? { label: 'Milestone', value: context.milestone.name } : null,
    context.environment
      ? {
          label: 'Ambiente',
          value: context.environment.target
            ? `${context.environment.name} (${context.environment.target})`
            : context.environment.name
        }
      : null,
    ...(context.configurations || []).map((item) => ({
      label: item.group,
      value: item.option
    }))
  ].filter(Boolean);
}

function RunSummary({ onSelectStatus, selectedStatus, summary }) {
  const indicators = [
    { key: 'All', label: 'Progresso', value: `${summary.completionPercentage}%`, icon: Clock3 },
    { key: 'Passed', label: 'Passou', value: summary.passed, icon: CheckCircle2 },
    { key: 'Failed', label: 'Falhou', value: summary.failed, icon: XCircle },
    { key: 'Blocked', label: 'Bloqueado', value: summary.blocked, icon: Ban },
    { key: 'Skipped', label: 'Ignorado', value: summary.skipped, icon: SkipForward },
    { key: 'Untested', label: 'Não testado', value: summary.untested, icon: CircleDashed }
  ];

  return (
    <div className="run-summary" aria-label="Resumo da execução">
      {indicators.map((indicator) => {
        const Icon = indicator.icon;
        return (
          <button
            className={`run-indicator ${
              selectedStatus === indicator.key ? 'active' : ''
            }`}
            key={indicator.key}
            type="button"
            onClick={() => onSelectStatus(indicator.key)}
          >
            <Icon size={17} />
            <span>
              <small>{indicator.label}</small>
              <strong>{indicator.value}</strong>
            </span>
          </button>
        );
      })}
    </div>
  );
}
