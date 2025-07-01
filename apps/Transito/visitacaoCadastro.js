import React, { useState, useEffect } from 'react';
import { StyleSheet, Platform,SafeAreaView,StatusBar } from 'react-native';
import FormComponent from '../../components/FormComponent';
import Header from '../../components/HeaderComponent';


const headerTitle = "Trânsito";
const headerItems = [
    ['Home', 'HomeTransito'],
    ['Lista de Veículos', 'visitacaoLista'],
];
const headerColor = '#0051ff';

const fields = [

];



const VisitacaoCadastro = ({ navigation }) => {
    const [camposOcultos, setCamposOcultos] = useState(['id', 'data_cadastro','id_novo','foi_atualizado','foi_criado']);

fieldsTypes = [{
    "placa": "text",
    "modelo": "picker",
    "cor": "picker",
    "motivo_visitacao" : "textarea",
    "horario_entrada" : "hrauto",
    "data_cadastro": "hrauto"
}];
return (
        <SafeAreaView style = {styles.safeArea}>
            <Header
    title={headerTitle}
    items={headerItems}
    color={headerColor}
    navigation={navigation}
/> 
            <FormComponent 
            database = {'transito.db'} 
            tabelas = {['CarroVisitacao']} 
            fields={fields}  
            fieldsTypes={fieldsTypes}
            initialData={{}} 
             ocultar = {camposOcultos} 
             labels = {{
                            placa: "Placa",
                            modelo: "Modelo",
                            cor:"Cor",
                            ano: "Ano",
                            motivo_visitacao: "Motivo da Visitação",
                            horario_entrada: "Horário de Entrada",
                
                        }}
            barraPersonalizada={{
                            CarroVisitacao: 'Carro Visitante',
                        }}

                        abaNavegacao = {false}

                        labelsInline={{
                        CarrosVisitacao : "Registro",
                        }} 

            TipoSub={"CRIAR"}        
                        getCampoInfo={[

                          ]}
                     

                          corApp={'#0051ff'}
            />
            
            </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
            flex: 1,
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }
});
export default VisitacaoCadastro;