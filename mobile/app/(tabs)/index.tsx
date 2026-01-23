import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, StyleSheet, 
  ScrollView, FlatList, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Dumbbell, Calendar, Clock, ChevronRight, 
  X as CloseIcon, Timer 
} from 'lucide-react-native';

// Componentes
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import ConfirmarReservaModal from '@/components/ConfirmarReserva';
import ToastAcceso from '../../components/ToastAcceso';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; 
const SPACING = 15; 

// Interfaces
interface Actividad {
  id_actividad: number;
  nombre: string;
  descripcion: string;
}

interface Horario {
  id_clase: number;
  dia: string;
  hora_inicio: string;
  status: string;
  nombre_instructor: string;
  aforo_maximo: number;
  inscritos: number;
  nombre_actividad?: string; // Para el modal de confirmación
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [clientData, setClientData] = useState({ nombre: '', id: '', apellido: '' });
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [misClases, setMisClases] = useState([]); 
  const [horarioHoy, setHorarioHoy] = useState([]); 
  const [notifs, setNotifs] = useState([]);
  const [volverAReservar, setVolverAReservar] = useState<Actividad[]>([]);

  // Estados para Horarios
  const [selectedAct, setSelectedAct] = useState<Actividad | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // Estados para el Popup de Confirmación
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [claseParaConfirmar, setClaseParaConfirmar] = useState<any>(null);
  
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      const apellido = await AsyncStorage.getItem('clientLastname');
      
      setClientData({ nombre: nombre || 'Usuario', id: id || '', apellido: apellido || '' });

