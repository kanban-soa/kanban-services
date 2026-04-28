import app from "./index";

const serverStartMs = Date.now();

function toNumber(value: unknown, fallback = 0) {
  const asNumber = typeof value === "number" ? value : Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptimeMs: Date.now() - serverStartMs,
  });
});

app.get("/",(req, res) => {
    res.json({
        message: "Welcome to the Statistic Service API",
} )});

