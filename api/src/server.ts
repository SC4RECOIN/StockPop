import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import ky from 'ky';
import { appRouter } from './router';

async function main() {
  // express implementation
  const app = express();

  // For testing purposes, wait-on requests '/'
  app.get('/', (_req, res) => {
    res.send('Server is running!');
  });

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
    }),
  );

  // rpc proxy
  app.post('/rpc', express.json(), async (req, res) => {
    try {
      console.log('RPC request A');

      const resA = await fetch(process.env.SOLANA_RPC_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      console.log(resA.status)
      const resB = await resA.json()
      console.log(resB)

      console.log('RPC request B');

      const response = await ky.post(process.env.SOLANA_RPC_URL!, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('RPC proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy RPC request' });
    }
  })

  console.log('Listening on port 3000');
  app.listen(3000);
}

void main();