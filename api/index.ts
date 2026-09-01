import app from '../server.ts';

export default function handler(req: any, res: any) {
  try {
    // If request URL was rewritten without /api prefix, prepend /api so Express routes match
    if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/health')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return app(req, res);
  } catch (err: any) {
    console.error('[Serverless Handler Error]', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: 'Authentication service temporarily unavailable'
      });
    }
  }
}
