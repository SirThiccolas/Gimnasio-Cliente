import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// He añadido ListTodo para Mis Reservas y Activity para Actividades
import { X, User, Dumbbell, Clock, Activity, ListTodo, Lock, LogOut, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SideMenu({ isOpen, onClose, clientData }: any) {
  const router = useRouter();
  const anim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: isOpen ? 0 : -width, duration: 300, useNativeDriver: true }).start();
  }, [isOpen]);

  const navigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as any), 300);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    onClose();
    router.replace("/(auth)");
  };

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.menu, { transform: [{ translateX: anim }] }]}>
          <View style={styles.header}>
            <User color="#ff7e5f" size={35} />
            <Text style={styles.userName}>{clientData.nombre || 'Usuario'}</Text>
            <TouchableOpacity onPress={onClose}><X color="#fff" size={24} /></TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.item} onPress={() => navigate("/(tabs)/")}>
              <View style={styles.itemLeft}><Dumbbell color="#fff" size={20} /><Text style={styles.itemText}>Inicio</Text></View>
              <ChevronRight color="#4b5563" size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={() => navigate("/(tabs)/horario")}>
              <View style={styles.itemLeft}><Clock color="#fff" size={20} /><Text style={styles.itemText}>Horario</Text></View>
              <ChevronRight color="#4b5563" size={16} />
            </TouchableOpacity>

            {/* Cambio de Clases por Actividades */}
            <TouchableOpacity style={styles.item} onPress={() => navigate("/(tabs)/actividades")}>
              <View style={styles.itemLeft}><Activity color="#fff" size={20} /><Text style={styles.itemText}>Actividades</Text></View>
              <ChevronRight color="#4b5563" size={16} />
            </TouchableOpacity>

            {/* Icono de Mis Reservas cambiado a ListTodo */}
            <TouchableOpacity style={styles.item} onPress={() => navigate("/(tabs)/reservas")}>
              <View style={styles.itemLeft}><ListTodo color="#fff" size={20} /><Text style={styles.itemText}>Mis Reservas</Text></View>
              <ChevronRight color="#4b5563" size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={() => navigate("/(auth)/change-password")}>
              <View style={styles.itemLeft}><Lock color="#fff" size={20} /><Text style={styles.itemText}>Cambiar Contraseña</Text></View>
              <ChevronRight color="#4b5563" size={16} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logout} onPress={handleLogout}>
            <LogOut color="#ff4757" size={20} /><Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  menu: { width: width * 0.75, backgroundColor: '#2f3640', height: '100%', padding: 25, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#3d4652', paddingBottom: 20 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  menuItems: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: '#3d4652' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemText: { color: '#fff', marginLeft: 15, fontSize: 15 },
  logout: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  logoutText: { color: '#ff4757', marginLeft: 15, fontWeight: 'bold' }
});