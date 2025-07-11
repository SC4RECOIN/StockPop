import { AppRouter } from "@/api/src/router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { inferRouterOutputs } from "@trpc/server";

export type ApiTypes = inferRouterOutputs<AppRouter>;

export function useApiClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_API_URL}/trpc`,
      }),
    ],
  });
}
