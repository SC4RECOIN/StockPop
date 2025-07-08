import { StyleSheet, FlatList, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { View, Text } from '@/components/Themed';
import { stocks } from '@/constants/stocks';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Define the Stock interface
interface Stock {
  ticker: string;
  name: string;
  mint: string;
  image: string;
  price: string;
  change: string;
}

// Add dummy price data to each stock
const stocksWithPrices = stocks.map(stock => ({
  ...stock,
  price: `$${(Math.random() * 1000 + 20).toFixed(2)}`,
  change: (Math.random() * 20 - 10).toFixed(2),
  image: stock.image || 'https://cdn.prod.website-files.com/655f3efc4be468487052e35a/684aae04a3d8452e0ae4bad8_Ticker%3DGOOG%2C%20Company%20Name%3DAlphabet%20Inc.%2C%20size%3D256x256.svg'
}));

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const renderStockItem = ({ item }: { item: Stock }) => {
    const isPositiveChange = parseFloat(item.change) >= 0;

    return (
      <View style={styles.stockItem}>
        <SvgUri
          style={styles.stockImage}
          uri={item.image}
          width={40}
          height={40}
        />

        <View style={styles.stockInfo}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={[
            styles.change,
            { color: isPositiveChange ? '#4CAF50' : '#F44336' }
          ]}>
            {isPositiveChange ? '+' : ''}{item.change}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={stocksWithPrices}
        keyExtractor={(item) => item.ticker}
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
