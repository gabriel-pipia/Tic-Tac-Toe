import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-6">
        <Text className="text-foreground text-center mb-4">We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-primary px-6 py-3 rounded-xl">
          <Text className="text-primary-foreground font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true); // Prevent multiple scans
    
    // Validate if it's our game ID (UUID or link)
    // Assuming simple UUID or full URL
    // If it's a UUID: push to index with gameId
    // If it's a URL: parse query param
    let gameId = data;
    if (data.includes('gameId=')) {
        gameId = data.split('gameId=')[1];
    }
    
    // Provide feedback
    Alert.alert('Scanned!', `Joining game...`, [
        { 
            text: 'OK', 
            onPress: () => {
                setScanned(false);
                router.push({ pathname: '/', params: { gameId } });
            }
        }
    ]);
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
           <View className="items-center">
             <Text className="text-white text-xl font-bold mb-8">Scan Game QR Code</Text>
             <View style={{ width: SCAN_SIZE, height: SCAN_SIZE }} className="relative justify-center items-center">
                <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
                
                <ScanLine size={100} color="white" className="opacity-50" />
             </View>
             <TouchableOpacity 
                onPress={() => router.back()}
                className="mt-10 bg-white/20 px-6 py-3 rounded-full"
             >
                 <Text className="text-white">Cancel</Text>
             </TouchableOpacity>
           </View>
        </View>
      </CameraView>
    </View>
  );
}