      const [resAct, resMis, resHoy, resVolver] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/actividades"),
        fetch(`http://127.0.0.1:8000/api/mis-clases/${id}`),
        fetch("http://127.0.0.1:8000/api/horario-hoy"),
        fetch(`http://127.0.0.1:8000/api/volver-reservar/${id}`),
      ]);

      if (resAct.ok) setActividades(await resAct.json());
      if (resMis.ok) setMisClases(await resMis.json());
      if (resHoy.ok) setHorarioHoy(await resHoy.json());
      if (resVolver.ok) setVolverAReservar(await resVolver.json());
      
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
    setHorarios([]); 
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/actividades/${actividad.id_actividad}/horarios`);
      if (res.ok) setHorarios(await res.json());
    } catch (e) { console.error(e); } finally { setLoadingHorarios(false); }
  };

  // Función que se ejecuta al confirmar la reserva en el Popup
  const ejecutarReserva = async () => {
    setConfirmModalVisible(false);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_cliente: clientData.id, 
          id_clase: claseParaConfirmar.id_clase 
        })
      });

      if (response.ok) {
        setToastMsg(`¡Reserva confirmada en ${claseParaConfirmar.nombre_actividad}!`);
        setShowToast(true);
        fetchInitialData(); // Recargar datos para ver la nueva clase en "Mis Clases"
      } else {
        const res = await response.json();
        alert(res.message || "No se pudo realizar la reserva");
      }
    } catch (error) {
      alert("Error de conexión al reservar");
    }
  };

  // Abre el popup de confirmación desde el modal de horarios
  const abrirConfirmacion = (horario: Horario) => {
    setClaseParaConfirmar({
      ...horario,
      nombre_actividad: selectedAct?.nombre,
      hora: horario.hora_inicio
    });
    setConfirmModalVisible(true);
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

      <CustomHeader 
        title="GYM PRO" 
        onOpenMenu={() => setIsMenuOpen(true)}
        clientId={clientData.id}
        unreadCount={notifs.length}
        notificaciones={notifs}
        onRefreshNotifs={() => fetchNotifs(clientData.id)}
      />

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} clientData={clientData as any} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.helloText}>Hola,</Text>
          <Text style={styles.nameText}>{clientData.nombre} 👋</Text>
        </View>

        {/* VOLVER A RESERVAR */}
        {volverAReservar.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Volver a reservar</Text>
            <FlatList
              data={volverAReservar}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={CARD_WIDTH + SPACING}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <View style={styles.rebookCard}>
                  <View>
                    <Dumbbell color="#ff7e5f" size={24} style={{ marginBottom: 12 }} />
                    <Text style={styles.rebookName}>{item.nombre}</Text>
                    <Text style={styles.rebookDesc} numberOfLines={1}>Repite tu clase favorita</Text>
                  </View>
                  <TouchableOpacity style={styles.rebookBtn} onPress={() => fetchHorarios(item)}>
                    <Text style={styles.rebookBtnText}>Reservar</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}

        {/* NUESTRAS ACTIVIDADES */}
        <Text style={styles.sectionTitle}>Nuestras Actividades</Text>
        <FlatList
          data={actividades}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style={styles.actCard}>
              <Dumbbell color="#ff7e5f" size={24} />
              <View>
                <Text style={styles.actName}>{item.nombre}</Text>
                <Text style={styles.actDesc} numberOfLines={3}>{item.descripcion}</Text>
              </View>
              <TouchableOpacity style={styles.mainBtn} onPress={() => fetchHorarios(item)}>
                <Text style={styles.mainBtnText}>Ver Horarios</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* TUS CLASES DE HOY */}
        <Text style={styles.sectionTitle}>Tus Clases de Hoy</Text>
        <View style={styles.listContainer}>
          {misClases.length > 0 ? misClases.map((clase: any, i) => (
            <View key={i} style={styles.myClassItem}>
                <View style={styles.timeBadge}><Text style={styles.timeText}>{clase.hora.substring(0,5)}</Text></View>
                <Text style={styles.myClassName}>{clase.nombre_actividad}</Text>
                <Calendar color="#ff7e5f" size={18} />
            </View>
          )) : <Text style={styles.emptyText}>No tienes reservas hoy.</Text>}
        </View>

        {/* HORARIO GENERAL */}
        <View style={styles.rowTitle}>
            <Text style={styles.sectionTitle}>Horario de Hoy</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/horario")}><Text style={styles.link}>Ver todo</Text></TouchableOpacity>
        </View>
        <View style={[styles.listContainer, { marginBottom: 30 }]}>
          {horarioHoy.map((item: any, i) => (
            <TouchableOpacity key={i} style={styles.horarioRowSimple} onPress={() => router.push("/(tabs)/clases")}>
              <Clock color="#7f8c8d" size={18} />
              <Text style={styles.horarioTimeSimple}>{item.hora.substring(0,5)}</Text>
              <Text style={styles.horarioNameSimple}>{item.nombre_actividad}</Text>
              <ChevronRight color="#ff7e5f" size={20} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* --- MODAL DE HORARIOS --- */}
      <Modal visible={!!selectedAct} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedAct?.nombre}</Text>
                <Text style={styles.modalSubTitle}>Sesiones disponibles</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAct(null)} style={styles.closeBtn}>
                <CloseIcon color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            {loadingHorarios ? (
              <View style={styles.modalLoading}><ActivityIndicator color="#ff7e5f" size="large" /></View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {horarios.length > 0 ? horarios.map((h, i) => {
                  const isFull = h.inscritos >= h.aforo_maximo;
                  const isCancelled = h.status?.toLowerCase() === 'cancelado';
                  return (
                    <TouchableOpacity 
                      key={i} 
                      disabled={isCancelled || isFull}
                      style={[styles.horarioItem, (isCancelled || isFull) && {opacity: 0.6}]}
                      onPress={() => abrirConfirmacion(h)}
                    >
                      <View style={styles.horarioRow}>
                        <View style={styles.horarioLeft}>
                           <Calendar color="#ff7e5f" size={18} />
                           <Text style={styles.diaText}>{h.dia.toUpperCase()}</Text>
                        </View>
                        <View style={styles.horarioRight}>
                           <Text style={styles.horaText}>{h.hora_inicio.substring(0,5)}</Text>
                           <View style={[styles.aforoBadge, isFull && styles.aforoFull]}>
                             <Text style={[styles.aforoText, isFull && {color: '#fff'}]}>{h.inscritos}/{h.aforo_maximo}</Text>
                           </View>
                        </View>
                      </View>
                      <View style={styles.horarioFooter}>
                        <Text style={styles.profeText}>Con {h.nombre_instructor}</Text>
                        {isCancelled ? <Text style={styles.cancelLabel}>CANCELADA</Text> : isFull ? <Text style={styles.fullLabel}>LLENO</Text> : <ChevronRight color="#ff7e5f" size={18} />}
                      </View>
                    </TouchableOpacity>
                  );
                }) : <Text style={styles.emptyText}>No hay horarios disponibles.</Text>}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* --- POPUP DE CONFIRMACIÓN DE RESERVA --- */}
      <ConfirmarReservaModal 
        visible={confirmModalVisible} 
        clase={claseParaConfirmar} 
        onClose={() => setConfirmModalVisible(false)} 
        onConfirm={ejecutarReserva} 
      />

      <ToastAcceso visible={showToast} message={toastMsg} onHide={() => setShowToast(false)} />
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
  actCard: { backgroundColor: '#2f3640', width: CARD_WIDTH, marginRight: SPACING, borderRadius: 25, padding: 25, borderLeftWidth: 8, borderLeftColor: '#ff7e5f', height: 230, justifyContent: 'space-between' },
  actName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  actDesc: { color: '#bdc3c7', fontSize: 13 },
  mainBtn: { backgroundColor: '#ff7e5f', padding: 12, borderRadius: 12, alignItems: 'center' },
  mainBtnText: { color: '#fff', fontWeight: 'bold' },
  rebookCard: { backgroundColor: '#2f3640', width: CARD_WIDTH, marginRight: SPACING, borderRadius: 20, padding: 20, borderLeftWidth: 6, borderLeftColor: '#ff7e5f', height: 180, justifyContent: 'space-between' },
  rebookName: { fontSize: 19, fontWeight: 'bold', color: '#fff' },
  rebookDesc: { color: '#bdc3c7', fontSize: 13 },
  rebookBtn: { backgroundColor: '#ff7e5f', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  rebookBtnText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 25 },
  myClassItem: { backgroundColor: '#2f3640', padding: 15, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timeBadge: { backgroundColor: '#ff7e5f', padding: 8, borderRadius: 10, width: 55, alignItems: 'center' },
  timeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  myClassName: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: 'bold', color: '#fff' },
  horarioRowSimple: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2f3640', padding: 18, borderRadius: 15, marginBottom: 8 },
  horarioTimeSimple: { marginLeft: 12, fontWeight: 'bold', width: 55, color: '#fff' },
  horarioNameSimple: { flex: 1, color: '#bdc3c7' },
  rowTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 25 },
  link: { color: '#ff7e5f', fontWeight: 'bold' },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2f3640', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  modalSubTitle: { color: '#7f8c8d', fontSize: 14 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 12 },
  modalLoading: { padding: 50, alignItems: 'center' },
  horarioItem: { backgroundColor: '#1e272e', borderRadius: 20, padding: 18, marginBottom: 12 },
  horarioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  horarioLeft: { flexDirection: 'row', alignItems: 'center' },
  horarioRight: { flexDirection: 'row', alignItems: 'center' },
  diaText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  horaText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 12 },
  aforoBadge: { backgroundColor: '#2f3640', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  aforoFull: { backgroundColor: '#e67e22' },
  aforoText: { color: '#bdc3c7', fontSize: 12, fontWeight: 'bold' },
  horarioFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profeText: { color: '#7f8c8d', fontSize: 13 },
  cancelLabel: { color: '#e74c3c', fontWeight: 'bold' },
  fullLabel: { color: '#f1c40f', fontWeight: 'bold' }
});