import React, { useState } from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import { ImageBackground } from 'expo-image'; // Usamos ImageBackground de expo-image

// --- 1. Constantes de Estilo y Color ---
const GRADIENT_START = '#ff7e5f'; // Naranja (Inicio del degradado del botón FXML)
const TEXT_DARK = '#2c3e50'; // Texto principal (similar a tu FXML)
const INPUT_BACKGROUND = '#f8f9fa'; // Gris claro para los inputs

// --- 2. Componentes Estilizados ---

// 1. Contenedor principal con la imagen de fondo
const StyledImageBackground = styled(ImageBackground)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

// 2. Capa de superposición para mejorar la legibilidad del texto
// Usamos un ligero desenfoque y opacidad baja para mantener el fondo visible
const Overlay = styled.View`
  background-color: rgba(255, 255, 255, 0.2); /* Blanco muy sutilmente transparente */
  flex: 1;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 30px;
`;

// 3. Contenedor principal del formulario (Simula el VBox interior con sombra)
const FormWrapper = styled.View`
  width: 100%;
  max-width: 400px;
  background-color: rgba(255, 255, 255, 0.95); /* Fondo blanco casi opaco */
  border-radius: 15px; /* background-radius: 15 */
  padding: 35px; /* padding: 35 */
  
  /* DropShadow del FXML */
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-offset: 0px 5px;
      shadow-opacity: 0.15;
      shadow-radius: 15px;
    `,
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

const Button = styled(TouchableOpacity)`
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

// --- 3. Componente de Inicio de Sesión ---

export default function LoginScreen() {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!dni || !password) return alert('Por favor, completa ambos campos.');
    setIsLoading(true);
    Keyboard.dismiss();

    // Lógica de Autenticación
    setTimeout(() => {
      setIsLoading(false);
      alert(`Autenticación simulada para DNI: ${dni}`);
    }, 1500);
  };

  const isButtonDisabled = !dni || !password || isLoading;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <StyledImageBackground
        source={require('../../assets/images/gym-background.jpg')} // 🚨 CAMBIA ESTA RUTA POR TU IMAGEN
        contentFit="cover"
        transition={1000}
      >
        <Overlay>
          <FormWrapper>
            {/* Título */}
            <TitleBox>
              <MainTitle>¡Bienvenido!</MainTitle>
              <Subtitle>Inicia sesión en tu cuenta</Subtitle>
            </TitleBox>

            {/* Campo DNI */}
            <InputGroup>
              <Label>DNI</Label>
              <Input
                placeholder="Introduce tu DNI"
                value={dni}
                onChangeText={setDni}
                keyboardType="default"
                autoCapitalize="none"
                placeholderTextColor="#a0a0a0"
              />
            </InputGroup>

            {/* Campo Contraseña */}
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

            {/* Botón de acceso */}
            <Button
              onPress={handleLogin}
              disabled={isButtonDisabled}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ButtonText>Acceder</ButtonText>
              )}
            </Button>
          </FormWrapper>

          {/* Enlace de "He olvidado mi contraseña" */}
          <ForgotPasswordLink onPress={() => alert('Recuperar contraseña')}>
            <LinkText>¿Olvidaste tu contraseña?</LinkText>
          </ForgotPasswordLink>
        </Overlay>
      </StyledImageBackground>
    </TouchableWithoutFeedback>
  );
}