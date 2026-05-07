import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import variantRoutes from './routes/variants';
import teamRoutes from './routes/teams';
import pdfRoutes from './routes/pdf';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'http://localhost:8080' : '*' }));
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
