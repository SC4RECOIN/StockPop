import { initTRPC, TRPCError } from "@trpc/server";
import {
  BalancesResponse,
  PoolWithBalance,
  RpcBalanceResponse,
  StocksResponse,
} from "./models";
import {
  GetOptionsOpenClose200Response,
  GetStocksAggregates200ResponseAllOfResultsInner,
  GetStocksAggregatesTimespanEnum,
  ListNews200ResponseResultsInner,
  restClient,
} from "@polygon.io/client-js";
import NodeCache from "node-cache";
import { z } from "zod";
import {
  stockDescriptions,
  stockIndustries,
  stockSectors,
} from "./descriptions";

const STOCKS_URL = "https://datapi.jup.ag/v1/pools/xstocks/24h";
const cache = new NodeCache({ stdTTL: 60 });

// cache keys
const stocksKey = "stocks";
const newsKey = (ticker: string) => `news:${ticker}`;
const summaryKey = (ticker: string) => `summary:${ticker}`;
const barsKey = (ticker: string, barSize: number) =>
  `bars:${ticker}:${barSize}`;
const balancesKey = (wallet: string) => `balances:${wallet}`;

const t = initTRPC.create();
const publicProcedure = t.procedure;
const router = t.router;

const polySDK = restClient(process.env.POLYGON_API_KEY!);

const ETFs = ["SPYx", "QQQx", "GLDx"];

export const appRouter = router({
  stocks: {
    tradable: publicProcedure.query(async () => {
      try {
        return await getStocks();
      } catch (error: any) {
        console.error("Error fetching stock data:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get stock data",
          cause: error,
        });
      }
    }),
    news: publicProcedure.input(z.string()).query(async ({ input }) => {
      input = trimTicker(input);

      if (cache.has(newsKey(input))) {
        const news = cache.get<Array<ListNews200ResponseResultsInner>>(
          newsKey(input)
        )!;
        return { news };
      }

      const response = await polySDK.listNews(input);

      if (response.results) {
        // cache the news results for 5 minutes
        cache.set(newsKey(input), response.results ?? [], 300);
      }

      return { news: response.results ?? [] };
    }),
    summary: publicProcedure.input(z.string()).query(async ({ input }) => {
      input = trimTicker(input);

      if (cache.has(summaryKey(input))) {
        const news = cache.get<GetOptionsOpenClose200Response>(
          summaryKey(input)
        )!;
        return { news };
      }

      const response = await polySDK.getStocksOpenClose(
        input,
        getCurrentDate(),
        true
      );
      cache.set(summaryKey(input), response);

      return response;
    }),
    bars: publicProcedure
      .input(
        z.object({
          ticker: z.string(),
          barSize: z.number(),
        })
      )
      .query(async ({ input }) => {
        const ticker = trimTicker(input.ticker);
        const barSize = input.barSize;
        const key = barsKey(ticker, barSize);

        if (cache.has(key)) {
          const bars =
            cache.get<Array<GetStocksAggregates200ResponseAllOfResultsInner>>(
              key
            )!;
          return { bars };
        }

        // start of next day
        const to = new Date();
        to.setDate(to.getDate() + 1);

        let from = new Date();
        let span = GetStocksAggregatesTimespanEnum.Minute;
        let size = barSize;

        if (barSize === 15) {
          // subtract 24h from the current date
          from.setDate(from.getDate() - 1);
        } else if (barSize === 60) {
          // subtract 7 days from the current date
          from.setDate(from.getDate() - 7);

          // use hour timespan
          span = GetStocksAggregatesTimespanEnum.Hour;
          size = 1;
        } else if (barSize === 1440) {
          // subtract 30 days from the current date
          from.setDate(from.getDate() - 30);

          // use day timespan
          span = GetStocksAggregatesTimespanEnum.Day;
          size = 1;
        }

        // Adjust for weekends
        const dayOfWeek = from.getDay();
        if (dayOfWeek === 0) {
          from.setDate(from.getDate() - 2); // Subtract 2 days if Sunday
        } else if (dayOfWeek === 6) {
          from.setDate(from.getDate() - 1); // Subtract 1 day if Saturday
        }

        const response = await polySDK.getStocksAggregates(
          ticker,
          size,
          span,
          dateToString(from),
          dateToString(to),
          true
        );

        if (response.results) {
          cache.set(key, response.results ?? []);
        }

        return { bars: response.results ?? [] };
      }),
  },
  wallet: {
    balances: publicProcedure.input(z.string()).query(async ({ input }) => {
      const key = balancesKey(input);
      if (cache.has(key)) {
        return cache.get<BalancesResponse>(key)!;
      }

      try {
        const stocks = await getStocks();
        const pools = stocks.pools as PoolWithBalance[];
        const balances: { [key: string]: number } = {};

        const programs = [
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        ];

        const results = await Promise.all(
          programs.map(async (program) => {
            const response = await fetch(process.env.SOLANA_RPC_URL!, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: "1",
                method: "getTokenAccountsByOwner",
                params: [
                  input,
                  { programId: program },
                  { encoding: "jsonParsed" },
                ],
              }),
            });
            return (await response.json()) as RpcBalanceResponse;
          })
        );

        for (const result of results) {
          for (const value of result.result.value) {
            const token = value.account.data.parsed.info.mint;
            const amount = parseFloat(
              value.account.data.parsed.info.tokenAmount.uiAmountString
            );

            if (amount === 0) continue;

            const pool = pools.find((pool) => pool.baseAsset.id === token);
            if (pool) {
              pool.balance = amount;
            } else {
              balances[token] = amount;
            }
          }
        }

        const resp = {
          pools,
          other: balances,
        };

        cache.set(key, resp, 2); // cache for 10 seconds

        return resp;
      } catch (error: any) {
        console.error("Error fetching balances::", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get balances",
          cause: error,
        });
      }
    }),
  },
});

async function getStocks(): Promise<StocksResponse> {
  if (cache.has(stocksKey)) {
    return cache.get<StocksResponse>(stocksKey)!;
  }
  const response = await fetch(STOCKS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
    },
  });
  const data = (await response.json()) as StocksResponse;

  // add additional properties to each asset
  data.pools = data.pools.map((pool) => {
    pool.baseAsset.category = ETFs.includes(pool.baseAsset.symbol)
      ? "etf"
      : "stock";
    pool.baseAsset.description =
      stockDescriptions[pool.baseAsset.symbol] ?? "No description available";
    pool.baseAsset.sector = stockSectors[pool.baseAsset.symbol];
    pool.baseAsset.industry = stockIndustries[pool.baseAsset.symbol];
    return pool;
  });

  cache.set(stocksKey, data);

  return data;
}

function trimTicker(ticker: string): string {
  // get rid of the 'x' at the end of the symbol if it exists (xStocks)
  if (ticker.endsWith("x")) {
    return ticker.slice(0, -1);
  }
  return ticker.toUpperCase();
}

const getCurrentDate = () => {
  return dateToString(new Date());
};

const dateToString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type AppRouter = typeof appRouter;
