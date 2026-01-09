import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, Key } from 'lucide-react-native';

export default function ChangePassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: Código, 3: Nueva Clave
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async () => {
    setLoading(true);
    // Llama a tu API de Laravel
    setTimeout(() => { // Simulación
      setLoading(false);
      setStep(2);
      Alert.alert("Enviado", "Revisa tu correo electrónico.");
    }, 1500);
  };

  const handleVerifyCode = () => {
    if (code.length === 6) setStep(3);
    else Alert.alert("Error", "El código debe ser de 6 dígitos.");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: '#ff7e5f' }}>← Volver</Text>
      </TouchableOpacity>

      <Lock color="#ff7e5f" size={50} style={{ alignSelf: 'center', marginBottom: 20 }} />
      <Text style={styles.title}>Seguridad</Text>
      <Text style={styles.subtitle}>
        {step === 1 && "Introduce tu email para recibir el código."}
        {step === 2 && "Introduce el código de 6 dígitos enviado."}
        {step === 3 && "Escribe tu nueva contraseña maestra."}
      </Text>

      <View style={styles.card}>
        {step === 1 && (
          <>
            <View style={styles.inputBox}>
              <Mail color="#95a5a6" size={20} />
              <TextInput 
                placeholder="Tu email" 
                style={styles.input} 
                value={email} 
                onChangeText={setEmail}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSendCode}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar Código</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.inputBox}>
              <Key color="#95a5a6" size={20} />
              <TextInput 
                placeholder="Código (6 dígitos)" 
                style={styles.input} 
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleVerifyCode}>
              <Text style={styles.btnText}>Verificar Código</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.inputBox}>
              <Lock color="#95a5a6" size={20} />
              <TextInput 
                placeholder="Nueva Contraseña" 
                secureTextEntry 
                style={styles.input} 
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#2ecc71' }]} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.btnText}>Actualizar Contraseña</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 25 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' },
  subtitle: { color: '#7f8c8d', textAlign: 'center', marginBottom: 30, marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 20, elevation: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f2f6', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20 },
  input: { flex: 1, paddingVertical: 15, marginLeft: 10, fontSize: 16 },
  btn: { backgroundColor: '#ff7e5f', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});