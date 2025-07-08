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
    "email": "email",
    "telefone": "telefone",
    "endereco": "text",
}];

const ClienteCadastro = ({ navigation }) => {
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
            tabelas={['Cliente']}
            fields={[fields]}
            fieldsTypes={fieldsTypes}
            initialData={{}}
            ocultar={camposOcultos}
            labels={{
                nome: "Nome",
                email: "E-mail",
                telefone: "Telefone",
                endereco: "Endereço",
        }}
            barraPersonalizada={{
                Cliente: 'Cadastro de Cliente',
        }}
            abaNavegacao={false}
            labelsInline={{
                Cliente: "Registro",
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

export default ClienteCadastro;