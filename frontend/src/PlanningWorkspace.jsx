import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  Check,
  Layers3,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Server,
  Settings2,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { Inspector } from './components/QualityPrimitives.jsx';
import { RunDialog } from './RunDialog.jsx';
import { api } from './services/api.js';

const tabs = [
  { id: 'plans', label: 'Planos', icon: Layers3 },
  { id: 'milestones', label: 'Milestones', icon: CalendarRange },
  { id: 'contexts', label: 'Contextos', icon: Settings2 }
];

const emptyMilestone = {
  name: '',
  description: '',
  status: 'Upcoming',
  startDate: '',
  dueDate: ''
};

let localKeyCounter = 0;

function createLocalKey(prefix) {
  localKeyCounter += 1;
  return `${prefix}-${Date.now()}-${localKeyCounter}`;
}

function emptyPlanSection(name = 'Casos do plano') {
  return {
    key: createLocalKey('section'),
    name,
    description: '',
    items: []
  };
}

function planSectionsForEditing(plan) {
  if (!plan?.sections?.length) {
    return [emptyPlanSection()];
  }

  const itemKeysById = new Map(
    plan.sections.flatMap((section) =>
      section.items.map((item) => [item.id, createLocalKey('item')])
    )
  );

  return plan.sections.map((section) => ({
    key: createLocalKey('section'),
    name: section.name,
    description: section.description || '',
    items: section.items.map((item) => ({
      key: itemKeysById.get(item.id),
      testCaseId: item.testCaseId,
      transitionInstructions: item.transitionInstructions || '',
      dependsOnItemKey: item.dependsOnItemId
        ? itemKeysById.get(item.dependsOnItemId) || null
        : null
    }))
  }));
}

