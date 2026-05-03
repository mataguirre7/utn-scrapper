import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { logger } from '../utils/logger';
import { coursesRouter } from './routes/courses';
import { activitiesRouter } from './routes/activities';
import { materialsRouter } from './routes/materials';
import { eventsRouter } from './routes/events';
import { notificationsRouter } from './routes/notifications';

const app: Express = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check (no Prisma required)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (Prisma initialized on first request)
app.use('/api/courses', coursesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/notifications', notificationsRouter);

const server = app.listen(PORT, () => {
  logger.log(`🚀 API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.log('Server closed');
    process.exit(0);
  });
});
