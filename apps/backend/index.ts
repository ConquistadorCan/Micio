import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import env from "./config/index.js";
import io from "./socket/index.js";
import { authRoutes } from "./routes/auth.route.js";
import { protectedRoutes } from "./routes/protected.routes.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middlewares/error.handler.js";

const app = Fastify({
    loggerInstance: logger
});

app.register(fastifyCookie);
app.register(errorHandler);

app.get("/health", async (_request, reply) => {
    reply.send({ status: "ok" });
});

app.register(authRoutes, { prefix: "/auth" });
app.register(protectedRoutes, { prefix: "/api" });

const start = async () => {
    await app.listen({ port: env.PORT });
    io.attach(app.server);
};

start().catch((err) => {
    logger.error(err, "Server failed to start");
    process.exit(1);
});