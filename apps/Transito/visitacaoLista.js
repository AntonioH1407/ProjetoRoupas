
import {View,StyleSheet,SafeAreaView,Platform,StatusBar,} from "react-native";
import Header from "../../components/HeaderComponent";
import ListarComBotao from "../../components/ListarComBotao";

const headerTitle = "Trânsito";
const headerItems = [
    ['Home', 'HomeTransito'],
    ['Lista de Veículos', 'visitacaoLista'],
];
const headerColor = "#0051ff";

const VisitacaoLista = ({ navigation }) => {
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
                   
                    <ListarComBotao
                        databaseName={"transito.db"}
                        tableFields={{
                            CarroVisitacao: {
                                "fields": ["placa"],
                            }
                        }}
                        fieldsTypes = {[{
                            "placa": "text",
                            "modelo": "picker",
                            "cor": "picker",
                            "motivo_visitacao" : "textarea",
                            "horario_entrada" : "hrauto",
                            "data_cadastro": "hrauto"
                        }]}
                        depth={1}
                        fieldslabels={{
                            placa: "Placas"
                        }}
                        permissao="3"
                        
                        exibirBotao={true}  
                        textoBotao={'Adicionar Veículo Visitante'}
                        telaFormulario={'visitacaoCadastro'}    
                        navigation={navigation}
                    />

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

export default VisitacaoLista;