import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const betterStackSourceToken = process.env.BETTERSTACK_SOURCE_TOKEN;
const betterStackIngestingHost = process.env.BETTERSTACK_INGESTING_HOST;

const betterStackEndpoint = betterStackIngestingHost
  ? betterStackIngestingHost.startsWith("http")
    ? betterStackIngestingHost
    : `https://${betterStackIngestingHost}`
  : undefined;

const shouldSendToBetterStack = Boolean(
  !isDev && betterStackSourceToken && betterStackEndpoint
);

export const logger = pino(
  isDev
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        level: "info",
        transport: shouldSendToBetterStack
          ? {
              targets: [
                {
                  target: "pino/file",
                  level: "info",
                  options: { destination: 1 },
                },
                {
                  target: "@logtail/pino",
                  level: "info",
                  options: {
                    sourceToken: betterStackSourceToken,
                    options: {
                      endpoint: betterStackEndpoint,
                    },
                  },
                },
              ],
            }
          : undefined,
      }
);
