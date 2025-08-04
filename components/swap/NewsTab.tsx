import { StyleSheet, Image, View as RNView } from "react-native";
import { Text, View } from "@/components/Themed";

interface NewsTabProps {
  news: any[];
}

export default function NewsTab({ news }: NewsTabProps) {
  return (
    <View style={styles.tabContentContainer}>
      {news.length === 0 ? (
        <Text style={styles.tabContent}>No news available.</Text>
      ) : (
        news.map((item) => (
          <View key={item.id} style={styles.newsTile}>
            <RNView style={styles.newsContent}>
              <RNView style={styles.newsTitleRow}>
                {item.image_url && (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={[styles.newsText, styles.newsTitle]}>
                  {item.title}
                </Text>
              </RNView>
              <Text style={[styles.newsText, styles.newsDescription]}>
                {item.description}
              </Text>
            </RNView>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentContainer: {},
  tabContent: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 5,
  },
  newsTile: {
    padding: 15,
    borderRadius: 8,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 15,
  },
  newsContent: {
    flexDirection: "column",
  },
  newsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 10,
  },
  newsText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  newsTitle: {
    fontWeight: "bold",
    flex: 1,
  },
  newsDescription: {
    marginTop: 4,
    fontSize: 14,
    color: "#CCC",
  },
});
