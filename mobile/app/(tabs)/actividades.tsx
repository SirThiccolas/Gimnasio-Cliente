import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  TouchableOpacity, ScrollView, Modal, TextInput 
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dumbbell, Timer, Clock, X, Calendar, ChevronRight, Check, Lock, Search } from 'lucide-react-native';

// Componentes
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import ConfirmarReservaModal from '../../components/ConfirmarReserva';
import ToastAcceso from '../../components/ToastAcceso';

interface Actividad {
  id_actividad: number;
  nombre: string;
  descripcion: string;
  aforo: number;
  duracion: number;
}

interface Horario {
  id_clase: number;
  dia: string;
  hora_inicio: string;
  status: string;
  nombre_instructor: string;
  aforo_maximo: number;
  inscritos: number;
  ya_reservado?: number;
}

export default function ActividadesScreen() {
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '' });
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedAct, setSelectedAct] = useState<Actividad | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [notifs, setNotifs] = useState([]);

  // Estados para reserva
  const [reservaModalVisible, setReservaModalVisible] = useState(false);
  const [claseParaReservar, setClaseParaReservar] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      setClientData({ nombre: nombre || 'Usuario', id: id || '' });

      const res = await fetch("http://127.0.0.1:8000/api/actividades");
      if (res.ok) setActividades(await res.json());
      if (id) fetchNotifs(id);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchNotifs = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/unread/${id}`);
      if (res.ok) setNotifs(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchHorarios = async (actividad: Actividad) => {
    setSelectedAct(actividad);
    setLoadingHorarios(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/actividades/${actividad.id_actividad}/horarios?client_id=${clientData.id}`);
      if (res.ok) setHorarios(await res.json());
    } catch (e) { console.error(e); } finally { setLoadingHorarios(false); }
  };

  const prepararReserva = (horario: Horario) => {
    setClaseParaReservar({ ...horario, nombre_actividad: selectedAct?.nombre });
    setReservaModalVisible(true);
  };

  const ejecutarReserva = async () => {
    setReservaModalVisible(false);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_cliente: clientData.id, id_clase: claseParaReservar.id_clase })
      });
      if (response.ok) {
        setToastMsg(`¡Reserva confirmada en ${selectedAct?.nombre}!`);
        setShowToast(true);
        if (selectedAct) fetchHorarios(selectedAct);
      } else {
        const result = await response.json();
        alert(result.message || "Error al reservar");
      }
    } catch (error) { alert("Error de conexión"); }
  };

  const actividadesFiltradas = actividades.filter(act => 
    act.nombre.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderActividad = ({ item }: { item: Actividad }) => (
    <TouchableOpacity style={styles.card} onPress={() => fetchHorarios(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}><Dumbbell color="#ff7e5f" size={24} /></View>
        <Text style={styles.actName}>{item.nombre}</Text>
      </View>
      <Text style={styles.actDesc} numberOfLines={2}>{item.descripcion}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.infoTag}>
          <Timer color="#ff7e5f" size={14} />
          <Text style={styles.infoTagText}>{item.duracion} min</Text>
        </View>
        <Text style={styles.verMas}>Ver horarios disponibles</Text>
      </View>
    </TouchableOpacity>
  );
  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#ff7e5f" />
        <Text style={[styles.loadingText, { marginTop: 10 }]}>Cargando actividades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader 
        title="ACTIVIDADES" 
        onOpenMenu={() => setIsMenuOpen(true)}
        clientId={clientData.id}
        unreadCount={notifs.length}
        notificaciones={notifs}
        onRefreshNotifs={() => fetchNotifs(clientData.id)}
      />

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} clientData={clientData as any} />

      <View style={styles.searchBarContainer}>
        <View style={styles.searchWrapper}>
          <Search color="#7f8c8d" size={20} style={{marginRight: 8}} />
          <TextInput 
            placeholder="Buscar actividad..." 
            placeholderTextColor="#7f8c8d"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

<FlatList
  data={actividadesFiltradas}
  keyExtractor={(item) => item.id_actividad.toString()}
  renderItem={renderActividad}
  contentContainerStyle={styles.listContent}
  // Solo mostramos el mensaje si YA terminó de cargar y la lista sigue vacía
  ListEmptyComponent={
    !loading ? (
      <View style={styles.emptyContainer}>
        <Search color="#7f8c8d" size={40} />
        <Text style={styles.emptyText}>No se encontraron actividades.</Text>
      </View>
    ) : null
  }
/>

