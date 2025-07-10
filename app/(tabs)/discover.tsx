import { StyleSheet, FlatList, Image } from 'react-native';
import { View, Text } from '@/components/Themed';
import Decimal from 'decimal.js';
import { useQuery } from '@tanstack/react-query';
import { ApiTypes, useApiClient } from '@/components/useApiClient';

type Pool = ApiTypes['stocks']['tradable']['pools'][number]

export default function DiscoverScreen() {
  const client = useApiClient();
  const { data, isLoading } = useQuery({ queryKey: ['stocks'], queryFn: () => client.stocks.tradable.query() })

  const renderStockItem = ({ item }: { item: Pool }) => {
    const asset = item.baseAsset;
    const priceChange = new Decimal(asset.stats24h.priceChange ?? 0).div(asset.usdPrice).mul(100)

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
          <Text style={styles.price}>{asset.stockData.price}</Text>
          <Text style={[
            styles.change,
            { color: priceChange.isPositive() ? '#4CAF50' : '#F44336' }
          ]}>
            {priceChange.toFixed(2)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.pools ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderStockItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  change: {
    fontSize: 14,
  },
});
