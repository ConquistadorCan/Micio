import Fastify from "fastify";
import env from "./config/index.js";

const app = Fastify({
    logger: true
});

app.get("/health", async (request, reply) => {
    reply.send({ status: "ok" });
});

app.listen({ port: env.PORT }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});