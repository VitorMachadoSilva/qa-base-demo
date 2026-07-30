import {
  CheckCircle2,
  Download,
  LoaderCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccountWorkspace } from './auth/AccountWorkspace.jsx';
import { LoginPage, SessionLoading } from './auth/LoginPage.jsx';
import { AppShell } from './components/AppShell.jsx';
import { useConfirmation } from './components/ConfirmationDialog.jsx';
import { DesignSystemFixture } from './DesignSystemFixture.jsx';
import { PlanningWorkspace } from './PlanningWorkspace.jsx';
import { ProjectBackupDialog } from './ProjectBackupDialog.jsx';
import { QuickNotesWorkspace } from './QuickNotesWorkspace.jsx';
import {
  api,
  PROJECT_BACKUP_LIMIT_BYTES,
  PROJECT_BACKUP_MIME
} from './services/api.js';
import { TestRepository } from './TestRepository.jsx';
import { TestRuns } from './TestRuns.jsx';
import { ValidationWorkspace } from './ValidationWorkspace.jsx';

const emptyProjectForm = { name: '', description: '' };
const availableViews = new Set([
  'projects',
  'overview',
  'validations',
  'repository',
  'planning',
  'runs',
  'quick-notes',
  'account',
  'design-system'
]);

const globalViews = new Set([
  'projects',
  'quick-notes',
  'account',
  'design-system'
]);

function readHashView() {
  const value = window.location.hash.replace('#', '');
  return availableViews.has(value) ? value : 'projects';
}

