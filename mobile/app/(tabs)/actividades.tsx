import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  TouchableOpacity, ScrollView, Modal, TextInput, RefreshControl 
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Dumbbell, Timer, Clock, X, Calendar, 
  ChevronRight, Check, Lock, Search, PlayCircle, MinusCircle 
} from 'lucide-react-native';

// Componentes
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import ConfirmarReservaModal from '../../components/ConfirmarReserva';
import ToastAcceso from '../../components/ToastAcceso';

// Interfaces
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
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchNotifs = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/unread/${id}?t=${Date.now()}`);
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

  const calcularInfoFecha = (diaNombre: string, horaInicio: string) => {
    const diasSemanas: { [key: string]: number } = {
      'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
      'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
    };

    const hoy = new Date();
    const hoyNum = hoy.getDay(); 
    const objetivo = diasSemanas[diaNombre.toLowerCase()];

    let dif = objetivo - hoyNum;
    if (dif < 0) dif += 7;

    if (dif === 0) {
      const [horas, minutos] = horaInicio.split(':').map(Number);
      const horaClaseObj = new Date();
      horaClaseObj.setHours(horas, minutos, 0);
      
      if (hoy > horaClaseObj) {
        dif = 7;
      }
    }

    const fechaClase = new Date();
    fechaClase.setDate(hoy.getDate() + dif);

    const diaCap = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1);
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    
    return {
      texto: `${diaCap}, ${fechaClase.toLocaleDateString('es-ES', opciones).replace('.', '')}`,
      iso: fechaClase.toISOString().split('T')[0],
      esHoyReal: dif === 0
    };
  };

  const prepararReserva = (horario: Horario) => {
    const infoFecha = calcularInfoFecha(horario.dia, horario.hora_inicio);
    setClaseParaReservar({ 
      ...horario, 
      nombre_actividad: selectedAct?.nombre,
      dia: infoFecha.texto,
      fecha_calculada: infoFecha.iso
    });
    setReservaModalVisible(true);
  };

  const ejecutarReserva = async () => {
    setReservaModalVisible(false);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_cliente: clientData.id, 
          id_clase: claseParaReservar.id_clase
        })
      });

      if (response.ok) {
        setToastMsg(`¡Reserva confirmada!`);
        setShowToast(true);
        if (selectedAct) fetchHorarios(selectedAct);
        fetchNotifs(clientData.id); 
      } else {
        const result = await response.json();
        alert(result.message || "Error al reservar");
      }
    } catch (error) { 
      alert("Error de conexión"); 
    }
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
      <div style={styles.cardFooter}>
        <View style={styles.infoTag}>
          <Timer color="#ff7e5f" size={14} />
          <Text style={styles.infoTagText}>{item.duracion} min</Text>
        </View>
        <Text style={styles.verMas}>Ver horarios disponibles</Text>
      </div>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#ff7e5f" />
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron actividades.</Text>
          </View>
        }
      />

      {/* MODAL DE HORARIOS */}
      <Modal visible={!!selectedAct} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedAct?.nombre}</Text>
                <Text style={styles.modalSubTitle}>Sesiones para esta semana</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAct(null)} style={styles.closeBtn}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            {loadingHorarios ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ff7e5f" size="large" />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {horarios.length > 0 ? (
                  horarios.map((h, i) => {
                    const ahora = new Date();
                    const info = calcularInfoFecha(h.dia, h.hora_inicio);
                    
                    const [horas, minutos] = h.hora_inicio.split(':').map(Number);
                    const inicio = new Date(); inicio.setHours(horas, minutos, 0);
                    const fin = new Date(inicio.getTime() + (selectedAct?.duracion || 60) * 60000);

                    // Lógica de estados
                    const estaEnCurso = info.esHoyReal && ahora >= inicio && ahora <= fin;
                    const estaFinalizada = info.esHoyReal && ahora > fin;
                    const yaInscrito = parseInt((h as any).ya_reservado) > 0;
                    const estaLleno = h.inscritos >= h.aforo_maximo;
                    const isCancelled = h.status?.toLowerCase() === 'cancelado';
                    
                    const isDisabled = yaInscrito || estaLleno || isCancelled || estaFinalizada;

                    return (
                      <TouchableOpacity 
                        key={i} 
                        disabled={isDisabled}
                        style={[
                          styles.horarioItem, 
                          yaInscrito && styles.horarioInscrito,
                          estaEnCurso && styles.horarioEnCurso,
                          estaFinalizada && styles.horarioFinalizada,
                          estaLleno && !yaInscrito && styles.horarioLleno
                        ]}
                        onPress={() => prepararReserva(h)}
                      >
                        <View style={styles.horarioRow}>
                          <View style={styles.horarioLeft}>
                             <Calendar color={estaFinalizada ? "#95a5a6" : estaEnCurso ? "#f1c40f" : yaInscrito ? "#2ecc71" : "#ff7e5f"} size={18} />
                             <Text style={[styles.diaText, estaFinalizada && {color: '#95a5a6'}]}>
                               {info.texto}
                             </Text>
                          </View>
                          <View style={styles.horarioRight}>
                             <Text style={[styles.horaText, estaFinalizada && {color: '#95a5a6'}]}>{h.hora_inicio.substring(0,5)}</Text>
                             <View style={[styles.aforoBadge, estaLleno && !yaInscrito && styles.aforoFull]}>
                               <Text style={[styles.aforoText, estaLleno && {color: '#fff'}]}>{h.inscritos}/{h.aforo_maximo}</Text>
                             </View>
                          </View>
                        </View>
                        <View style={styles.horarioFooter}>
                          <Text style={styles.profeText}>Monitor: {h.nombre_instructor}</Text>
                          
                          {yaInscrito ? (
                              <View style={styles.badge}><Check color="#2ecc71" size={12} /><Text style={styles.successLabel}> INSCRITO</Text></View>
                          ) : estaEnCurso ? (
                              <View style={styles.badge}><PlayCircle color="#f1c40f" size={12} /><Text style={styles.enCursoLabel}> EN CURSO</Text></View>
                          ) : estaFinalizada ? (
                              <View style={styles.badge}><MinusCircle color="#95a5a6" size={12} /><Text style={styles.finalizadaLabel}> FINALIZADA</Text></View>
                          ) : estaLleno ? (
                              <View style={styles.badge}><Lock color="#f1c40f" size={12} /><Text style={styles.fullLabel}> LLENO</Text></View>
                          ) : isCancelled ? (
                              <Text style={styles.cancelLabel}>CANCELADO</Text>
                          ) : (
                              <ChevronRight color="#ff7e5f" size={18} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Clock color="#7f8c8d" size={40} />
                    <Text style={styles.emptyText}>No hay horarios disponibles esta semana.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ConfirmarReservaModal 
        visible={reservaModalVisible} 
        clase={claseParaReservar} 
        onClose={() => setReservaModalVisible(false)} 
        onConfirm={ejecutarReserva} 
      />
      
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e272e' },
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
  horarioItem: { backgroundColor: '#1e272e', borderRadius: 15, padding: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#ff7e5f' },
  horarioInscrito: { borderLeftColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.05)' },
  horarioEnCurso: { borderLeftColor: '#f1c40f' },
  horarioFinalizada: { borderLeftColor: '#485460', opacity: 0.5 },
  horarioLleno: { borderLeftColor: '#7f8c8d', opacity: 0.6 },
  horarioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  horarioLeft: { flexDirection: 'row', alignItems: 'center' },
  horarioRight: { flexDirection: 'row', alignItems: 'center' },
  diaText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  horaText: { color: '#fff', marginRight: 10, fontWeight: '600', fontSize: 16 },
  aforoBadge: { backgroundColor: '#2f3640', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  aforoFull: { backgroundColor: '#e67e22' },
  aforoText: { color: '#bdc3c7', fontSize: 11, fontWeight: 'bold' },
  horarioFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profeText: { color: '#7f8c8d', fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center' },
  successLabel: { color: '#2ecc71', fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
  enCursoLabel: { color: '#f1c40f', fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
  finalizadaLabel: { color: '#95a5a6', fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
  fullLabel: { color: '#f1c40f', fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
  cancelLabel: { color: '#e74c3c', fontWeight: 'bold', fontSize: 11 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 10 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' }
});