import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Calendar, X, Check } from 'lucide-react-native';

interface ConfirmarProps {
  visible: boolean;
  clase: any;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmarReservaModal({ visible, clase, onConfirm, onClose }: ConfirmarProps) {
  if (!clase) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icono Superior */}
          <View style={styles.iconCircle}>
            <Calendar color="#ff7e5f" size={32} />
          </View>

          {/* Texto Informativo */}
          <Text style={styles.title}>Confirmar Reserva</Text>
          <Text style={styles.message}>
            ¿Deseas reservar la clase de <Text style={styles.bold}>{clase.nombre_actividad}</Text>?
          </Text>
          
          <View style={styles.detailsBox}>
            <Text style={styles.detailText}>📅 {clase.dia}</Text>
            <Text style={styles.detailText}>⏰ {clase.hora_inicio?.substring(0, 5)} hs</Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <X color="#fff" size={20} />
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={onConfirm}>
              <Check color="#fff" size={20} />
              <Text style={styles.btnText}>Reservar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#2f3640',
    width: '100%',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d4652'
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 126, 95, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  message: { color: '#bdc3c7', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  bold: { color: '#fff', fontWeight: 'bold' },
  detailsBox: {
    backgroundColor: '#1e272e',
    padding: 15,
    borderRadius: 15,
    width: '100%',
    marginBottom: 25,
    alignItems: 'center'
  },
  detailText: { color: '#ff7e5f', fontWeight: '600', fontSize: 15, marginVertical: 2 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  btn: {
    flex: 0.48,
    flexDirection: 'row',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  btnCancel: { backgroundColor: '#485460' },
  btnConfirm: { backgroundColor: '#ff7e5f' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});