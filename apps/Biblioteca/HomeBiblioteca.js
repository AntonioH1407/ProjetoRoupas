import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform
} from 'react-native';
import Header from '../../components/HeaderComponent';
import { setupBibliotecaDatabase } from './BibliotecaDBSetup';

const headerTitle = "Biblioteca";
const headerItems = [
    ['Home', 'HomeBiblioteca'],
    ['Lista de Livros', 'LivroLista'],
    ['Lista de Emprestimos', 'ListaEmprestimo']
];
const headerColor = '#008000';

const HomeScreen = ({ navigation }) => {
    useEffect(() => {
    setupBibliotecaDatabase();
    }, []);

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
                    onPress={() => navigation.navigate('LivroLista')} 
                >
                    <Text style={styles.buttonText}>Livros </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('ListaEmprestimo')} 
                >
                    <Text style={styles.buttonText}>Emprestimos </Text>
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
    button: {
        width: 250,
        height: 50,
        backgroundColor: '#008000',
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