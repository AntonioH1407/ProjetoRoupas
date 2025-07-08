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
    "cliente": "picker",
    "produto": "picker",
    "quantidade": "number",
    "data_pedido": "data",
}];

const PedidoCadastro = ({ navigation }) => {
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
            tabelas={['Pedido']}
            fields={[fields]}
            fieldsTypes={fieldsTypes}
            initialData={{}}
            ocultar={camposOcultos}
            labels={{
                cliente: "Cliente",
                produto: "Produto",
                quantidade: "Quantidade",
                data_pedido: "Data do Pedido",
        }}
            barraPersonalizada={{
                Pedido: 'Cadastro de Pedidos',
        }}
            abaNavegacao={false}
            labelsInline={{
                Pedido: "Registro",
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

export default PedidoCadastro;