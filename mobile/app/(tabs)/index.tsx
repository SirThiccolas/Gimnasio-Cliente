import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, StyleSheet, 
  ScrollView, FlatList, ActivityIndicator, Alert, Animated, Easing 
} from 'react-native';
import styled from 'styled-components/native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Menu, Bell, X, LogOut, Dumbbell, Calendar, 
  Clock, User, Users, Lock, ChevronRight 
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// --- MEDIDAS CARRUSEL ---
const CARD_WIDTH = width * 0.8; 
const SPACING = 15; 
const CARD_HEIGHT = 380;       // Altura fija para que no se vea "larga"
const SNAP_INTERVAL = CARD_WIDTH + SPACING;
const LEFT_PADDING = 25; // El margen izquierdo real

export default function HomeScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '' });
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Refs para Animaciones y Scroll
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const menuAnim = useRef(new Animated.Value(-width)).current; // Inicia fuera de pantalla
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- LÓGICA DE ANIMACIÓN DEL MENÚ ---
  useEffect(() => {
    Animated.parallel([
      Animated.timing(menuAnim, {
        toValue: isMenuOpen ? 0 : -width,
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isMenuOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [isMenuOpen]);

  // --- AUTO-SCROLL INFINITO CORREGIDO ---
  useEffect(() => {
    if (actividades.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = currentIndex + 1;
        
        if (nextIndex >= actividades.length) {
          nextIndex = 0;
          // Volver al inicio respetando el padding
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        } else {
          // Calcular offset exacto: (index * (ancho + espacio))
          flatListRef.current?.scrollToOffset({ 
            offset: nextIndex * SNAP_INTERVAL, 
            animated: true 
          });
        }
        setCurrentIndex(nextIndex);
      }, 4000); 

      return () => clearInterval(interval);
    }
  }, [currentIndex, actividades]);

  const fetchInitialData = async () => {
    try {
      const nombre = await AsyncStorage.getItem('clientName');
      const id = await AsyncStorage.getItem('clientId');
      setClientData({ nombre: nombre || 'Usuario', id: id || '0' });

      const response = await fetch("http://127.0.0.1:8000/api/actividades");
      const data = await response.json();
      setActividades(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/(auth)');
  };

  const renderActividad = ({ item }: { item: any }) => (
    <View style={styles.classCard}>
      <View style={styles.iconCircle}>
        <Dumbbell color="#ff7e5f" size={24} />
      </View>
      <Text style={styles.className}>{item.nombre}</Text>
      <Text style={styles.classDescription} numberOfLines={2}>
        {item.descripcion || "Mejora tu rendimiento físico con profesionales."}
      </Text>
      <View style={styles.infoRow}>
        <Clock size={16} color="#7f8c8d" />
        <Text style={styles.infoText}>Duración: {item.duracion} min</Text>
      </View>
      <View style={styles.infoRow}>
        <Users size={16} color="#7f8c8d" />
        <Text style={styles.infoText}>Aforo máx: {item.aforo} pers.</Text>
      </View>
      <TouchableOpacity 
        style={styles.mainButton} 
        onPress={() => router.push({ pathname: "/(tabs)/clases", params: { id: item.id_actividad } })}
      >
        <Text style={styles.mainButtonText}>Reservar Ahora</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* OVERLAY ANIMADO (FONDO OSCURO) */}
      {isMenuOpen && (
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setIsMenuOpen(false)} 
          />
        </Animated.View>
      )}
      
      {/* MENÚ LATERAL ANIMADO */}
      <Animated.View style={[styles.sideMenu, { transform: [{ translateX: menuAnim }] }]}>
        <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.closeBtn}>
          <X color="#fff" size={28} />
        </TouchableOpacity>
        
        <View style={styles.profileBox}>
          <User color="#ff7e5f" size={40} />
          <Text style={styles.profileName}>{clientData.nombre}</Text>
          <Text style={styles.profileId}>Socio ID: #{clientData.id}</Text>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(tabs)/clases"); }}>
          <Dumbbell color="#fff" size={22} /><Text style={styles.menuItemText}>Clases</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(tabs)/horario"); }}>
          <Clock color="#fff" size={22} /><Text style={styles.menuItemText}>Horario</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(tabs)/reservas"); }}>
          <Calendar color="#fff" size={22} /><Text style={styles.menuItemText}>Mis reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); router.push("/(auth)/change-password"); }}>
          <Lock color="#fff" size={22} /><Text style={styles.menuItemText}>Cambiar contraseña</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, { marginTop: 'auto', borderBottomWidth: 0 }]} onPress={handleLogout}>
          <LogOut color="#ff4757" size={22} /><Text style={[styles.menuItemText, { color: '#ff4757' }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
          <Menu color="#2c3e50" size={28} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ff7e5f' }}>GYM PRO</Text>
        <TouchableOpacity onPress={() => alert("Notificaciones vacías")}>
          <Bell color="#2c3e50" size={26} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 25 }}>
          <Text style={{ fontSize: 20, color: '#7f8c8d' }}>Hola,</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2c3e50' }}>{clientData.nombre} 👋</Text>
        </View>

        <Text style={styles.sectionTitle}>Nuestras Actividades</Text>

        {loading ? (
          <ActivityIndicator color="#ff7e5f" size="large" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={actividades}
            renderItem={renderActividad}
            keyExtractor={(item) => item.id_actividad.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: LEFT_PADDING, paddingBottom: 20 }}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            snapToAlignment="start"
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
              setCurrentIndex(index);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 999,
  },
  sideMenu: {
    position: 'absolute',
    left: 0, 
    top: 0, 
    bottom: 0,
    width: width * 0.75, // Ocupa el 75% del ancho
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    padding: 30,         // Menos padding para que no se vea vacío
    paddingTop: 60,
    borderTopRightRadius: 20, // Toque estético
    borderBottomRightRadius: 20,
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  profileBox: { 
    marginBottom: 30, 
    paddingBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#333' 
  },
  profileName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  profileId: { color: '#888', fontSize: 13 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 18, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#333' 
  },
  menuItemText: { color: '#fff', fontSize: 16, marginLeft: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginLeft: 25, marginBottom: 15 },
  classCard: {
    backgroundColor: '#fff',
    width: CARD_WIDTH,
    height: CARD_HEIGHT, // <-- ALTURA FIJA PARA EVITAR QUE SE ESTIRE
    marginRight: SPACING,
    borderRadius: 25,
    padding: 20,
    justifyContent: 'space-between', // Distribuye el contenido dentro
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderLeftWidth: 8,
    borderLeftColor: '#ff7e5f',
  },
  iconCircle: { backgroundColor: '#fff1ed', padding: 10, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15 },
  className: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  classDescription: { 
    fontSize: 14, 
    color: '#7f8c8d', 
    height: 40, // Limitamos el espacio del texto
    lineHeight: 20 
  },  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { color: '#7f8c8d', fontSize: 14, marginLeft: 8 },
  mainButton: { backgroundColor: '#ff7e5f', padding: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontWeight: 'bold' },
});