import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import Header from '../../components/HeaderComponent';
import ListarComBotao from '../../components/ListarComBotao';

const headerTitle = "Biblioteca";
const headerItems = [
    ['Home', 'HomeBiblioteca'],
    ['Lista de Livros', 'LivroLista'],
    ['Lista de Emprestimos', 'ListaEmprestimo']
];
const headerColor = '#008000';

const ListaEmprestimo = ({ navigation }) => {
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
                        databaseName={"biblioteca.db"}
                        tableFields={{
                            Emprestimo: {
                                "fields": ["usuario"],
                            },
                            Livro: {
                                "fields": ["titulo"],
                            }
                        }}
                        fieldsTypes={[{
                            "livro": "picker",
                            "usuario": "text",
                            "data_emprestimo": "data",
                            "data_devolucao": "data"
                        }]}
                        depth={1}
                        feldslabels={{
                            titulo: "Título"
                        }}
                        permissao="3"
                        exibirBotao={true}
                        textoBotao={'Adicionar Emprestimo'}
                        telaFormulario={'EmprestimoCadastro'}
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
    
export default ListaEmprestimo;

