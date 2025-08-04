import {
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useState, useMemo } from "react";
import { Text, View } from "@/components/Themed";
import { Notifier } from "react-native-notifier";
import { getErrorAlert } from "@/components/utils";
import { Octicons } from "@expo/vector-icons";
import { BaseAsset } from "@/api/src/models";
import { CandlestickChart, LineChart } from "react-native-wagmi-charts";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";

interface ChartTabProps {
  selectedStock: BaseAsset | null;
}

export default function ChartTab({ selectedStock }: ChartTabProps) {
  const client = useApiClient();
  const [chartType, setChartType] = useState<"line" | "candles">("line");
  const { width: screenWidth } = Dimensions.get("window");

  const barData = useQuery({
    queryKey: ["stocks-bars", selectedStock?.symbol],
    queryFn: () =>
      client.stocks.bars.query({ ticker: selectedStock!.symbol, barSize: 15 }),
    enabled: !!selectedStock,
  });

  /**
   * Transform stock price data for chart visualization
   * Returns [lineChartData, candlestickData]
   */
  const [lineData, candles] = useMemo(() => {
    // Handle error state
    if (barData.failureReason) {
      console.error("Error fetching stock price data:", barData.failureReason);
      Notifier.showNotification(
        getErrorAlert(barData.failureReason, "Error loading price data")
      );
    }

    // Handle empty data
    const data = barData.data?.bars;
    if (!data || data.length === 0) {
      console.warn("No price data available for the selected stock");
      return [[], []];
    }

    // Transform to line chart format
    const line = data.map((bar: any) => ({
      timestamp: bar.t,
      value: bar.c,
    }));

    // Transform to candlestick format
    const candlesticks = data.map((bar: any) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    }));

    return [line, candlesticks];
  }, [barData.failureReason, barData.data]);

  // Show loading indicator while chart data is loading
  if (barData.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Don't render if no data available
  if (lineData.length === 0 && candles.length === 0) {
    return null;
  }

  return (
    <View style={styles.tabContentContainer}>
      <View style={styles.chartTypeToggle}>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            chartType === "line" && styles.chartTypeButtonActive,
          ]}
          onPress={() => setChartType("line")}
        >
          <Text
            style={[
              styles.chartTypeText,
              chartType === "line" && styles.chartTypeTextActive,
            ]}
          >
            Line
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            chartType === "candles" && styles.chartTypeButtonActive,
          ]}
          onPress={() => setChartType("candles")}
        >
          <Text
            style={[
              styles.chartTypeText,
              chartType === "candles" && styles.chartTypeTextActive,
            ]}
          >
            Candles
          </Text>
        </TouchableOpacity>
      </View>
      {chartType === "line" ? (
        <LineChart.Provider data={lineData}>
          <LineChart width={screenWidth - 20} height={250}>
            <LineChart.Path color={"#9D00FF"}>
              <LineChart.Gradient />
            </LineChart.Path>
            <LineChart.CursorCrosshair color="white">
              <LineChart.Tooltip
                textStyle={{
                  color: "white",
                  fontSize: 14,
                }}
              />
            </LineChart.CursorCrosshair>
          </LineChart>
        </LineChart.Provider>
      ) : (
        <CandlestickChart.Provider data={candles}>
          <CandlestickChart width={screenWidth - 20} height={250}>
            <CandlestickChart.Candles />
            <CandlestickChart.Crosshair>
              <CandlestickChart.Tooltip
                style={{ backgroundColor: "black" }}
                textStyle={{ color: "white", fontSize: 12 }}
              />
            </CandlestickChart.Crosshair>
          </CandlestickChart>
          <CandlestickChart.DatetimeText
            style={{ color: "white", fontSize: 12 }}
          />
        </CandlestickChart.Provider>
      )}
      {selectedStock && (
        <View
          style={[
            styles.discountAlert,
            {
              backgroundColor:
                selectedStock.stockData.price < selectedStock.usdPrice
                  ? "rgba(255, 0, 0, 0.2)"
                  : "rgba(0, 255, 0, 0.2)",
            },
          ]}
        >
          <Octicons
            name="info"
            color="white"
            size={20}
            style={{ marginRight: 10 }}
          />
          <Text style={{ flex: 1, flexWrap: "wrap", color: "white" }}>
            This stock is trading{" "}
            {Math.abs(
              (1 - selectedStock.stockData.price / selectedStock.usdPrice) * 100
            ).toFixed(2)}
            %{" "}
            {selectedStock.stockData.price > selectedStock.usdPrice
              ? "lower"
              : "higher"}{" "}
            on chain than it is on the stock market.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 150,
  },
  tabContentContainer: {},
  chartTypeToggle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
    zIndex: 1,
  },
  chartTypeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#666",
  },
  chartTypeButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  chartTypeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  chartTypeTextActive: {
    color: "#000000",
  },
  discountAlert: {
    backgroundColor: "#2E2E2E",
    padding: 10,
    borderRadius: 5,
    flexDirection: "row",
    marginTop: 10,
  },
});
