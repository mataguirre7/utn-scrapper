import { config } from '../config/env';
import { logger } from '../utils/logger';
import { getPrisma } from '../db/prisma';
import { hashObject } from '../utils/hash';

export interface NotificationMessage {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  emoji?: string;
  entityId?: string;
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    logger.warn('⚠️  Telegram not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.telegram.chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${error}`);
    }

    logger.log('📨 Message sent to Telegram');
    return true;
  } catch (error) {
    logger.error('Failed to send Telegram message', error);
    return false;
  }
}

export async function notifyChanges(notifications: NotificationMessage[]): Promise<void> {
  if (notifications.length === 0) {
    logger.debug('No notifications to send');
    return;
  }

  const prisma = getPrisma();

  const emoji: { [key: string]: string } = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  let message = '*📊 Cambios detectados en tu campus*\n\n';
  const loggedNotifications: Array<{ title: string; message: string }> = [];

  for (const notif of notifications) {
    const emj = notif.emoji || emoji[notif.priority];
    message += `${emj} *${notif.title}*\n`;
    if (notif.description) {
      message += `${notif.description}\n`;
    }
    message += '\n';

    loggedNotifications.push({
      title: notif.title,
      message: `${notif.title}\n${notif.description || ''}`,
    });
  }

  // Send message
  const sent = await sendTelegramMessage(message);

  // Log all notifications to DB (idempotent)
  for (const notif of loggedNotifications) {
    const hash = hashObject(notif);
    const existing = await prisma.notificationLog.findFirst({
      where: {
        message: notif.message,
      },
    });

    if (!existing) {
      await prisma.notificationLog.create({
        data: {
          entityType: 'SyncNotification',
          entityId: hash,
          notificationType: 'sent',
          message: notif.message,
          sent,
        },
      });
      logger.log(`✓ Logged notification: ${notif.title}`);
    } else {
      logger.debug(`Notification already logged: ${notif.title}`);
    }
  }
}

export async function notifyImportantActivity(
  courseName: string,
  activityName: string,
  dueDate: Date | null
): Promise<void> {
  let message = `⚠️ *${courseName}*\n*${activityName}*`;

  if (dueDate) {
    const daysUntil = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    message += `\nVence en ${daysUntil} días`;
  }

  await sendTelegramMessage(message);
}
