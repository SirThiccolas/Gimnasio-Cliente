import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  TouchableOpacity, ScrollView, Modal, SafeAreaView 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dumbbell, Users, Timer, Clock, X, Calendar, ChevronRight } from 'lucide-react-native';

// Componentes
import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';

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
}

export default function ActividadesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientData, setClientData] = useState({ nombre: '', id: '', apellido: '' });
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [selectedAct, setSelectedAct] = useState<Actividad | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      const apellido = await AsyncStorage.getItem('clientLastname');
      
      setClientData({ 
        nombre: nombre || 'Usuario', 
        id: id || '', 
        apellido: apellido || '' 
      });

      const res = await fetch("http://127.0.0.1:8000/api/actividades");
      if (res.ok) setActividades(await res.json());
      
      if (id) fetchNotifs(id);
    } catch (e) { 
        console.error("Error al cargar datos:", e); 
    } finally { 
        setLoading(false); 
    }
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
      if (res.ok) {
        const data = await res.json();
        setHorarios(data);
      }
    } catch (e) { 
        console.error("Error al cargar horarios:", e); 
    } finally { 
        setLoadingHorarios(false); 
    }
  };

  const renderActividad = ({ item }: { item: Actividad }) => (
    <TouchableOpacity style={styles.card} onPress={() => fetchHorarios(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Dumbbell color="#ff7e5f" size={24} />
        </View>
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

      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        clientData={clientData as any} 
      />

      <FlatList
        data={actividades}
        keyExtractor={(item) => item.id_actividad.toString()}
        renderItem={renderActividad}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.mainTitle}>Explora nuestras clases</Text>}
      />

      {/* MODAL DE HORARIOS */}
      <Modal visible={!!selectedAct} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedAct?.nombre}</Text>
                <Text style={styles.modalSubTitle}>Selecciona una sesión para reservar</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAct(null)} style={styles.closeBtn}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            {loadingHorarios ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color="#ff7e5f" size="large" />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {horarios.length > 0 ? horarios.map((h, i) => {
                  const isCancelled = h.status?.toLowerCase() === 'cancelado';
                  const isFull = h.inscritos >= h.aforo_maximo;

                  return (
                    <TouchableOpacity 
                      key={i} 
                      disabled={isCancelled}
                      style={[styles.horarioItem, isCancelled && styles.horarioCancelado]}
                      onPress={() => {
                        setSelectedAct(null);
                        router.push({
                          pathname: "/(tabs)/clases",
                          params: { id_clase_directo: h.id_clase }
                        });
                      }}
                    >
                      <View style={styles.horarioRow}>
                        <View style={styles.horarioLeft}>
                           <Calendar color={isCancelled ? "#7f8c8d" : "#ff7e5f"} size={18} />
                           <Text style={styles.diaText}>{h.dia.toUpperCase()}</Text>
                        </View>
                        <View style={styles.horarioRight}>
                           <Text style={[styles.horaText, isCancelled && {color: '#7f8c8d'}]}>
                             {h.hora_inicio.substring(0,5)}
                           </Text>
                           <View style={[styles.aforoBadge, isFull && !isCancelled && styles.aforoFull]}>
                             <Text style={[styles.aforoText, isFull && !isCancelled && {color: '#fff'}]}>
                               {h.inscritos}/{h.aforo_maximo}
                             </Text>
                           </View>
                        </View>
                      </View>
                      
                      <View style={styles.horarioFooter}>
                        <Text style={styles.profeText}>Instructor: {h.nombre_instructor}</Text>
                        {isCancelled ? (
                            <Text style={styles.cancelLabel}>CANCELADA</Text>
                        ) : isFull ? (
                            <Text style={styles.fullLabel}>COMPLETA</Text>
                        ) : (
                            <ChevronRight color="#ff7e5f" size={18} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }) : (
                  <View style={styles.emptyContainer}>
                    <Clock color="#7f8c8d" size={40} />
                    <Text style={styles.emptyText}>No hay horarios disponibles para esta actividad.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e272e' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  listContent: { padding: 25, paddingBottom: 40 },
  card: { backgroundColor: '#2f3640', borderRadius: 25, padding: 25, marginBottom: 20, borderLeftWidth: 8, borderLeftColor: '#ff7e5f', elevation: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { backgroundColor: 'rgba(255, 126, 95, 0.1)', padding: 10, borderRadius: 12, marginRight: 15 },
  actName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  actDesc: { color: '#bdc3c7', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e272e', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  infoTagText: { color: '#ff7e5f', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },
  verMas: { color: '#7f8c8d', fontSize: 12, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2f3640', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  modalTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  modalSubTitle: { color: '#7f8c8d', fontSize: 14, marginTop: 4 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 12 },
  modalLoading: { padding: 50, alignItems: 'center' },
  
  // Items de Horario
  horarioItem: { backgroundColor: '#1e272e', borderRadius: 20, padding: 18, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  horarioCancelado: { opacity: 0.5, backgroundColor: '#242b33' },
  horarioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  horarioLeft: { flexDirection: 'row', alignItems: 'center' },
  horarioRight: { flexDirection: 'row', alignItems: 'center' },
  diaText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },
  horaText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 12 },
  
  aforoBadge: { backgroundColor: '#2f3640', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  aforoFull: { backgroundColor: '#e67e22' },
  aforoText: { color: '#bdc3c7', fontSize: 12, fontWeight: 'bold' },

  horarioFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profeText: { color: '#7f8c8d', fontSize: 13 },
  cancelLabel: { color: '#e74c3c', fontWeight: 'bold', fontSize: 12 },
  fullLabel: { color: '#f1c40f', fontWeight: 'bold', fontSize: 12 },

  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 15, fontSize: 15, lineHeight: 22 }
});