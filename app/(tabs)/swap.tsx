import { BaseAsset } from '@/api/src/models';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { useState, useEffect } from 'react';
import Modal from 'react-native-modal';
import { Notifier } from 'react-native-notifier';
import { Text, View } from '@/components/Themed';
import { useApiClient } from '@/components/useApiClient';
import { useQuery } from '@tanstack/react-query';
import { getErrorAlert } from '@/components/utils';
import { Ionicons } from '@expo/vector-icons';

export default function SwapScreen() {
  const client = useApiClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['stocks'], queryFn: () => client.stocks.tradable.query() });
  const stocks: BaseAsset[] = data?.pools.map(p => p.baseAsset) ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<BaseAsset | null>(null);
  const [amount, setAmount] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (stocks.length > 0 && !selectedStock) {
      setSelectedStock(stocks[0]);
    }

    if (error) {
      console.error('Error fetching stocks:', error);
      Notifier.showNotification(getErrorAlert(error, 'Error loading stocks'));
    }
  }, [stocks, error]);

  const filteredStocks = stocks.filter(stock => {
    const query = searchQuery.toLowerCase();
    return stock.name.toLowerCase().includes(query) ||
      stock.symbol.toLowerCase().includes(query);
  });

  const handleStockSelect = (stock: BaseAsset) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setShowResults(false);
  };

  const renderStockItem = ({ item }: { item: BaseAsset }) => (
    <TouchableOpacity style={styles.stockItem} onPress={() => handleStockSelect(item)}>
      <Image source={{ uri: item.icon }} style={styles.stockImage} />
      <View style={styles.stockTextContainer}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockFullName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#FFFFFF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setShowResults(text.length > 0);
          }}
          onFocus={() => setShowResults(true)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setShowResults(false);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={filteredStocks}
            keyExtractor={(item) => item.id}
            renderItem={renderStockItem}
            style={styles.resultsList}
          />
        </View>
      )}

      {selectedStock && !showResults && (
        <View style={styles.stockDetails}>
          <Image source={{ uri: selectedStock.icon }} style={styles.stockImageLarge} />
          <Text style={styles.stockNameLarge}>{selectedStock.name}</Text>
          <Text style={styles.stockPrice}>Price: ${selectedStock.stockData.price.toFixed(2)}</Text>
          <Text style={styles.stockMcap}>Market Cap: ${selectedStock.mcap.toLocaleString()}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.buyButton]}>
          <Text style={styles.actionButtonText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.sellButton]}>
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 5,
  },
  clearButton: {
    padding: 5,
  },
  resultsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    maxHeight: 300,
    marginBottom: 15,
  },
  resultsList: {
    maxHeight: 300,
  },
  input: {
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
  },
  sellButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stockImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  stockTextContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  stockName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  stockSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockFullName: {
    color: '#999',
    fontSize: 14,
  },
  stockDetails: {
    alignItems: 'center',
    marginBottom: 15,
  },
  stockImageLarge: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  stockNameLarge: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stockPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  stockMcap: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
