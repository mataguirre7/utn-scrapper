import { Router, Request, Response } from 'express';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

export const activitiesRouter = Router();

activitiesRouter.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const activities = await prisma.activity.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { dueDate: 'asc' },
    });

    res.json(activities);
  } catch (error) {
    logger.error('GET /activities/course/:courseId error', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

activitiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    logger.error('GET /activities/:id error', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});
