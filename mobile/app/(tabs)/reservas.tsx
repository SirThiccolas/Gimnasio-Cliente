import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  TouchableOpacity, Modal, Pressable 
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, QrCode, AlertCircle, Trash2, X } from 'lucide-react-native';

import CustomHeader from '../../components/CustomHeader';
import SideMenu from '../../components/SideMenu';
import QrAcceso from '../../components/QrAcceso';
import ToastAcceso from '../../components/ToastAcceso';

interface Reserva {
  id_clase: number;
  nombre_actividad: string;
  actividad_activa: number;
  status_clase: string;
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
  const [notifs, setNotifs] = useState([]);
  
  // Estados para Modales
  const [selectedQr, setSelectedQr] = useState<any>(null);
  const [modalBorradoVisible, setModalBorradoVisible] = useState(false);
  const [idParaBorrar, setIdParaBorrar] = useState<number | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const hoyStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const id = await AsyncStorage.getItem('clientId');
      const nombre = await AsyncStorage.getItem('clientName');
      const apellido = await AsyncStorage.getItem('clientLastname');
      setClientData({ nombre: nombre || '', id: id || '', apellido: apellido || '' });
      if (id) {
        await fetchReservas(id);
        fetchNotifs(id);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };
  const fetchNotifs = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/unread/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifs(data);
      }
    } catch (e) { 
      console.error("Error cargando notificaciones en Reservas:", e); 
    }
  };
  const fetchReservas = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/reservas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setReservas(data);
      }
    } catch (error) { 
      console.error("Error al obtener reservas:", error); 
    }
  };

  const handleCancelarReserva = (idClase: number) => {
    setIdParaBorrar(idClase);
    setModalBorradoVisible(true);
  };

  const ejecutarBorrado = async () => {
    if (!idParaBorrar || !clientData.id) return;
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/reservas/${idParaBorrar}?id_cliente=${clientData.id}`, 
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        setToastMsg("Reserva cancelada");
        setShowToast(true);
        fetchReservas(clientData.id);
      } else {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData.message);
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setModalBorradoVisible(false);
      setIdParaBorrar(null);
    }
  };

  const handleScanSuccess = async (scannedData: string) => {
    try {
      let limpio = scannedData.replace(/´/g, '"').replace(/ç/g, '}').replace(/¨/g, '{');
      const payload = JSON.parse(limpio);
      
      const response = await fetch(`http://127.0.0.1:8000/api/validar-acceso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToastMsg(`¡Acceso Correcto!`);
        setShowToast(true);
        setTimeout(() => {
          setSelectedQr(null);
          fetchReservas(clientData.id);
        }, 1500);
      }
    } catch (e) {
      console.error("Error en escaneo:", e);
    }
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (filtro === 'hoy') return r.fecha_clase === hoyStr && r.status === 'confirmado';
    if (filtro === 'usadas') return r.status === 'usado';
    return true;
  });

const renderItem = ({ item }: { item: Reserva }) => {
    const esHoy = item.fecha_clase === hoyStr;
    const esUsado = item.status === 'usado';
    
    // VALIDACIÓN TRIPLE
    const actividadDesactivada = item.actividad_activa === 0;
    const claseCancelada = item.status_clase === 'cancelado';
    
    // Si falla la actividad O la clase O la reserva misma
    const esCanceladoTotal = item.status === 'cancelado' || actividadDesactivada || claseCancelada;

    // Solo mostrar como "OK" si todo está activo
    const esConfirmadoReal = item.status === 'confirmado' && !actividadDesactivada && !claseCancelada;

    const badgeColor = esCanceladoTotal ? '#e74c3c' : (esUsado ? '#3498db' : '#2ecc71');
    
    // Texto dinámico para que el usuario sepa POR QUÉ no hay clase
    let textoStatus = item.status;
    if (actividadDesactivada) textoStatus = 'ACTIVIDAD ANULADA';
    else if (claseCancelada) textoStatus = 'CLASE CANCELADA';

    return (
      <View style={[
        styles.card, 
        esUsado && styles.cardUsado,
        esCanceladoTotal && styles.cardCancelado
      ]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.actividadName, esCanceladoTotal && { color: '#e74c3c' }]}>
            {item.nombre_actividad}
          </Text>
          
          <View style={styles.headerRight}>
            {esConfirmadoReal && (
              <TouchableOpacity 
                onPress={() => handleCancelarReserva(item.id_clase)}
                style={styles.deleteBtn}
              >
                <Trash2 size={18} color="#e74c3c" />
              </TouchableOpacity>
            )}
            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.statusText}>{textoStatus}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Clock size={16} color={esCanceladoTotal ? "#e74c3c" : "#ff7e5f"} />
          <Text style={[styles.infoText, esCanceladoTotal && { color: '#e74c3c', textDecorationLine: 'line-through' }]}>
            {item.hora_inicio.substring(0, 5)} hs - {item.fecha_clase}
          </Text>
        </View>

        {/* Solo sale el QR si nada está cancelado */}
        {esHoy && esConfirmadoReal && (
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
      <CustomHeader 
        title="MIS RESERVAS" 
        onOpenMenu={() => setIsMenuOpen(true)} 
        clientId={clientData.id} 
        unreadCount={notifs.length}
        notificaciones={notifs}
        onRefreshNotifs={() => fetchNotifs(clientData.id)}
      />
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
          keyExtractor={(item, index) => item.id_clase?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay reservas para mostrar.</Text>}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalBorradoVisible}
        onRequestClose={() => setModalBorradoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertCircle size={40} color="#e74c3c" />
            </View>
            
            <Text style={styles.modalTitle}>¿Cancelar Reserva?</Text>
            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres cancelar esta clase? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity 
                style={styles.btnSecundario} 
                onPress={() => setModalBorradoVisible(false)}
              >
                <Text style={styles.btnSecundarioText}>VOLVER</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnPrimario} 
                onPress={ejecutarBorrado}
              >
                <Text style={styles.btnPrimarioText}>SÍ, CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <QrAcceso 
        visible={!!selectedQr} 
        onClose={() => setSelectedQr(null)} 
        data={selectedQr}
        onScanSuccess={handleScanSuccess} 
      />

      <ToastAcceso visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
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
  
  card: { 
    backgroundColor: '#2f3640', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    borderLeftWidth: 5, 
    borderLeftColor: '#2ecc71'
  },
  cardUsado: { opacity: 0.6, borderLeftColor: '#3498db' },
  cardCancelado: { 
    opacity: 0.9, 
    borderLeftColor: '#e74c3c',
    backgroundColor: '#3d2b2b',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)'
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10, 
    alignItems: 'center',
    zIndex: 10,
  },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  deleteBtn: { 
    marginRight: 12, 
    padding: 10, 
    backgroundColor: 'rgba(231, 76, 60, 0.1)', 
    borderRadius: 8,
  },
  actividadName: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { color: '#bdc3c7', marginLeft: 8 },
  qrButton: { backgroundColor: '#ff7e5f', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10 },
  qrButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  emptyText: { color: '#7f8c8d', textAlign: 'center', marginTop: 40 },

  // --- ESTILOS DEL MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2f3640',
    borderRadius: 25,
    padding: 25,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalIconContainer: {
    marginBottom: 15,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 15,
    borderRadius: 50,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    color: '#bdc3c7',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  btnSecundario: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#57606f',
    alignItems: 'center',
  },
  btnSecundarioText: {
    color: '#bdc3c7',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnPrimario: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimarioText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});