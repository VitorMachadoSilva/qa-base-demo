import { runNotificationSchedulerTick } from './notificationService.js';

let scheduler = null;
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await runNotificationSchedulerTick();
  } catch (error) {
    console.error('Notification scheduler failed:', error.message);
  } finally {
    running = false;
  }
}

export function startNotificationScheduler() {
  if (scheduler) return scheduler;
  void tick();
  scheduler = setInterval(tick, 60_000);
  scheduler.unref();
  return scheduler;
}

export function stopNotificationScheduler() {
  if (scheduler) clearInterval(scheduler);
  scheduler = null;
}
