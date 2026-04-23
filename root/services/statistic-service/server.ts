import app from "./index";

const serverStartMs = Date.now();

function toNumber(value: unknown, fallback = 0) {
  const asNumber = typeof value === "number" ? value : Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
}

const statistics = {
  totalUsers: 1000,
  activeUsers: 800,
  newUsersToday: 50,
  totalRevenue: 50000,
};

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptimeMs: Date.now() - serverStartMs,
  });
});

app.get("/api/statistics", (req, res) => {
  res.json(statistics);
});

app.get("/",(req, res) => {
    res.json({
        message: "Welcome to the Statistic Service API",
} )});

app.post("/api/statistics/refresh", (req, res) => {
  const body = typeof req.body === "object" && req.body ? req.body : {};
  statistics.totalUsers = toNumber((body as { totalUsers?: unknown }).totalUsers, statistics.totalUsers);
  statistics.activeUsers = toNumber((body as { activeUsers?: unknown }).activeUsers, statistics.activeUsers);
  statistics.newUsersToday = toNumber((body as { newUsersToday?: unknown }).newUsersToday, statistics.newUsersToday);
  statistics.totalRevenue = toNumber((body as { totalRevenue?: unknown }).totalRevenue, statistics.totalRevenue);

  res.json({
    updated: true,
    statistics,
  });
});
