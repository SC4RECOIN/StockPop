import { BaseAsset } from '@/api/src/models';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ScrollView, Animated } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import Modal from 'react-native-modal';
import { Notifier } from 'react-native-notifier';
import { Text, View } from '@/components/Themed';
import { useApiClient } from '@/components/useApiClient';
import { useQuery } from '@tanstack/react-query';
import { getErrorAlert } from '@/components/utils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function SwapScreen() {
  const { stockId } = useLocalSearchParams<{ stockId: string }>();
  const client = useApiClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['stocks'], queryFn: () => client.stocks.tradable.query() });
  const stocks: BaseAsset[] = data?.pools.map(p => p.baseAsset) ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<BaseAsset | null>(null);
  const [amount, setAmount] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'buy' | 'sell' | null>(null);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [tabAnimation] = useState(new Animated.Value(0));
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    };
    loadFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      };
      loadFavorites();
    }, [])
  );

  useEffect(() => {
    if (stocks.length > 0) {
      if (stockId) {
        // Find the stock with the matching ID from the URL parameters
        const stockFromParams = stocks.find(stock => stock.id === stockId);
        if (stockFromParams) {
          setSelectedStock(stockFromParams);
        } else if (!selectedStock) {
          // Fallback to the first stock if the requested stock isn't found
          setSelectedStock(stocks[0]);
        }
      } else if (!selectedStock) {
        // If no stockId parameter, default to the first stock
        setSelectedStock(stocks[0]);
      }
    }

    if (error) {
      console.error('Error fetching stocks:', error);
      Notifier.showNotification(getErrorAlert(error, 'Error loading stocks'));
    }
  }, [stocks, stockId, error, selectedStock]);

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

  const handleActionPress = (type: 'buy' | 'sell') => {
    setActionType(type);
    setActionModalVisible(true);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
    setAmount('');
  };

  const handleAction = () => {
    // Here you would implement the actual buy/sell logic
    console.log(`${actionType} ${amount} of ${selectedStock?.symbol}`);
    closeActionModal();
  };

  const toggleFavorite = async (stockId: string) => {
    const updatedFavorites = favorites.includes(stockId)
      ? favorites.filter(id => id !== stockId)
      : [...favorites, stockId];

    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (stockId: string) => favorites.includes(stockId);

  const renderStockItem = ({ item, index }: { item: BaseAsset; index: number }) => (
    <TouchableOpacity
      style={[
        styles.stockItem,
        index === filteredStocks.length - 1 ? styles.lastStockItem : null
      ]}
      onPress={() => handleStockSelect(item)}
    >
      <Image source={{ uri: item.icon }} style={styles.stockImage} />
      <View style={styles.stockTextContainer}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockFullName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const TabSection = ({ selectedTab }: { selectedTab: string }) => {
    if (selectedTab === 'summary') {
      return (
        <View style={styles.tabContentContainer}>
          <Text style={styles.tabContent}>Previous Close: $123.45</Text>
          <Text style={styles.tabContent}>Market Cap: $1.23B</Text>
          <Text style={styles.tabContent}>Volume: 1.2M</Text>
        </View>
      );
    } else if (selectedTab === 'news') {
      return (
        <View style={styles.tabContentContainer}>
          <View style={styles.newsTile}><Text style={styles.newsText}>News Story 1</Text></View>
          <View style={styles.newsTile}><Text style={styles.newsText}>News Story 2</Text></View>
          <View style={styles.newsTile}><Text style={styles.newsText}>News Story 3</Text></View>
        </View>
      );
    } else if (selectedTab === 'profile') {
      return (
        <View style={styles.tabContentContainer}>
          <Text style={styles.tabContent}>This is a description of the company.</Text>
        </View>
      );
    }
    return null;
  };

  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
    Animated.timing(tabAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      tabAnimation.setValue(0);
    });
  };

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
        {selectedStock && (
          <TouchableOpacity onPress={() => toggleFavorite(selectedStock.id)}>
            <Ionicons
              name={isFavorite(selectedStock.id) ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite(selectedStock.id) ? '#FFFFFF' : '#666'}
              style={styles.favoriteIcon}
            />
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
          <View style={styles.stockHeader}>
            <View style={styles.stockHeaderLeft}>
              <Image source={{ uri: selectedStock.icon }} style={styles.stockImageLarge} />
              <View>
                <Text>{selectedStock.name.replace("xStock", "")}</Text>
                <Text style={styles.stockSymbolLarge}>{selectedStock.symbol}</Text>
              </View>
            </View>
            <View style={styles.stockHeaderRight}>
              <Text style={styles.stockPriceLarge}>$ {selectedStock.stockData.price.toFixed(2)} <Text style={{ fontSize: 16 }}>USD</Text></Text>
              <Text style={styles.stockChange24h}>+ {0.44.toFixed(2)}%</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.tabContainer}>
        {['summary', 'news', 'profile'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.activeTabButton,
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Animated.Text
              style={[
                styles.tabButtonText,
                selectedTab === tab && styles.activeTabButtonText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.tabContentScrollView}>
        <TabSection selectedTab={selectedTab} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => handleActionPress('buy')}
        >
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.sellButton]}
          onPress={() => handleActionPress('sell')}
        >
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>

      <Modal isVisible={actionModalVisible} onBackdropPress={closeActionModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {selectedStock?.symbol}
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter amount"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.sellButton]} onPress={closeActionModal}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.buyButton]}
              onPress={handleAction}
              disabled={!amount}
            >
              <Text style={styles.buyButtonText}>{actionType === 'buy' ? 'Buy' : 'Sell'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 30,
    marginTop: 60,
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
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: '#FFFFFF',
  },
  sellButton: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonText: {
    color: '#000000',
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
  lastStockItem: {
    borderBottomWidth: 0,
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
    marginBottom: 15,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockHeaderRight: {
    alignItems: 'flex-end',
  },
  stockImageLarge: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  stockSymbolLarge: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stockPriceLarge: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stockChange24h: {
    color: 'lightgreen',
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    padding: 15,
    backgroundColor: '#2E2E2E',
    borderRadius: 8,
    color: '#FFFFFF',
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#000000',
  },
  tabContentScrollView: {
    flex: 1,
  },
  tabContentContainer: {
  },
  tabTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tabContent: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  newsTile: {
    padding: 15,
    borderRadius: 8,
    borderColor: '#333',
    borderWidth: 1,
    marginBottom: 15,
  },
  newsText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  favoriteIcon: {
    marginLeft: 10,
  },
});
