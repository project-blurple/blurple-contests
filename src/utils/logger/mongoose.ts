import { createFileTransports, globalFormat } from ".";
import { createLogger } from "winston";

export const mongooseLogger = createLogger({
  format: globalFormat,
  transports: [...createFileTransports("database", ["debug"])],
});
