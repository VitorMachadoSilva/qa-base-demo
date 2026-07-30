export const TELEGRAM_MESSAGE_TARGET = 3800;

export function escapeTelegramHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function compact(value, fallback = '-') {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  return escapeTelegramHtml(normalized || fallback);
}

function formatDay(day) {
  if (!day) return 'sem data';
  const [year, month, date] = day.slice(0, 10).split('-');
  return `${date}/${month}/${year}`;
}

function demandBlock(record) {
  const impact =
    record.type === 'AD'
      ? ` | ${compact(record.criticality)} | ${record.affectedUsersCount || 0} afetado(s)`
      : '';

  return [
    `<b>${compact(record.type)} ${compact(record.code)}</b> - ${compact(record.title)}`,
    `${compact(record.projectName)} | ${compact(record.deadlineLabel)}${impact}`,
    `QA: ${compact(record.qaOwner)} | Suporte: ${compact(record.supportContact)}`
  ].join('\n');
}

function accessBlock(record) {
  return [
    `<b>${compact(record.name)}</b> - ${compact(record.company)}`,
    `${compact(record.deadlineLabel)} | vence em ${formatDay(record.expiresDay)}`,
    `${compact(record.systems.join(', '))} | Resp.: ${compact(record.internalOwner)}`
  ].join('\n');
}

function sectionBlocks(title, records, renderRecord) {
  if (records.length === 0) return [];
  return [`<b>${escapeTelegramHtml(title)}</b>`, ...records.map(renderRecord)];
}

export function renderDemandReport(records, plannedDay) {
  const sections = [
    ...sectionBlocks('Urgentes e vencidas', records.filter((item) => item.group === 'Urgent'), demandBlock),
    ...sectionBlocks('Sem data', records.filter((item) => item.group === 'NoDate'), demandBlock),
    ...sectionBlocks('Em acompanhamento', records.filter((item) => item.group === 'Active'), demandBlock)
  ];

  return partitionMessage(
    `<b>QaBase | Relatorio AD/MF</b>\n${formatDay(plannedDay)} | ${records.length} demanda(s)`,
    sections
  );
}

export function renderAccessReport(records, plannedDay) {
  const sections = [
    ...sectionBlocks('Vencidos', records.filter((item) => item.daysRemaining < 0), accessBlock),
    ...sectionBlocks('Vencem hoje', records.filter((item) => item.daysRemaining === 0), accessBlock),
    ...sectionBlocks('Proximos vencimentos', records.filter((item) => item.daysRemaining > 0), accessBlock)
  ];

  return partitionMessage(
    `<b>QaBase | Acessos de terceiros</b>\n${formatDay(plannedDay)} | ${records.length} acesso(s)`,
    sections
  );
}

export function partitionMessage(header, blocks, maxLength = TELEGRAM_MESSAGE_TARGET) {
  const baseParts = [];
  let current = header;

  for (const block of blocks) {
    const candidate = `${current}\n\n${block}`;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current !== header) {
      baseParts.push(current);
      current = `${header}\n\n${block}`;
    } else {
      baseParts.push(block.slice(0, maxLength));
      current = header;
    }
  }

  if (current !== header || baseParts.length === 0) {
    baseParts.push(current);
  }

  if (baseParts.length === 1) {
    return baseParts;
  }

  return baseParts.map(
    (part, index) => `${part}\n\n<i>Parte ${index + 1} de ${baseParts.length}</i>`
  );
}
