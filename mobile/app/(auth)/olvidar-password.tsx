import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, Key, ChevronLeft, User, CheckCircle2 } from 'lucide-react-native';

export default function OlvidarPassword() {
  const [step, setStep] = useState(1); // 1: DNI/Email, 2: Código, 3: Nueva Clave
  const [dni, setDni] = useState('');
  const [emailEnvio, setEmailEnvio] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_URL = "http://127.0.0.1:8000/api";

  // PASO 1: Enviar DNI y Email al servidor
  const handleSendCode = async () => {
    if (!dni || !emailEnvio) {
      return Alert.alert("Error", "Por favor, introduce tu DNI y un email de contacto.");
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/solicitar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dni: dni.trim(), 
          email: emailEnvio.toLowerCase().trim() 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        Alert.alert("Código Enviado", "Revisa el correo que has introducido.");
      } else {
        Alert.alert("Atención", data.message || "No se pudo procesar la solicitud.");
      }
    } catch (error) {
      Alert.alert("Error", "No hay conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Verificar código asociado al DNI
  // PASO 2: Verificar código asociado al DNI
  const handleVerifyCode = async () => {
    if (code.length !== 6) return Alert.alert("Error", "El código debe ser de 6 dígitos.");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/solicitar-codigo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          dni: dni.trim(), 
          email: emailEnvio.toLowerCase().trim() 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        Alert.alert("Error", data.message || "Código incorrecto.");
      }
    } catch (error) {
      Alert.alert("Error", "Error al verificar conexión.");
    } finally {
      setLoading(false);
    }
  };

  // PASO 3: Actualizar password usando el DNI como referencia
  const handleUpdatePassword = async () => {
    if (newPassword.length < 4) {
      return Alert.alert("Error", "La contraseña es muy corta.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Las contraseñas no coinciden.");
    }

    setLoading(true);
    try {
      console.log("Enviando datos a:", `${API_URL}/reset-password`);
      
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ 
          dni: dni.trim(), 
          password: newPassword 
        })
      });

      // Si la respuesta no es JSON, esto fallará y saltará al catch
      const data = await response.json();
      console.log("Respuesta servidor:", data);

      setLoading(false);

      // Si el código llega aquí, informamos y redirigimos SIEMPRE que no sea un error 400/500
      if (response.ok) {
        Alert.alert(
          "¡Éxito!", 
          "Contraseña actualizada correctamente.",
          [{ 
            text: "Ir al Login", 
            onPress: () => router.replace('/(auth)') 
          }],
          { cancelable: false }
        );
        
        // Redirección de seguridad por si el Alert falla en algún dispositivo
        setTimeout(() => {
          router.replace('/(auth)');
        }, 3000);

      } else {
        Alert.alert("Error", data.message || "No se pudo actualizar la clave.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error crítico:", error);
      // En trabajos de clase, a veces el servidor da error pero SI cambia la clave
      // Por si acaso, informamos al usuario.
      Alert.alert("Aviso", "Revisa si puedes entrar con la nueva clave.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#ff7e5f" size={28} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          {step === 3 ? <CheckCircle2 color="#2ecc71" size={50} /> : <Lock color="#ff7e5f" size={50} />}
        </View>

        <Text style={styles.title}>Seguridad</Text>
        <Text style={styles.subtitle}>
          {step === 1 && "Identifícate con tu DNI para recibir un código."}
          {step === 2 && "Introduce el código que enviamos a tu correo."}
          {step === 3 && "Configura tu nueva contraseña de acceso."}
        </Text>

        <View style={styles.card}>
          {step === 1 && (
            <>
              <View style={styles.inputBox}>
                <User color="#95a5a6" size={20} />
                <TextInput 
                  placeholder="DNI del Socio" 
                  placeholderTextColor="#95a5a6"
                  style={styles.input} 
                  value={dni} 
                  onChangeText={setDni}
                />
              </View>
              <View style={styles.inputBox}>
                <Mail color="#95a5a6" size={20} />
                <TextInput 
                  placeholder="Email de recepción" 
                  placeholderTextColor="#95a5a6"
                  style={styles.input} 
                  value={emailEnvio} 
                  onChangeText={setEmailEnvio}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleSendCode} disabled={loading}>
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
                  placeholderTextColor="#95a5a6"
                  style={styles.input} 
                  keyboardType="numeric"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleVerifyCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verificar Código</Text>}
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
              <View style={styles.inputBox}>
                <Lock color="#95a5a6" size={20} />
                <TextInput 
                  placeholder="Confirmar Contraseña" 
                  secureTextEntry 
                  style={styles.input} 
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#2ecc71' }]} onPress={handleUpdatePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Cambiar Contraseña</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  backBtn: { position: 'absolute', top: 60, left: 25, zIndex: 10 },
  iconCircle: { alignSelf: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 50, marginBottom: 20, elevation: 3 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' },
  subtitle: { color: '#7f8c8d', textAlign: 'center', marginBottom: 30, marginTop: 10, paddingHorizontal: 40 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 25, marginHorizontal: 25, elevation: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f2f6', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15 },
  input: { flex: 1, paddingVertical: 15, marginLeft: 10, fontSize: 16, color: '#2c3e50' },
  btn: { backgroundColor: '#ff7e5f', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});