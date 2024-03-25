import winston from "winston";
import createLogger from "./logger";

export const middlewareLog = createLogger("middleware");
export const indexLog = createLogger("index");
export const coreLog = createLogger("core");