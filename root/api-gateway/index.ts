import express from 'express';
import { corsMiddleware } from './middleware/cors.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { proxyMiddleware } from './middleware/proxy.middleware';
import { matchRoute } from './config/routes';

const app = express();

// 1. CORS — must be first so OPTIONS preflight gets correct headers
app.use(corsMiddleware);

// 2. Request ID — inject before any logging or processing
app.use(requestIdMiddleware);

// 3. Health check — bypass auth and rate limiting entirely
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// 4. Route matching — attach matched route to request
app.use((req: any, _res, next) => {
  req.matchedRoute = matchRoute(req.path);
  next();
});

// 5. Auth — validate JWT where required
app.use(authMiddleware as any);

// 6. Rate limiting — enforce per-client limits
app.use(rateLimitMiddleware as any);

// 7. Proxy — forward to upstream and return response
app.use((req: any, res) => {
  proxyMiddleware(req, res);
});

// 8. 404 fallback — no route matched
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'No gateway route matched this path' });
});

export default app;

