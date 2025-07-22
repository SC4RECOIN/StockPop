import { BaseAsset } from '@/api/src/models';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { useState, useEffect } from 'react';
import Modal from 'react-native-modal';
import { Notifier } from 'react-native-notifier';
import { Octicons } from '@react-native-vector-icons/octicons';
import { Text, View } from '@/components/Themed';
import { useApiClient } from '@/components/useApiClient';
import { useQuery } from '@tanstack/react-query';
import { getErrorAlert } from '@/components/utils';

export default function SwapScreen() {
  const client = useApiClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['stocks'], queryFn: () => client.stocks.tradable.query() });
  const stocks: BaseAsset[] = data?.pools.map(p => p.baseAsset) ?? [];

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<BaseAsset | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (stocks.length > 0 && !selectedStock) {
      setSelectedStock(stocks[0]);
    }

    if (error) {
      console.error('Error fetching stocks:', error);
      Notifier.showNotification(getErrorAlert(error, 'Error loading stocks'));
    }
  }, [stocks, error]);

  const toggleModal = () => setModalVisible(!isModalVisible);

  const handleStockSelect = (stock: BaseAsset) => {
    setSelectedStock(stock);
    toggleModal();
  };

  const renderStockItem = ({ item }: { item: BaseAsset }) => (
    <TouchableOpacity style={styles.stockItem} onPress={() => handleStockSelect(item)}>
      <Image source={{ uri: item.icon }} style={styles.stockImage} />
      <Text style={styles.stockName}>{item.symbol}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {selectedStock && (
        <View style={styles.stockDetails}>
          <Image source={{ uri: selectedStock.icon }} style={styles.stockImageLarge} />
          <Text style={styles.stockNameLarge}>{selectedStock.name}</Text>
          <Text style={styles.stockPrice}>Price: ${selectedStock.stockData.price.toFixed(2)}</Text>
          <Text style={styles.stockMcap}>Market Cap: ${selectedStock.mcap.toLocaleString()}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.tokenSelector} onPress={toggleModal}>
        <View style={styles.tokenSelectContainer}>
          <Text style={styles.tokenText}>{selectedStock?.symbol}</Text>
          <Octicons name="chevron-down" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

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

      <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
        <View style={styles.modalContent}>
          <FlatList
            data={stocks}
            keyExtractor={(item) => item.id}
            renderItem={renderStockItem}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  tokenSelector: {
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 15,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  tokenSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
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
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    height: '60%',
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
  stockName: {
    color: '#FFFFFF',
    fontSize: 16,
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