export function PlanningWorkspace({ project, onNotify, onRunCreated }) {
  const [tab, setTab] = useState('plans');

  return (
    <section className="planning-workspace">
      <div className="planning-tabs" role="tablist" aria-label="Planejamento">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              aria-selected={tab === item.id}
              className={tab === item.id ? 'active' : ''}
              key={item.id}
              role="tab"
              type="button"
              onClick={() => setTab(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'plans' && (
        <PlansView
          project={project}
          onNotify={onNotify}
          onRunCreated={onRunCreated}
        />
      )}
      {tab === 'milestones' && (
        <MilestonesView project={project} onNotify={onNotify} />
      )}
      {tab === 'contexts' && <ContextsView project={project} onNotify={onNotify} />}
    </section>
  );
}

function PlansView({ project, onNotify, onRunCreated }) {
  const { confirmAction } = useConfirmation();
  const [plans, setPlans] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [components, setComponents] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [runScope, setRunScope] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [project.id]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [planData, caseData, componentData] = await Promise.all([
        api.listTestPlans(project.id),
        api.listProjectTestCases(project.id),
        api.listTestComponents(project.id)
      ]);
      setPlans(planData);
      setAllCases(caseData);
      setComponents(componentData);
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  function openPlan(plan = null) {
    setDialog({
      plan,
      name: plan?.name || '',
      description: plan?.description || '',
      sections: planSectionsForEditing(plan),
      activeSectionKey: null,
      query: '',
      componentId: 'All',
      error: ''
    });
  }

  async function savePlan(event) {
    event.preventDefault();
    const payload = {
      name: dialog.name,
      description: dialog.description || null,
      sections: dialog.sections.map((section) => ({
        key: section.key,
        name: section.name,
        description: section.description || null,
        items: section.items.map((item) => ({
          key: item.key,
          testCaseId: item.testCaseId,
          transitionInstructions: item.transitionInstructions || null,
          dependsOnItemKey: item.dependsOnItemKey || null
        }))
      }))
    };

    const emptySection = dialog.sections.find((section) => !section.name.trim());
    if (emptySection) {
      setDialog({ ...dialog, error: 'Dê um nome para todas as seções.' });
      return;
    }

    try {
      if (dialog.plan) {
        await api.updateTestPlan(dialog.plan.id, payload);
        onNotify('Plano atualizado.');
      } else {
        await api.createTestPlan(project.id, payload);
        onNotify('Plano criado.');
      }
      setDialog(null);
      await loadData();
    } catch (error) {
      setDialog((current) => ({ ...current, error: error.message }));
      onNotify(error.message, true);
    }
  }

  async function deletePlan(plan) {
    const confirmed = await confirmAction({
      title: `Excluir o plano ${plan.name}?`,
      message: 'O plano será removido, mas o histórico das execuções será mantido.',
      confirmLabel: 'Excluir plano',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteTestPlan(plan.id);
      onNotify('Plano excluído.');
      await loadData();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <div>
          <h2>Planos reutilizáveis</h2>
          <p>Monte escopos ordenados para regressões e ciclos recorrentes.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => openPlan()}>
          <Plus size={17} />
          Novo plano
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">Carregando planos...</div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <Layers3 size={30} />
          <strong>Nenhum plano criado.</strong>
          <span>Crie um rascunho e adicione casos quando estiver pronto.</span>
          <button className="primary-button" type="button" onClick={() => openPlan()}>
            <Plus size={17} />
            Criar plano
          </button>
        </div>
      ) : (
        <div className="planning-list">
          {plans.map((plan) => (
            <article className="planning-row" key={plan.id}>
              <div className="planning-row-main">
                <span className="planning-row-icon">
                  <Layers3 size={18} />
                </span>
                <span>
                  <strong>{plan.name}</strong>
                  <small>{plan.description || 'Sem descrição'}</small>
                </span>
              </div>
              <div className="planning-metrics">
                <span>
                  <strong>{plan.items.length}</strong>
                  casos
                </span>
                <span>
                  <strong>{plan._count?.runs || 0}</strong>
                  runs
                </span>
              </div>
              <div className="row-actions">
                <button
                  className="ghost-button"
                  disabled={plan.items.length === 0}
                  type="button"
                  onClick={() =>
                    setRunScope({
                      testPlanId: plan.id,
                      planName: plan.name,
                      caseCount: plan.items.length
                    })
                  }
                >
                  <PlayCircle size={16} />
                  Executar
                </button>
                <button
                  className="icon-button"
                  title="Editar plano"
                  type="button"
                  onClick={() => openPlan(plan)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger"
                  title="Excluir plano"
                  type="button"
                  onClick={() => deletePlan(plan)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog && (
        <PlanDialog
          allCases={allCases}
          components={components}
          dialog={dialog}
          onChange={setDialog}
          onClose={() => setDialog(null)}
          onSubmit={savePlan}
        />
      )}

      {runScope && (
        <RunDialog
          projectId={project.id}
          scope={runScope}
          onClose={() => setRunScope(null)}
          onNotify={onNotify}
          onCreated={(runId) => {
            setRunScope(null);
            onRunCreated(runId);
          }}
        />
      )}
    </div>
  );
}

function PlanDialog({ allCases, components, dialog, onChange, onClose, onSubmit }) {
  const { confirmAction } = useConfirmation();
  const casesById = useMemo(
    () => new Map(allCases.map((testCase) => [testCase.id, testCase])),
    [allCases]
  );
  const activeSectionKey = dialog.activeSectionKey || dialog.sections[0]?.key;
  const selectedCount = dialog.sections.reduce(
    (total, section) => total + section.items.length,
    0
  );
  const normalizedQuery = dialog.query.trim().toLowerCase();
  const availableCases = allCases.filter(
    (testCase) =>
      (dialog.componentId === 'All' ||
        testCase.components?.some(
          (component) => String(component.id) === String(dialog.componentId)
        )) &&
      (!normalizedQuery ||
        `${testCase.title} ${testCase.suite?.name || ''} ${
          testCase.components?.map((component) => component.name).join(' ') || ''
        }`
          .toLowerCase()
          .includes(normalizedQuery))
  );

  function sanitizeDependencies(sections) {
    const previousKeys = new Set();

    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const nextItem = {
          ...item,
          dependsOnItemKey:
            item.dependsOnItemKey && previousKeys.has(item.dependsOnItemKey)
              ? item.dependsOnItemKey
              : null
        };
        previousKeys.add(item.key);
        return nextItem;
      })
    }));
  }

  function setSections(sections, extra = {}) {
    onChange({
      ...dialog,
      ...extra,
      error: '',
      sections: sanitizeDependencies(sections)
    });
  }

  function updateSection(sectionKey, field, value) {
    setSections(
      dialog.sections.map((section) =>
        section.key === sectionKey ? { ...section, [field]: value } : section
      )
    );
  }

  function addSection() {
    const section = emptyPlanSection(`Etapa ${dialog.sections.length + 1}`);
    setSections([...dialog.sections, section], { activeSectionKey: section.key });
  }

  function moveSection(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= dialog.sections.length) {
      return;
    }

    const sections = [...dialog.sections];
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    setSections(sections);
  }

  async function removeSection(section) {
    if (dialog.sections.length === 1) {
      onChange({ ...dialog, error: 'O plano precisa manter pelo menos uma seção.' });
      return;
    }
    if (section.items.length > 0) {
      const confirmed = await confirmAction({
        title: `Remover a seção ${section.name}?`,
        message: `${section.items.length} ocorrência(s) de casos serão removidas desta seção.`,
        confirmLabel: 'Remover seção',
        danger: true
      });

      if (!confirmed) {
        return;
      }
    }

    const sections = dialog.sections.filter((item) => item.key !== section.key);
    setSections(sections, {
      activeSectionKey:
        activeSectionKey === section.key ? sections[0]?.key : activeSectionKey
    });
  }

  function addOccurrence(testCase) {
    const targetKey = activeSectionKey || dialog.sections[0].key;
    setSections(
      dialog.sections.map((section) =>
        section.key === targetKey
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  key: createLocalKey('item'),
                  testCaseId: testCase.id,
                  transitionInstructions: '',
                  dependsOnItemKey: null
                }
              ]
            }
          : section
      )
    );
  }

  function updateItem(sectionKey, itemKey, field, value) {
    setSections(
      dialog.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              items: section.items.map((item) =>
                item.key === itemKey ? { ...item, [field]: value } : item
              )
            }
          : section
      )
    );
  }

  function moveItem(sectionKey, index, direction) {
    const section = dialog.sections.find((item) => item.key === sectionKey);
    const targetIndex = index + direction;
    if (!section || targetIndex < 0 || targetIndex >= section.items.length) {
      return;
    }

    const items = [...section.items];
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    setSections(
      dialog.sections.map((item) =>
        item.key === sectionKey ? { ...item, items } : item
      )
    );
  }

  function moveItemToSection(sourceSectionKey, itemKey, targetSectionKey) {
    const item = dialog.sections
      .find((section) => section.key === sourceSectionKey)
      ?.items.find((candidate) => candidate.key === itemKey);
    if (!item || sourceSectionKey === targetSectionKey) {
      return;
    }

    setSections(
      dialog.sections.map((section) => {
        if (section.key === sourceSectionKey) {
          return {
            ...section,
            items: section.items.filter((candidate) => candidate.key !== itemKey)
          };
        }
        if (section.key === targetSectionKey) {
          return {
            ...section,
            items: [...section.items, { ...item, dependsOnItemKey: null }]
          };
        }
        return section;
      })
    );
  }

  function removeItem(sectionKey, itemKey) {
    setSections(
      dialog.sections.map((section) => ({
        ...section,
        items:
          section.key === sectionKey
            ? section.items.filter((item) => item.key !== itemKey)
            : section.items
      }))
    );
  }

  function dependencyOptions(itemKey) {
    const options = [];
    for (const section of dialog.sections) {
      for (const item of section.items) {
        if (item.key === itemKey) {
          return options;
        }
        const testCase = casesById.get(item.testCaseId);
        options.push({
          key: item.key,
          label: `${section.name} · ${testCase?.title || 'Caso removido'}`
        });
      }
    }
    return options;
  }

  return (
    <Modal
      large
      title={dialog.plan ? 'Editar plano' : 'Novo plano'}
      onClose={onClose}
    >
      <form className="composite-plan-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            Nome
            <input
              autoFocus
              minLength={3}
              required
              value={dialog.name}
              onChange={(event) => onChange({ ...dialog, name: event.target.value })}
            />
          </label>
          <label className="field">
            Descrição
            <input
              value={dialog.description}
              onChange={(event) =>
                onChange({ ...dialog, description: event.target.value })
              }
            />
          </label>
        </div>

        {dialog.error && (
          <div className="form-error" role="alert">
            {dialog.error}
          </div>
        )}

        <div className="plan-editor-grid">
          <section className="plan-catalog">
            <div className="subsection-heading">
              <span>
                <strong>Repositório</strong>
                <small>{availableCases.length} casos encontrados</small>
              </span>
              <label className="search-box">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Buscar caso"
                  value={dialog.query}
                  onChange={(event) => onChange({ ...dialog, query: event.target.value })}
                />
              </label>
            </div>
            <label className="field compact-field">
              Componente
              <select
                value={dialog.componentId}
                onChange={(event) =>
                  onChange({ ...dialog, componentId: event.target.value })
                }
              >
                <option value="All">Todos os componentes</option>
                {components.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="case-picker-list">
              {availableCases.length === 0 ? (
                <div className="compact-empty">Nenhum caso disponível.</div>
              ) : (
                availableCases.map((testCase) => (
                  <button
                    className="case-picker-item"
                    key={testCase.id}
                    type="button"
                    onClick={() => addOccurrence(testCase)}
                  >
                    <Plus size={15} />
                    <span>
                      <strong>{testCase.title}</strong>
                      <small>{testCase.suite?.name || `TC-${testCase.id}`}</small>
                      {testCase.components?.length > 0 && (
                        <span className="component-chip-row">
                          {testCase.components.map((component) => (
                            <span className="component-chip" key={component.id}>
                              {component.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="composite-plan-structure">
            <div className="subsection-heading">
              <span>
                <strong>Estrutura do plano</strong>
                <small>
                  {dialog.sections.length} seção(ões) · {selectedCount} ocorrência(s)
                </small>
              </span>
              <button className="ghost-button" type="button" onClick={addSection}>
                <Plus size={15} />
                Seção
              </button>
            </div>
            <div className="plan-section-list">
              {dialog.sections.map((section, sectionIndex) => (
                <section
                  className={`plan-section-editor ${
                    section.key === activeSectionKey ? 'active' : ''
                  }`}
                  key={section.key}
                  onClick={() =>
                    onChange({ ...dialog, activeSectionKey: section.key })
                  }
                >
                  <header>
                    <span className="section-order">{sectionIndex + 1}</span>
                    <label className="field">
                      Nome da seção
                      <input
                        required
                        value={section.name}
                        onChange={(event) =>
                          updateSection(section.key, 'name', event.target.value)
                        }
                      />
                    </label>
                    <div className="row-actions">
                      <button
                        className="plain-icon"
                        disabled={sectionIndex === 0}
                        title="Mover seção para cima"
                        type="button"
                        onClick={() => moveSection(sectionIndex, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="plain-icon"
                        disabled={sectionIndex === dialog.sections.length - 1}
                        title="Mover seção para baixo"
                        type="button"
                        onClick={() => moveSection(sectionIndex, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="plain-icon danger"
                        title="Remover seção"
                        type="button"
                        onClick={() => removeSection(section)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </header>
                  <input
                    className="section-description"
                    placeholder="Objetivo ou estado compartilhado da seção"
                    value={section.description}
                    onChange={(event) =>
                      updateSection(section.key, 'description', event.target.value)
                    }
                  />

                  {section.items.length === 0 ? (
                    <div className="compact-empty">
                      Seção vazia. Selecione-a e adicione casos do repositório.
                    </div>
                  ) : (
                    <div className="plan-occurrence-list">
                      {section.items.map((item, itemIndex) => {
                        const testCase = casesById.get(item.testCaseId);
                        const dependencies = dependencyOptions(item.key);
                        return (
                          <div className="plan-occurrence" key={item.key}>
                            <span className="order-number">{itemIndex + 1}</span>
                            <div className="plan-occurrence-main">
                              <strong>{testCase?.title || 'Caso removido'}</strong>
                              <small>
                                {testCase?.suite?.name || `TC-${item.testCaseId}`}
                              </small>
                              <div className="occurrence-fields">
                                <label className="field">
                                  Transição
                                  <input
                                    placeholder="Estado que deve ser mantido"
                                    value={item.transitionInstructions}
                                    onChange={(event) =>
                                      updateItem(
                                        section.key,
                                        item.key,
                                        'transitionInstructions',
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>
                                <label className="field">
                                  Depende de
                                  <select
                                    value={item.dependsOnItemKey || ''}
                                    onChange={(event) =>
                                      updateItem(
                                        section.key,
                                        item.key,
                                        'dependsOnItemKey',
                                        event.target.value || null
                                      )
                                    }
                                  >
                                    <option value="">Sem dependência</option>
                                    {dependencies.map((dependency) => (
                                      <option key={dependency.key} value={dependency.key}>
                                        {dependency.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="field">
                                  Seção
                                  <select
                                    value={section.key}
                                    onChange={(event) =>
                                      moveItemToSection(
                                        section.key,
                                        item.key,
                                        event.target.value
                                      )
                                    }
                                  >
                                    {dialog.sections.map((targetSection) => (
                                      <option
                                        key={targetSection.key}
                                        value={targetSection.key}
                                      >
                                        {targetSection.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            </div>
                            <div className="step-actions">
                              <button
                                className="plain-icon"
                                disabled={itemIndex === 0}
                                title="Mover ocorrência para cima"
                                type="button"
                                onClick={() => moveItem(section.key, itemIndex, -1)}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                className="plain-icon"
                                disabled={itemIndex === section.items.length - 1}
                                title="Mover ocorrência para baixo"
                                type="button"
                                onClick={() => moveItem(section.key, itemIndex, 1)}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                className="plain-icon danger"
                                title="Remover ocorrência"
                                type="button"
                                onClick={() => removeItem(section.key, item.key)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>
        </div>

        <DialogActions onCancel={onClose} />
      </form>
    </Modal>
  );
}

function MilestonesView({ project, onNotify }) {
  const { confirmAction } = useConfirmation();
  const [milestones, setMilestones] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [project.id]);

  async function loadMilestones() {
    try {
      setIsLoading(true);
      setMilestones(await api.listMilestones(project.id));
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  function openMilestone(milestone = null) {
    setDialog({
      milestone,
      form: milestone
        ? {
            name: milestone.name,
            description: milestone.description || '',
            status: milestone.status,
            startDate: toDateInput(milestone.startDate),
            dueDate: toDateInput(milestone.dueDate)
          }
        : { ...emptyMilestone }
    });
  }

  async function saveMilestone(event) {
    event.preventDefault();
    const payload = {
      ...dialog.form,
      description: dialog.form.description || null,
      startDate: dialog.form.startDate || null,
      dueDate: dialog.form.dueDate || null
    };

    try {
      if (dialog.milestone) {
        await api.updateMilestone(dialog.milestone.id, payload);
        onNotify('Milestone atualizado.');
      } else {
        await api.createMilestone(project.id, payload);
        onNotify('Milestone criado.');
      }
      setDialog(null);
      await loadMilestones();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function setStatus(milestone, status) {
    try {
      await api.updateMilestone(milestone.id, {
        name: milestone.name,
        description: milestone.description,
        status,
        startDate: milestone.startDate,
        dueDate: milestone.dueDate
      });
      onNotify(status === 'Completed' ? 'Milestone concluído.' : 'Status atualizado.');
      await loadMilestones();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteMilestone(milestone) {
    const confirmed = await confirmAction({
      title: `Excluir o milestone ${milestone.name}?`,
      message: 'As execuções relacionadas manterão o snapshot deste milestone.',
      confirmLabel: 'Excluir milestone',
      danger: true
    });

    if (!confirmed) {
      return;
    }
    try {
      await api.deleteMilestone(milestone.id);
      onNotify('Milestone excluído.');
      await loadMilestones();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <div>
          <h2>Milestones</h2>
          <p>Organize versões, sprints e entregas com progresso consolidado.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => openMilestone()}>
          <Plus size={17} />
          Novo milestone
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">Carregando milestones...</div>
      ) : milestones.length === 0 ? (
        <div className="empty-state">
          <CalendarRange size={30} />
          <strong>Nenhum milestone criado.</strong>
          <span>Cadastre a próxima entrega que será validada.</span>
        </div>
      ) : (
        <div className="planning-list">
          {milestones.map((milestone) => (
            <article className="planning-row milestone-row" key={milestone.id}>
              <div className="planning-row-main">
                <span className="planning-row-icon">
                  <CalendarRange size={18} />
                </span>
                <span>
                  <strong>{milestone.name}</strong>
                  <small>{formatDateRange(milestone.startDate, milestone.dueDate)}</small>
                </span>
              </div>
              <span className={`lifecycle-badge ${milestone.status.toLowerCase()}`}>
                {statusLabel(milestone.status)}
              </span>
              <div className="milestone-progress">
                <span>
                  {milestone.summary.executed}/{milestone.summary.totalCases} casos executados
                </span>
                <span className="progress-track">
                  <span style={{ width: `${milestone.summary.completionPercentage}%` }} />
                </span>
                <small>{milestone.summary.totalRuns} run(s)</small>
              </div>
              <div className="row-actions">
                {milestone.status !== 'Completed' && (
                  <button
                    className="icon-button"
                    title={milestone.status === 'Upcoming' ? 'Ativar' : 'Concluir'}
                    type="button"
                    onClick={() =>
                      setStatus(
                        milestone,
                        milestone.status === 'Upcoming' ? 'Active' : 'Completed'
                      )
                    }
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  className="icon-button"
                  title="Editar milestone"
                  type="button"
                  onClick={() => openMilestone(milestone)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger"
                  title="Excluir milestone"
                  type="button"
                  onClick={() => deleteMilestone(milestone)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog && (
        <Modal
          title={dialog.milestone ? 'Editar milestone' : 'Novo milestone'}
          onClose={() => setDialog(null)}
        >
          <form onSubmit={saveMilestone}>
            <label className="field">
              Nome
              <input
                autoFocus
                minLength={3}
                required
                value={dialog.form.name}
                onChange={(event) =>
                  setDialog({
                    ...dialog,
                    form: { ...dialog.form, name: event.target.value }
                  })
                }
              />
            </label>
            <label className="field">
              Descrição
              <textarea
                rows={3}
                value={dialog.form.description}
                onChange={(event) =>
                  setDialog({
                    ...dialog,
                    form: { ...dialog.form, description: event.target.value }
                  })
                }
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Início
                <input
                  type="date"
                  value={dialog.form.startDate}
                  onChange={(event) =>
                    setDialog({
                      ...dialog,
                      form: { ...dialog.form, startDate: event.target.value }
                    })
                  }
                />
              </label>
              <label className="field">
                Prazo
                <input
                  type="date"
                  value={dialog.form.dueDate}
                  onChange={(event) =>
                    setDialog({
                      ...dialog,
                      form: { ...dialog.form, dueDate: event.target.value }
                    })
                  }
                />
              </label>
            </div>
            <label className="field">
              Status
              <select
                value={dialog.form.status}
                onChange={(event) =>
                  setDialog({
                    ...dialog,
                    form: { ...dialog.form, status: event.target.value }
                  })
                }
              >
                <option value="Upcoming">Planejado</option>
                <option value="Active">Ativo</option>
                <option value="Completed">Concluído</option>
              </select>
            </label>
            <DialogActions onCancel={() => setDialog(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function ContextsView({ project, onNotify }) {
  const { confirmAction, requestText } = useConfirmation();
  const [environments, setEnvironments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [optionNames, setOptionNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContexts();
  }, [project.id]);

  async function loadContexts() {
    try {
      setIsLoading(true);
      const [environmentData, groupData] = await Promise.all([
        api.listEnvironments(project.id),
        api.listConfigurationGroups(project.id)
      ]);
      setEnvironments(environmentData);
      setGroups(groupData);
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEnvironment(event) {
    event.preventDefault();
    const payload = {
      name: dialog.form.name,
      description: dialog.form.description || null,
      target: dialog.form.target || null
    };
    try {
      if (dialog.environment) {
        await api.updateEnvironment(dialog.environment.id, payload);
        onNotify('Ambiente atualizado.');
      } else {
        await api.createEnvironment(project.id, payload);
        onNotify('Ambiente criado.');
      }
      setDialog(null);
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteEnvironment(environment) {
    const confirmed = await confirmAction({
      title: `Excluir o ambiente ${environment.name}?`,
      message: 'O ambiente será removido das opções disponíveis para novas execuções.',
      confirmLabel: 'Excluir ambiente',
      danger: true
    });

    if (!confirmed) {
      return;
    }
    try {
      await api.deleteEnvironment(environment.id);
      onNotify('Ambiente excluído.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function createGroup(event) {
    event.preventDefault();
    try {
      await api.createConfigurationGroup(project.id, { name: newGroupName });
      setNewGroupName('');
      onNotify('Grupo criado.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function moveGroup(group, direction) {
    try {
      await api.updateConfigurationGroup(group.id, {
        name: group.name,
        position: group.position + direction
      });
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function renameGroup(group) {
    const name = await requestText({
      title: 'Renomear grupo',
      message: 'Atualize o nome deste grupo de configuração.',
      inputLabel: 'Nome do grupo',
      initialValue: group.name,
      confirmLabel: 'Salvar nome'
    });
    if (!name || name === group.name) {
      return;
    }
    try {
      await api.updateConfigurationGroup(group.id, { name, position: group.position });
      onNotify('Grupo atualizado.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteGroup(group) {
    const confirmed = await confirmAction({
      title: `Excluir o grupo ${group.name}?`,
      message: 'Todas as opções deste grupo também serão removidas.',
      confirmLabel: 'Excluir grupo',
      danger: true
    });

    if (!confirmed) {
      return;
    }
    try {
      await api.deleteConfigurationGroup(group.id);
      onNotify('Grupo excluído.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function addOption(event, groupId) {
    event.preventDefault();
    try {
      await api.createConfigurationOption(groupId, { name: optionNames[groupId] });
      setOptionNames({ ...optionNames, [groupId]: '' });
      onNotify('Opção criada.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function renameOption(option) {
    const name = await requestText({
      title: 'Renomear opção',
      message: 'Atualize o nome desta opção de configuração.',
      inputLabel: 'Nome da opção',
      initialValue: option.name,
      confirmLabel: 'Salvar nome'
    });
    if (!name || name === option.name) {
      return;
    }
    try {
      await api.updateConfigurationOption(option.id, { name });
      onNotify('Opção atualizada.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  async function deleteOption(option) {
    const confirmed = await confirmAction({
      title: `Excluir a opção ${option.name}?`,
      message: 'A opção será removida do grupo de configuração.',
      confirmLabel: 'Excluir opção',
      danger: true
    });

    if (!confirmed) {
      return;
    }
    try {
      await api.deleteConfigurationOption(option.id);
      onNotify('Opção excluída.');
      await loadContexts();
    } catch (error) {
      onNotify(error.message, true);
    }
  }

  return (
    <div className="context-layout">
      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Ambientes</h2>
            <p>Alvos reutilizáveis como local, homologação ou produção.</p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              setDialog({
                environment: null,
                form: { name: '', description: '', target: '' }
              })
            }
          >
            <Plus size={17} />
            Novo ambiente
          </button>
        </div>
        {isLoading ? (
          <div className="empty-state">Carregando contextos...</div>
        ) : environments.length === 0 ? (
          <div className="compact-empty">
            <Server size={25} />
            <strong>Nenhum ambiente.</strong>
          </div>
        ) : (
          <div className="planning-list">
            {environments.map((environment) => (
              <article className="context-row" key={environment.id}>
                <span className="planning-row-icon">
                  <Server size={17} />
                </span>
                <span>
                  <strong>{environment.name}</strong>
                  <small>{environment.target || environment.description || 'Sem identificador'}</small>
                </span>
                <small>{environment._count?.runs || 0} run(s)</small>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    title="Editar ambiente"
                    type="button"
                    onClick={() =>
                      setDialog({
                        environment,
                        form: {
                          name: environment.name,
                          description: environment.description || '',
                          target: environment.target || ''
                        }
                      })
                    }
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="icon-button danger"
                    title="Excluir ambiente"
                    type="button"
                    onClick={() => deleteEnvironment(environment)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-header">
          <div>
            <h2>Configurações</h2>
            <p>Dimensões opcionais, como navegador, sistema e dispositivo.</p>
          </div>
        </div>
        <form className="inline-create" onSubmit={createGroup}>
          <input
            minLength={2}
            placeholder="Novo grupo"
            required
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
          />
          <button className="primary-button" title="Adicionar grupo" type="submit">
            <Plus size={17} />
            Adicionar
          </button>
        </form>
        <div className="configuration-list">
          {groups.map((group, index) => (
            <article className="configuration-group" key={group.id}>
              <header>
                <span>
                  <strong>{group.name}</strong>
                  <small>{group.options.length} opção(ões)</small>
                </span>
                <div className="row-actions">
                  <button
                    className="plain-icon"
                    disabled={index === 0}
                    title="Mover grupo para cima"
                    type="button"
                    onClick={() => moveGroup(group, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="plain-icon"
                    disabled={index === groups.length - 1}
                    title="Mover grupo para baixo"
                    type="button"
                    onClick={() => moveGroup(group, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="plain-icon"
                    title="Renomear grupo"
                    type="button"
                    onClick={() => renameGroup(group)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="plain-icon danger"
                    title="Excluir grupo"
                    type="button"
                    onClick={() => deleteGroup(group)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </header>
              <div className="option-list">
                {group.options.map((option) => (
                  <span className="option-chip" key={option.id}>
                    {option.name}
                    <button
                      className="plain-icon"
                      title="Renomear opção"
                      type="button"
                      onClick={() => renameOption(option)}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="plain-icon danger"
                      title="Excluir opção"
                      type="button"
                      onClick={() => deleteOption(option)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <form className="inline-create compact" onSubmit={(event) => addOption(event, group.id)}>
                <input
                  placeholder="Nova opção"
                  required
                  value={optionNames[group.id] || ''}
                  onChange={(event) =>
                    setOptionNames({ ...optionNames, [group.id]: event.target.value })
                  }
                />
                <button className="icon-button" title="Adicionar opção" type="submit">
                  <Plus size={16} />
                </button>
              </form>
            </article>
          ))}
          {!isLoading && groups.length === 0 && (
            <div className="compact-empty">Nenhum grupo de configuração.</div>
          )}
        </div>
      </section>

      {dialog && (
        <Modal
          title={dialog.environment ? 'Editar ambiente' : 'Novo ambiente'}
          onClose={() => setDialog(null)}
        >
          <form onSubmit={saveEnvironment}>
            <label className="field">
              Nome
              <input
                autoFocus
                minLength={3}
                required
                value={dialog.form.name}
                onChange={(event) =>
                  setDialog({
                    ...dialog,
                    form: { ...dialog.form, name: event.target.value }
                  })
                }
              />
            </label>
            <label className="field">
              Identificador
              <input
                placeholder="URL, build ou caminho"
                value={dialog.form.target}
                onChange={(event) =>
                  setDialog({
                    ...dialog,
                    form: { ...dialog.form, target: event.target.value }
                  })
                }
              />
            </label>
            <label className="field">
              Descrição
              <textarea
                rows={3}
                value={dialog.form.description}
                onChange={(event) =>
                  setDialog({
                    ...dialog,
                    form: { ...dialog.form, description: event.target.value }
                  })
                }
              />
            </label>
            <DialogActions onCancel={() => setDialog(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, large = false, onClose, title }) {
  if (!large) {
    return (
      <Inspector title={title} onClose={onClose}>
        {children}
      </Inspector>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`modal ${large ? 'modal-plan' : ''}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" title="Fechar" type="button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
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

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function statusLabel(status) {
  return { Upcoming: 'Planejado', Active: 'Ativo', Completed: 'Concluído' }[status];
}

function formatDateRange(startDate, dueDate) {
  const formatter = new Intl.DateTimeFormat('pt-BR');
  if (!startDate && !dueDate) {
    return 'Sem período definido';
  }
  if (startDate && dueDate) {
    return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(dueDate))}`;
  }
  return startDate
    ? `A partir de ${formatter.format(new Date(startDate))}`
    : `Até ${formatter.format(new Date(dueDate))}`;
}
