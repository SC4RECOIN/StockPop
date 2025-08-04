import {
  JupiterUltraOrderResponse,
  JupiterUltraService,
} from "@/services/tradeService";
import { useState, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { PublicKey } from "@solana/web3.js";

interface UseSwapQuoteProps {
  selectedStock: any | null;
  pubkey: PublicKey | null;
  actionType: "buy" | "sell" | null;
}

export default function useSwapQuote({
  selectedStock,
  pubkey,
  actionType,
}: UseSwapQuoteProps) {
  // Trade amount states with debounce to prevent excessive API calls
  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounce(amount, 1000);

  // Swap quote states for trading
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [swapQuote, setSwapQuote] = useState<JupiterUltraOrderResponse | null>(
    null
  );
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const resetQuote = () => {
    setSwapQuote(null);
    setQuoteError(null);
  };

  const fetchSwapQuote = useCallback(async () => {
    // Validate required data
    if (
      !selectedStock ||
      !pubkey ||
      !debouncedAmount ||
      parseFloat(debouncedAmount) <= 0
    ) {
      setSwapQuote(null);
      return;
    }

    try {
      setIsLoadingQuote(true);
      setQuoteError(null);

      const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      let [input, output] = [USDC, selectedStock.id];
      let decimals = 6;

      if (actionType === "sell") {
        [input, output] = [selectedStock.id, USDC];
        decimals = selectedStock.decimals;
      }

      // Convert input amount to the correct unit based on token decimals
      const inputAmountBase = JupiterUltraService.toBaseUnits(
        debouncedAmount,
        decimals
      );

      console.log(
        `Getting swap quote for ${debouncedAmount} ${selectedStock.symbol} (${inputAmountBase} base units)`
      );

      const order = await JupiterUltraService.getSwapOrder(
        input,
        output,
        inputAmountBase.toString(),
        pubkey.toString()
      );

      console.log(
        `Received swap quote: ${order.inAmount} -> ${order.outAmount}`
      );
      setSwapQuote(order);

      if (order.errorMessage) {
        setQuoteError(order.errorMessage);
      }
    } catch (error) {
      console.error("Error fetching swap quote:", error);
      setQuoteError(
        error instanceof Error ? error.message : "Failed to get swap quote"
      );
    } finally {
      setIsLoadingQuote(false);
    }
  }, [selectedStock, pubkey, debouncedAmount, actionType]);

  // Reset quote state and fetch new quote when amount changes
  const resetAndFetchQuote = useCallback(() => {
    setQuoteError(null);
    setSwapQuote(null);

    // Only fetch if we have an amount
    if (debouncedAmount) {
      fetchSwapQuote();
    }
  }, [debouncedAmount, fetchSwapQuote]);

  return {
    amount,
    setAmount,
    debouncedAmount,
    isLoadingQuote,
    swapQuote,
    quoteError,
    setQuoteError,
    setSwapQuote,
    fetchSwapQuote,
    resetAndFetchQuote,
    resetQuote,
  };
}
