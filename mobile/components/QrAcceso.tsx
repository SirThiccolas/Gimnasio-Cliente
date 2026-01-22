import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { X, Info } from 'lucide-react-native'; // Corregido aquí

interface QrProps {
  visible: boolean;
  onClose: () => void;
  data: any;
}

export default function QrAcceso({ visible, onClose, data }: QrProps) {
  if (!visible || !data) return null;

  const qrString = JSON.stringify({
    id_clase: data.id_clase,
    id_cliente: data.id_cliente
  });

  return (
    <View style={styles.fullScreenOverlay}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X color="#fff" size={24} />
        </TouchableOpacity>

        <Text style={styles.title}>Pase de Entrada</Text>
        <Text style={styles.subtitle}>{data.actividad}</Text>
        
        <View style={styles.qrCard}>
          <QRCode
            value={qrString}
            size={220}
            color="#1e272e"
            backgroundColor="#fff"
          />
        </View>

        <View style={styles.infoBox}>
          <Info color="#ff7e5f" size={18} />
          <Text style={styles.infoText}>
            Válido solo para hoy a las {data?.hora ? String(data.hora).substring(0, 5) : '--:--'} hs
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500, 
  },
  container: { backgroundColor: '#2f3640', width: '90%', borderRadius: 30, padding: 25, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end', padding: 5 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#ff7e5f', fontSize: 18, fontWeight: '600', marginBottom: 25 },
  qrCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 25 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 126, 95, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20 },
  infoText: { color: '#bdc3c7', marginLeft: 10, fontSize: 13 },
});