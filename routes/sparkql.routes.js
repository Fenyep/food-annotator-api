import express from "express";
import { blazeQuery } from "../controllers/sparkql/blaze_controller.js";


export const sparklRouter = express.Router();

sparklRouter.post('/readBlaze', blazeQuery);