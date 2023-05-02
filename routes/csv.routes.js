import express from "express";

import { upload } from '../middleware/multer-config.js'

import { annotateFiles } from "../controllers/csv/csv_controller.js";

export const csvRouter = express.Router();

// csvRouter.post('/upload', upload, uploadFile);

// csvRouter.post('/read', upload, readFile);
csvRouter.post('/read', upload, annotateFiles);