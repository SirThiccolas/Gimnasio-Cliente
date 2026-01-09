import React, { useState } from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import { ImageBackground } from 'expo-image';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

const GRADIENT_START = '#ff7e5f';
const TEXT_DARK = '#2c3e50';
const INPUT_BACKGROUND = '#f8f9fa';

const StyledImageBackground = styled(ImageBackground)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Overlay = styled.View`
  background-color: rgba(255, 255, 255, 0.2);
  flex: 1;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 30px;
`;

const FormWrapper = styled.View`
  width: 100%;
  max-width: 400px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 35px;
  ${Platform.select({
    ios: `shadow-color: #000; shadow-offset: 0px 5px; shadow-opacity: 0.15; shadow-radius: 15px;`,
    android: 'elevation: 10;',
  })}
`;

const TitleBox = styled.View`
  align-items: center;
  margin-bottom: 30px;
`;

const MainTitle = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: ${TEXT_DARK};
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
  margin-top: 5px;
`;

const InputGroup = styled.View`
  margin-bottom: 20px;
`;

const Label = styled.Text`
  color: ${TEXT_DARK};
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 8px;
`;

const Input = styled.TextInput`
  width: 100%;
  height: 45px;
  background-color: ${INPUT_BACKGROUND};
  border-radius: 8px;
  border-width: 1px;
  border-color: #e0e0e0;
  padding: 0 12px;
  font-size: 14px;
  color: ${TEXT_DARK};
`;

const Button = styled(TouchableOpacity)<{ disabled?: boolean }>`
  width: 100%;
  height: 45px;
  background-color: ${GRADIENT_START};
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 15px;
  font-weight: bold;
`;

const ForgotPasswordLink = styled(TouchableOpacity)`
  margin-top: 25px;
`;

const LinkText = styled.Text`
  color: ${GRADIENT_START};
  font-size: 13px;
  text-decoration-line: underline;
  font-weight: 500;
`;

interface LoginResponse {
  status: string;
  message: string;
  user?: {
    nombre: string;
    dni: string;
  };
}

export default function LoginScreen() {
  const [dni, setDni] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!dni || !password) {
      Alert.alert('Atención', 'Por favor, completa ambos campos.');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const API_URL = "http://127.0.0.1:8000/api/login"; 

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ dni, password }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        Alert.alert('¡Bienvenido!', `Hola ${data.user?.nombre}`);
        router.replace('/(tabs)'); 
      } else {
        Alert.alert('Error', data.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error de conexión', 'No se pudo contactar con el servidor. Verifica tu conexión e IP.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !dni || !password || isLoading;

  return (
  <>
    <Stack.Screen options={{ headerShown: false }} />

    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <StyledImageBackground
        source={require('../../assets/images/gym-background.jpg')}
        contentFit="cover"
        transition={1000}
      >
        <Overlay>
          <FormWrapper>
            <TitleBox>
              <MainTitle>¡Bienvenido!</MainTitle>
              <Subtitle>Inicia sesión en tu cuenta</Subtitle>
            </TitleBox>

            <InputGroup>
              <Label>DNI</Label>
              <Input
                placeholder="Introduce tu DNI"
                value={dni}
                onChangeText={setDni}
                autoCapitalize="none"
                placeholderTextColor="#a0a0a0"
              />
            </InputGroup>

            <InputGroup>
              <Label>Contraseña</Label>
              <Input
                placeholder="Introduce tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#a0a0a0"
              />
            </InputGroup>

            <Button onPress={handleLogin} disabled={isButtonDisabled}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ButtonText>Acceder</ButtonText>
              )}
            </Button>
          </FormWrapper>

          <ForgotPasswordLink onPress={() => Alert.alert('Recuperar', 'Función no disponible')}>
            <LinkText>¿Olvidaste tu contraseña?</LinkText>
          </ForgotPasswordLink>
        </Overlay>
      </StyledImageBackground>
    </TouchableWithoutFeedback>
  </>
);
}