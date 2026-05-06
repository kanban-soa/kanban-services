import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

export function registerSwaggerDocs(app: Express) {
  app.get("/docs.json", (req, res) => {
    res.json(openApiDocument);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}

