import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import env from "./config/index.js";
import io from "./socket/index.js";
import { authRoutes } from "./routes/auth.route.js";
import { protectedRoutes } from "./routes/protected.routes.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middlewares/error.handler.js";

const app = Fastify({
    loggerInstance: logger
});

app.register(fastifyCors, { origin: env.CLIENT_URL, credentials: true });
app.register(fastifyCookie);
app.register(errorHandler);

app.get("/health", async (_request, reply) => {
    reply.send({ status: "ok" });
});

app.register(authRoutes, { prefix: "/auth" });
app.register(protectedRoutes, { prefix: "/api" });

const start = async () => {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    io.attach(app.server);
};

start().catch((err) => {
    logger.error(err, "Server failed to start");
    process.exit(1);
});