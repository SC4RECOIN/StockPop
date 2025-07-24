import { initTRPC, TRPCError } from '@trpc/server';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { StocksResponse } from './models';
import NodeCache from 'node-cache';
import { stockDescriptions } from './descriptions';

const STOCKS_URL = "https://datapi.jup.ag/v1/pools/xstocks/24h"
const cache = new NodeCache({ stdTTL: 60 });
const stocksKey = 'stocks';

const t = initTRPC.create();
const publicProcedure = t.procedure;
const router = t.router;

const ETFs = ['SPYx', 'QQQx', 'GLDx']

// Avoid 403 on Jupiter
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36';

export const appRouter = router({
  stocks: {
    tradable: publicProcedure
      .query(async () => {
        if (cache.has(stocksKey)) {
          return cache.get<StocksResponse>(stocksKey)!;
        }

        try {
          const response: AxiosResponse<StocksResponse> = await axios.get(STOCKS_URL);

          // add additional properties to each asset
          response.data.pools.map(pool => {
            pool.baseAsset.category = ETFs.includes(pool.baseAsset.symbol) ? 'etf' : 'stock';
            pool.baseAsset.description = stockDescriptions[pool.baseAsset.symbol] ?? 'No description available';
            pool.baseAsset.sector = pool.baseAsset.sector;
            pool.baseAsset.industry = pool.baseAsset.industry;
            return pool
          });

          cache.set(stocksKey, response.data);

          return response.data
        } catch (error: any) {
          console.error('Error fetching stock data:', error.response?.status, error.response?.data);

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get stock data',
            cause: error,
          });
        }
      }),
  },
});

export type AppRouter = typeof appRouter;