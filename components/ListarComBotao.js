import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ListDataComponent from '../components/ListDataComponent';

const ListarComBotao = ({databaseName,tableFields,depth = null,fieldslabels = {},horizontal,permissao = "0", navigation,telaFormulario, textoBotao, exibirBotao, ocultar, auxiliaryActionConfig,itemRenderer}) => {

   
return (<View style = {styles.teste}>

<View style={styles.a}>
{exibirBotao && (<TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate(telaFormulario)}   >
                    <Text style={styles.buttonText}>{textoBotao}</Text>
                </TouchableOpacity>
    
    )}
    </View >     
       
<ListDataComponent
            databaseName = {databaseName}
            tableFields={tableFields} 
            depth={depth}
            fieldslabels={fieldslabels}
            permissao={permissao}
            ocultar = {ocultar}
            auxiliaryActionConfig={auxiliaryActionConfig}
            itemRenderer={itemRenderer}
            horizontal={horizontal}
        />          
</View>
    );
};

const styles = StyleSheet.create({
    a:{
alignItems: 'center'

    },
    button: {
        width: 250,
        height: 50,
        backgroundColor: '#0051ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 10,
    },
    teste:{
        flex : 1
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
   
});

export default ListarComBotao;