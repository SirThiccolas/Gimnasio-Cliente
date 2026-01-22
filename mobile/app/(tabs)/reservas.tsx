import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Clock, Info } from 'lucide-react-native';

// Importamos los mismos componentes del Home
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';

export default function ReservasScreen() {
  const router = useRouter();
  
  // Estados para el Header y el Menú
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [clientData, setClientData] = useState({ nombre: '', id: '', apellido: '' });
  
  // Estados de los datos de reservas
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. Obtener datos del storage
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      const apellido = await AsyncStorage.getItem('clientLastname');
      
      const userData = { 
        nombre: nombre || 'Usuario', 
        id: id || '', 
        apellido: apellido || '' 
      };
      setClientData(userData);

      if (id) {
        // 2. Cargar Reservas y Notificaciones en paralelo
        await Promise.all([
          fetchReservas(id),
          fetchNotifs(id)
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservas = async (id: string) => {
    try {
      // IMPORTANTE: Cambia 127.0.0.1 por tu IP real si pruebas en móvil físico
      const response = await fetch(`http://127.0.0.1:8000/api/reservas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setReservas(data);
      }
    } catch (error) {
      console.error("Error reservas:", error);
    }
  };

  const fetchNotifs = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/unread/${id}`);
      if (res.ok) setNotifs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.actividadName}>{item.nombre_actividad}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmada' ? '#2ed573' : '#ffa502' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Calendar size={18} color="#ff7e5f" />
        <Text style={styles.infoText}>Fecha: {item.fecha_clase}</Text>
      </View>

      <View style={styles.infoRow}>
        <Clock size={18} color="#ff7e5f" />
        <Text style={styles.infoText}>Hora: {item.hora_inicio?.substring(0, 5)} hs</Text>
      </View>

      <View style={styles.footer}>
        <Info size={14} color="#7f8c8d" />
        <Text style={styles.footerText}>Reservado el: {item.dia_reserva}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER IDÉNTICO AL HOME */}
      <CustomHeader 
        title="MIS RESERVAS" 
        onOpenMenu={() => setIsMenuOpen(true)}
        clientId={clientData.id}
        unreadCount={notifs.length}
        notificaciones={notifs}
        onRefreshNotifs={() => fetchNotifs(clientData.id)}
      />

      {/* MENÚ LATERAL */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        clientData={clientData} 
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff7e5f" />
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes reservas registradas.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 25 },
  card: { 
    backgroundColor: '#2f3640', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15,
    borderLeftWidth: 6,
    borderLeftColor: '#ff7e5f'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actividadName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { color: '#bdc3c7', marginLeft: 10, fontSize: 15 },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    borderTopWidth: 0.5, 
    borderTopColor: '#3d4652', 
    paddingTop: 10 
  },
  footerText: { color: '#7f8c8d', fontSize: 12, marginLeft: 5 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 50, fontSize: 16 }
});