import { Redirect, Stack } from 'expo-router';
import React from 'react';

// --- 1. Definición y Simulación del Contexto de Autenticación ---

// Tipo para el valor del contexto de autenticación
interface AuthContextType {
    isAuthenticated: boolean;
    setAuthenticated: (value: boolean) => void;
    // user: User | null; // Puedes añadir el objeto de usuario aquí
}

// Hook de simulación de autenticación
const useAuth = (): AuthContextType => {
    // 🚨 En producción, este estado se inicializaría leyendo el token de AsyncStorage.
    // Usamos 'false' por defecto para forzar la visualización del login.
    const [isAuthenticated, setIsAuthenticated] = React.useState(false); 
    
    // Simulación de verificación inicial (para evitar el flash de redirección)
    React.useEffect(() => {
        // Ejemplo: Leer AsyncStorage.getItem('userToken')...
        // Si existe, setIsAuthenticated(true);
        // Si no existe, setIsAuthenticated(false);
    }, []);

    return { 
        isAuthenticated, 
        setAuthenticated: setIsAuthenticated 
    };
}

// Creamos el contexto. El 'as' es necesario para TypeScript.
export const AuthContext = React.createContext({} as AuthContextType);

// Hook personalizado para acceder a la sesión fácilmente
export const useSession = () => React.useContext(AuthContext);

// --- 2. Componente de Layout Principal ---

export default function RootLayout() {
    // Obtenemos el estado y las funciones del hook de autenticación
    const auth = useAuth();
    
    // Si no estás usando un Context, el estado de autenticación simple iría aquí.

    return (
        // Proveemos el contexto a toda la aplicación
        <AuthContext.Provider value={auth}>
            <Stack>
                {/* 1. GRUPO DE AUTENTICACIÓN (LOGIN) */}
                {/* Ocultamos el header para que el login ocupe toda la pantalla */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                
                {/* 2. Redirección si está autenticado */}
                {/* Si auth.isAuthenticated es true, redirigimos a la raíz del grupo (tabs) */}
                {auth.isAuthenticated && (
                    <Redirect href="/(tabs)" />
                )}

                {/* 3. GRUPO DE APLICACIÓN PRINCIPAL (TABS) */}
                {/* Ocultamos el header para que el layout de pestañas lo controle */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                
                {/* 4. Modales fuera del flujo (accesibles desde ambos grupos) */}
                {/* El modal se puede mantener con cabecera para tener el botón de cerrar */}
                <Stack.Screen 
                    name="modal" 
                    options={{ 
                        presentation: 'modal', 
                        title: 'Recuperar Contraseña' 
                    }} 
                />
            </Stack>
        </AuthContext.Provider>
    );
}