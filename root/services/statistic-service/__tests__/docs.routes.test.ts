import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { registerSwaggerDocs } from "../api/docs/swagger";

describe("swagger docs", () => {
  it("serves the OpenAPI document", async () => {
    const app = express();
    registerSwaggerDocs(app);

    const response = await request(app).get("/docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(response.body.paths["/api/v1/statistics"]).toBeDefined();
  });

  it("serves the Swagger UI", async () => {
    const app = express();
    registerSwaggerDocs(app);

    const response = await request(app).get("/docs/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Swagger UI");
  });
});
