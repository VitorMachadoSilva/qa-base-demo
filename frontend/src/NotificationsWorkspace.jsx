import {
  BellRing,
  Bot,
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  History,
  Link2,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Send,
  Settings2,
  Trash2,
  Wifi
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  DataLedger,
  Inspector,
  StatePanel
} from './components/QualityPrimitives.jsx';
import { api } from './services/api.js';

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: BellRing },
  { id: 'telegram', label: 'Telegram', icon: Bot },
  { id: 'schedules', label: 'Agendamentos', icon: CalendarClock },
  { id: 'history', label: 'Histórico', icon: History }
];

const statusLabels = {
  Pending: 'Pendente',
  Processing: 'Processando',
  Sent: 'Enviado',
  Failed: 'Falhou',
  NoData: 'Sem dados',
  Cancelled: 'Cancelado'
};

const typeLabels = {
  DemandReport: 'AD/MF',
  AccessReport: 'Acessos',
  Test: 'Teste',
  Resend: 'Reenvio'
};

const triggerLabels = {
  Scheduled: 'Agendado',
  CatchUp: 'Recuperação',
  Manual: 'Manual',
  ManualResend: 'Reenvio manual'
};

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatCivilDay(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function StatusBadge({ status }) {
  return (
    <span className={`notification-status status-${status.toLowerCase()}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function NotificationsWorkspace({ onNotify }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState(null);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', page: 1 });
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [candidates, setCandidates] = useState([]);

  async function loadWorkspace() {
    try {
      setIsLoading(true);
      const [nextOverview, nextHistory] = await Promise.all([
        api.getNotificationOverview(),
        api.listNotificationDeliveries({ ...filters, pageSize: 25 })
      ]);
      setOverview(nextOverview);
      setSettings(nextOverview.settings);
      setHistory(nextHistory);
    } catch (error) {
      onNotify(error.message, true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [filters.type, filters.status, filters.page]);

  useEffect(() => {
    if (!selectedDelivery) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') setSelectedDelivery(null);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedDelivery]);

  async function runAction(key, action, successMessage) {
    try {
      setBusyAction(key);
      const result = await action();
      if (successMessage) onNotify(successMessage);
      await loadWorkspace();
      return result;
    } catch (error) {
      onNotify(error.message, true);
      return null;
    } finally {
      setBusyAction('');
    }
  }

  async function openDelivery(id) {
    const detail = await runAction(`detail-${id}`, () => api.getNotificationDelivery(id));
    if (detail) setSelectedDelivery(detail);
  }

  if (isLoading && !overview) {
    return (
      <StatePanel
        kind="loading"
        title="Carregando notificações"
        description="Consultando canal, agenda e histórico."
      />
    );
  }

  return (
    <section className="notifications-workspace">
      <nav className="workspace-tabs" aria-label="Configurações e notificações">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={activeTab === tab.id ? 'active' : ''}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === 'overview' && (
        <OverviewTab
          overview={overview}
          onNavigate={setActiveTab}
          onRefresh={loadWorkspace}
        />
      )}
      {activeTab === 'telegram' && (
        <TelegramTab
          busyAction={busyAction}
          candidates={candidates}
          onCandidates={setCandidates}
          onRun={runAction}
          settings={settings}
        />
      )}
      {activeTab === 'schedules' && (
        <SchedulesTab
          busyAction={busyAction}
          onRun={runAction}
          settings={settings}
        />
      )}
      {activeTab === 'history' && (
        <HistoryTab
          busyAction={busyAction}
          filters={filters}
          history={history}
          onFilters={setFilters}
          onOpen={openDelivery}
        />
      )}

      {selectedDelivery && (
        <DeliveryInspector
          busyAction={busyAction}
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onResend={async () => {
            const result = await runAction(
              `resend-${selectedDelivery.id}`,
              () => api.resendNotificationDelivery(selectedDelivery.id),
              'Reenvio criado e processado.'
            );
            if (result) setSelectedDelivery(result);
          }}
        />
      )}
    </section>
  );
}

function OverviewTab({ overview, onNavigate, onRefresh }) {
  const settings = overview.settings;
  const readiness = settings.telegram.ready
    ? settings.enabled
      ? 'Operação ativa'
      : 'Canal pronto'
    : 'Configuração pendente';

  return (
    <div className="notification-tab">
      <section className="notification-command">
        <div>
          <span className="eyebrow">Centro operacional</span>
          <h2>{readiness}</h2>
          <p>
            {settings.telegram.ready
              ? `${settings.telegram.chatTitle} · envios ${settings.enabled ? 'ativados' : 'desativados'}`
              : 'O canal permanece bloqueado até a validação do bot e do grupo.'}
          </p>
        </div>
        <button className="icon-button" type="button" title="Atualizar" onClick={onRefresh}>
          <RefreshCw size={17} />
        </button>
      </section>

      <div className="notification-metrics">
        <Metric
          icon={Wifi}
          label="Canal"
          value={settings.telegram.ready ? 'Pronto' : 'Pendente'}
          action={() => onNavigate('telegram')}
        />
        <Metric
          icon={Clock3}
          label="Próximo AD/MF"
          value={formatCivilDay(settings.nextDemandReportDay)}
          action={() => onNavigate('schedules')}
        />
        <Metric
          icon={CalendarClock}
          label="Próximo acesso"
          value={formatCivilDay(settings.nextAccessReportDay)}
          action={() => onNavigate('schedules')}
        />
        <Metric
          icon={Send}
          label="Entregas"
          value={String(Object.values(overview.totals || {}).reduce((sum, count) => sum + count, 0))}
          action={() => onNavigate('history')}
        />
      </div>

      <div className="notification-overview-ledgers">
        <OverviewRecord
          empty="Nenhuma entrega registrada."
          label="Última entrega"
          onNavigate={() => onNavigate('history')}
          record={overview.latestDelivery}
        />
        <OverviewRecord
          empty="Nenhuma falha registrada."
          label="Última falha"
          onNavigate={() => onNavigate('history')}
          record={overview.latestFailure}
        />
      </div>
    </div>
  );
}

function Metric({ action, icon: Icon, label, value }) {
  return (
    <button className="notification-metric" type="button" onClick={action}>
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function OverviewRecord({ empty, label, onNavigate, record }) {
  return (
    <section className="notification-record">
      <header>
        <span className="eyebrow">{label}</span>
        {record && <StatusBadge status={record.status} />}
      </header>
      {record ? (
        <>
          <strong>{typeLabels[record.type] || record.type}</strong>
          <span>{formatDateTime(record.createdAt)}</span>
          {record.safeErrorMessage && <p>{record.safeErrorMessage}</p>}
        </>
      ) : (
        <span>{empty}</span>
      )}
      <button className="plain-link" type="button" onClick={onNavigate}>
        Abrir histórico
      </button>
    </section>
  );
}

function TelegramTab({ busyAction, candidates, onCandidates, onRun, settings }) {
  const telegram = settings.telegram;

  async function validateBot() {
    await onRun('validate-bot', () => api.getTelegramStatus(), 'Bot validado.');
  }

  async function discover() {
    const result = await onRun('discover', () => api.discoverTelegramGroups());
    if (result) onCandidates(result.candidates);
  }

  return (
    <div className="notification-tab telegram-setup">
      <section className="telegram-state-line">
        <div className={`setup-state ${telegram.tokenConfigured ? 'done' : ''}`}>
          <span>1</span>
          <div><strong>Token local</strong><small>{telegram.tokenConfigured ? 'Configurado' : 'Pendente'}</small></div>
        </div>
        <div className={`setup-state ${telegram.botVerified ? 'done' : ''}`}>
          <span>2</span>
          <div><strong>Bot</strong><small>{telegram.botVerified ? `@${telegram.botUsername}` : 'Não validado'}</small></div>
        </div>
        <div className={`setup-state ${telegram.channelConnected ? 'done' : ''}`}>
          <span>3</span>
          <div><strong>Grupo</strong><small>{telegram.chatTitle || 'Não conectado'}</small></div>
        </div>
      </section>

      {!telegram.tokenConfigured && (
        <section className="setup-action-band">
          <CircleAlert size={18} />
          <div>
            <strong>Token ausente no backend</strong>
            <p>O campo <code>TELEGRAM_BOT_TOKEN</code> ainda não foi carregado no ambiente local.</p>
          </div>
        </section>
      )}

      {telegram.tokenConfigured && !telegram.botVerified && (
        <section className="setup-action-band">
          <Bot size={18} />
          <div>
            <strong>Validar identidade do bot</strong>
            <p>A validação confirma o token sem revelar seu conteúdo.</p>
          </div>
          <button className="primary-button" type="button" disabled={busyAction} onClick={validateBot}>
            {busyAction === 'validate-bot' ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
            Validar
          </button>
        </section>
      )}

      {telegram.botVerified && !telegram.channelConnected && (
        <>
          <section className="setup-action-band">
            <Link2 size={18} />
            <div>
              <strong>Conectar grupo</strong>
              <code>/connect@{telegram.botUsername}</code>
            </div>
            <button className="primary-button" type="button" disabled={busyAction} onClick={discover}>
              {busyAction === 'discover' ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
              Buscar grupo
            </button>
          </section>
          <div className="telegram-candidates">
            {candidates.length === 0 ? (
              <StatePanel
                title="Nenhum grupo detectado"
                description="A busca considera comandos recentes enviados em grupos."
              />
            ) : (
              candidates.map((candidate) => (
                <div className="telegram-candidate" key={candidate.chatId}>
                  <div>
                    <strong>{candidate.title}</strong>
                    <span>{candidate.type === 'supergroup' ? 'Supergrupo' : 'Grupo'}</span>
                  </div>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={busyAction}
                    onClick={() =>
                      onRun(
                        `connect-${candidate.chatId}`,
                        () => api.connectTelegramGroup(candidate.chatId),
                        'Grupo conectado.'
                      )
                    }
                  >
                    <Link2 size={16} />
                    Conectar
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {telegram.channelConnected && (
        <section className="connected-channel">
          <header>
            <div>
              <span className="eyebrow">Destino fixo</span>
              <h3>{telegram.chatTitle}</h3>
              <p>@{telegram.botUsername} · {telegram.chatType}</p>
            </div>
            <span className="channel-ready"><Wifi size={15} /> Pronto</span>
          </header>
          <div className="channel-actions">
            <button
              className="primary-button"
              type="button"
              disabled={busyAction}
              onClick={() =>
                onRun('test', () => api.testTelegramChannel(), 'Mensagem de teste enviada.')
              }
            >
              <Send size={16} />
              Testar canal
            </button>
            <button
              className="ghost-button"
              type="button"
              disabled={busyAction}
              onClick={() =>
                onRun(
                  'disconnect',
                  () => api.disconnectTelegramGroup(),
                  'Grupo desconectado e envios desativados.'
                )
              }
            >
              <RotateCcw size={16} />
              Reconectar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function SchedulesTab({ busyAction, onRun, settings }) {
  const [form, setForm] = useState(() => ({
    enabled: settings.enabled,
    timeZone: settings.timeZone,
    sendTime: settings.sendTime,
    demandCadenceDays: settings.demandCadenceDays,
    accessLeadDays: settings.accessLeadDays
  }));
  const [newLeadDay, setNewLeadDay] = useState('');

  useEffect(() => {
    setForm({
      enabled: settings.enabled,
      timeZone: settings.timeZone,
      sendTime: settings.sendTime,
      demandCadenceDays: settings.demandCadenceDays,
      accessLeadDays: settings.accessLeadDays
    });
  }, [settings]);

  const sortedLeadDays = useMemo(
    () => [...form.accessLeadDays].sort((left, right) => right - left),
    [form.accessLeadDays]
  );

  function addLeadDay() {
    const days = Number(newLeadDay);
    if (!Number.isInteger(days) || days < 1 || days > 365 || form.accessLeadDays.includes(days)) {
      return;
    }
    setForm((current) => ({
      ...current,
      accessLeadDays: [...current.accessLeadDays, days]
    }));
    setNewLeadDay('');
  }

  return (
    <form
      className="notification-tab schedule-form"
      onSubmit={(event) => {
        event.preventDefault();
        onRun(
          'save-schedule',
          () => api.updateNotificationSettings(form),
          'Agendamentos atualizados.'
        );
      }}
    >
      <section className="schedule-enable">
        <div>
          <span className="eyebrow">Automação global</span>
          <strong>Envios agendados</strong>
          <p>O histórico e os testes manuais continuam disponíveis quando desativado.</p>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          <span aria-hidden="true" />
          <b>{form.enabled ? 'Ativado' : 'Desativado'}</b>
        </label>
      </section>

      <div className="schedule-grid">
        <label className="field">
          Fuso horário
          <select
            value={form.timeZone}
            onChange={(event) => setForm({ ...form, timeZone: event.target.value })}
          >
            <option value="America/Sao_Paulo">America/Sao_Paulo</option>
            <option value="America/Manaus">America/Manaus</option>
            <option value="America/Recife">America/Recife</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
        <label className="field">
          Horário de envio
          <input
            type="time"
            required
            value={form.sendTime}
            onChange={(event) => setForm({ ...form, sendTime: event.target.value })}
          />
        </label>
        <label className="field">
          Frequência AD/MF
          <span className="number-suffix">
            <input
              type="number"
              min="1"
              max="90"
              required
              value={form.demandCadenceDays}
              onChange={(event) =>
                setForm({ ...form, demandCadenceDays: Number(event.target.value) })
              }
            />
            <span>dias</span>
          </span>
        </label>
      </div>

      <section className="lead-days-editor">
        <header>
          <div>
            <span className="eyebrow">Acessos de terceiros</span>
            <strong>Antecedências</strong>
          </div>
          <div className="lead-day-add">
            <input
              aria-label="Nova antecedência em dias"
              type="number"
              min="1"
              max="365"
              value={newLeadDay}
              onChange={(event) => setNewLeadDay(event.target.value)}
            />
            <button className="ghost-button" type="button" onClick={addLeadDay}>
              Adicionar
            </button>
          </div>
        </header>
        <div className="lead-day-list">
          {sortedLeadDays.map((days) => (
            <span key={days}>
              {days} dias antes
              <button
                className="plain-icon"
                type="button"
                title={`Remover ${days} dias`}
                disabled={form.accessLeadDays.length === 1}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    accessLeadDays: current.accessLeadDays.filter((item) => item !== days)
                  }))
                }
              >
                <Trash2 size={14} />
              </button>
            </span>
          ))}
          <span className="fixed-trigger">No vencimento</span>
          <span className="fixed-trigger">Diário após vencer</span>
        </div>
      </section>

      <div className="schedule-actions">
        <button className="primary-button" type="submit" disabled={busyAction === 'save-schedule'}>
          {busyAction === 'save-schedule' ? <LoaderCircle className="spin" size={16} /> : <Settings2 size={16} />}
          Salvar agendamentos
        </button>
      </div>
    </form>
  );
}

function HistoryTab({ busyAction, filters, history, onFilters, onOpen }) {
  return (
    <div className="notification-tab history-tab">
      <div className="history-filters">
        <label className="field">
          Tipo
          <select
            value={filters.type}
            onChange={(event) => onFilters({ ...filters, type: event.target.value, page: 1 })}
          >
            <option value="All">Todos</option>
            <option value="DemandReport">AD/MF</option>
            <option value="AccessReport">Acessos</option>
            <option value="Test">Teste</option>
            <option value="Resend">Reenvio</option>
          </select>
        </label>
        <label className="field">
          Status
          <select
            value={filters.status}
            onChange={(event) => onFilters({ ...filters, status: event.target.value, page: 1 })}
          >
            <option value="All">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <span>{history?.total || 0} registro(s)</span>
      </div>

      {!history?.items.length ? (
        <StatePanel
          title="Histórico vazio"
          description="Testes, relatórios e execuções sem dados aparecerão aqui."
        />
      ) : (
        <>
          <DataLedger className="notification-ledger" label="Histórico de notificações">
            <table>
              <thead>
                <tr>
                  <th>Entrega</th>
                  <th>Origem</th>
                  <th>Status</th>
                  <th>Planejado</th>
                  <th>Registros</th>
                  <th>Tentativas</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((delivery) => (
                  <tr
                    className="clickable-row"
                    key={delivery.id}
                    tabIndex="0"
                    onClick={() => onOpen(delivery.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') onOpen(delivery.id);
                    }}
                  >
                    <td><strong>{typeLabels[delivery.type] || delivery.type}</strong><small>#{delivery.id}</small></td>
                    <td>{triggerLabels[delivery.trigger] || delivery.trigger}</td>
                    <td><StatusBadge status={delivery.status} /></td>
                    <td>{formatCivilDay(delivery.plannedDay)}</td>
                    <td>{delivery.sourceCount}</td>
                    <td>{delivery.attemptCount}</td>
                    <td>{formatDateTime(delivery.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataLedger>
          <div className="history-pagination">
            <button
              className="ghost-button"
              type="button"
              disabled={filters.page <= 1 || busyAction}
              onClick={() => onFilters({ ...filters, page: filters.page - 1 })}
            >
              Anterior
            </button>
            <span>{filters.page} de {history.pageCount}</span>
            <button
              className="ghost-button"
              type="button"
              disabled={filters.page >= history.pageCount || busyAction}
              onClick={() => onFilters({ ...filters, page: filters.page + 1 })}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryInspector({ busyAction, delivery, onClose, onResend }) {
  return (
    <Inspector
      className="notification-inspector"
      modal
      onClose={onClose}
      title={`Entrega #${delivery.id}`}
    >
      <div className="delivery-detail">
        <section className="delivery-summary">
          <div><span>Tipo</span><strong>{typeLabels[delivery.type] || delivery.type}</strong></div>
          <div><span>Status</span><StatusBadge status={delivery.status} /></div>
          <div><span>Origem</span><strong>{triggerLabels[delivery.trigger] || delivery.trigger}</strong></div>
          <div><span>Grupo</span><strong>{delivery.channelTitleSnapshot || '-'}</strong></div>
          <div><span>Registros</span><strong>{delivery.sourceCount}</strong></div>
          <div><span>Criada</span><strong>{formatDateTime(delivery.createdAt)}</strong></div>
        </section>

        {delivery.safeErrorMessage && (
          <div className="delivery-error">
            <CircleAlert size={17} />
            <div><strong>{delivery.safeErrorCode}</strong><span>{delivery.safeErrorMessage}</span></div>
          </div>
        )}

        <section className="delivery-parts">
          <header>
            <span className="eyebrow">Mensagens</span>
            <strong>{delivery.parts.length} parte(s)</strong>
          </header>
          {delivery.parts.map((part) => (
            <article key={part.id}>
              <header>
                <strong>Parte {part.position}</strong>
                <StatusBadge status={part.status} />
              </header>
              <pre>{part.body}</pre>
              <div className="attempt-list">
                {part.attempts.map((attempt) => (
                  <div key={attempt.id}>
                    <span>Tentativa {attempt.attemptNumber}</span>
                    <strong>{statusLabels[attempt.status] || attempt.status}</strong>
                    <time>{formatDateTime(attempt.startedAt)}</time>
                    {attempt.safeErrorMessage && <small>{attempt.safeErrorMessage}</small>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="payload-snapshot">
          <span className="eyebrow">Fotografia da entrega</span>
          <pre>{JSON.stringify(JSON.parse(delivery.payloadSnapshot), null, 2)}</pre>
        </section>
      </div>
      <footer className="inspector-actions">
        <button className="ghost-button" type="button" onClick={onClose}>Fechar</button>
        <button
          className="primary-button"
          type="button"
          disabled={delivery.status === 'NoData' || busyAction}
          onClick={onResend}
        >
          <RotateCcw size={16} />
          Reenviar
        </button>
      </footer>
    </Inspector>
  );
}
