import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lock, ShieldCheck, ChevronLeft } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  
  // Campos del formulario
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  // Estado del mensaje de feedback
  const [feedback, setFeedback] = useState({ msg: '', type: '' });

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('clientId');
      if (id) setClientId(id);
    };
    getUserId();
  }, []);

  const handleUpdate = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      setFeedback({ msg: 'Por favor, rellena todos los campos.', type: 'error' });
      return;
    }

    if (newPass !== confirmPass) {
      setFeedback({ msg: 'La nueva contraseña no coincide.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback({ msg: '', type: '' });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: clientId,
          password_actual: currentPass,
          password_nueva: newPass
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback({ msg: '¡Éxito! Contraseña actualizada.', type: 'success' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => router.back(), 2000);
      } else {
        setFeedback({ msg: data.message || 'Error al actualizar.', type: 'error' });
      }
    } catch (error) {
      setFeedback({ msg: 'Error de conexión con el servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft color="#ff7e5f" size={30} />
      </TouchableOpacity>

      <View style={styles.header}>
        <ShieldCheck color="#ff7e5f" size={60} />
        <Text style={styles.title}>Cambiar Contraseña</Text>
        <Text style={styles.subtitle}>Asegura tu cuenta con una nueva clave</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Contraseña Actual</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry 
          value={currentPass} 
          onChangeText={setCurrentPass}
          placeholder="Escribe tu clave actual"
        />

        <Text style={styles.label}>Nueva Contraseña</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry 
          value={newPass} 
          onChangeText={setNewPass}
          placeholder="Mínimo 4 caracteres"
        />

        <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry 
          value={confirmPass} 
          onChangeText={setConfirmPass}
          placeholder="Repite la nueva clave"
        />

        {/* MENSAJE DE FEEDBACK (Sustituye a la Alerta) */}
        {feedback.msg !== '' && (
          <View style={[styles.msgBox, feedback.type === 'error' ? styles.errorBox : styles.successBox]}>
            <Text style={[styles.msgText, feedback.type === 'error' ? styles.errorText : styles.successText]}>
              {feedback.msg}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btn, loading && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Actualizar Ahora</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 25 },
  backBtn: { marginTop: 40, marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginTop: 10 },
  subtitle: { color: '#7f8c8d', fontSize: 14, textAlign: 'center' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 4 },
  label: { color: '#34495e', fontWeight: '600', marginBottom: 8, fontSize: 14 },
  input: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#ff7e5f', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  msgBox: { padding: 12, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  errorBox: { backgroundColor: '#ffebee' },
  successBox: { backgroundColor: '#e8f5e9' },
  msgText: { fontSize: 14, fontWeight: '500' },
  errorText: { color: '#c62828' },
  successText: { color: '#2e7d32' }
});