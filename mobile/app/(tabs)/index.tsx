import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, StyleSheet, 
  ScrollView, FlatList, ActivityIndicator 
} from 'react-native';
import styled from 'styled-components/native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Menu, Bell, X, LogOut, Dumbbell, Calendar, Clock, User, Users } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- ESTILOS ---
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #f8f9fa;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  elevation: 4;
`;

const SideMenu = styled.View<{ isOpen: boolean }>`
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: ${width * 0.75}px;
  background-color: #2c3e50;
  z-index: 1000;
  padding: 60px 20px;
  display: ${props => props.isOpen ? 'flex' : 'none'};
`;

const Overlay = styled.TouchableOpacity`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
`;

// Estilos del Carrusel
const ClassCard = styled.View`
  background-color: #fff;
  width: ${width * 0.75}px;
  margin-right: 15px;
  border-radius: 20px;
  padding: 20px;
  elevation: 3;
  border-left-width: 5px;
  border-left-color: #ff7e5f;
`;

export default function HomeScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '' });
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Referencia y estado para el auto-scroll
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Lógica de Movimiento Automático
  useEffect(() => {
    if (actividades.length > 0) {
      const interval = setInterval(() => {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= actividades.length) {
          nextIndex = 0; // Vuelve al inicio
        }
        
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, 3500); // Se mueve cada 3.5 segundos

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

  const renderActividad = ({ item }: { item: any }) => (
    <ClassCard>
      <View style={styles.iconCircle}>
        <Dumbbell color="#ff7e5f" size={24} />
      </View>
      <Text style={styles.className}>{item.nombre}</Text>
      
      <View style={styles.infoRow}>
        <Clock size={16} color="#7f8c8d" />
        <Text style={styles.infoText}>Duración: {item.duracion} min</Text>
      </View>

      <View style={styles.infoRow}>
        <Users size={16} color="#7f8c8d" />
        <Text style={styles.infoText}>Aforo máx: {item.capacidad} pers.</Text>
      </View>

      <TouchableOpacity style={styles.mainButton}>
        <Text style={styles.mainButtonText}>Reservar Clase</Text>
      </TouchableOpacity>
    </ClassCard>
  );

  return (
    <Container>
      <Stack.Screen options={{ headerShown: false }} />

      {isMenuOpen && <Overlay onPress={() => setIsMenuOpen(false)} activeOpacity={1} />}
      
      <SideMenu isOpen={isMenuOpen}>
        <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
          <X color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{clientData.nombre}</Text>
        <TouchableOpacity onPress={async () => { await AsyncStorage.clear(); router.replace('/(auth)'); }} style={{ marginTop: 40 }}>
          <Text style={{ color: '#ff4757', fontWeight: 'bold' }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </SideMenu>

      <Header>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
          <Menu color="#2c3e50" size={28} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ff7e5f' }}>GYM PRO</Text>
        <Bell color="#2c3e50" size={26} />
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 25 }}>
          <Text style={{ fontSize: 20, color: '#7f8c8d' }}>Hola,</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2c3e50' }}>{clientData.nombre} 👋</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actividades</Text>
        </View>

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
            contentContainerStyle={{ paddingLeft: 25, paddingRight: 10 }}
            snapToInterval={width * 0.75 + 15} // Para que encaje al deslizar
            decelerationRate="fast"
          />
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Corregido: con comillas
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  iconCircle: { backgroundColor: '#fff1ed', padding: 10, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15 },
  className: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { color: '#7f8c8d', fontSize: 14, marginLeft: 8 },
  mainButton: { backgroundColor: '#2c3e50', padding: 12, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontWeight: 'bold' },
});