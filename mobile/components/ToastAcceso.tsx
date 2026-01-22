import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native'; // Añadimos Modal
import { CheckCircle, X } from 'lucide-react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

export default function ToastAcceso({ visible, message, onClose }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 60, 
        useNativeDriver: true,
        bounciness: 10,
      }).start();

      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Usamos un Modal transparente para que flote sobre el QR o sobre la lista
  return (
    <Modal visible={visible} transparent={true} animationType="none" pointerEvents="box-none">
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.content}>
          <CheckCircle color="#2ecc71" size={24} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Acceso Correcto</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#7f8c8d" size={18} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: '5%',
    right: '5%',
    zIndex: 9999, // <--- EL MÁS ALTO
},
  content: {
    backgroundColor: '#2f3640', // Color igual a tus cards para consistencia
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2ecc71',
    elevation: 20, // Más elevación para Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  textContainer: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  message: { color: '#bdc3c7', fontSize: 12 },
  closeBtn: { padding: 4 },
});