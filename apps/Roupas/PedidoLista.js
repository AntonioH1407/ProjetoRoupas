import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import Header from '../../components/HeaderComponent';
import ListarComBotao from '../../components/ListarComBotao';

const headerTitle = "Loja de Roupas";
const headerItems = [
    ['Home', 'HomeRoupas'],
    ['Lista de Produtos', 'ProdutoLista'],
    ['Lista de Clientes', 'ClienteLista'],
    ['Lista de Pedidos', 'PedidoLista'],

];
const headerColor = '#008000';

const PedidoLista = ({ navigation }) => {
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
                        databaseName={"lojaroupa.db"}
                        tableFields={{
                            Pedido: {
                                "fields": ["cliente", "produto"]
                            }
                        }}
                        fieldsTypes={[{
                            "cliente": "picker",
                            "produto": "picker",
                            "quantidade": "number",
                            "data_pedido": "data",
                        }]}
                        depth={1}
                        feldslabels={{
                            nome: "Nome"
                        }}
                        permissao="3"
                        exibirBotao={true}
                        textoBotao={'Adicionar Pedido'}
                        telaFormulario={'PedidoCadastro'}
                        navigation={navigation}
                        corBotao={headerColor}
                        
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
    
export default PedidoLista;

