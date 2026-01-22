import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, StyleSheet, 
  ScrollView, FlatList, ActivityIndicator 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dumbbell, Calendar, Clock, ChevronRight } from 'lucide-react-native';

// Componentes
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; 
const SPACING = 15; 

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Datos
  const [clientData, setClientData] = useState({ nombre: '', id: '', apellido: '' });
  const [actividades, setActividades] = useState([]);
  const [misClases, setMisClases] = useState([]); 
  const [horarioHoy, setHorarioHoy] = useState([]); 
  const [notifs, setNotifs] = useState([]);

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      const apellido = await AsyncStorage.getItem('clientLastname');
      
      setClientData({ 
        nombre: nombre || 'Usuario', 
        id: id || '', 
        apellido: apellido || '' 
      });

      const [resAct, resMis, resHoy] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/actividades"),
        fetch(`http://127.0.0.1:8000/api/mis-clases/${id}`),
        fetch("http://127.0.0.1:8000/api/horario-hoy"),
      ]);

      if (resAct.ok) setActividades(await resAct.json());
      if (resMis.ok) setMisClases(await resMis.json());
      if (resHoy.ok) setHorarioHoy(await resHoy.json());
      
      if (id) fetchNotifs(id);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7e5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER UNIFICADO */}
      <CustomHeader 
        title="GYM PRO" 
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* BIENVENIDA */}
        <View style={styles.welcomeSection}>
          <Text style={styles.helloText}>Hola,</Text>
          <Text style={styles.nameText}>{clientData.nombre} 👋</Text>
        </View>

        {/* CARRUSEL ACTIVIDADES */}
        <Text style={styles.sectionTitle}>Nuestras Actividades</Text>
        <FlatList
          data={actividades}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          renderItem={({ item }: any) => (
            <View style={styles.actCard}>
              <Dumbbell color="#ff7e5f" size={24} />
              <View>
                <Text style={styles.actName}>{item.nombre}</Text>
                <Text style={styles.actDesc} numberOfLines={3}>{item.descripcion}</Text>
              </View>
              <TouchableOpacity 
                style={styles.mainBtn} 
                onPress={() => router.push("/(tabs)/actividades")}
              >
                <Text style={styles.mainBtnText}>Reservar</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* TUS CLASES DE HOY */}
        <Text style={styles.sectionTitle}>Tus Clases de Hoy</Text>
        <View style={styles.listContainer}>
          {misClases.length > 0 ? misClases.map((clase: any, i) => (
            <View key={i} style={styles.myClassItem}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{clase.hora.substring(0,5)}</Text>
                </View>
                <Text style={styles.myClassName}>{clase.nombre_actividad}</Text>
                <Calendar color="#ff7e5f" size={18} />
            </View>
          )) : <Text style={styles.emptyText}>No tienes reservas hoy.</Text>}
        </View>

        {/* HORARIO GENERAL DE HOY */}
        <View style={styles.rowTitle}>
            <Text style={styles.sectionTitle}>Horario de Hoy</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/horario")}>
              <Text style={styles.link}>Ver todo</Text>
            </TouchableOpacity>
        </View>
        <View style={[styles.listContainer, { marginBottom: 30 }]}>
          {horarioHoy.map((item: any, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.horarioRow} 
              onPress={() => router.push("/(tabs)/clases")}
            >
              <Clock color="#7f8c8d" size={18} />
              <Text style={styles.horarioTime}>{item.hora.substring(0,5)}</Text>
              <Text style={styles.horarioName}>{item.nombre_actividad}</Text>
              <ChevronRight color="#ff7e5f" size={20} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e272e' },
  welcomeSection: { padding: 25 },
  helloText: { fontSize: 20, color: '#bdc3c7' },
  nameText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 25, marginVertical: 15 },
  carouselContainer: { paddingLeft: 25, paddingBottom: 20 },
  actCard: { 
    backgroundColor: '#2f3640', 
    width: CARD_WIDTH, 
    marginRight: SPACING, 
    borderRadius: 25, 
    padding: 25, 
    elevation: 5, 
    borderLeftWidth: 8, 
    borderLeftColor: '#ff7e5f', 
    height: 230, 
    justifyContent: 'space-between' 
  },
  actName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  actDesc: { color: '#bdc3c7', fontSize: 13, lineHeight: 18 },
  mainBtn: { backgroundColor: '#ff7e5f', padding: 12, borderRadius: 12, alignItems: 'center' },
  mainBtnText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 25 },
  myClassItem: { backgroundColor: '#2f3640', padding: 15, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timeBadge: { backgroundColor: '#ff7e5f', padding: 8, borderRadius: 10, width: 55, alignItems: 'center' },
  timeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  myClassName: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: 'bold', color: '#fff' },
  horarioRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2f3640', padding: 18, borderRadius: 15, marginBottom: 8 },
  horarioTime: { marginLeft: 12, fontWeight: 'bold', width: 55, color: '#fff' },
  horarioName: { flex: 1, color: '#bdc3c7', fontWeight: '500' },
  rowTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 25 },
  link: { color: '#ff7e5f', fontWeight: 'bold' },
  emptyText: { color: '#7f8c8d', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }
});