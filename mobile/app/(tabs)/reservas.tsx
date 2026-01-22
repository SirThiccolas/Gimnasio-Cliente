import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, QrCode } from 'lucide-react-native';

import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import QrAcceso from '../../components/QrAcceso';
import ToastAcceso from '../../components/ToastAcceso';

interface Reserva {
  id_clase: number;
  nombre_actividad: string;
  hora_inicio: string;
  status: 'confirmado' | 'cancelado' | 'usado';
  fecha_clase: string;
}

export default function ReservasScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '', apellido: '' });
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'hoy' | 'usadas'>('todas');
  
  const [selectedQr, setSelectedQr] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const hoyStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadInitialData();
  }, []);

  // --- LÓGICA DE POLLING Y POPUP ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (selectedQr) {
      interval = setInterval(async () => {
        try {
          // IMPORTANTE: Cambia 127.0.0.1 por tu IP local (ej. 192.168.1.XX) si usas móvil real
          const response = await fetch(
            `http://127.0.0.1:8000/api/status-inscripcion/${clientData.id}/${selectedQr.id_clase}`
          );
          const data = await response.json();

          if (data.status === 'usado') {
            console.log("¡Acceso confirmado en el servidor!");
            clearInterval(interval);
            
            // 1. Mostrar el Toast inmediatamente
            setToastMsg(`¡Bienvenido a ${selectedQr.actividad}!`);
            setShowToast(true);

            // 2. Delay para que el usuario vea el Toast sobre el QR antes de cerrar
            setTimeout(() => {
              setSelectedQr(null); 
              fetchReservas(clientData.id); // Refrescar lista para marcar como usado
            }, 1500);
          }
        } catch (e) {
          console.log("Esperando validación...");
        }
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedQr]);

  const loadInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      const apellido = await AsyncStorage.getItem('clientLastname');
      setClientData({ nombre: nombre || '', id: id || '', apellido: apellido || '' });
      if (id) await fetchReservas(id);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchReservas = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/reservas/${id}`);
      if (response.ok) setReservas(await response.json());
    } catch (error) { console.error(error); }
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (filtro === 'hoy') return r.fecha_clase === hoyStr && r.status !== 'usado';
    if (filtro === 'usadas') return r.status === 'usado';
    return true;
  });

  const renderItem = ({ item }: { item: Reserva }) => {
    const esHoy = item.fecha_clase === hoyStr;
    const esUsado = item.status === 'usado';
    return (
      <View style={[styles.card, esUsado && styles.cardUsado]}>
        <View style={styles.cardHeader}>
          <Text style={styles.actividadName}>{item.nombre_actividad}</Text>
          <View style={[styles.statusBadge, { backgroundColor: esUsado ? '#3498db' : '#2ecc71' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Clock size={16} color="#ff7e5f" />
          <Text style={styles.infoText}>{item.hora_inicio.substring(0, 5)} hs - {item.fecha_clase}</Text>
        </View>
        {esHoy && !esUsado && (
          <TouchableOpacity 
            style={styles.qrButton} 
            onPress={() => setSelectedQr({
              id_clase: item.id_clase,
              id_cliente: clientData.id,
              actividad: item.nombre_actividad,
              hora: item.hora_inicio
            })}
          >
            <QrCode color="#fff" size={18} />
            <Text style={styles.qrButtonText}>MOSTRAR QR</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CustomHeader title="MIS RESERVAS" onOpenMenu={() => setIsMenuOpen(true)} clientId={clientData.id} />
      
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} clientData={clientData as any} />

      <View style={styles.tabContainer}>
        {(['todas', 'hoy', 'usadas'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFiltro(f)} style={[styles.tabButton, filtro === f && styles.tabActive]}>
            <Text style={[styles.tabText, filtro === f && styles.tabTextActive]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff7e5f" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={reservasFiltradas}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay reservas para mostrar.</Text>}
        />
      )}

      {/* --- EL ORDEN AQUÍ ABAJO ES LO QUE ARREGLA EL POPUP --- */}
      
      {/* 1. El QR se dibuja primero (Capa inferior de los overlays) */}
      <QrAcceso 
        visible={!!selectedQr} 
        onClose={() => setSelectedQr(null)} 
        data={selectedQr} 
      />

      {/* 2. El Toast se dibuja después (Capa superior, saldrá por encima del QR) */}
      <ToastAcceso 
        visible={showToast} 
        message={toastMsg} 
        onClose={() => setShowToast(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#2f3640', margin: 15, borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#3d4652', borderRadius: 10 },
  tabText: { color: '#7f8c8d', fontSize: 11, fontWeight: 'bold' },
  tabTextActive: { color: '#ff7e5f' },
  card: { backgroundColor: '#2f3640', borderRadius: 20, padding: 20, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#ff7e5f' },
  cardUsado: { opacity: 0.5, borderLeftColor: '#3498db' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  actividadName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { color: '#bdc3c7', marginLeft: 8 },
  qrButton: { backgroundColor: '#ff7e5f', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10 },
  qrButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 40 }
});