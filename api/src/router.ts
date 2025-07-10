import { initTRPC } from '@trpc/server';
import axios, { AxiosResponse } from 'axios';
import { StocksResponse } from './models';
import NodeCache from 'node-cache';

const STOCKS_URL = "https://datapi.jup.ag/v1/pools/xstocks/24h"

const cache = new NodeCache({ stdTTL: 60 });
const stocksKey = 'stocks';

const t = initTRPC.create();
const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  stocks: {
    tradable: publicProcedure
      .query(async () => {
        if (cache.has(stocksKey)) {
          return cache.get<StocksResponse>(stocksKey)!;
        }

        const response: AxiosResponse<StocksResponse> = await axios.get(STOCKS_URL);
        cache.set(stocksKey, response.data);

        return response.data
      }),
  },
});

export type AppRouter = typeof appRouter;