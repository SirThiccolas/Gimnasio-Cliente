import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, RefreshControl 
} from 'react-native';
import { Stack } from 'expo-router';
import { Clock, Calendar, Check, Users, Lock, Search, X, PlayCircle, MinusCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import ConfirmarReservaModal from '../../components/ConfirmarReserva';
import ToastAcceso from '../../components/ToastAcceso';

export default function HorarioScreen() {
  const [diaSeleccionado, setDiaSeleccionado] = useState({ nombre: 'todos', label: 'Todos' });
  const [horario, setHorario] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '' });
  const [notifs, setNotifs] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClase, setSelectedClase] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // 1. Cargar datos del cliente al montar
  useEffect(() => {
    const loadStorage = async () => {
      const id = await AsyncStorage.getItem('clientId');
      const name = await AsyncStorage.getItem('clientName');
      if (id) {
        setClientData({ id, nombre: name || '' });
        // Pedir notificaciones inmediatamente tengamos el ID
        fetchNotifs(id);
      }
    };
    loadStorage();
  }, []);

  // 2. Cargar horario cuando cambie el día o el cliente
  useEffect(() => {
    if (clientData.id) {
      fetchHorario();
    }
  }, [diaSeleccionado, clientData.id]);

  const fetchNotifs = async (id: string) => {
    if (!id) return;
    try {
      // Usamos un timestamp para evitar cache del navegador/dispositivo
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/unread/${id}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifs(data);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const fetchHorario = async () => {
    setLoading(true);
    try {
      const url = `http://127.0.0.1:8000/api/horario-completo?dia=${diaSeleccionado.nombre}&client_id=${clientData.id}`;
      const resp = await fetch(url);
      const data = await resp.json();
      setHorario(Array.isArray(data) ? data : []);
    } catch (e) {
      setHorario([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHorario();
    fetchNotifs(clientData.id);
  }, [clientData.id]);

  // Generar lista de días
  const listaDias = useMemo(() => {
    const diasGenerados = [{ nombre: 'todos', label: 'Todos' }];
    const hoy = new Date();
    for (let i = 0; i < 8; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + i);
      const nombreDia = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(fecha);
      const numeroDia = fecha.getDate();
      const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(fecha);
      diasGenerados.push({
        nombre: nombreDia.toLowerCase(),
        label: `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)}, ${numeroDia} ${nombreMes.replace('.', '')}`,
        esHoy: i === 0
      });
    }
    return diasGenerados;
  }, []);

  const horarioFiltrado = useMemo(() => {
    return horario.filter((item: any) => {
      const bus = searchText.toLowerCase();
      return (item?.nombre_actividad?.toLowerCase() || '').includes(bus) || 
             (item?.nombre_instructor?.toLowerCase() || '').includes(bus);
    });
  }, [searchText, horario]);

  const handleOpenConfirm = (clase: any) => {
    const infoDia = listaDias.find(d => d.nombre === clase.dia.toLowerCase());
    setSelectedClase({ 
      ...clase, 
      dia: diaSeleccionado.nombre !== 'todos' ? diaSeleccionado.label : (infoDia ? infoDia.label : clase.dia) 
    });
    setModalVisible(true);
  };

  const ejecutarReserva = async () => {
    setModalVisible(false);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_cliente: clientData.id, id_clase: selectedClase.id_clase })
      });
      if (response.ok) {
        setToastMsg(`¡Reserva confirmada!`);
        setShowToast(true);
        fetchHorario();
        fetchNotifs(clientData.id); // Actualizar notifs tras reservar
      } else {
        const res = await response.json();
        alert(res.message || "Error al reservar");
      }
    } catch (error) { alert("Error de conexión"); }
  };

  const renderItem = ({ item }: { item: any }) => {
    const ahora = new Date();
    const nombreHoyReal = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(ahora).toLowerCase();
    
    // Solo es "hoy" si coincide el nombre del día Y estamos en la pestaña "Todos" o en la primera pestaña del selector
    const esHoyReal = item.dia.toLowerCase() === nombreHoyReal && 
                      (diaSeleccionado.nombre === 'todos' || diaSeleccionado.label === listaDias[1].label);
    
    const [horas, minutos] = item.hora_inicio.split(':').map(Number);
    const fechaClaseInicio = new Date();
    fechaClaseInicio.setHours(horas, minutos, 0);
    const duracion = parseInt(item.duracion) || 60;
    const fechaClaseFin = new Date(fechaClaseInicio.getTime() + duracion * 60000);

    const estaEnCurso = esHoyReal && ahora >= fechaClaseInicio && ahora <= fechaClaseFin;
    const estaFinalizada = esHoyReal && ahora > fechaClaseFin;

    const yaInscrito = parseInt(item.ya_reservado) > 0;
    const count = parseInt(item.inscritos_count) || 0;
    const max = parseInt(item.aforo) || 0;
    const estaLleno = max > 0 && count >= max;

    return (
      <View style={[
        styles.card, 
        yaInscrito && styles.cardInscrito, 
        estaLleno && !yaInscrito && styles.cardLleno,
        estaEnCurso && styles.cardEnCurso,
        estaFinalizada && styles.cardFinalizada
      ]}>
        <View style={styles.timeSection}>
          <Clock color={estaFinalizada ? "#95a5a6" : estaEnCurso ? "#f1c40f" : yaInscrito ? "#2ecc71" : "#ff7e5f"} size={18} />
          <Text style={[styles.timeText, estaFinalizada && {color: '#95a5a6'}]}>{item.hora_inicio?.substring(0, 5)}</Text>
          <Text style={styles.diaTag}>{item.dia?.substring(0, 3)}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <Text style={[styles.className, estaFinalizada && {color: '#95a5a6'}]}>{item.nombre_actividad}</Text>
            {estaEnCurso && <View style={styles.liveBadge}><Text style={styles.liveText}>EN CURSO</Text></View>}
            {estaFinalizada && <View style={styles.finalizadaBadge}><Text style={styles.finalizadaText}>FINALIZADA</Text></View>}
          </View>
          <View style={styles.row}>
            <Users size={14} color="#7f8c8d" />
            <Text style={[styles.cupoText, estaLleno && !estaFinalizada && { color: '#e74c3c' }]}>
              {estaFinalizada ? "Sesión terminada" : estaLleno ? "Lleno" : `Cupos: ${count}/${max}`}
            </Text>
          </View>
          <Text style={styles.instructorText}>{item.nombre_instructor}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.bookBtn, yaInscrito && styles.btnSuccess, (estaLleno || estaEnCurso || estaFinalizada) && !yaInscrito && styles.btnDisabled]}
          onPress={() => handleOpenConfirm(item)}
          disabled={yaInscrito || estaLleno || estaEnCurso || estaFinalizada}
        >
          {yaInscrito ? <Check color="#fff" size={20} /> : 
           estaFinalizada ? <MinusCircle color="#fff" size={20} /> :
           estaEnCurso ? <PlayCircle color="#fff" size={20} /> :
           estaLleno ? <Lock color="#fff" size={20} /> : <Calendar color="#fff" size={20} />}
        </TouchableOpacity>
      </View>
    );
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
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} clientData={clientData as any} />

      <View style={styles.selectorContainer}>
        <FlatList
          data={listaDias} horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.diaPill, diaSeleccionado.label === item.label && styles.diaPillActive]}
              onPress={() => { setDiaSeleccionado(item); setSearchText(''); }}
            >
              <Text style={[styles.diaText, diaSeleccionado.label === item.label && styles.diaTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 15 }}
        />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search color="#7f8c8d" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput} placeholder="Buscar actividad..."
            placeholderTextColor="#7f8c8d" value={searchText} onChangeText={setSearchText}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#ff7e5f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={horarioFiltrado}
          keyExtractor={(item: any) => item.id_clase.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff7e5f" />}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay clases disponibles.</Text>}
        />
      )}

      <ConfirmarReservaModal visible={modalVisible} clase={selectedClase} onClose={() => setModalVisible(false)} onConfirm={ejecutarReserva} />
      <ToastAcceso visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  selectorContainer: { backgroundColor: '#2f3640' },
  diaPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#3d4652' },
  diaPillActive: { backgroundColor: '#ff7e5f' },
  diaText: { color: '#bdc3c7', fontWeight: '600', fontSize: 13 },
  diaTextActive: { color: '#fff' },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2f3640' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e272e', borderRadius: 12, paddingHorizontal: 12, height: 45 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff' },
  card: { backgroundColor: '#2f3640', borderRadius: 20, flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ff7e5f' },
  cardInscrito: { borderLeftColor: '#2ecc71' },
  cardLleno: { borderLeftColor: '#7f8c8d', opacity: 0.6 },
  cardEnCurso: { borderLeftColor: '#f1c40f' },
  cardFinalizada: { borderLeftColor: '#485460', opacity: 0.5 },
  liveBadge: { backgroundColor: '#f1c40f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  liveText: { color: '#1e272e', fontSize: 10, fontWeight: 'bold' },
  finalizadaBadge: { backgroundColor: '#485460', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  finalizadaText: { color: '#bdc3c7', fontSize: 10, fontWeight: 'bold' },
  timeSection: { alignItems: 'center', width: 75 },
  timeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  diaTag: { color: '#7f8c8d', fontSize: 11, textTransform: 'uppercase' },
  infoSection: { flex: 1, marginLeft: 15 },
  className: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  instructorText: { color: '#7f8c8d', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  cupoText: { color: '#7f8c8d', fontSize: 13, marginLeft: 5 },
  bookBtn: { backgroundColor: '#ff7e5f', padding: 12, borderRadius: 15, width: 50, alignItems: 'center' },
  btnSuccess: { backgroundColor: '#2ecc71' },
  btnDisabled: { backgroundColor: '#485460' },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 50 }
});