import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Clock, Calendar } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';

export default function HorarioScreen() {
  // Estado para el objeto del día seleccionado (guardamos nombre para la API y label para la UI)
  const [diaSeleccionado, setDiaSeleccionado] = useState({ nombre: 'Todos', label: 'Todos' });
  const [horario, setHorario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '' });
  const [notifs, setNotifs] = useState([]);

  // 1. Generar los días dinámicamente (Hoy + los siguientes 6 días)
  const listaDias = useMemo(() => {
    const diasGenerados = [{ nombre: 'Todos', label: 'Todos' }];
    const hoy = new Date();

    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + i);

      const nombreDia = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(fecha);
      const numeroDia = fecha.getDate();

      diasGenerados.push({
        nombre: nombreDia.toLowerCase(),
        label: `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)}, ${numeroDia}`
      });
    }
    return diasGenerados;
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchHorario();
  }, [diaSeleccionado]);

  const fetchInitialData = async () => {
    const id = await AsyncStorage.getItem('clientId');
    const name = await AsyncStorage.getItem('clientName');
    setClientData({ id: id || '', nombre: name || '' });
    if (id) fetchNotifs(id);
  };

  const fetchNotifs = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/unread/${id}`);
      setNotifs(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchHorario = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/horario-completo?dia=${diaSeleccionado.nombre}`);
      const data = await resp.json();
      setHorario(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <CustomHeader 
        title="HORARIO" 
        onOpenMenu={() => setIsMenuOpen(true)}
        clientId={clientData.id}
        unreadCount={notifs.length}
        notificaciones={notifs}
        onRefreshNotifs={() => fetchNotifs(clientData.id)}
      />

      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        clientData={clientData} 
      />

      <View style={styles.selectorContainer}>
        <FlatList
          data={listaDias}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.diaPill, diaSeleccionado.label === item.label && styles.diaPillActive]}
              onPress={() => setDiaSeleccionado(item)}
            >
              <Text style={[styles.diaText, diaSeleccionado.label === item.label && styles.diaTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 15 }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff7e5f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={horario}
          keyExtractor={(item: any) => item.id_clase.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay clases para este día.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.timeSection}>
                <Clock color="#ff7e5f" size={18} />
                <Text style={styles.timeText}>{item.hora_inicio?.substring(0, 5)}</Text>
                <Text style={styles.diaTag}>{item.dia?.substring(0, 3)}</Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.className}>{item.nombre_actividad}</Text>
                <Text style={styles.cupoText}>Aforo: {item.aforo} personas</Text>
              </View>
              <TouchableOpacity style={styles.bookBtn}>
                <Calendar color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  selectorContainer: { backgroundColor: '#2f3640' },
  diaPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#3d4652' },
  diaPillActive: { backgroundColor: '#ff7e5f' },
  diaText: { color: '#bdc3c7', fontWeight: '600' },
  diaTextActive: { color: '#fff' },
  card: { backgroundColor: '#2f3640', borderRadius: 20, flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ff7e5f' },
  timeSection: { alignItems: 'center', width: 70 },
  timeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  diaTag: { color: '#7f8c8d', fontSize: 11, textTransform: 'uppercase' },
  infoSection: { flex: 1, marginLeft: 15 },
  className: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cupoText: { color: '#7f8c8d', fontSize: 13 },
  bookBtn: { backgroundColor: '#3d4652', padding: 12, borderRadius: 15 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 50 }
});