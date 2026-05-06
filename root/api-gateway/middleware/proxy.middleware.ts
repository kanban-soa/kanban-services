import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import config from '../config/env';
import { logger } from '../lib/logger';
import { sendGatewayError } from '../utils/response';

const spoofableHeaders = new Set([
  'x-user-id',
  'x-user-email',
  'x-user-role',
  'x-request-id',
]);

const stripResponseHeaderPrefixes = ['x-internal-'];
const stripResponseHeaders = new Set(['x-powered-by', 'server']);

function buildForwardHeaders(req: AuthenticatedRequest): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (spoofableHeaders.has(key.toLowerCase())) {
      continue;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(','));
    }
  }

  headers.set('x-request-id', req.requestId);
  headers.set('x-forwarded-for', req.ip ?? '');
  headers.set('x-forwarded-proto', req.protocol);
  headers.set('x-gateway-version', '1.0');

  if (req.user?.id) {
    headers.set('x-user-id', req.user.id);
  }
  if (req.user?.email) {
    headers.set('x-user-email', req.user.email);
  }
  if (req.user?.role) {
    headers.set('x-user-role', req.user.role);
  }

  // Do not forward the original content-length because we are re-serializing the body
  headers.delete('content-length');

  return headers;
}

function buildTargetUrl(req: AuthenticatedRequest): string {
  const route = req.matchedRoute;
  if (!route) {
    return '';
  }

  const originalUrl = req.originalUrl ?? req.url;
  const queryIndex = originalUrl.indexOf('?');
  const query = queryIndex >= 0 ? originalUrl.slice(queryIndex) : '';
  const rawPath = req.path;
  const rewrittenPath = route.rewrite ? route.rewrite(rawPath) : rawPath;

  return `${route.target}${rewrittenPath}${query}`;
}

function stripUpstreamHeaders(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (stripResponseHeaders.has(lowerKey)) {
      return;
    }
    if (stripResponseHeaderPrefixes.some((prefix) => lowerKey.startsWith(prefix))) {
      return;
    }
    output[key] = value;
  });
  return output;
}

export async function proxyMiddleware(req: AuthenticatedRequest, res: Response): Promise<void> {
  const route = req.matchedRoute;
  if (!route) {
    sendGatewayError(res, req, 404, 'not_found', 'No gateway route matched this path');
    return;
  }

  if (route.methods && !route.methods.includes(req.method)) {
    sendGatewayError(res, req, 404, 'not_found', 'No gateway route matched this path');
    return;
  }

  const targetUrl = buildTargetUrl(req);
  if (!targetUrl) {
    sendGatewayError(res, req, 404, 'not_found', 'No gateway route matched this path');
    return;
  }

  const headers = buildForwardHeaders(req);
  const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
  const startTime = Date.now();
  const clientId = req.user?.id ?? req.ip ?? 'anon';

  try {
    let bodyBuffer: Buffer | undefined = undefined;
    if (hasBody) {
      const chunks: any[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      bodyBuffer = Buffer.concat(chunks);
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
      signal: AbortSignal.timeout(config.upstreamTimeoutMs),
    };

    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = stripUpstreamHeaders(response.headers);
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);

    const durationMs = Date.now() - startTime;
    logger.logRequest({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl ?? req.url,
      routePrefix: route.prefix,
      clientId,
      statusCode: response.status,
      durationMs,
      userAgent: req.headers['user-agent'],
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.logRequest({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl ?? req.url,
      routePrefix: route.prefix,
      clientId,
      statusCode: 502,
      durationMs,
      userAgent: req.headers['user-agent'],
    });

    if (error instanceof DOMException && error.name === 'AbortError') {
      sendGatewayError(res, req, 504, 'upstream_timeout', 'Service did not respond in time');
      return;
    }

    sendGatewayError(res, req, 502, 'upstream_unavailable', 'Could not reach upstream service');
  }
}

