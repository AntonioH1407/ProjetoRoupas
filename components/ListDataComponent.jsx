import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
    TextInput,
} from "react-native"; // Added Alert
import SQLiteComponent from "./SQliteComponent";
import FormComponent from "./FormComponent";
import { FontAwesome } from "@expo/vector-icons";

// Nova função para construir dinamicamente os campos do FormComponent
async function buildFormFields(tableFields, parentTable, foreignKeyMappings, schema) {
    // Adicione verificação para garantir que schema não é null ou undefined
    if (!schema) schema = [];

    const parentFields = tableFields[parentTable]["fields"] || [];

    // Gera os campos do formulário para a tabela principal
    const mainFields = parentFields.reduce((acc, field) => {
        // Corrija aqui: schema pode ser null
        if (Array.isArray(schema) && schema.find((f) => f.columnName === field && f.isForeignKey)) {
            // Campo tipo 'picker'
            const options = Object.entries(foreignKeyMappings[field] || {}).map(
                ([value, label]) => ({
                    label,
                    value,
                })
            );
            acc.push(["picker", field, options]);
        } else {
            acc.push(["text", field]);
        }
        return acc;
    }, []);

    // Gera array de campos "inline" para as tabelas filhas
    const childTables = Object.keys(tableFields).filter((t) => t !== parentTable);

    const inlineFields = childTables.map((childTable) => {
        const childDefs = tableFields[childTable]["fields"].reduce((arr, field) => {
            // Corrija aqui também
            if (Array.isArray(schema) && schema.find((f) => f.columnName === field && f.isForeignKey)) {
                const options = [];
                arr.push(["picker", field, options]);
            } else {
                arr.push(["text", field]);
            }
            return arr;
        }, []);
        return ["inline", childTable, childDefs];
    });

    return [...mainFields, ...inlineFields];
}

// Nova função para construir dinamicamente labels
function buildLabels(tableFields) {
    const labels = {};
    Object.keys(tableFields).forEach((table) => {
        tableFields[table]["fields"].forEach((field) => {
            labels[field] = field
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase());
        });
    });
    return labels;
}

// Nova função para construir dinamicamente barraPersonalizada
function buildBarraPersonalizada(tableFields) {
    const barraPersonalizada = {};
    Object.keys(tableFields).forEach((table) => {
        barraPersonalizada[table] = table
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    });
    return barraPersonalizada;
}

