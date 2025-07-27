import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWallet } from '@/components/useWallet';

export default function ModalScreen() {
  const { signOut, pubkey } = useWallet();

  const handleSignOut = async () => {
    console.log("Signing user out");
    signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Wallet Address</Text>
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
          {pubkey && pubkey.toBase58()}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between'
  },
  addressContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center'
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    paddingHorizontal: 10,
    width: '100%',
    textAlign: 'center'
  },
  footer: {
    width: '100%',
    padding: 20,
  },
  signOutButton: {
    borderColor: 'white',
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  signOutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
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
