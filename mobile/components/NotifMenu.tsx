import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Platform 
} from 'react-native';
import { X, Info as InfoIcon, CheckCheck } from 'lucide-react-native';

interface Notificacion {
  id_notificacion: number;
  descripcion: string;
  leido: number;
  fecha_notificacion?: string;
}

interface NotifMenuProps {
  visible: boolean;
  onClose: () => void;
  clientId: string;
  unreadCount: number;
  notificaciones: Notificacion[];
  onRefresh: () => void;
}

export default function NotifMenu({ visible, onClose, clientId, unreadCount, notificaciones, onRefresh }: NotifMenuProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notificacion | null>(null);
  const [historial, setHistorial] = useState<Notificacion[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/notificaciones/all/${clientId}`);
      const data = await res.json();
      setHistorial(data);
      setIsHistoryOpen(true);
    } catch (e) { console.error(e); }
  };

  const openDetail = async (notif: Notificacion) => {
    setSelectedNotif(notif);
    setIsDetailOpen(true);
    if (notif.leido === 0) {
      await fetch(`http://127.0.0.1:8000/api/notificaciones/leer-una/${notif.id_notificacion}`, { method: 'POST' });
      onRefresh();
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/api/notificaciones/leer-todas/${clientId}`, { method: 'POST' });
      onRefresh();
      onClose();
    } catch (e) { console.error("Error al marcar todas como leídas", e); }
  };

  return (
    <>
      {/* MODAL PRINCIPAL: NUEVAS NOTIFICACIONES */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.notifBox}>
            <View style={styles.notifHeader}>
              <Text style={styles.modalTitle}>Nuevas ({unreadCount})</Text>
              <TouchableOpacity onPress={onClose}><X size={24} color="#2c3e50" /></TouchableOpacity>
            </View>

            <FlatList 
              data={notificaciones} 
              keyExtractor={(item) => item.id_notificacion.toString()} 
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.notifItem} onPress={() => openDetail(item)}>
                  <View style={styles.dot} />
                  <Text style={styles.notifDescText} numberOfLines={1}>{item.descripcion}</Text>
                </TouchableOpacity>
              )} 
              ListEmptyComponent={<Text style={styles.emptyText}>Sin avisos nuevos</Text>} 
            />

            <View style={styles.notifFooter}>
              {/* BOTÓN LEER TODO */}
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.readAllBtn}>
                  <CheckCheck size={18} color="#ff7e5f" />
                  <Text style={styles.readAllText}>Leer todo</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={fetchHistory} style={styles.btnHistory}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Ver Historial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL HISTORIAL */}
      <Modal visible={isHistoryOpen} transparent animationType="fade" onRequestClose={() => setIsHistoryOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.notifBox, { maxHeight: '80%' }]}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>Historial</Text>
              <TouchableOpacity onPress={() => setIsHistoryOpen(false)} style={styles.closeIconFixed}>
                <X size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={historial} 
              keyExtractor={(item) => item.id_notificacion.toString()} 
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.notifItem, { opacity: item.leido ? 0.5 : 1 }]} 
                  onPress={() => openDetail(item)}
                >
                  <Text style={styles.notifDescText}>{item.descripcion}</Text>
                </TouchableOpacity>
              )} 
            />
          </View>
        </View>
      </Modal>

      {/* MODAL DETALLE */}
      <Modal visible={isDetailOpen} transparent animationType="fade" onRequestClose={() => setIsDetailOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailBox}>
            <InfoIcon color="#ff7e5f" size={40} style={{alignSelf: 'center', marginBottom: 15}} />
            <Text style={styles.detailTitle}>Aviso del Gimnasio</Text>
            <Text style={styles.detailText}>{selectedNotif?.descripcion}</Text>
            <TouchableOpacity style={styles.closeBtnDetail} onPress={() => setIsDetailOpen(false)}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  notifBox: { width: '85%', backgroundColor: '#fff', borderRadius: 25, padding: 20 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  historyHeader: { width: '100%', alignItems: 'center', marginBottom: 20, position: 'relative', height: 30, justifyContent: 'center' },
  closeIconFixed: { position: 'absolute', right: 0, top: 0 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, color: '#2c3e50' },
  notifItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff7e5f', marginRight: 10 },
  notifDescText: { fontSize: 14, color: '#2c3e50', flex: 1 },
  notifFooter: { 
    marginTop: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    paddingTop: 15
  },
  readAllBtn: { flexDirection: 'row', alignItems: 'center' },
  readAllText: { color: '#ff7e5f', fontWeight: 'bold', marginLeft: 5, fontSize: 14 },
  btnHistory: { backgroundColor: '#2f3640', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginVertical: 20 },
  detailBox: { width: '80%', backgroundColor: '#fff', borderRadius: 30, padding: 30 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#2c3e50' },
  detailText: { fontSize: 16, textAlign: 'center', color: '#2c3e50', lineHeight: 22 },
  closeBtnDetail: { backgroundColor: '#ff7e5f', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 20 }
});