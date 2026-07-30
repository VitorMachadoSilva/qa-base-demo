import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  StickyNote,
  UserRound
} from 'lucide-react';
import { useState } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

const projectDestinations = [
  { id: 'overview', label: 'Visão geral', shortLabel: 'Visão', icon: LayoutDashboard },
  { id: 'validations', label: 'Validações', shortLabel: 'Fichas', icon: FileCheck2 },
  { id: 'repository', label: 'Repositório', shortLabel: 'Casos', icon: CheckCircle2 },
  { id: 'planning', label: 'Planejamento', shortLabel: 'Planos', icon: ClipboardList },
  { id: 'runs', label: 'Execuções', shortLabel: 'Runs', icon: BarChart3 }
];

export function AppShell({
  children,
  command,
  location,
  notification,
  onDismissNotification,
  onLogout,
  onNavigate,
  project,
  user,
  view
}) {
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const showProjectContext = Boolean(
    project &&
      view !== 'projects' &&
      view !== 'quick-notes' &&
      view !== 'account' &&
      view !== 'design-system'
  );

  function navigate(destination) {
    setContextOpen(false);
    onNavigate(destination);
  }

  return (
    <div
      className={`app-shell quality-shell ${
        showProjectContext ? 'has-project-context' : 'global-workspace'
      } ${
        showProjectContext && contextCollapsed ? 'context-collapsed' : ''
      } ${showProjectContext && contextOpen ? 'context-open' : ''} view-${view}`}
    >
      <aside className="global-rail" aria-label="Navegação global">
        <button
          className="rail-brand"
          type="button"
          title="QaBase"
          onClick={() => navigate('projects')}
        >
          <span>QB</span>
        </button>

        <button
          className={`rail-action ${view === 'projects' ? 'active' : ''}`}
          type="button"
          title="Projetos"
          aria-label="Projetos"
          onClick={() => navigate('projects')}
        >
          <FolderKanban size={19} />
        </button>

        <button
          className={`rail-action ${view === 'quick-notes' ? 'active' : ''}`}
          type="button"
          title="Anotações rápidas"
          aria-label="Anotações rápidas"
          onClick={() => navigate('quick-notes')}
        >
          <StickyNote size={19} />
        </button>

        <button
          className={`rail-action ${view === 'account' ? 'active' : ''}`}
          type="button"
          title={`Minha conta - ${user.name}`}
          aria-label={`Minha conta de ${user.name}`}
          onClick={() => navigate('account')}
        >
          <UserRound size={19} />
        </button>

        <div className="rail-footer">
          {project && showProjectContext && (
            <div className="rail-project" title={project.name} aria-label={`Projeto ${project.name}`}>
              {project.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <button
            className="rail-action rail-logout"
            type="button"
            title="Sair do QaBase"
            aria-label="Sair do QaBase"
            onClick={onLogout}
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      {showProjectContext && (
        <aside className="context-nav">
          <div className="context-heading">
            <div className="context-project">
              <span>Projeto ativo</span>
              <strong title={project.name}>{project.name}</strong>
            </div>
            <button
              className="plain-icon context-toggle"
              type="button"
              title={contextCollapsed ? 'Expandir navegação' : 'Recolher navegação'}
              aria-label={contextCollapsed ? 'Expandir navegação' : 'Recolher navegação'}
              onClick={() => setContextCollapsed((current) => !current)}
            >
              {contextCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>

          <nav className="context-destinations" aria-label="Projeto">
            {projectDestinations.map((destination) => {
              const Icon = destination.icon;
              return (
                <button
                  className={`context-destination ${view === destination.id ? 'active' : ''}`}
                  key={destination.id}
                  type="button"
                  title={destination.label}
                  onClick={() => navigate(destination.id)}
                >
                  <Icon size={18} />
                  <span>{destination.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="context-signature" aria-hidden="true">
            <span />
            QaBase
          </div>
        </aside>
      )}

      <main className="main-area">
        <header className="topbar location-bar">
          {showProjectContext && (
            <button
              className="icon-button tablet-context-button"
              type="button"
              title={contextOpen ? 'Fechar navegação do projeto' : 'Abrir navegação do projeto'}
              aria-label={contextOpen ? 'Fechar navegação do projeto' : 'Abrir navegação do projeto'}
              onClick={() => setContextOpen((current) => !current)}
            >
              <PanelsTopLeft size={18} />
            </button>
          )}
          <div className="location-copy">
            <span className="eyebrow">
              {showProjectContext ? project.name : 'Workspace local'}
            </span>
            <h1>{location}</h1>
          </div>
          <div className="location-actions">
            <ThemeSwitcher />
            {command && <div className="location-command">{command}</div>}
          </div>
        </header>

        {notification && (
          <div
            className={`toast ${notification.isError ? 'error' : ''} ${
              notification.isLeaving ? 'leaving' : ''
            }`}
            key={notification.id}
            role={notification.isError ? 'alert' : 'status'}
          >
            <span>{notification.message}</span>
            <button
              className="plain-icon"
              type="button"
              title="Fechar mensagem"
              aria-label="Fechar mensagem"
              onClick={onDismissNotification}
            >
              ×
            </button>
          </div>
        )}

        <div className="work-canvas">{children}</div>
      </main>

      {project && showProjectContext && (
        <nav className="mobile-nav" aria-label="Navegação do projeto">
          {projectDestinations.map((destination) => {
            const Icon = destination.icon;
            return (
              <button
                className={view === destination.id ? 'active' : ''}
                key={destination.id}
                type="button"
                onClick={() => navigate(destination.id)}
              >
                <Icon size={18} />
                <span>{destination.shortLabel}</span>
              </button>
            );
          })}
          <button
            className={view === 'projects' ? 'active' : ''}
            type="button"
            onClick={() => navigate('projects')}
          >
            <MoreHorizontal size={18} />
            <span>Mais</span>
          </button>
        </nav>
      )}

      {!showProjectContext && (
        <nav className="global-mobile-nav" aria-label="Navegação global">
          <button
            className={view === 'projects' ? 'active' : ''}
            type="button"
            onClick={() => navigate('projects')}
          >
            <FolderKanban size={18} />
            <span>Projetos</span>
          </button>
          <button
            className={view === 'quick-notes' ? 'active' : ''}
            type="button"
            onClick={() => navigate('quick-notes')}
          >
            <StickyNote size={18} />
            <span>Notas</span>
          </button>
          <button
            className={view === 'account' ? 'active' : ''}
            type="button"
            onClick={() => navigate('account')}
          >
            <UserRound size={18} />
            <span>Conta</span>
          </button>
        </nav>
      )}
    </div>
  );
}
