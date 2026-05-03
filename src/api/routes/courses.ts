import { Router, Request, Response } from 'express';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

export const coursesRouter = Router();

coursesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { activities: true, materials: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const withStats = courses.map(c => ({
      id: c.id,
      externalId: c.externalId,
      name: c.name,
      url: c.url,
      active: c.active,
      activitiesCount: c._count.activities,
      materialsCount: c._count.materials,
      lastSeenAt: c.lastSeenAt,
      firstSeenAt: c.firstSeenAt,
    }));

    res.json(withStats);
  } catch (error) {
    logger.error('GET /courses error', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

coursesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        activities: {
          orderBy: { dueDate: 'asc' },
        },
        materials: true,
        calendarEvents: true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    logger.error(`GET /courses/:id error`, error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});
