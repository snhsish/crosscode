import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import QrScanner from '@/components/qr-scanner';
import { ThemedText } from '@/components/themed-text';
import { decodeQrPayload } from '@crosscode/shared';
import { BottomTabInset, Spacing } from '@/constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handleScan(data: string) {
    try {
      const payload = decodeQrPayload(data);
      router.push(
        `/confirm-connection?url=${encodeURIComponent(payload.url)}` as any
      );
    } catch {
      alert(
        'Invalid QR code. Scan the QR from `npx crosscode` in your terminal.'
      );
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <QrScanner onScan={handleScan} />
      <ThemedText style={styles.hint}>
        Point your camera at the QR code{'\n'}from your terminal
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  hint: {
    position: 'absolute',
    bottom: BottomTabInset + Spacing.three + 160,
    alignSelf: 'center',
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
