import { Router, Request, Response } from 'express';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

export const materialsRouter = Router();

materialsRouter.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const materials = await prisma.material.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { title: 'asc' },
    });

    res.json(materials);
  } catch (error) {
    logger.error('GET /materials/course/:courseId error', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

materialsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    logger.error('GET /materials/:id error', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});
