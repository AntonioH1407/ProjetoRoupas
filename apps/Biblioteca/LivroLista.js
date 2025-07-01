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

const LivroLista = ({ navigation }) => {
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
                            Livro: {
                                "fields": ["titulo"]
                            }
                        }}
                        fieldsTypes={[{
                            "titulo": "text",
                            "autor": "picker",
                            "categoria": "picker",
                            "ano_publicacao": "text",
                            "data_cadastro": "hrauto"
                        }]}
                        depth={1}
                        feldslabels={{
                            titulo: "Título"
                        }}
                        permissao="3"
                        exibirBotao={true}
                        textoBotao={'Adicionar Livro'}
                        telaFormulario={'LivroCadastro'}
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
    
export default LivroLista;

