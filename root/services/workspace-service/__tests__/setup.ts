import { vi } from "vitest";

// Avoid the real Postgres pool being initialized at module-load time.
// The DB layer is mocked at the repository level in each test file,
// but importing services pulls lib/db transitively, so we stub it here.
vi.mock("@workspace-service/lib/db", () => ({
  db: {},
}));

// Silence logger output during tests.
vi.mock("@workspace-service/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../common/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../../common/middleware/request-logger", () => ({
  requestLogger: () => (_req: any, _res: any, next: any) => next(),
}));
