import { Router, Request, Response } from 'express';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const days = parseInt(req.query.days as string) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const notifications = await prisma.notificationLog.findMany({
      where: {
        sentAt: {
          gte: sinceDate,
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    res.json(notifications);
  } catch (error) {
    logger.error('GET /notifications error', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

notificationsRouter.get('/entity/:entityId', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const notifications = await prisma.notificationLog.findMany({
      where: { entityId: req.params.entityId },
      orderBy: { sentAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    logger.error('GET /notifications/entity/:entityId error', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});
