import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import Header from '../../components/HeaderComponent';
import { setupTransitoDatabase } from './TransitoDBSetup';

//Declaração do título e itens do cabeçalho/Header
const headerTitle = "Trânsito";
const headerItems = [
    ['Home', 'HomeTransito'],
    ['Lista de Veículos', 'visitacaoLista'],
];
const headerColor = '#0051ff';

// Componente HomeScreen
const HomeScreen = ({ navigation }) => {
    useEffect(() => {
        setupTransitoDatabase();
    }, []);

    //No return eu colocamos o que será renderizado na tela
    // O SafeAreaView é usado para evitar que o conteúdo fique atrás de elementos como a barra de status
    // O View é usado para agrupar outros componentes e aplicar estilos
    // O TouchableOpacity é usado para criar um botão que pode ser pressionado
    // O Text é usado para exibir texto na tela
    // O StyleSheet é usado para definir estilos para os componentes
    // O StatusBar é usado para controlar a aparência da barra de status do dispositivo
    // O Platform é usado para verificar o sistema operacional do dispositivo
    // O useEffect é usado para executar código quando o componente é montado ou atualizado
    // O navigation é usado para navegar entre as telas da aplicação
    // O setupTransitoDatabase é uma função que configura o banco de dados para o aplicativo de trânsito
    // O headerTitle, headerItems e headerColor são usados para definir o título e os itens do cabeçalho da tela
    // O navigation.navigate é usado para navegar para a tela de lista de veículos quando o botão é pressionado
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.appContainer}>
                
                <Header
                    title={headerTitle}
                    items={headerItems}
                    color={headerColor}
                    navigation={navigation}
                />

                <View style={styles.container}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('visitacaoLista')}
                    >
                        <Text style={styles.buttonText}>Veículo Visitante</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    appContainer: {
        flex: 1,
        flexDirection: 'column',
        width: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        marginBottom: 50,
    },
    button: {
        width: 250,
        height: 50,
        backgroundColor: '#0051ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;