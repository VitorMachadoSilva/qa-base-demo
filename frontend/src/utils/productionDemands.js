export const demandTypeLabels = {
  AD: 'Análise de Defeito',
  MF: 'Mal Funcionamento'
};

export const demandStatusLabels = {
  Open: 'Aberta',
  InProgress: 'Em andamento',
  Waiting: 'Aguardando',
  Closed: 'Encerrada'
};

export const demandCriticalityLabels = {
  Low: 'Baixa',
  Medium: 'Média',
  High: 'Alta'
};

export const deadlineStateLabels = {
  NoDate: 'Sem data',
  OnTrack: 'No prazo',
  DueToday: 'Vence hoje',
  Overdue: 'Atrasada',
  Closed: 'Encerrada'
};

export function formatDemandDate(value) {
  if (!value) {
    return 'Sem data';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function toDateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function demandDeadlineLabel(demand) {
  if (demand.deadlineState === 'Overdue') {
    return `${demand.daysOverdue} dia${demand.daysOverdue === 1 ? '' : 's'} em atraso`;
  }

  if (demand.deadlineState === 'DueToday') {
    return 'Vence hoje';
  }

  if (demand.deadlineState === 'NoDate') {
    return 'Sem data';
  }

  if (demand.deadlineState === 'Closed') {
    return 'Encerrada';
  }

  return `${demand.daysRemaining} dia${demand.daysRemaining === 1 ? '' : 's'} restante${demand.daysRemaining === 1 ? '' : 's'}`;
}

export function demandImpactLabel(demand) {
  if (demand.type === 'MF') {
    return demand.status === 'Closed'
      ? 'Paliativa entregue'
      : 'Paliativa em acompanhamento';
  }

  return `${demandCriticalityLabels[demand.criticality] || 'Sem criticidade'} · ${
    demand.affectedUsersCount || 0
  } afetado${demand.affectedUsersCount === 1 ? '' : 's'}`;
}

export function relatedRecordLabel(record) {
  return record?.title || record?.name || record?.code || 'Registro indisponível';
}
