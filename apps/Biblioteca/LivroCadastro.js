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

const camposOcultos = ['id', 'data_cadastro', 'id_novo', 'foi_atualizado', 'foi_criado', 'livro'];
const fieldsTypes = [{
    "titulo": "text",
    "autor": "picker",
    "categoria": "picker",
    "ano_publicacao": "text",
    "data_cadastro": "hrauto",
    "capa": "upload",
}];

const LivroCadastro = ({ navigation }) => {
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
            tabelas={['Livro', 'LivroAutor']}
            fields={[fields]}
            fieldsTypes={fieldsTypes}
            initialData={{}}
            ocultar={camposOcultos}
            labels={{
                titulo: "Título",
                autor: "Autor",
                categoria: "Categoria",
                ano_publicacao: "Ano de Publicação",
                capa: "Capa do Livro",
        }}
            barraPersonalizada={{
                Livro: 'Cadastro de Livro',
        }}
            abaNavegacao={false}
            labelsInline={{
                Livro: "Registro",
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight
    : 0,
    },
});

export default LivroCadastro;