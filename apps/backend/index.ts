import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import env from "./config/index.js";
import io from "./socket/index.js";
import { authRoutes } from "./routes/auth.route.js";
import { conversationRoutes } from "./routes/conversation.route.js";

const app = Fastify({
    logger: true
});

app.register(fastifyCookie);

app.get("/health", async (request, reply) => {
    reply.send({ status: "ok" });
});

app.register(authRoutes, { prefix: "/auth" });
app.register(conversationRoutes, { prefix: "/api" });

app.listen({ port: env.PORT }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    io.attach(app.server);
});