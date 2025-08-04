import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { Text, View } from "@/components/Themed";
import { BaseAsset } from "@/api/src/models";
import {
  JupiterUltraOrderResponse,
  JupiterUltraService,
} from "@/services/tradeService";
import Modal from "react-native-modal";
import { useWallet } from "../WalletContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import useSwapQuote from "./useSwapQuote";
import { VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "expo-router";
import { Notifier } from "react-native-notifier";
import { getInfoAlert, getErrorAlert } from "../utils";

interface ActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  actionType: "buy" | "sell" | null;
  selectedStock: BaseAsset | null;
}

export default function ActionModal({
  isVisible,
  onClose,
  actionType,
  selectedStock,
}: ActionModalProps) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { pubkey, solBalance, signTransaction } = useWallet();
  const [signingLoading, setSigningLoading] = useState(false);

  const {
    amount,
    setAmount,
    isLoadingQuote,
    swapQuote,
    quoteError,
    resetQuote,
  } = useSwapQuote({
    selectedStock,
    pubkey,
    actionType,
  });

  // Wallet errors
  const solThreshold = 0.005;
  const solBelowThreshold = solBalance < solThreshold;
  const buyError = !pubkey
    ? "Connect your wallet"
    : solBelowThreshold
    ? "Insufficient SOL balance"
    : "";

  // Get balances available for trading
  const { data: balanceData } = useQuery({
    queryKey: ["balances", pubkey],
    queryFn: () => client.wallet.balances.query(pubkey!.toBase58()),
    enabled: !!pubkey,
    refetchInterval: 10_000,
  });
  const [stockBalance, usdCash] = useMemo(
    () => [
      balanceData?.pools.find((pool) => pool.baseAsset.id === selectedStock?.id)
        ?.balance ?? 0,
      balanceData?.other["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"] ?? 0,
    ],
    [balanceData?.other]
  );

  const closeModal = () => {
    setAmount("");
    resetQuote();
    onClose();
  };

  // Execute the swap action (buy/sell)
  const handleAction = useCallback(async () => {
    // Validate all required data is present
    if (!swapQuote || !selectedStock || !pubkey || !swapQuote.transaction) {
      console.error("Cannot execute swap: missing required data");
      return;
    }

    try {
      setSigningLoading(true);

      // Deserialize and sign transaction
      const unSignedTransaction = VersionedTransaction.deserialize(
        Buffer.from(swapQuote.transaction, "base64")
      );
      const transaction = await signTransaction(unSignedTransaction);

      // Send the transaction
      await JupiterUltraService.executeSwapOrder(
        transaction,
        swapQuote.requestId
      );

      // Wait for transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Refresh balances and close modal
      await queryClient.invalidateQueries({ queryKey: ["balances", pubkey] });
      closeModal();

      // Navigate to portfolio with refresh parameter
      router.push({
        pathname: "/(tabs)",
        params: { balanceUpdate: selectedStock.id },
      });

      // Show success notification
      Notifier.showNotification(
        getInfoAlert(
          "Swap Success",
          `${actionType === "buy" ? "Bought" : "Sold"} ${selectedStock.symbol}`
        )
      );
    } catch (error) {
      console.error("Error executing swap:", error);
      Notifier.showNotification(
        getErrorAlert(error as Error, "Error executing swap")
      );
    } finally {
      setSigningLoading(false);
    }
  }, [swapQuote, selectedStock, pubkey, actionType, amount]);

  // Format price impact percentage for display
  const formatPriceImpact = useCallback(
    (priceImpactPct: string | undefined) => {
      if (!priceImpactPct) return "0.00%";
      const impact = parseFloat(priceImpactPct);
      return `${impact > 0 ? "+" : ""}${(impact * 100).toFixed(2)}%`;
    },
    []
  );

  const quoteOutput =
    swapQuote &&
    selectedStock &&
    JupiterUltraService.fromBaseUnits(
      swapQuote.outAmount,
      actionType === "buy" ? selectedStock.decimals : 6
    );

  return (
    <Modal isVisible={isVisible} onBackdropPress={closeModal}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {actionType === "buy" ? "Buy" : "Sell"} {selectedStock?.symbol}
        </Text>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Available:</Text>
          <TouchableOpacity
            onPress={() => {
              if (actionType === "buy") {
                setAmount(usdCash.toString());
              } else {
                setAmount(stockBalance.toString());
              }
            }}
          >
            <Text style={[styles.balanceValue]}>
              {actionType === "buy"
                ? `${usdCash.toFixed(2)} USD`
                : `${stockBalance.toFixed(6)} ${selectedStock?.symbol}`}{" "}
            </Text>
          </TouchableOpacity>
        </View>
        <RNView style={styles.inputContainer}>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter amount"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <TouchableOpacity
            style={styles.maxButton}
            onPress={() => {
              if (actionType === "buy") {
                setAmount(usdCash.toString());
              } else {
                setAmount(stockBalance.toString());
              }
            }}
          >
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </RNView>

        {isLoadingQuote && (
          <RNView style={styles.quoteLoadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.quoteLoadingText}>Getting quote...</Text>
          </RNView>
        )}

        {quoteError && (
          <RNView style={styles.quoteErrorContainer}>
            <Text style={styles.quoteErrorText}>{quoteError}</Text>
          </RNView>
        )}

        {buyError && (
          <RNView style={styles.quoteErrorContainer}>
            <Text style={styles.quoteErrorText}>{buyError}</Text>
          </RNView>
        )}

        {swapQuote && !isLoadingQuote && quoteOutput && (
          <RNView style={styles.quoteInfoContainer}>
            <RNView style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>You'll receive:</Text>
              <Text style={styles.quoteValue}>
                {actionType === "buy"
                  ? `${quoteOutput.toFixed(6)} ${selectedStock?.symbol}`
                  : `${quoteOutput.toFixed(2)} USD`}
              </Text>
            </RNView>

            <RNView style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>Exchange Rate:</Text>
              <Text style={styles.quoteValue}>
                1 {selectedStock?.symbol} ≈{" "}
                {(actionType === "buy"
                  ? JupiterUltraService.fromBaseUnits(swapQuote.inAmount, 6) /
                    quoteOutput
                  : quoteOutput /
                    JupiterUltraService.fromBaseUnits(
                      swapQuote.inAmount,
                      selectedStock!.decimals
                    )
                ).toFixed(2)}{" "}
                USD
              </Text>
            </RNView>

            <RNView style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>Price Impact:</Text>
              <Text
                style={[
                  styles.quoteValue,
                  parseFloat(swapQuote.priceImpactPct) > 1
                    ? styles.highImpact
                    : null,
                ]}
              >
                {formatPriceImpact(swapQuote.priceImpactPct)}
              </Text>
            </RNView>
          </RNView>
        )}

        <View style={styles.modalButtonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sellButton]}
            onPress={closeModal}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={handleAction}
            disabled={
              !amount || isLoadingQuote || !!quoteError || signingLoading
            }
          >
            {isLoadingQuote || signingLoading ? (
              <RNView style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color="#000000" />
              </RNView>
            ) : (
              <Text style={styles.buyButtonText}>
                {actionType === "buy" ? "Buy" : "Sell"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    padding: 15,
    backgroundColor: "#2E2E2E",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: "#FFFFFF",
  },
  sellButton: {
    borderColor: "#FFFFFF",
    borderWidth: 1,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buyButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  balanceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#1E1E1E",
    padding: 5,
  },
  balanceLabel: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  maxButton: {
    position: "absolute",
    right: 10,
    backgroundColor: "#333",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  maxButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  quoteLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    marginBottom: 15,
  },
  quoteLoadingText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 14,
  },
  quoteErrorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  quoteErrorText: {
    color: "#FF6B6B",
    fontSize: 14,
  },
  quoteInfoContainer: {
    backgroundColor: "#2E2E2E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  quoteInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  quoteLabel: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  quoteValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  highImpact: {
    color: "#FF6B6B",
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
});
