import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const errorHandler: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError && error.isOperational) {
      logger.warn(
        { code: error.code, statusCode: error.statusCode, url: request.url },
        error.message
      );

      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if (error instanceof AppError) {
      logger.error(
        { code: error.code, statusCode: error.statusCode, url: request.url, err: error },
        "Non-operational app error"
      );

      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: "An unexpected error occurred",
        },
      });
    }

    logger.error(
      { err: error, url: request.url, method: request.method },
      "Unhandled error"
    );

    const isProd = process.env.NODE_ENV === "production";
    const message = !isProd && error instanceof Error ? error.message : "Internal server error";

    return reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    });
  });
};
