import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  Modal, ActivityIndicator
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import SQliteComponent from "./components/SQliteComponent";
import { setAuthToken } from "./components/Api";
import { login } from "./components/Api"; // Importe a função de login da sua API

const HomeScreen = ({ navigation }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userGroup, setUserGroup] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Estado para controlar o carregamento

    const appNames = ["transito","biblioteca"];

    useFocusEffect(
      React.useCallback(() => {
        // Simulação de verificação de login
        const checkLoginStatus = async () => {
          try {
            // const storedUserGroup = await AsyncStorage.getItem("userGroup");
            // if (storedUserGroup) {
            //     setUserGroup(storedUserGroup);
            //     console.log("Grupo de usuário recuperado:", storedUserGroup);
            //     setIsLoggedIn(true);
            // } else {
                setIsLoggedIn(false);
            // }
          } catch (error) {
              console.error("Erro ao verificar o status de login:", error);
          }
        };
        
        checkLoginStatus();
      }, [])
    );



    const handleLogin = async () => {
        setIsLoading(true); // Mostrar indicador de carregamento
        try {
            
            const data = await login("eliandro.souza", "ifsuldeminas");
			      setAuthToken(data.access);
            // console.log("DEU CERTO!!");

            // setIsLoggedIn(true);
            // setUserGroup("geral");  3297 43

            if (appNames.includes(username.toLowerCase()) && password === "123456" || username.toLowerCase() === "geral" ) {
                setUserGroup(username.toLowerCase());
                setIsLoggedIn(true);
                await AsyncStorage.setItem("userGroup", userGroup);
                console.log("Login bem-sucedido!");
            } else if(username.endsWith("admin") && password.toLowerCase() == "admin") {

              const db = username.toLowerCase().replace("admin", "") + ".db";
              await SQliteComponent.deleteTables([db], ["__all__"])

              alert("Banco de dados apagado com sucesso!");
            } else {
              alert("Usuário ou senha inválidos");
            }
        } catch (e) {
            console.log("Erro ao fazer login:", e);
            alert("Credenciais inválidas");
        } finally {
            setIsLoading(false); // Ocultar indicador de carregamento
        }
    };

    return (
        <View style={styles.container}>
            <Image
                source={require("./assets/pci_logo.png")}
                style={styles.imagemPrincipal}
                resizeMode="cover"
            />
            <Text style={styles.tituloAplicativos}>
                Programa Campus Inteligente
            </Text>

            {!isLoggedIn ? (
                <View style={styles.loginContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Usuário"
                        value={username}
                        onChangeText={setUsername}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <Pressable style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.cardContainer}>
                    <Text style={styles.tituloAplicativos}>
                        Aplicativos Disponíveis:
                    </Text>

                    {/* Renderizar botão de acordo com o grupo do usuário */}
                    {(userGroup === "geral" ? appNames : [userGroup]).map((app) => (
                        <Pressable
                            key={app}
                            style={styles.appButton}
                            onPress={() => navigation.navigate(`Home${app.charAt(0).toUpperCase() + app.slice(1)}`)}
                        >
                            <Text style={styles.appButtonText}>{app.charAt(0).toUpperCase() + app.slice(1)}</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {isLoading && (
                <Modal transparent={true} animationType="fade">
                    <View style={styles.modalBackground}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text style={styles.loadingText}>Carregando...</Text>
                    </View>
                </Modal>
            )}
        </View>
      );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f4f4",
    alignItems: "center",
    justifyContent: "center",
  },
  loginContainer: {
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  input: {
    width: "80%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    borderRadius: 5,
  },
  loginButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cardContainer: {
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  imagemPrincipal: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  tituloAplicativos: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  appButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#28a745",
    borderRadius: 5,
    marginVertical: 10,
  },
  appButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  listContainer: {
    width: "100%",
  },
  card: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    marginVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#dc3545",
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
  },
});

export default HomeScreen;