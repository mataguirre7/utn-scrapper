import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { logger } from '../utils/logger';
import { coursesRouter } from './routes/courses';
import { activitiesRouter } from './routes/activities';
import { materialsRouter } from './routes/materials';
import { eventsRouter } from './routes/events';
import { notificationsRouter } from './routes/notifications';

const app: Express = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/courses', coursesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  logger.log(`🚀 API server running on http://localhost:${PORT}`);
});
