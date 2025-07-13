import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuthorization } from '@/components/AuthorizationProvider';

export default function ModalScreen() {
  const { selectedAccount } = useAuthorization();

  return (
    <View style={styles.container}>
      <Text>Connected Wallet</Text>
      <Text>{selectedAccount && selectedAccount?.address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
