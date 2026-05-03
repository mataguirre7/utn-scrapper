import { Router, Request, Response } from 'express';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

export const eventsRouter = Router();

eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const events = await prisma.calendarEvent.findMany({
      include: { course: true },
      orderBy: { dueDate: 'asc' },
    });

    res.json(events);
  } catch (error) {
    logger.error('GET /events error', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

eventsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const event = await prisma.calendarEvent.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    logger.error('GET /events/:id error', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});
