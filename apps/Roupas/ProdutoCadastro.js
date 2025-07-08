import React, { useState } from 'react';
import { StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native';
import FormComponent from '../../components/FormComponent';
import Header from '../../components/HeaderComponent';

const headerTitle = "Loja de Roupas";
const headerItems = [
    ['Home', 'HomeRoupas'],
    ['Lista de Produtos', 'ProdutoLista'],
    ['Lista de Clientes', 'ClienteLista'],
    ['Lista de Pedidos', 'PedidoLista'],

];
const headerColor = '#008000';
const fields = [

];

const camposOcultos = ['id', 'data_cadastro', 'id_novo', 'foi_atualizado', 'foi_criado'];
const fieldsTypes = [{
    "nome": "text",
    "preco": "preco",
    "descricao": "text",
    "imagem": "upload",
}];

const ProdutoCadastro = ({ navigation }) => {
    return (
    <SafeAreaView style={styles.safeArea}>
        <Header
            title={headerTitle}
            items={headerItems}
            color={headerColor}
            navigation={navigation}
        />
        <FormComponent
            database={'lojaroupa.db'}
            tabelas={['Produto']}
            fields={[fields]}
            fieldsTypes={fieldsTypes}
            initialData={{}}
            ocultar={camposOcultos}
            labels={{
                nome: "Nome",
                preco: "Preço",
                descricao: "Descrição",
                imagem: "Imagem",
        }}
            barraPersonalizada={{
                Produto: 'Cadastro de Produto',
        }}
            abaNavegacao={false}
            labelsInline={{
                Produto: "Registro",
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

export default ProdutoCadastro;