export function App() {
  const { confirmAction } = useConfirmation();
  const backupInputRef = useRef(null);
  const notificationSequence = useRef(0);
  const [authStatus, setAuthStatus] = useState('loading');
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [view, setView] = useState(readHashView);
  const [dashboard, setDashboard] = useState(null);
  const [initialRunId, setInitialRunId] = useState(null);
  const [projectDialog, setProjectDialog] = useState(null);
  const [backupDialog, setBackupDialog] = useState(null);
  const [exportingProjectId, setExportingProjectId] = useState(null);
  const [isPreviewingBackup, setIsPreviewingBackup] = useState(false);
  const [query, setQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      `${project.name} ${project.description || ''}`.toLowerCase().includes(normalizedQuery)
    );
  }, [projects, query]);

  useEffect(() => {
    function handleHashChange() {
      setView(readHashView());
    }

    function handleUnauthorized() {
      setCurrentUser(null);
      setProjects([]);
      setSelectedProjectId(null);
      setAuthStatus('anonymous');
    }

    let active = true;
    api
      .getCurrentSession()
      .then(({ user }) => {
        if (active) {
          setCurrentUser(user);
          setAuthStatus('authenticated');
          if (user.mustChangePassword) {
            window.location.hash = 'account';
            setView('account');
          }
        }
      })
      .catch(() => {
        if (active) {
          setAuthStatus('anonymous');
        }
      });

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('qabase:unauthorized', handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('qabase:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' && !currentUser?.mustChangePassword) {
      loadProjects();
    }
  }, [authStatus, currentUser?.mustChangePassword]);

  useEffect(() => {
    if (!selectedProjectId || view !== 'overview') {
      return;
    }

    api
      .getDashboard(selectedProjectId)
      .then(setDashboard)
      .catch((error) => notify(error.message, true));
  }, [selectedProjectId, view]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const notificationId = notification.id;
    const leaveTimeout = window.setTimeout(() => {
      setNotification((current) =>
        current?.id === notificationId ? { ...current, isLeaving: true } : current
      );
    }, 3500);
    const removeTimeout = window.setTimeout(() => {
      setNotification((current) => (current?.id === notificationId ? null : current));
    }, 3800);

    return () => {
      window.clearTimeout(leaveTimeout);
      window.clearTimeout(removeTimeout);
    };
  }, [notification?.id]);

  if (authStatus === 'loading') {
    return <SessionLoading />;
  }

  if (authStatus !== 'authenticated' || !currentUser) {
    return (
      <LoginPage
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setAuthStatus('authenticated');
          if (user.mustChangePassword) {
            window.location.hash = 'account';
            setView('account');
          }
        }}
      />
    );
  }

  async function loadProjects(preferredProjectId) {
    try {
      setIsLoading(true);
      const data = await api.listProjects();
      setProjects(data);
      setSelectedProjectId((currentId) => {
        const nextId = preferredProjectId || currentId;
        return data.some((project) => project.id === nextId) ? nextId : data[0]?.id || null;
      });
    } catch (error) {
      notify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  function notify(message, isError = false) {
    notificationSequence.current += 1;
    setNotification({
      id: notificationSequence.current,
      isError,
      isLeaving: false,
      message
    });
  }

  function dismissNotification() {
    const notificationId = notification?.id;
    if (!notificationId) return;

    setNotification((current) =>
      current?.id === notificationId ? { ...current, isLeaving: true } : current
    );
    window.setTimeout(() => {
      setNotification((current) => (current?.id === notificationId ? null : current));
    }, 220);
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Clear the browser state even when the server session has already expired.
    } finally {
      setCurrentUser(null);
      setProjects([]);
      setSelectedProjectId(null);
      setNotification(null);
      setAuthStatus('anonymous');
      window.location.hash = 'projects';
    }
  }

  function navigate(nextView) {
    if (currentUser.mustChangePassword && nextView !== 'account') {
      notify('Altere a senha temporária para liberar sua demonstração.', true);
      return;
    }

    if (!globalViews.has(nextView) && !selectedProject) {
      notify('Selecione ou crie um projeto primeiro.', true);
      return;
    }

    window.location.hash = nextView;
    setView(nextView);
  }

  function openCreateProject() {
    setProjectDialog({ project: null, form: emptyProjectForm });
  }

  function openEditProject(project) {
    setProjectDialog({
      project,
      form: {
        name: project.name,
        description: project.description || ''
      }
    });
  }

  async function handleProjectSubmit(event) {
    event.preventDefault();

    try {
      if (projectDialog.project) {
        await api.updateProject(projectDialog.project.id, projectDialog.form);
        notify('Projeto atualizado.');
        await loadProjects(projectDialog.project.id);
      } else {
        const createdProject = await api.createProject(projectDialog.form);
        notify('Projeto criado.');
        await loadProjects(createdProject.id);
        window.location.hash = 'overview';
        setView('overview');
      }
      setProjectDialog(null);
    } catch (error) {
      notify(error.message, true);
    }
  }

  async function handleDeleteProject(project) {
    const confirmed = await confirmAction({
      title: `Excluir ${project.name}?`,
      message:
        'Suítes, casos, execuções e demais dados vinculados também serão removidos permanentemente.',
      confirmLabel: 'Excluir projeto',
      danger: true,
      inputLabel: 'Nome do projeto',
      verificationText: project.name
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteProject(project.id);
      notify('Projeto excluído.');
      await loadProjects();
      navigate('projects');
    } catch (error) {
      notify(error.message, true);
    }
  }

  async function handleExportProject(project) {
    if (exportingProjectId) return;

    try {
      setExportingProjectId(project.id);
      const { blob, filename } = await api.downloadProjectBackup(project.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      notify(`Backup de ${project.name} exportado.`);
    } catch (error) {
      notify(error.message, true);
    } finally {
      setExportingProjectId(null);
    }
  }

  async function handleBackupSelection(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > PROJECT_BACKUP_LIMIT_BYTES) {
      notify('O backup excede o limite de 50 MiB.', true);
      return;
    }

    try {
      setIsPreviewingBackup(true);
      const content = await file.text();
      const preview = await api.previewProjectBackup(content);
      setBackupDialog({
        content,
        error: null,
        isImporting: false,
        name: preview.suggestedName,
        preview
      });
    } catch (error) {
      notify(error.message, true);
    } finally {
      setIsPreviewingBackup(false);
    }
  }

  async function handleImportProject() {
    if (!backupDialog || backupDialog.isImporting) return;

    setBackupDialog((current) => ({ ...current, error: null, isImporting: true }));
    try {
      const result = await api.importProjectBackup(
        backupDialog.content,
        backupDialog.name.trim()
      );
      setBackupDialog(null);
      await loadProjects(result.project.id);
      notify('Projeto restaurado com sucesso.');
      window.location.hash = 'overview';
      setView('overview');
    } catch (error) {
      setBackupDialog((current) =>
        current
          ? { ...current, error: error.message, isImporting: false }
          : current
      );
    }
  }

  function openProject(project) {
    setSelectedProjectId(project.id);
    window.location.hash = 'overview';
    setView('overview');
  }

  const pageTitle = {
    projects: 'Projetos',
    overview: 'Visão geral',
    validations: 'Validações',
    repository: 'Repositório de testes',
    planning: 'Planejamento',
    runs: 'Execuções',
    'quick-notes': 'Anotações rápidas',
    account: 'Minha conta',
    'design-system': 'Sistema visual'
  }[view];

  return (
    <>
      <AppShell
        command={
          view === 'projects' ? (
            <div className="project-command-actions">
              <input
                accept={`.qabase,${PROJECT_BACKUP_MIME}`}
                aria-label="Selecionar arquivo de backup .qabase"
                className="visually-hidden"
                ref={backupInputRef}
                type="file"
                onChange={handleBackupSelection}
              />
              <button
                className="ghost-button"
                disabled={isPreviewingBackup}
                type="button"
                onClick={() => backupInputRef.current?.click()}
              >
                {isPreviewingBackup ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {isPreviewingBackup ? 'Validando' : 'Importar Backup'}
              </button>
              <button className="primary-button" type="button" onClick={openCreateProject}>
                <Plus size={18} />
                Novo projeto
              </button>
            </div>
          ) : null
        }
        location={pageTitle}
        notification={notification}
        onDismissNotification={dismissNotification}
        onLogout={handleLogout}
        onNavigate={navigate}
        project={selectedProject}
        user={currentUser}
        view={view}
      >
        {view === 'design-system' && <DesignSystemFixture />}

        {view === 'quick-notes' && <QuickNotesWorkspace onNotify={notify} />}

        {view === 'account' && (
          <AccountWorkspace
            onLogout={handleLogout}
            onNotify={notify}
            onUserChange={(user) => {
              const completedFirstAccess =
                currentUser.mustChangePassword && !user.mustChangePassword;
              setCurrentUser(user);
              if (completedFirstAccess) navigate('projects');
            }}
            required={currentUser.mustChangePassword}
            user={currentUser}
          />
        )}

        {view === 'projects' && (
          <ProjectsView
            filteredProjects={filteredProjects}
            isLoading={isLoading}
            onCreate={openCreateProject}
            onDelete={handleDeleteProject}
            onEdit={openEditProject}
            onExport={handleExportProject}
            onOpen={openProject}
            query={query}
            selectedProjectId={selectedProjectId}
            setQuery={setQuery}
            exportingProjectId={exportingProjectId}
          />
        )}

        {view === 'overview' && selectedProject && (
          <Overview
            dashboard={dashboard}
            onOpenRepository={() => navigate('repository')}
            onOpenRuns={() => navigate('runs')}
          />
        )}

        {view === 'repository' && selectedProject && (
          <TestRepository
            project={selectedProject}
            onNotify={notify}
            onRunCreated={(runId) => {
              setInitialRunId(runId);
              navigate('runs');
            }}
          />
        )}

        {view === 'validations' && selectedProject && (
          <ValidationWorkspace project={selectedProject} onNotify={notify} />
        )}

        {view === 'runs' && selectedProject && (
          <TestRuns
            initialRunId={initialRunId}
            onInitialRunHandled={() => setInitialRunId(null)}
            onNotify={notify}
            onOpenRepository={() => navigate('repository')}
            project={selectedProject}
          />
        )}

        {view === 'planning' && selectedProject && (
          <PlanningWorkspace
            project={selectedProject}
            onNotify={notify}
            onRunCreated={(runId) => {
              setInitialRunId(runId);
              navigate('runs');
            }}
          />
        )}
      </AppShell>

      {projectDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setProjectDialog(null)}
        >
          <form
            className="modal"
            onSubmit={handleProjectSubmit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{projectDialog.project ? 'Editar projeto' : 'Novo projeto'}</h2>
              <button
                className="icon-button"
                type="button"
                title="Fechar"
                onClick={() => setProjectDialog(null)}
              >
                <X size={17} />
              </button>
            </div>

            <label className="field">
              Nome
              <input
                autoFocus
                minLength={3}
                required
                value={projectDialog.form.name}
                onChange={(event) =>
                  setProjectDialog({
                    ...projectDialog,
                    form: { ...projectDialog.form, name: event.target.value }
                  })
                }
              />
            </label>

            <label className="field">
              Descrição
              <textarea
                rows={4}
                value={projectDialog.form.description}
                onChange={(event) =>
                  setProjectDialog({
                    ...projectDialog,
                    form: { ...projectDialog.form, description: event.target.value }
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setProjectDialog(null)}>
                Cancelar
              </button>
              <button className="primary-button" type="submit">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {backupDialog && (
        <ProjectBackupDialog
          backup={backupDialog.preview}
          error={backupDialog.error}
          isImporting={backupDialog.isImporting}
          name={backupDialog.name}
          onClose={() => {
            if (!backupDialog.isImporting) setBackupDialog(null);
          }}
          onConfirm={handleImportProject}
          onNameChange={(name) =>
            setBackupDialog((current) => ({ ...current, error: null, name }))
          }
        />
      )}

    </>
  );
}

function ProjectsView({
  exportingProjectId,
  filteredProjects,
  isLoading,
  onCreate,
  onDelete,
  onEdit,
  onExport,
  onOpen,
  query,
  selectedProjectId,
  setQuery
}) {
  return (
    <section className="content-section projects-section">
      <div className="section-header">
        <div>
          <h2>Seus produtos e aplicações</h2>
          <p>Cada projeto mantém seu próprio repositório, histórico e execuções.</p>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar projeto"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {isLoading ? (
        <div className="empty-state">Carregando projetos...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum projeto encontrado.</strong>
          <span>Crie o primeiro projeto para começar seu repositório de testes.</span>
          {!query && (
            <button className="primary-button" type="button" onClick={onCreate}>
              <Plus size={17} />
              Criar projeto
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap data-ledger">
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Descrição</th>
                <th>Suítes</th>
                <th>Runs</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr
                  className={`clickable-row ${
                    project.id === selectedProjectId ? 'selected-project' : ''
                  }`}
                  key={project.id}
                  onClick={() => onOpen(project)}
                >
                  <td>
                    <code className="project-id">PRJ-{project.id}</code>
                    <strong>{project.name}</strong>
                    {project.id === selectedProjectId && (
                      <span className="current-project-mark">Atual</span>
                    )}
                  </td>
                  <td data-label="Descrição">{project.description || 'Sem descrição'}</td>
                  <td data-label="Suítes">{project._count?.suites ?? 0}</td>
                  <td data-label="Runs">{project._count?.runs ?? 0}</td>
                  <td data-label="Ações">
                    <div className="row-actions">
                      <button
                        aria-label={`Exportar backup de ${project.name}`}
                        className="icon-button"
                        disabled={Boolean(exportingProjectId)}
                        type="button"
                        title="Exportar backup"
                        onClick={(event) => {
                          event.stopPropagation();
                          onExport(project);
                        }}
                      >
                        {exportingProjectId === project.id ? (
                          <LoaderCircle className="spin" size={16} />
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Editar projeto"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(project);
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        title="Excluir projeto"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(project);
                        }}
                      >
                        <Trash2 size={16} />
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
  );
}

function Overview({ dashboard, onOpenRepository, onOpenRuns }) {
  const summary = dashboard?.lastRunSummary;
  const completion = summary?.completionPercentage ?? 0;

  return (
    <>
      <section className="summary-grid" aria-label="Resumo">
        <SummaryCard
          label="Casos no projeto"
          value={dashboard?.totalCases ?? 0}
          onClick={onOpenRepository}
        />
        <SummaryCard
          label="Execuções criadas"
          value={dashboard?.totalRuns ?? 0}
          onClick={onOpenRuns}
        />
        <SummaryCard
          label="Progresso do último run"
          value={`${completion}%`}
          onClick={onOpenRuns}
        />
        <SummaryCard
          label="Falhas no último run"
          value={summary?.failed ?? 0}
          tone="danger"
          onClick={onOpenRuns}
        />
      </section>

      <section className="overview-grid">
        <div className="content-section overview-panel">
          <div>
            <span className="eyebrow">Cobertura</span>
            <h2>Repositório de testes</h2>
            <p>Organize cenários por funcionalidade e mantenha uma fonte reutilizável.</p>
          </div>
          <button className="ghost-button" type="button" onClick={onOpenRepository}>
            <CheckCircle2 size={17} />
            Abrir repositório
          </button>
        </div>
        <div className="content-section overview-panel">
          <div>
            <span className="eyebrow">Validação</span>
            <h2>Execuções</h2>
            <p>Acompanhe o que passou, falhou, bloqueou ou ainda precisa ser testado.</p>
          </div>
          <button className="ghost-button" type="button" onClick={onOpenRuns}>
            <PlayCircle size={17} />
            Ver execuções
          </button>
        </div>
      </section>
    </>
  );
}

function SummaryCard({ label, onClick, tone, value }) {
  const Component = onClick ? 'button' : 'article';

  return (
    <Component
      className={`summary-card ${onClick ? 'summary-action' : ''} ${
        tone ? `summary-${tone}` : ''
      }`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </Component>
  );
}
