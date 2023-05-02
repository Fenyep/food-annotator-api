import express from 'express';
import cors from 'cors'
import { fileURLToPath } from 'url';
import path from 'path'
import { csvRouter } from './routes/csv.routes.js';
import { sparklRouter } from './routes/sparkql.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cors({ origin: '*' }))

app.use('/upload', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/csv', csvRouter);

app.use('/api/v1/sparkql', sparklRouter);

