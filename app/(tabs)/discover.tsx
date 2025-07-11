import { StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { View, Text } from '@/components/Themed';
import Decimal from 'decimal.js';
import { useQuery } from '@tanstack/react-query';
import { ApiTypes, useApiClient } from '@/components/useApiClient';
import { useEffect } from 'react';
import { Notifier } from 'react-native-notifier';
import { getErrorAlert } from '@/components/utils';

type Pool = ApiTypes['stocks']['tradable']['pools'][number]

export default function DiscoverScreen() {
  const client = useApiClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['stocks'], queryFn: () => client.stocks.tradable.query() })

  useEffect(() => {
    if (error) {
      console.error('Error fetching stocks:', error);
      Notifier.showNotification(getErrorAlert(error, 'Error loading stocks'));
    }
  }, [error]);

  const renderStockItem = ({ item }: { item: Pool }) => {
    const asset = item.baseAsset;
    const priceChange = new Decimal(asset.stats24h.priceChange ?? 0).div(asset.usdPrice).mul(100)

    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format

    return (
      <View style={styles.stockItem}>
        <Image
          source={{ uri: asset.icon }}
          style={styles.stockImage}
        />

        <View style={styles.stockInfo}>
          <Text style={styles.ticker}>{asset.symbol}</Text>
          <Text style={styles.name}>{asset.name}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>${asset.stockData.price.toFixed(2)}</Text>
          <Text style={[
            styles.change,
            { color: priceChange.isPositive() ? '#4CAF50' : '#F44336' }
          ]}>
            {priceChange.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.mcapInfo}>
          <Text style={styles.ticker}>{formatter(asset.stockData.mcap)}</Text>
          <Text style={styles.name}>{formatter(asset.mcap)}</Text>
        </View>
      </View>
    );
  };

  const pools = data?.pools.sort((a, b) => b.baseAsset.stockData.price - a.baseAsset.stockData.price) ?? []

  return (
    <View style={styles.container}>
      {(isLoading && !error) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading stocks...</Text>
        </View>
      ) : (
        <FlatList
          data={pools}
          keyExtractor={(item) => item.id}
          renderItem={renderStockItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stockImage: {
    borderRadius: 20,
    marginRight: 15,
    width: 40,
    height: 40,
  },
  stockInfo: {
    flex: 1,
  },
  mcapInfo: {
    minWidth: 40,
  },
  ticker: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginRight: 30,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  change: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
