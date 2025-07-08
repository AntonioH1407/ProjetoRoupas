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

const ClienteLista = ({ navigation }) => {
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
                            Cliente: {
                                "fields": ["nome", "telefone"]
                            }
                        }}
                        fieldsTypes={[{
                            "nome": "text",
                            "email": "email",
                            "telefone": "telefone",
                            "endereço": "text",
                        }]}
                        depth={1}
                        feldslabels={{
                            nome: "Nome"
                        }}
                        permissao="3"
                        exibirBotao={true}
                        textoBotao={'Adicionar Cliente'}
                        telaFormulario={'ClienteCadastro'}
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
    
export default ClienteLista;