{/* MODAL DE HORARIOS */}
<Modal visible={!!selectedAct} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <View>
          <Text style={styles.modalTitle}>{selectedAct?.nombre}</Text>
          <Text style={styles.modalSubTitle}>Sesiones disponibles</Text>
        </View>
        <TouchableOpacity onPress={() => setSelectedAct(null)} style={styles.closeBtn}>
          <X color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* 1. MIENTRAS CARGA: Mostramos la ruedita centralizada */}
      {loadingHorarios ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ff7e5f" size="large" />
          <Text style={styles.loadingText}>Buscando horarios...</Text>
        </View>
      ) : (
        /* 2. CUANDO TERMINA: Mostramos la lista o el mensaje de error */
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {horarios.length > 0 ? (
            horarios.map((h, i) => {
              const yaInscrito = parseInt((h as any).ya_reservado) > 0;
              const estaLleno = h.inscritos >= h.aforo_maximo;
              const isCancelled = h.status?.toLowerCase() === 'cancelado';
              const disabled = yaInscrito || estaLleno || isCancelled;

              return (
                <TouchableOpacity 
                  key={i} 
                  disabled={disabled}
                  style={[
                    styles.horarioItem, 
                    isCancelled && styles.horarioCancelado,
                    yaInscrito && styles.horarioInscrito,
                    estaLleno && !yaInscrito && styles.horarioLleno
                  ]}
                  onPress={() => prepararReserva(h)}
                >
                  <View style={styles.horarioRow}>
                    <View style={styles.horarioLeft}>
                       <Calendar color={yaInscrito ? "#2ecc71" : "#ff7e5f"} size={18} />
                       <Text style={[styles.diaText, yaInscrito && {color: '#2ecc71'}]}>{h.dia.toUpperCase()}</Text>
                    </View>
                    <View style={styles.horarioRight}>
                       <Text style={styles.horaText}>{h.hora_inicio.substring(0,5)}</Text>
                       <View style={[styles.aforoBadge, estaLleno && !yaInscrito && styles.aforoFull]}>
                         <Text style={[styles.aforoText, estaLleno && {color: '#fff'}]}>{h.inscritos}/{h.aforo_maximo}</Text>
                       </View>
                    </View>
                  </View>
                  <View style={styles.horarioFooter}>
                    <Text style={styles.profeText}>Monitor: {h.nombre_instructor}</Text>
                    {yaInscrito ? (
                        <View style={styles.badge}><Check color="#2ecc71" size={12} /><Text style={styles.successLabel}> INSCRITO</Text></View>
                    ) : estaLleno ? (
                        <View style={styles.badge}><Lock color="#f1c40f" size={12} /><Text style={styles.fullLabel}> LLENO</Text></View>
                    ) : (
                        <ChevronRight color="#ff7e5f" size={18} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            /* 3. SOLO SI NO HAY DATOS Y NO ESTÁ CARGANDO: Mostramos el mensaje */
            <View style={styles.emptyContainer}>
              <Clock color="#7f8c8d" size={40} />
              <Text style={styles.emptyText}>No hay horarios disponibles para esta actividad esta semana.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  </View>
</Modal>

      <ConfirmarReservaModal visible={reservaModalVisible} clase={claseParaReservar} onClose={() => setReservaModalVisible(false)} onConfirm={ejecutarReserva} />
      <ToastAcceso visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  searchBarContainer: { padding: 20, backgroundColor: '#2f3640' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e272e', borderRadius: 12, paddingHorizontal: 15, height: 45 },
  searchInput: { color: '#fff', flex: 1 },
  listContent: { padding: 20 },
  card: { backgroundColor: '#2f3640', borderRadius: 20, padding: 20, marginBottom: 15, borderLeftWidth: 6, borderLeftColor: '#ff7e5f' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconContainer: { backgroundColor: 'rgba(255, 126, 95, 0.1)', padding: 8, borderRadius: 10, marginRight: 12 },
  actName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actDesc: { color: '#bdc3c7', fontSize: 13, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e272e', padding: 6, borderRadius: 8 },
  infoTagText: { color: '#ff7e5f', marginLeft: 5, fontSize: 11, fontWeight: 'bold' },
  verMas: { color: '#7f8c8d', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2f3640', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  modalSubTitle: { color: '#7f8c8d', fontSize: 13 },
  closeBtn: { backgroundColor: '#1e272e', padding: 5, borderRadius: 10 },
  horarioItem: { backgroundColor: '#1e272e', borderRadius: 15, padding: 15, marginBottom: 10 },
  horarioInscrito: { borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
  horarioLleno: { opacity: 0.5 },
  horarioCancelado: { opacity: 0.3 },
  horarioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  horarioLeft: { flexDirection: 'row', alignItems: 'center' },
  horarioRight: { flexDirection: 'row', alignItems: 'center' },
  diaText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  horaText: { color: '#fff', marginRight: 10, fontWeight: '600' },
  aforoBadge: { backgroundColor: '#2f3640', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  aforoFull: { backgroundColor: '#e67e22' },
  aforoText: { color: '#bdc3c7', fontSize: 11 },
  horarioFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profeText: { color: '#7f8c8d', fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center' },
  successLabel: { color: '#2ecc71', fontWeight: 'bold', fontSize: 11 },
  fullLabel: { color: '#f1c40f', fontWeight: 'bold', fontSize: 11 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 20 },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#7f8c8d',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusBadgeFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 196, 15, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#1e272e' 
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  }
});