const ListDataComponent = ({
    databaseName,
    tableFields,
    depth = null,
    fieldslabels = {},
    permissao = "0",
    ocultar = [],
    fkMap,
    itemRenderer,
    auxiliaryActionConfig,
    horizontal = false, // nova prop, padrão false
}) => {
    const [data, setData] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [foreignKeyMappings, setForeignKeyMappings] = useState({});
    // Added state for editing
    const [editingItem, setEditingItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Novo estado para carregamento
    const [modalVisible, setModalVisible] = useState(false);
    const [schema, setSchema] = useState(null); // Adicione este estado


    // First key in tableFields is assumed to be the parent table
    const parentTable = Object.keys(tableFields)[0];
    const parentFields = (tableFields[parentTable] && Array.isArray(tableFields[parentTable]["fields"]))
        ? tableFields[parentTable]["fields"]
        : [];
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const openModal = () => setModalVisible(true); // Abrir modal
  
    const closeModal = () => setModalVisible(false); // Fechar modal

    useEffect(() => {
        const fetchForeignKeys = async () => {
            try {
                // Obter o esquema da tabela pai
                const schema = await SQLiteComponent.getTableSchema(databaseName, parentTable);
                setSchema(schema);

                // Identificar campos que são chaves estrangeiras
                const foreignKeyFields = schema
                    .filter((field) => field.isForeignKey)
                    .map((field) => ({
                        columnName: field.columnName,
                        refTableName: field.relationship.table,
                        refColumnName: field.relationship.column,
                    }));
    
                // Mapear os valores das tabelas referenciadas
                const mappings = {};
                for (const fkField of foreignKeyFields) {
                    const records = await SQLiteComponent.getRecords(
                        databaseName,
                        fkField.refTableName,
                        0
                    );

                    // Usar o fkMap para determinar qual campo exibir
                    const displayField = fkMap && fkMap[fkField.columnName]
                    ? fkMap[fkField.columnName]
                    : "id"; // Default to 'id' if no mapping is provided

                    mappings[fkField.columnName] = records.reduce((acc, record) => {
                        acc[record.id] = record[displayField]; // Assuming 'nome' is the display field
                        return acc;
                    }, {});
                }
                setForeignKeyMappings(mappings);
            } catch (error) {
                console.error("Erro ao obter o esquema da tabela:", error);
            }
        };

        const fetchData = async () => {
            try {
                const records = await SQLiteComponent.getRecords(databaseName, parentTable, depth);
          
                setData(Array.isArray(records) ? records : []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setData([]); // Defina como array vazio em caso de erro
            } finally {
                setIsLoading(false); // Finaliza o carregamento
            }
        };

        const initialize = async () => {
            await fetchForeignKeys();
            await fetchData();
        };

        initialize();
    }, [databaseName, parentTable, tableFields]);

    useEffect(() => {
        // Filtrar os dados com base no termo de busca

  
        setFilteredData(
            data.filter(item =>
                Object.values(item).some(value =>
                    value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        );
    }, [searchTerm, data]);

    const replaceForeignKeys = (record) => {
        const updatedRecord = { ...record };
    
        for (const [field, relationConfig] of Object.entries(tableFields[parentTable].relatedFields || {})) {
            if (Array.isArray(updatedRecord[field])) {
                updatedRecord[field] = updatedRecord[field].map((fkRecord) => {
                    const updatedFkRecord = {};

                    // Restringir aos campos especificados
                    const fieldsToShow = relationConfig.fields || Object.keys(fkRecord);
                    fieldsToShow.forEach((key) => {
                        if (fkRecord[key]) {

                            // Se houver mapeamento de foreign keys, aplicá-lo
                            if (relationConfig.fieldValue && relationConfig.fieldValue[key]) {
                                updatedFkRecord[key] =
                                    fkRecord[key][relationConfig.fieldValue[key]] || "N/A";
                            } else {
                                updatedFkRecord[key] = fkRecord[key];
                            }
                        }
                    });
    
                    return updatedFkRecord;
                });
            }
        }
    
        return updatedRecord;
    };   


    const getFieldLabel = (field) => {
        return fieldslabels[field] || field;
    };

    const renderChildTables = (item) => {
        return Object.keys(item)
            .filter((key) => {
                // Adiciona verificação para garantir que parentFields é array
                return key.endsWith("_set") && parentFields.includes(key);
            })
            .map((childKey) => {
                
                const childRecords = item[childKey];
                if (!childRecords || childRecords.length === 0) {
                    console.log('retornei null')
                    return null; // Retorna vazio se não houver dados
                }

                console.log('retornei algo')
    
                return (
                    <View key={childKey} style={styles.inlineSection}>
                        <Text style={styles.inlineTitle}>
                            {getFieldLabel(childKey)}:
                        </Text>
                        {childRecords.map((childItem, index) => (
                            <View key={index} style={styles.inlineCard}>
                                {Object.keys(childItem).map((field) => {
                                    let displayValue = childItem[field];
                                
                                    // Verifica se o campo é um objeto e, se for, usa o id
                                    if (typeof displayValue === 'object' && displayValue !== null) {
                                        displayValue = displayValue.id || displayValue; // Escolhe o id do objeto, se disponível
                                    }
    
                                    return (
                                        <Text key={field} style={styles.inlineText}>
                                            {getFieldLabel(field)}:{" "}
                                            {foreignKeyMappings[field]
                                                ? foreignKeyMappings[field][displayValue] || displayValue
                                                : displayValue}
                                        </Text>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                );
            });
    };
    
    const handleEdit = (item) => {
        try {
            console.log("=== EDIT PROCESS START ===");
            console.log("Original item:", item);
            console.log("Parent table:", parentTable);

            // Fix the data structure to match what editRecords expects
            const editData = {
                [parentTable]: 
                    {
                        ...item,
                        id: Number(item.id),
                    },
            };

            console.log("Edit data structure:", editData);
            
            setEditingItem(editData);

            openModal();

        } catch (error) {
            console.error("Error in handleEdit:", error);
        }
    };

    const handleEditClose = () => {
        setEditingItem(null);
    };

    const handleDelete = async (id) => {
        Alert.alert(
            "Confirmar Deleção",
            "Você tem certeza que deseja excluir este registro?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    onPress: async () => {
                        try {
                            const dbArray = Array.isArray(databaseName) ? databaseName : [databaseName];
                            const success = await SQLiteComponent.deleteRecords(
                                databaseName,
                                [{ tableName: parentTable, id }]
                            );

                            console.log("Delete success:", success);
                            console.log('chegou aqui')
                            if (success) {
                                setData(data.filter((item) => item.id !== id));
                                Alert.alert(
                                    "Sucesso",
                                    "Dado excluído com sucesso"
                                );
                            } else {
                                Alert.alert(
                                    "Erro",
                                    "Dado não excluído. Tente novamente mais tarde"
                                );
                            }
                        } catch (error) {
                            console.error("Erro ao deletar registro:", error);
                            Alert.alert(
                                "Erro",
                                "Dado não excluído. Tente novamente mais tarde"
                            );
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const toggleExpand = (id) => {
        setExpandedId((prevId) => (prevId === id ? null : id));
        console.log("Expanded ID:", expandedId);
        console.log('id:', id)
    };
    
    const renderItem = ({ item }) => {
        const isExpanded = expandedId === item.id;
        // const displayFields = parentFields.filter((field) => !field.endsWith("_set")); // Movido para defaultRenderItemContent
        const displayItem = replaceForeignKeys(item);

        const defaultRenderItemContent = () => {
            const displayFields = parentFields.filter((field) => !field.endsWith("_set"));
            return (
                <>
                    {displayFields.length === 0 ? (
                        <Text style={styles.noRecordsMessage}>Sem dados</Text>
                    ) : (
                        displayFields.map((field) => (
                            <Text key={field} style={styles.fieldText}>
                                {getFieldLabel(field)}: {getDisplayValue(field, displayItem[field])}
                            </Text>
                        ))
                    )
                    }
                    {isExpanded && (
                        <View style={styles.expandedContent}>
                            {/* Verifica se renderChildTables retorna array vazio ou array de nulls */}
                            {(!renderChildTables(displayItem) || renderChildTables(displayItem).length === 0 || renderChildTables(displayItem).every(child => child === null)) ? (
                                <Text style={styles.noRecordsMessage}>Sem registros</Text>
                            ) :  renderChildTables(displayItem)}
                        </View>
                    )}
                </>
            );
        };

        let customRenderResult = null;
        if (itemRenderer && typeof itemRenderer === 'function') {
            customRenderResult = itemRenderer(item, defaultRenderItemContent);
        }

        const renderMainContent = () => {
            if (React.isValidElement(customRenderResult)) {
                return customRenderResult; // Renderer forneceu um elemento JSX completo
            }
            // Caso contrário, usa o defaultRenderItemContent ou o customContent do objeto
            return (
                <>
                    {defaultRenderItemContent()}
                    {customRenderResult && customRenderResult.customContent ? customRenderResult.customContent : null}
                </>
            );
        };

        const cardStyle = [
            styles.card,
            customRenderResult && customRenderResult.style ? customRenderResult.style : {},
        ];

        // Função para determinar quais ícones padrão exibir
        const renderStandardIcons = () => {
            const icons = [];
            if (permissao === "1" || permissao === "3") {
                icons.push(
                    <View style={styles.iconButton} key="edit">
                        <TouchableOpacity onPress={() => handleEdit(item)}>
                            <FontAwesome name="pencil" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                );
            }
            if (permissao === "2" || permissao === "3") {
                icons.push(
                    <View style={styles.iconButton} key="delete">
                        <TouchableOpacity onPress={() => handleDelete(displayItem.id)}>
                            <FontAwesome name="trash" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                );
            }
            return icons;
        };

        const renderAuxiliaryButtons = () => {
            if (!auxiliaryActionConfig) {
                return null;
            }

            const configs = Array.isArray(auxiliaryActionConfig) ? auxiliaryActionConfig : [auxiliaryActionConfig];
            
            // Cada botão auxiliar é um filho direto do iconContainer
            return configs.map((config, index) => {
                if (!config || typeof config.renderButton !== 'function' || typeof config.onPressAction !== 'function') {
                    console.warn(`Configuração do botão auxiliar inválida no índice ${index}`, config);
                    return null;
                }

                if (typeof config.isVisible === 'function' && !config.isVisible(item)) {
                    return null;
                }

                if (config.permissionLevel) {
                    if (permissao === "0" && config.permissionLevel !== "0") return null;
                    if (permissao !== "0" && !permissao.includes(config.permissionLevel) && config.permissionLevel !== "0") return null;
                }
                
                const triggerPress = () => {
                    config.onPressAction(item);
                };

                // Cada botão auxiliar é uma View separada
                return <View key={`aux-btn-${item.id}-${index}`}>{config.renderButton(item, triggerPress)}</View>;
            }).filter(Boolean); // Remove nulls e entradas inválidas
        };

        const getDisplayValue = (field, value) => {
            if (typeof value === 'object' && value !== null && !React.isValidElement(value)) {
                const fkField = fkMap && fkMap[field] ? fkMap[field] : 'id';
                if (value.hasOwnProperty(fkField)) {
                    return value[fkField];
                }
                // Se fkField não existe ou valor não é objeto simples, tenta stringify
                // Isso pode não ser ideal para todos os casos, mas é um fallback
                return typeof value.toString === 'function' ? value.toString() : JSON.stringify(value);
            }
            return value;
        };
    
        return (
            <View style={cardStyle}>
                <TouchableOpacity style={styles.touchableContainer} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.dataContainer}>
                        {renderMainContent()}
                    </View>
                </TouchableOpacity>
                <View style={[
                    styles.iconContainer,
                    horizontal ? { flexDirection: 'row', alignItems: 'center' } : { flexDirection: 'column', alignItems: 'center' }
                ]}>
                    {renderStandardIcons()}
                    {renderAuxiliaryButtons()}
                </View>
            </View>
        );
    };

    // Definir as tabelas a serem passadas para FormComponent com base nas props ou em tableFields
    const tabelasParaEditar = Object.keys(tableFields);


    // buildFormFields é async, então precisamos garantir que generatedFields seja um array (não uma Promise)
    const [generatedFields, setGeneratedFields] = useState([]);

    useEffect(() => {
        // Função para construir os campos de forma assíncrona
        const buildFields = async () => {
            const result = await buildFormFields(
                tableFields,
                parentTable,
                foreignKeyMappings,
                schema
            );
            setGeneratedFields(result || []);
        };
        // Só chama se schema já foi carregado
        if (schema) {
            buildFields();
        }
    }, [tableFields, parentTable, foreignKeyMappings, schema]);


    const barraPersonalizada = buildBarraPersonalizada(tableFields);

    // Passar apenas as tabelas necessárias e garantir que initialData corresponde ao item selecionado
    return (
        <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
                <FontAwesome name="search" size={20} color="gray" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Carregando dados...</Text>
                </View>
            ) : (
                filteredData.length === 0 ? (
                    <Text style={styles.noRecordsMessage}>Nenhum registro encontrado</Text>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                    />
                )
            )}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={closeModal}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <FormComponent
                      database={databaseName}
                      tabelas={tabelasParaEditar}
                      fields={generatedFields || []} // Agora sempre será array
                      initialData={
                          editingItem // Ensure correct nesting
                      }
                      ocultar={ocultar}
                      labels={fieldslabels}
                      barraPersonalizada={barraPersonalizada}
                      labelsInline={fieldslabels}
                      TipoSub="EDITAR"
                      onClose={handleEditClose}
                  />
                  <Pressable
                    style={styles.submitButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.submitButtonText}>
                        Cancelar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
        </View>
    );
};

const styles = {
    card: {
        padding: 10,
        margin: 10,
borderRadius: 15,
        backgroundColor: "#f9f9f9",
        flexDirection: "row", // Changed from 'column' to 'row'
        borderWidth: 1,
        borderColor: "black",
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 8,
        width: '95%',
        alignSelf: 'center',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
    },
touchableContainer: {
        flex: 1,
        flexShrink: 1,
    },
    dataContainer: {
        flex: 1, // Take up remaining space
        flexDirection: "column",
    },
    fieldText: {
        fontSize: 16,
    },
    iconContainer: {
        // flexDirection e alignItems agora são definidos dinamicamente
        justifyContent: "center",
        marginLeft: 10,
    },
    iconButton: {
        marginTop: 10,
        marginLeft: 0,
    },
    inlineSection: {
        marginTop: 10,
    },
    inlineTitle: {
        fontWeight: "bold",
        fontSize: 14,
        marginBottom: 5,
    },
    inlineCard: {
        padding: 5,
        backgroundColor: "#e0e0e0",
        borderRadius: 3,
        marginBottom: 5,
    },
    inlineText: {
        fontSize: 14,
        maxWidth: "100%",
    },
    expandedContent: {
        padding: 10,
        marginVertical: 10,
        marginBottom: 10,
        backgroundColor: "#e8e8e8",
        borderRadius: 5,
        flex: 1
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: "#000",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "80%",
      height: "90%",
      backgroundColor: "#fff",
      padding: 20,
      borderRadius: 8,
      alignItems: "center",
    },
    submitButton: {
      backgroundColor: "#2196F3", // Cor de fundo do botão (azul)
      padding: 15,
      borderRadius: 5,
      marginTop: 20,
      alignItems: "center",
    },
    submitButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    noRecordsMessage: {
        textAlign: 'center',
        fontSize: 16,
        color: 'gray',
        marginTop: 10,
    },
};

export default ListDataComponent;