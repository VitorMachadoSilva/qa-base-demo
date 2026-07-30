const CIVIL_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function isValidSendTime(value) {
  return TIME_PATTERN.test(value);
}

export function civilDate(value = new Date(), timeZone = 'America/Sao_Paulo') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function civilTime(value = new Date(), timeZone = 'America/Sao_Paulo') {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.hour}:${values.minute}`;
}

export function addCivilDays(day, amount) {
  if (!CIVIL_DAY_PATTERN.test(day)) {
    throw new Error('Data civil invalida');
  }

  const [year, month, date] = day.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1, date + amount));

  return target.toISOString().slice(0, 10);
}

export function differenceInCivilDays(left, right) {
  const leftTime = Date.parse(`${left}T00:00:00.000Z`);
  const rightTime = Date.parse(`${right}T00:00:00.000Z`);

  return Math.round((leftTime - rightTime) / 86_400_000);
}

export function scheduleHasPassed(now, timeZone, sendTime) {
  return civilTime(now, timeZone) >= sendTime;
}

export function initialPlannedDay(now, timeZone, sendTime) {
  const today = civilDate(now, timeZone);
  return scheduleHasPassed(now, timeZone, sendTime) ? addCivilDays(today, 1) : today;
}

export function latestDueDay(firstDay, today, cadenceDays) {
  const difference = differenceInCivilDays(today, firstDay);

  if (difference <= 0) {
    return firstDay;
  }

  return addCivilDays(firstDay, Math.floor(difference / cadenceDays) * cadenceDays);
}

export function nextFutureDay(day, today, cadenceDays) {
  let next = day;

  while (next <= today) {
    next = addCivilDays(next, cadenceDays);
  }

  return next;
}
