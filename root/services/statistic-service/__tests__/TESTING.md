# Testing Guide: Statistic Service

This document outlines the testing strategy for the **Statistic Service**. The tests are written using [Vitest](https://vitest.dev/) for the test framework and [Supertest](https://github.com/ladjs/supertest) for HTTP assertions.

## Test File Structure

The primary test file for the API routes is:
- `__tests__/statistics.routes.test.ts`

## Testing Philosophy

The tests are designed as **integration tests** at the route level. This means that instead of testing the service functions in isolation, we test the Express routes and mock the underlying services that they depend on. This approach provides a more realistic test of the API's behavior from an external consumer's perspective.

## Test Flow Breakdown

The `statistics.routes.test.ts` file is divided into two main test suites:

### 1. `describe("statistics routes", ...)`

This suite tests the primary statistics-fetching endpoint: `GET /statistics/:workspaceId`.

**Flow:**
1.  **Mock the Service**: Before each test, `vi.spyOn(service, "getStatistics")` is used to intercept calls to the `getStatistics` function from the `statistics` service.
2.  **Set Mock Behavior**:
    -   For the success case, `.mockResolvedValue(...)` is used to make the service return a predefined, successful statistics payload.
    -   For the failure case, `.mockRejectedValue(new Error("..."))` is used to simulate the service throwing an error.
3.  **Create Express App**: A new `express` app instance is created for each test to ensure isolation. The `statisticsRoutes` are loaded into this app.
4.  **Make HTTP Request**: `supertest` is used to make a `GET` request to the test server (e.g., `request(app).get("/statistics/workspace-1?range=7d")`).
5.  **Assert the Response**:
    -   `expect(response.status).toBe(...)` checks that the HTTP status code is correct (e.g., `200` for success, `500` for a server error).
    -   `expect(response.body).toEqual(...)` checks that the JSON body of the response matches the expected output.

### 2. `describe("statistics export routes", ...)`

This suite is dedicated to testing the data export endpoint: `GET /statistics/:workspaceId/export`.

The key difference here is how the service is mocked, because the `exportStatistics` function is responsible for directly writing the HTTP response.

**Flow:**
1.  **Mock the Export Service**: `vi.spyOn(exportService, "exportStatistics")` is used to intercept calls to the `exportStatistics` function.
2.  **Set Mock Behavior (Important!)**:
    -   Instead of `mockResolvedValue`, we use `.mockImplementation(async (res) => { ... })`.
    -   The mock implementation receives the Express `Response` object (`res`) as an argument.
    -   Inside the mock, we **manually end the request** by calling `res.status(200).send("mock csv")` or `res.status(200).json({ mock: "json" })`.
    -   **Why?**: If we only use `mockResolvedValue`, the mock will return a promise, but it will **never** send a response to `supertest`, causing the test to time out. The mock implementation ensures the HTTP request is properly closed.
3.  **Make HTTP Request**: `supertest` makes a `GET` request to the `/export` endpoint with different `format` query parameters (`csv`, `json`).
4.  **Assert the Call**:
    -   `expect(spy).toHaveBeenCalledWith(...)` is used to verify that the `exportStatistics` function was called.
    -   `expect.objectContaining({...})` is used to make the assertion more flexible, checking only for the key properties in the `query` object without worrying about exact object equality or property order. This makes the test less brittle.
5.  **Assert the Response**: We check that the status code is `200` to confirm the request was handled successfully.

By following this flow, the tests ensure that the routes correctly parse parameters, call the appropriate services with the right arguments, and handle both success and error conditions gracefully.
