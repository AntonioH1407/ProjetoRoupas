import React, { useState } from 'react';
import { StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native';
import FormComponent from '../../components/FormComponent';
import Header from '../../components/HeaderComponent';

const headerTitle = "Biblioteca";
const headerItems = [
    ['Home', 'HomeBiblioteca'],
    ['Lista de Livros', 'LivroLista'],
    ['Lista de Emprestimos', 'ListaEmprestimo']
];
const headerColor = '#008000';

const fields = [

];

const camposOcultos = ['id', 'data_cadastro', 'id_novo', 'foi_atualizado', 'foi_criado', 'autor','categoria','ano_publicacao','data_cadastro','capa'];
const fieldsTypes = [{
    "livro": "pickerRelacional",
    "usuario": "text",
    "data_emprestimo": "data",
    "data_devolucao": "data"
}];

const EmprestimoCadastro = ({ navigation }) => {
    return (
    <SafeAreaView style={styles.safeArea}>
        <Header
            title={headerTitle}
            items={headerItems}
            color={headerColor}
            navigation={navigation}
        />
        <FormComponent
            database={'biblioteca.db'}
            tabelas={['Emprestimo']}
            fields={[fields]}
            fieldsTypes={fieldsTypes}
            initialData={{}}
            ocultar={camposOcultos}
            labels={{
                livro: "Livro",
                data_emprestimo: "Data Emprestimo",
                data_devolucao: "Data Devolução",
                usuario: "Usuário",
        }}
            barraPersonalizada={{
                Emprestimo: 'Cadastro de Emprestimos',
        }}
            abaNavegacao={false}
            labelsInline={{
                Emprestimo: "Registro",
            }}
            TipoSub={"CRIAR"}
            getCampoInfo={[]}
            corApp={'#008000'}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    appContainer: {
        flex: 1,
        flexDirection: "column",
        width: "100%",
    },
});
    
export default EmprestimoCadastro;

