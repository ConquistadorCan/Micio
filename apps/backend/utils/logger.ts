import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const betterStackSourceToken = process.env.BETTERSTACK_SOURCE_TOKEN;
const betterStackIngestingHost = process.env.BETTERSTACK_INGESTING_HOST;

const betterStackEndpoint = betterStackIngestingHost
  ? betterStackIngestingHost.startsWith("http")
    ? betterStackIngestingHost
    : `https://${betterStackIngestingHost}`
  : undefined;

const shouldSendErrorsToBetterStack = Boolean(
  !isDev && betterStackSourceToken && betterStackEndpoint
);

const consoleTarget = {
  target: "pino-pretty",
  level: isDev ? "debug" : "info",
  options: {
    colorize: isDev,
    translateTime: "SYS:HH:MM:ss",
    ignore: "pid,hostname",
    singleLine: !isDev,
  },
};

const targets = shouldSendErrorsToBetterStack
  ? [
      consoleTarget,
      {
        target: "@logtail/pino",
        level: "error",
        options: {
          sourceToken: betterStackSourceToken,
          options: {
            endpoint: betterStackEndpoint,
          },
        },
      },
    ]
  : [consoleTarget];

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: { targets },
});
