import { PlayCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from './services/api.js';

function defaultName() {
  return `Execução ${new Intl.DateTimeFormat('pt-BR').format(new Date())}`;
}

export function RunDialog({
  projectId,
  scope,
  onClose,
  onCreated,
  onNotify
}) {
  const [form, setForm] = useState({
    name: defaultName(),
    milestoneId: '',
    environmentId: '',
    configurationSelections: {}
  });
  const [milestones, setMilestones] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const scopeLabel = useMemo(
    () =>
      scope.testPlanId
        ? `${scope.planName} · ${scope.caseCount} caso(s)`
        : `${scope.testCaseIds.length} caso(s) selecionado(s)`,
    [scope]
  );

  useEffect(() => {
    Promise.all([
      api.listMilestones(projectId),
      api.listEnvironments(projectId),
      api.listConfigurationGroups(projectId)
    ])
      .then(([milestoneData, environmentData, groupData]) => {
        setMilestones(milestoneData.filter((item) => item.status !== 'Completed'));
        setEnvironments(environmentData);
        setGroups(groupData);
      })
      .catch((error) => onNotify(error.message, true))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload = {
        name: form.name,
        milestoneId: form.milestoneId ? Number(form.milestoneId) : null,
        environmentId: form.environmentId ? Number(form.environmentId) : null,
        configurationOptionIds: Object.values(form.configurationSelections)
          .filter(Boolean)
          .map(Number),
        ...(scope.testPlanId
          ? { testPlanId: scope.testPlanId }
          : { testCaseIds: scope.testCaseIds })
      };
      const run = await api.createRun(projectId, payload);
      onNotify('Execução criada.');
      onCreated(run.id);
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop run-dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        className="modal run-dialog"
        aria-label="Definir contexto do run"
        aria-modal="true"
        role="dialog"
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">Nova execução</span>
            <h2>Definir contexto do run</h2>
          </div>
          <button className="icon-button" type="button" title="Fechar" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="scope-summary">
          <PlayCircle size={18} />
          <span>
            <small>Escopo</small>
            <strong>{scopeLabel}</strong>
          </span>
        </div>

        <label className="field">
          Nome da execução
          <input
            autoFocus
            minLength={3}
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>

        {isLoading ? (
          <div className="compact-loading">Carregando opções de contexto...</div>
        ) : (
          <>
            <div className="form-grid">
              <label className="field">
                Milestone
                <select
                  value={form.milestoneId}
                  onChange={(event) => setForm({ ...form, milestoneId: event.target.value })}
                >
                  <option value="">Sem milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Ambiente
                <select
                  value={form.environmentId}
                  onChange={(event) =>
                    setForm({ ...form, environmentId: event.target.value })
                  }
                >
                  <option value="">Sem ambiente</option>
                  {environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>
                      {environment.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {groups.length > 0 && (
              <fieldset className="configuration-fields">
                <legend>Configurações</legend>
                <div className="form-grid">
                  {groups.map((group) => (
                    <label className="field" key={group.id}>
                      {group.name}
                      <select
                        value={form.configurationSelections[group.id] || ''}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            configurationSelections: {
                              ...form.configurationSelections,
                              [group.id]: event.target.value
                            }
                          })
                        }
                      >
                        <option value="">Não especificado</option>
                        {group.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" disabled={isLoading || isSaving} type="submit">
            <PlayCircle size={17} />
            {isSaving ? 'Criando...' : 'Criar execução'}
          </button>
        </div>
      </form>
    </div>
  );
}
