import  { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput 
} from 'react-native';
import { Stack } from 'expo-router';
import { Clock, Calendar, Check, Users, Lock, Search, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import ConfirmarReservaModal from '../../components/ConfirmarReserva';
import ToastAcceso from '../../components/ToastAcceso';

export default function HorarioScreen() {
  const [diaSeleccionado, setDiaSeleccionado] = useState({ nombre: 'Todos', label: 'Todos' });
  const [horario, setHorario] = useState([]);
  const [searchText, setSearchText] = useState(''); // <--- ESTADO PARA LA BÚSQUEDA
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '' });
  const [notifs, setNotifs] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClase, setSelectedClase] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // ... (useMemo de listaDias igual)
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

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (clientData.id) fetchHorario();
  }, [diaSeleccionado, clientData.id]);

  const fetchInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const name = await AsyncStorage.getItem('clientName');
      setClientData({ id: id || '', nombre: name || '' });
      if (id) fetchNotifs(id);
    } catch (e) { console.error(e); }
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
      const resp = await fetch(`http://127.0.0.1:8000/api/horario-completo?dia=${diaSeleccionado.nombre}&client_id=${clientData.id}`);
      const data = await resp.json();
      setHorario(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- LÓGICA DE FILTRADO ---
  const horarioFiltrado = useMemo(() => {
    return horario.filter((item: any) => 
      item.nombre_actividad.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.nombre_instructor && item.nombre_instructor.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [searchText, horario]);

  const handleOpenConfirm = (clase: any) => {
    setSelectedClase(clase);
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
      } else {
        const res = await response.json();
        alert(res.message || "No se pudo realizar la reserva");
      }
    } catch (error) { alert("Error de conexión"); }
  };

  const renderItem = ({ item }: { item: any }) => {
    const yaInscrito = parseInt(item.ya_reservado) > 0;
    const count = item.inscritos_count || 0;
    const estaLleno = count >= item.aforo;

    return (
      <View style={[styles.card, yaInscrito && styles.cardInscrito, estaLleno && !yaInscrito && styles.cardLleno]}>
        <View style={styles.timeSection}>
          <Clock color={yaInscrito ? "#2ecc71" : estaLleno ? "#7f8c8d" : "#ff7e5f"} size={18} />
          <Text style={styles.timeText}>{item.hora_inicio?.substring(0, 5)}</Text>
          <Text style={styles.diaTag}>{item.dia?.substring(0, 3)}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.className}>{item.nombre_actividad}</Text>
          <View style={styles.row}>
            <Users size={14} color="#7f8c8d" />
            <Text style={[styles.cupoText, estaLleno && { color: '#e74c3c' }]}>
              {estaLleno ? "Lleno" : `Cupos: ${count}/${item.aforo}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, yaInscrito && styles.btnSuccess, estaLleno && !yaInscrito && styles.btnDisabled]}
          onPress={() => handleOpenConfirm(item)}
          disabled={yaInscrito || estaLleno}
        >
          {yaInscrito ? <Check color="#fff" size={20} /> : estaLleno ? <Lock color="#fff" size={20} /> : <Calendar color="#fff" size={20} />}
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

      {/* Selector de Días */}
      <View style={styles.selectorContainer}>
        <FlatList
          data={listaDias}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.diaPill, diaSeleccionado.label === item.label && styles.diaPillActive]}
              onPress={() => {
                setDiaSeleccionado(item);
                setSearchText(''); // Limpiar búsqueda al cambiar día si prefieres
              }}
            >
              <Text style={[styles.diaText, diaSeleccionado.label === item.label && styles.diaTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 15 }}
        />
      </View>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search color="#7f8c8d" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar actividad o instructor..."
            placeholderTextColor="#7f8c8d"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X color="#7f8c8d" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff7e5f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={horarioFiltrado} // <--- USAMOS LA LISTA FILTRADA
          keyExtractor={(item: any) => item.id_clase.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron clases.</Text>}
          renderItem={renderItem}
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
  diaPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#3d4652' },
  diaPillActive: { backgroundColor: '#ff7e5f' },
  diaText: { color: '#bdc3c7', fontWeight: '600' },
  diaTextActive: { color: '#fff' },
  
  // Estilos de búsqueda
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2f3640',
    borderBottomWidth: 1,
    borderBottomColor: '#1e272e'
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e272e',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },

  card: { backgroundColor: '#2f3640', borderRadius: 20, flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ff7e5f' },
  cardInscrito: { borderLeftColor: '#2ecc71', opacity: 0.9 },
  cardLleno: { borderLeftColor: '#7f8c8d', opacity: 0.6 },
  timeSection: { alignItems: 'center', width: 75 },
  timeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  diaTag: { color: '#7f8c8d', fontSize: 11, textTransform: 'uppercase' },
  infoSection: { flex: 1, marginLeft: 15 },
  className: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cupoText: { color: '#7f8c8d', fontSize: 13, marginLeft: 5 },
  bookBtn: { backgroundColor: '#ff7e5f', padding: 12, borderRadius: 15, width: 50, alignItems: 'center' },
  btnSuccess: { backgroundColor: '#2ecc71' },
  btnDisabled: { backgroundColor: '#485460' },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 50, fontSize: 16 }
});