import React, { useState, useEffect } from 'react';
import {  StyleSheet, View, Text, TextInput, Button, Pressable, ScrollView, Image, Platform,TouchableOpacity ,Alert, Switch,FlatList, KeyboardAvoidingView, Modal} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import sqlite from '../components/SQliteComponent';
import { CameraPhotoComponent } from '../components/CameraComponent';
import { get, create,update } from '../components/Api';
import NetInfo from '@react-native-community/netinfo';
import { TextInputMask } from "react-native-masked-text";
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from 'react-native-dropdown-picker';
import { RadioButton } from 'react-native-paper';
import { QRCodeScannerComponent } from '../components/CameraComponent';
import { LogBox } from 'react-native';
import CheckboxComponent from './CrFormulario/checkbox';
import Hrauto from './CrFormulario/Hrauto';
import UniversalTextField from './CrFormulario/UniversalTextField';
LogBox.ignoreLogs([
  'Warning: Cannot update a component (`FormComponent`) while rendering a different component (`CellRenderer`).'
]);
const FormComponent = ({database,tabelas = [],fields = [],initialData = [{}],ocultar = [],labels = [],barraPersonalizada, TipoSub, labelsInline = [], camera, getCampoInfo = [], radioOptions, corApp, qrcodefk, variaveis = {}, tabelaMulti, placeholder,abaNavegacao = true, funcaoChamada = {}, funcaoChamadaSalvar = {}, fieldsTypes = []}) => {
const [formData, setFormData] = useState(initialData);
const [campos, setCampos] = useState(null);
const [valor, setValor] = useState({});
const [currentTableIndex, setCurrentTableIndex] = useState(0);
const [inlineFields, setInlineFields] = useState({});
const [FK, setFK] = useState({});
const [Gambi, setGambi] = useState([]);
const [Gambi2, setGambi2] = useState([]);
const [showCamera, setShowCamera] = useState(false);
const databases = sqlite.openDatabase(database);
const [isConnected, setIsConnected] = useState(false);
const [isPickerOpenState, setPickerOpenState] = useState({});
const [isAnyPickerOpen, setIsAnyPickerOpen] = useState(false);
const [showCalendarState, setShowCalendarState] = useState({});
const [modalVisible, setModalVisible] = useState(false);
const [dadosParaConfirmacao, setDadosParaConfirmacao] = useState(null);
const[jsonEnviado, setJsonEnviado] = useState(null);
const [showQRCodeScanner, setShowQRCodeScanner] = useState(false);
const [qrCodeValue, setQRCodeValue] = useState('');
const [tabelaQrcode, setTabelaQrcode] = useState('');
const [dadosSql, setDadosSql] = useState(null);
const [qrcodeColumn, setQrCodeColumn] = useState(null);
const [isValidHora, setIsValidHora] = useState(false);
 const [isValid, setIsValid] = useState(true);
const [inputDate, setInputDate] = useState('');
const [inputDateState, setInputDateState] = useState({});
let inl = false;
if(tabelas.length > 0) {
  inl = true;
}

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setIsConnected(state.isConnected);
  });
  return () => {
    unsubscribe();
  };
}, []);

useEffect(() => {
    const initialInlineFields = {};
    fields.forEach(field => {
      if (field[0] === 'inline') {
        const [_, label, subFields] = field;
        initialInlineFields[label] = subFields.map(() => ['']); 
      }
    });
    setInlineFields(initialInlineFields);
  }, [fields]);
  useEffect(() => {
    // Verifica se está em uma tela com campos inline
    const currentTable = tabelas[currentTableIndex];
    const hasInlineFields = campos?.some(field => field[0] === 'inline' && field[1] === currentTable);
    
    if (hasInlineFields && (!inlineFields[currentTable] || inlineFields[currentTable].length === 0)) {
      // Encontra os subFields do campo inline atual
      const inlineField = campos.find(field => field[0] === 'inline' && field[1] === currentTable);
      if (inlineField) {
        const [_, label, subFields] = inlineField;
        handleAddInlineField(label, subFields);
      }
    }
  }, [currentTableIndex, campos]);
console.log(formData);
  useEffect(() => {
    const atualizarInlineFields = () => {
      setInlineFields((prevFields) => {
        const updatedFields = { ...prevFields };
        Object.keys(updatedFields).forEach((label) => {
          updatedFields[label] = updatedFields[label].map((fieldSet) =>
            fieldSet.map((field) => {
              if (field.type === "picker" && valor[field.columnName]) {
                return { ...field, options: valor[field.columnName] };
              }
              return field;
            })
          );
        });
        return updatedFields;
      });
    };
  
    atualizarInlineFields();
  }, [valor, FK]);

  const renderNavigationBar = () => {
    return (
      <View style={styles.navBar}>
        {tabelas.map((table, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setCurrentTableIndex(index)}
            style={[
              styles.navItem,
              currentTableIndex === index && styles.activeNavItem,
            ]}
          >
            <Text style={styles.navText}>
              {barraPersonalizada[table] || table}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const removeDbExtension = (dbName) => {
    if (typeof dbName === "string" && dbName.endsWith(".db")) {
      return dbName.slice(0, -3);
    }
    return dbName;
  };
const carregaForeignKeys = async (fk) => {
  // Função utilitária para remover o sufixo .db do nome do banco

  const results = {};
  try {
    for (const key in fk) {
      let { databaseName, tableName, displayField, fieldName } = fk[key]; // databaseName aqui é o nome do BD da FK, que pode ser diferente do 'database' da prop principal
      const fkFieldTypeConfig = fieldsTypesMap[key]; 

      let registrosPai; 

      if (isConnected == false) {
        const dbForApi = removeDbExtension(databaseName); // Usa o databaseName da FK
        registrosPai = await get(dbForApi, tableName);
      } else {
        registrosPai = await sqlite.getRecords(databaseName, tableName); // SQLite usa o databaseName da FK
      }

      if (fkFieldTypeConfig && fkFieldTypeConfig.type === 'pickerRelacional' && fkFieldTypeConfig.config) {
        const config = fkFieldTypeConfig.config;
        let registrosAvo;

        if (isConnected == false) {
          const dbForApi = removeDbExtension(databaseName); // Usa o databaseName da FK para a tabela avó também
          registrosAvo = await get(dbForApi, config.nomeTabelaAvo);
        } else {
          registrosAvo = await sqlite.getRecords(databaseName, config.nomeTabelaAvo); // SQLite usa o databaseName da FK
        }
        
        const mapaAvo = registrosAvo.reduce((map, avoRecord) => {
          map[avoRecord[config.campoIdTabelaAvo]] = avoRecord[config.campoExibicaoTabelaAvo];
          return map;
        }, {});

        results[key] = registrosPai.map((paiRecord) => {
          const idDoAvo = paiRecord[config.fkNaTabelaPaiParaAvo];
          const labelDoAvo = mapaAvo[idDoAvo] || `${idDoAvo})`; // Fallback
          
          // Você pode personalizar o formato do label aqui se desejar
          // Por exemplo, incluir o ID do pai para diferenciação, se necessário
          const displayLabel = `${labelDoAvo}`;

          return {
            label: displayLabel,
            value: paiRecord[fieldName], // Este é o ID da tabela pai (ex: DetalheProduto.id)
          };
        });
      } else {
        // Lógica padrão para pickers normais
        results[key] = registrosPai.map((registro) => ({
          label: registro[displayField],
          value: registro[fieldName],
        }));
      }
    }
    setValor((prevState) => ({
      ...prevState, // Mantém os valores anteriores
      ...results,   // Sobrescreve ou adiciona novos valores
    }));
  } catch (error) {
    console.error("Erro ao carregar chaves estrangeiras:", error);
  }
};

useEffect(() => {
  setFormData(initialData); 
}, [initialData]);
const inserirVariaveis = (camposGerados, variaveis) => {
  let resultado = [];
  for (let i = 0; i < (camposGerados.length); i++) {
    resultado.push(["text", `exibi${i}`]); // Inserindo a variável antes do campo
    resultado.push(camposGerados[i]);  // Adicionando o campo original
  }
  resultado.push(["text", `exibi${camposGerados.length}`]); // Última variável no final
  return resultado;
};

useEffect(() => {
  const fetchSchemas = async () => {
    try {
      
      if (!database || tabelas.length === 0) return; 
      const tabelaAtual = tabelas[currentTableIndex]; 
      const schema = await sqlite.getTableSchema(database, tabelaAtual);
      const fkk = await todasFkPopuladas(database, tabelaAtual, getCampoInfo);
      setFK((prevFK) => {
        if (JSON.stringify(prevFK) !== JSON.stringify(fkk)) {
          return fkk; 
        }
        return prevFK;
      });
      const camposGerados = gerarFields(schema, ocultar);
      camposModificados = inserirVariaveis(camposGerados)
      // console.log("campos mod",camposModificados);
      setCampos(camposModificados);
      
    } catch (error) {
      console.error("Erro ao carregar esquemas:", error);
    }
  };
  fetchSchemas();
}, [database, tabelas, currentTableIndex, ocultar,valor,FK,Gambi,Gambi2]);

useEffect(() => {
  const fetchForeignKeys = async () => {
    try {
      if (Object.keys(FK).length === 0) return; 
      
      await carregaForeignKeys(FK);  
    } catch (error) {
      console.error("Erro ao carregar chaves estrangeiras:", error);
    }
  };
  fetchForeignKeys(); 
}, [currentTableIndex, FK, Gambi,Gambi2])
const fieldsTypesMap = React.useMemo(() => {
  // Suporta tanto array de objetos quanto objeto simples
  if (Array.isArray(fieldsTypes)) {
    // Se for array de objetos, mescla todos em um só objeto
    return Object.assign({}, ...fieldsTypes);
  }
  return fieldsTypes || {};
}, [fieldsTypes]);
const gerarFields = (tipos, campos_ocultos) => {
  if (!Array.isArray(tipos)) return [];
  const inlineFieldsAdded = {};
  return tipos
    .map(({ dataType, columnName, isForeignKey }) => {
      // Use o tipo definido em fieldsTypesMap, se existir
      const tipoCustom = fieldsTypesMap[columnName];

      // Se não for inline
      if (currentTableIndex === 0 && !isForeignKey && !campos_ocultos.includes(columnName)) {
        if (tipoCustom) {
          // Se o tipo customizado existe, retorna conforme o tipo
          return [tipoCustom, columnName];
        }
        // Fallback para "text" se não houver tipo definido
        return ["text", columnName];
      } else if (currentTableIndex === 0 && isForeignKey && !campos_ocultos.includes(columnName)) {
        // ...existing code para foreign keys...
        if (tipoCustom) {
          // Se o tipo customizado existe, retorna conforme o tipo
          // Para foreign keys, normalmente é picker/multi/qrcodefk/etc
          if (tipoCustom === "qrcodefk") return ["qrcodefk", columnName];
          if (tipoCustom === "multi") return ["multi", columnName, valor[columnName] || []];
          if (tipoCustom === "picker") return ["picker", columnName, valor[columnName] || []];
          // Adicione outros tipos customizados para FK se necessário
        }
        // Fallback para picker
        return ["picker", columnName, valor[columnName] || []];
      } else if (currentTableIndex > 0 && !inlineFieldsAdded[tabelas[currentTableIndex]]) {
        inlineFieldsAdded[tabelas[currentTableIndex]] = true;
        const inlineSubFields = tipos
          .filter(({ columnName: col }) => !campos_ocultos.includes(col))
          .map(({ dataType, columnName: col, isForeignKey: isFK }) => {
            const tipoInline = fieldsTypesMap[col];
            if (isFK) {
              if (tipoInline === "multi") return ["multi", col, valor[col] || []];
              if (tipoInline === "picker") return ["picker", col, valor[col] || []];
              // Adicione outros tipos customizados para FK inline se necessário
              return ["picker", col, valor[col] || []];
            } else if (tipoInline) {
              return [tipoInline, col];
            }
            // Fallback para "text"
            return ["text", col];
          });
        return ["inline", tabelas[currentTableIndex], inlineSubFields];
      }
      return null;
    })
    .filter(Boolean);
};

const todasFkPopuladas = async (databaseName, tableName, getCampoInfo) => {
  const schema = await sqlite.obterForKeyInfo(databaseName, tableName);
  const fkMap = {};
  let campoInfoMap;
  if (Array.isArray(getCampoInfo)) {
    campoInfoMap = new Map(
      getCampoInfo.map(info => [info.tableName, info.displayField])
    );
  } else if (getCampoInfo && typeof getCampoInfo === "object") {
    
    campoInfoMap = new Map([[getCampoInfo.tableName, getCampoInfo.displayField]]);
  } else {
    campoInfoMap = new Map(); 
  }

  schema.forEach((column) => {
    if (column.isForeignKey && column.relationship) {
      const { columnName, relationship } = column;

      const display = campoInfoMap.get(relationship.tableName) || 'nome';
      fkMap[columnName] = {
        databaseName: relationship.databaseName,
        tableName: relationship.tableName,
        fieldName: relationship.fieldName,
        displayField: display,
      };
    }
  });
  return fkMap;
};

const handleInputChange = (tableName, columnName, value) => {

    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [tableName]: {
          ...prevData[tableName],
          [columnName]: value,
        },
      };
      return newData;
    });
  };

  const reset = () => {
    console.log("Dados do formulário Limposs.");
    setFormData({});
  };
  
  const [a, setA] = useState(0); 
  const [b, setB] = useState(0); 
  const handleAddInlineField = (label, inlineSubFields) => {
   
    setA((prevA) => {
      const newA = prevA + 1;
      setGambi(1 + newA); 
      return newA;
    });
  
    setInlineFields((prevFields) => {
      const updatedFields = { ...prevFields };
  
      if (!updatedFields[label]) {
        updatedFields[label] = [];
      }
  
      const newFieldSet = inlineSubFields.map(([type, columnName]) => ({
        type,
        columnName,
        value: type === "picker" ? "" : "",
        options: valor[columnName] || [], 
      }));
  
      updatedFields[label].push(newFieldSet);
  
      setFormData((prevData) => ({
        ...prevData,
        [label]: updatedFields[label],
      }));
  
      return updatedFields;
    });
  };
  
  const handleRemoveInlineField = (label, index) => {
    setInlineFields(prevFields => {
      const updatedFields = { ...prevFields };
      updatedFields[label] = updatedFields[label].filter((_, i) => i !== index);
  
      setFormData(prevData => ({
        ...prevData,
        [label]: updatedFields[label],
      }));
  
      return updatedFields;
    });
  };

  const visualizacao_form = (fields) => {
    if (!Array.isArray(fields) || fields.length === 0) {
      return <Text style={styles.warning}>Nenhum campo disponível</Text>;
    }
    
    return fields
      .map((field, index) => {
        const label = labels[index] || field[1];
        const [type, columnName, options] = field;
        const tableName = tabelas[currentTableIndex];
        
        const fieldComponent = renderField([type, label, columnName, options, tableName]);
        
        // Se renderField retornar null, não renderiza nenhum container para esse campo
        if (!fieldComponent) return null;
        
        return (
          <View key={index} style={styles.formContainer}>
            {fieldComponent}
          </View>
        );
      })
      .filter((component) => component !== null);
  };

const handleRemoveImage = (tableName, columnName, indexToRemove) => {
  setFormData((prevData) => {
    const updatedImages = prevData[tableName][columnName].filter(
      (_, index) => index !== indexToRemove
    );
    return {
      ...prevData,
      [tableName]: {
        ...prevData[tableName],
        [columnName]: updatedImages,
      },
    };
  });
};

const pickImage = async (tableName, columnName) => {
  try {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsMultipleSelection: true, 
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => ({ uri: asset.uri })); 

      setFormData(prevData => {
        const previousImages = prevData[tableName]?.[columnName] || [];
        return {
          ...prevData,
          [tableName]: {
            ...prevData[tableName],
            [columnName]: [...previousImages, ...selectedImages], 
          },
        };
      });
    }
  } catch (error) {
    console.error('Erro ao escolher imagens:', error);
  }
};

const handleCameraCapture = (tableName, columnName, photoUri) => {
  setFormData((prevData) => {
    const previousImages = prevData[tableName]?.[columnName] || []; 
    return {
      ...prevData,
      [tableName]: {
        ...prevData[tableName],
        [columnName]: [...previousImages, { uri: photoUri }], 
      },
    };
  });
};

useEffect(() => {
  const buscarDados = async () => {
    if (qrCodeValue) {
      try {
        // Exemplo de chamada para buscar registros no SQLite
        let registros;
        if(isConnected == false){
          const dbForApi = removeDbExtension(database); // 'database' aqui é a prop principal do FormComponent
          registros = await get(dbForApi, tabelaQrcode, qrCodeValue, 0);
        }
          else{
            registros = await sqlite.getRecords(database, tabelaQrcode, 0, qrCodeValue);
          }
        
        // Função para filtrar os dados com base nas colunas especificadas em qrcodefk
        const processarDados = (dados, colunas) => {
          return dados.map(registro => {
            let novoRegistro = {};
            colunas.forEach(coluna => {
              if (registro.hasOwnProperty(coluna)) {
                novoRegistro[coluna] = registro[coluna];
              }
            });
            return novoRegistro;
          });
        };

        // Supondo que qrcodefk seja uma string JSON, converta para array
        const colunasDesejadas = JSON.parse(qrcodefk); // Converte a string JSON para array
        const dadosProcessados = processarDados(registros, colunasDesejadas);
        setDadosSql(dadosProcessados);
       
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }
  };

  buscarDados();
}, [qrCodeValue, database, tabelaQrcode, qrcodefk, isConnected]); // Adicionado isConnected às dependências
const removerPalavrasChavesString = (texto, palavrasChave) => {
  let resultado = texto;
  palavrasChave.forEach((palavra) => {
    // Remove a primeira ocorrência da palavra-chave.
    // Se desejar remover todas as ocorrências, pode usar uma expressão regular com a flag 'g'.
    resultado = resultado.replace(palavra, '');
  });
  return resultado;
};
useEffect(() => {
  if (qrcodeColumn) {
    const palavrasRemovidas = ["qrcodefk_", "_id"];
    const tabela = removerPalavrasChavesString(qrcodeColumn, palavrasRemovidas);
    setTabelaQrcode(tabela);
  }
}, [qrcodeColumn]);



const variaveisExibicao ={
exibi0 : "a"
}

const renderField = (field) => {
  const [type, label, columnName, options, tableName] = field;
  const labels_Modificada = labels[columnName] || columnName;
  const value = formData[tableName]?.[columnName] || '';  
  const fieldName = label; 
 

  switch (type) {
    case "text": {
      if (columnName.startsWith("exibi")) {
        const currentScreen = currentTableIndex;
  
        const screenVariablesFromExibicao = variaveisExibicao?.[currentScreen];
        const screenVariablesFromProps = variaveis?.[currentScreen];
  
        const screenVariables = {
          ...(screenVariablesFromProps || {}),
          ...(screenVariablesFromExibicao || {})
        };
  
        const valorParaExibir = screenVariables[columnName];
  
        if (!valorParaExibir) {
          return null;
        }
  
        return (
          <View key={columnName} style={styles.exibiContainer}>
            <Text style={styles.exibiText}>
              {valorParaExibir}
            </Text>
          </View>
        );
      } else {
        return (
          <UniversalTextField
            key={columnName}
            columnName={columnName}
            label={labels_Modificada}
            value={value}
            tableName={tableName}
            placeholder={(placeholder && placeholder[columnName]) || labels_Modificada}
            onChange={(text) => {
              handleInputChange(tableName, columnName, text);
            }}
            funcaoChamada={funcaoChamada}
          />
        );
      }
    }
      
      case "picker":
        const handlePickerOpen = (columnKey, isOpen) => {
          setPickerOpenState((prevState) => ({
            ...prevState,
            [columnKey]: isOpen,
          }));
          setIsAnyPickerOpen(Object.values({ ...isPickerOpenState, [columnKey]: isOpen }).some(Boolean));
        };
        
        return (
          <View key={columnName} style= {styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}</Text>
            <DropDownPicker
  open={isPickerOpenState[columnName] || false}
  setOpen={(isOpen) => handlePickerOpen(columnName, isOpen)}
  value={value}
  setValue={(callback) => {
    const newValue = typeof callback === "function" ? callback(value) : callback;
    handleInputChange(tableName, columnName, newValue);
    if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
      funcaoChamada[columnName](tableName, columnName, newValue);
    }
  }}
  items={options.map((option) => ({
    label: option.label,
    value: option.value,
  }))}
  searchable={true}
  placeholder="Selecione uma opção"
  searchPlaceholder="Buscar..."
  style={styles.picker}
  dropDownContainerStyle={[
    styles.dropDownContainer,
    { zIndex: 9999, maxHeight: 200 },
  ]}
  nestedScrollEnabled={true}
  scrollViewProps={{
    nestedScrollEnabled: true,
  }}
  listMode="SCROLLVIEW" 
/>

</View>
        );
        case "multi":
          const handlePickerOpenMulti = (columnKey, isOpen) => {
            setPickerOpenState(prevState => ({
              ...prevState,
              [columnKey]: isOpen,
            }));
            setIsAnyPickerOpen(
              Object.values({ ...isPickerOpenState, [columnKey]: isOpen }).some(Boolean)
            );
          };
        
          return (
            <View
              key={columnName}
              style={
                styles.fieldContainer
               
              }
            >
              <Text style={styles.label}>{labels_Modificada}</Text>
              <DropDownPicker
                open={isPickerOpenState[columnName] || false}
                setOpen={(isOpen) => handlePickerOpenMulti(columnName, isOpen)}
                // Certifique-se de que o value está definido como array para múltiplas seleções
                value={Array.isArray(value) ? value : []}
                setValue={(callback) => {
                  const newValue =
                    typeof callback === "function" ? callback(Array.isArray(value) ? value : []) : callback;
                  // Atualiza o formData com o array de valores selecionados
                  handleInputChange(tableName, columnName, newValue);
                }}
                items={options.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                searchable={true}
                placeholder="Selecione uma opção"
                searchPlaceholder="Buscar..."
                style={styles.picker}
                dropDownContainerStyle={[
                  styles.dropDownContainer,
                  { zIndex: 1000, maxHeight: 200 },
                ]}
                nestedScrollEnabled={true}
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                listMode="SCROLLVIEW"
                multiple={true}  // Habilita seleção múltipla
                mode="BADGE"     // Exibe os itens selecionados como badge (opcional)
              />
            </View>
          );
        case "qrcodefk":
         
        
          setQrCodeColumn(columnName);
          const handleCheckin = async (data) => {
          
          setQRCodeValue(data);
          setShowQRCodeScanner(false); // Ocultar o scanner após a leitura do QR Code
          handleInputChange(tableName, columnName, data);
          console.log('onSave chamado');
          onSave(qrCodeValue);
        };
      
         return (
            <View>

            {!qrCodeValue && (<TouchableOpacity style={styles.scanButton} onPress={() => setShowQRCodeScanner(true)}>
          <Text style={styles.scanButtonText}>Escanear QR Code</Text>
        </TouchableOpacity>)}


        {/* {!qrCodeValue &&(<TouchableOpacity
        style={styles.simulateButton}
        onPress={() => handleCheckin("1")}>
        <Text style={styles.simulateButtonText}>Simular QR Code</Text>
      </TouchableOpacity>)} */}
              <Modal
                visible={showQRCodeScanner}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowQRCodeScanner(false)}
              >
                <View style={styles.modalContainer}>
                  <Text style={styles.scannerOverlayText}>Leia o QR Code!</Text>
                  <QRCodeScannerComponent onQRCodeScanned={handleCheckin} />
                  <Button
                    title="Fechar"
                    onPress={() => setShowQRCodeScanner(false)}
                  />
                </View>
              </Modal>
              {dadosSql && dadosSql.length > 0 ? (
  <FlatList
    data={dadosSql}
    keyExtractor={(item, index) => index.toString()}
    renderItem={({ item }) => (
      <View style={styles.itemContainer}>
        {Object.entries(item).map(([key, value]) => (
          <Text key={key} style={styles.itemText}>
            <Text style={styles.label}>{labels_Modificada}:</Text> {value}
          </Text>
        ))}
      </View>
    )}
  />
) : (
  <Text style={styles.dadosText}>Nenhum dado encontrado</Text>
)}

    </View>
  );
        case "camera":
          const capturedImages = formData?.[tableName]?.[columnName] || []; 
        
          return (
            <View key={columnName} style={styles.fieldContainer}>
              <Text style={styles.label}>{labels_Modificada}</Text>
              
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(true)} 
              >
                <Text style={styles.cameraButtonText}>Abrir câmera</Text>
              </TouchableOpacity>
                    
              <ScrollView horizontal style={styles.imagePreviewContainer}>
                {capturedImages.map((image, index) => (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <Pressable onPress={() => handleRemoveImage(tableName, columnName, index)}>
                      <Text style={styles.removeButton}>X</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>       
              
              {showCamera && (
                <CameraPhotoComponent
                  onPhotoTaken={(photoUri) => {
                    handleCameraCapture(tableName, columnName, photoUri); 
                    setShowCamera(false); 
                  }}
                />
              )}
            </View>
          );
        
          case 'upload':
const uploadedImages = formData?.[tableName]?.[columnName] || []; 

return (
  <View key={label} style={styles.fieldContainer}>
    <Text style={styles.label}>{labels_Modificada}:</Text>
    <View style={styles.uploadContainer}>
      <Pressable onPress={() => pickImage(tableName, columnName)}>
        <Text style={styles.uploadButton}>Escolher Imagem</Text>
      </Pressable>
      <ScrollView horizontal style={styles.imagePreviewContainer}>
        {uploadedImages.map((image, index) => (
          <View key={index} style={styles.imagePreviewItem}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            <Text style={styles.fileNameText}>Imagem {index + 1}</Text>
            <Pressable onPress={() => handleRemoveImage(tableName, columnName, index)}>
              <Text style={styles.removeButton}>X</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  </View>
);
        
          case "checkbox":
            return (
              <CheckboxComponent
                value={value}
                label={labels_Modificada}
                onValueChange={(newValue) => {
                  handleInputChange(tableName, columnName, newValue);
                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                    funcaoChamada[columnName](tableName, columnName, newValue);
                  }
                }}
              />
            );

        case 'textarea':
          const funcTextArea = funcaoChamada[columnName];

        return (
          <View key={label} style={styles.fieldContainer}>
            <Text style={styles.label}>{labels_Modificada}:</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              rows={4}
              value={value}
              onChangeText={(text) =>{ 
                handleInputChange(tableName,columnName, text)
                if (typeof funcTextArea === "function") {
                  funcTextArea(tableName, columnName, text);
                }                
              }}
            />
          </View>
        );
        case 'preco':
          const funcaoPreco = funcaoChamada[columnName];
            return (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{label}</Text>
                <TextInputMask
                  type="money"
                  options={{
                    precision: 2,
                    separator: '.',
                    delimiter: '',
                    unit: '',
                    suffixUnit: ''
                  }}
                  value={value}
                  onChangeText={(text) => {
                    handleInputChange(tableName, columnName, text);
                    if (typeof funcaoPreco === "function") {
                      funcaoPreco(tableName, columnName, text);
                    }
                  }}
                  style={styles.input}
                  placeholder={labels_Modificada}
                />
              </View>
            );

          case "cpf":
          return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInputMask
                    type="cpf"
                    value={value}
                    onChangeText={(text) => {
                      handleInputChange(tableName, columnName, text);
                    }
                  }
                    style={styles.input}
                    placeholder={label}
                  />
                </View>
              );
        case "email" :
          return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    value={value}
                    onChangeText={(text) => {
                      
                        handleInputChange(tableName, columnName, text);
                      
                      setIsValid(text.includes("@"));
                      funcaoChamada?.[columnName]?.(tableName, columnName, text);
                    }}
                    style={[styles.input, !isValid && styles.errorInput]}
                    placeholder={label}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {!isValid && (
                    <View style={styles.tooltipContainer}>
                      <Text style={styles.tooltipText}>Insira um e-mail válido</Text>
                    </View>
                  )}
                </View>
              );
        case "rg":
           return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInputMask
                    type="custom"
                    options={{ mask: "99.999.999" }}
                    value={value}
                    onChangeText={(text) => {
                      handleInputChange(tableName, columnName, text);
                    }}
                    style={styles.input}
                    placeholder={label}
                  />
                </View>
              );
        case "cnpj":
           return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInputMask
                    type="custom"
                    options={{ mask: "99.999.999/9999-99" }}
                    value={value}
                    onChangeText={(text) => {
                      handleInputChange(tableName, columnName, text);
                      
                    }}
                    style={styles.input}
                    placeholder={label}
                  />
                </View>
              );
        case "exibi":
          if (!value) return null;
    return (
      <View style={styles.exibiContainer}>
        <Text style={styles.exibiText}>{value}</Text>
      </View>
    );
    case "data":
      const toggleCalendar = (key, isOpen) => {
        setShowCalendarState((prevState) => ({
          ...prevState,
          [key]: isOpen,
        }));
      };
    
      const handleManualDateChange = (column, text) => {
        setInputDateState((prevState) => ({
          ...prevState,
          [column]: text,
        }));
        if (!text) {
          handleInputChange(tableName, column, "");
          return;
        }
        const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
        if (dateRegex.test(text)) {
          handleInputChange(tableName, column, text); 
        }
      };
    
      return (
        <View key={columnName} style={styles.fieldContainer}>
          <Text style={styles.label}>{labels_Modificada}</Text>
          <View style={styles.row}>
            <TextInputMask
              type={"datetime"}
              options={{
                format: "YYYY/MM/DD" ,
              }}
              value={inputDateState[columnName] || ""} 
              onChangeText={(text) => handleManualDateChange(columnName, text)}
              style={[styles.input, { flex: 1 }]}
              placeholder={labels_Modificada}
            />
            <TouchableOpacity
              onPress={() => toggleCalendar(columnName, true)} 
              style={styles.calendarButton}
            >
              <Text style={styles.calendarButtonText}>📅</Text>
            </TouchableOpacity>
          </View>
    
          {showCalendarState[columnName] && (
            <DateTimePicker
              value={
                inputDateState[columnName]
                  ? new Date(inputDateState[columnName])
                  : value
                  ? new Date(value)
                  : new Date()
              }
              mode="date"
              display="calendar"
              onChange={(event, selectedDate) => {
                toggleCalendar(columnName, false);
                if (selectedDate) {
                  const formattedDate = selectedDate.toISOString().split("T")[0];
                  handleInputChange(tableName, columnName, formattedDate); 
                  setInputDateState((prevState) => ({
                    ...prevState,
                    [columnName]: formattedDate,
                  }));
                }
              }}
            />
          )}
        </View>
      );
    
        case "telefone":
           return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInputMask
                    type="custom"
                    options={{ mask: "(99) 99999-9999" }}
                    value={value}
                    onChangeText={(text) => {
                      handleInputChange(tableName, columnName, text);
                      
                    }}
                    style={styles.input}
                    placeholder={label}
                  />
                </View>
              );
        case "ano":
           return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInputMask
                    type="custom"
                    options={{ mask: "9999" }}
                    value={value}
                    onChangeText={(text) => {
                      handleInputChange(tableName, columnName, text);
                  
                    }}
                    style={styles.input}
                    placeholder={label}
                  />
                </View>
              );
        case "qrcode":
          
              return (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{label}</Text>
                  { !qrCodeValue ? (
                    <TouchableOpacity style={styles.scanButton} onPress={() => setShowQRCodeScanner(true)}>
                      <Text style={styles.scanButtonText}>Escanear QR Code</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qrCodeValueContainer}>
                      <Text style={styles.qrCodeValueLabel}>Valor do QR Code:</Text>
                      <Text style={styles.qrCodeValue}>{qrCodeValue}</Text>
                    </View>
                  )}
                  <Modal
                    visible={showQRCodeScanner}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowQRCodeScanner(false)}
                  >
                    <View style={styles.modalContainer}>
                      <Text style={styles.scannerOverlayText}>Leia o QR Code!</Text>
                      <QRCodeScannerComponent onQRCodeScanned={handleCheckin} />
                      <Button title="Fechar" onPress={() => setShowQRCodeScanner(false)} />
                    </View>
                  </Modal>
                </View>
              );

        case "horario":
          const validateAndFormatTime = (text) => {
            let [hours, minutes] = text.split(":").map(Number);
        
            if (isNaN(hours) || isNaN(minutes)) return text; // Permite edição normal enquanto incompleto
        
            // Garante que a hora não seja maior que 23 e os minutos não sejam maiores que 59
            hours = Math.min(hours, 23);
            minutes = Math.min(minutes, 59);
        
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
          };
        
          return (
            <View key={columnName} style={styles.fieldContainer}>
              <Text style={styles.label}>{labels_Modificada}</Text>
              <TextInputMask
                type={"custom"}
                options={{
                  mask: "99:99", // Máscara para horário (hh:mm)
                }}
                value={value}
                onChangeText={(text) => {
                  const formattedTime = validateAndFormatTime(text);
                  const isValid = formattedTime.length === 5; // Apenas aceita se estiver completo
        
                  setIsValidHora(isValid);
                  handleInputChange(tableName, columnName, formattedTime);
                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                    funcaoChamada[columnName](tableName, columnName, formattedTime);
                  }
                }}
                style={[styles.input, !isValidHora && styles.errorInput]}
                placeholder="hh:mm"
                keyboardType="numeric"
              />
              {/* {!isValidHora && <Text style={styles.errorText}>Horário inválido</Text>} */}
            </View>
          );
        
          case  "hrauto":
            return (
              <Hrauto
                value={value}
                label={labels_Modificada}
                onUpdate={(newTime) => {
                  handleInputChange(tableName, columnName, newTime);
                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                    funcaoChamada[columnName](tableName, columnName, newTime);
                  }
                }}
              />
            );
        case "number":
          return (
            <View key={columnName} style={styles.fieldContainer}>
              <Text style={styles.label}>{labels_Modificada}</Text>
              <TextInputMask
                type={"only-numbers"}
                value={value}
                onChangeText={(text) => {
                  handleInputChange(tableName, columnName, text);
                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                    funcaoChamada[columnName](tableName, columnName, text);
                  }
                }}
                style={styles.input}
                placeholder={labels_Modificada}
              />
            </View>
          );
         
          
          // ...
          
          case "radio":
            const dynamicOptions = radioOptions[columnName] || [];
            return (
              <View key={columnName} style={styles.fieldContainer}>
                <Text style={styles.label}>{labels_Modificada}</Text>
                {dynamicOptions.map((option) => (
                  <View key={option.value} style={styles.radioContainer}>
                    <RadioButton
                      value={option.value}
                      status={value === option.value ? 'checked' : 'unchecked'}
                      onPress={() => {
                        handleInputChange(tableName, columnName, option.value);
                        if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                          funcaoChamada[columnName](tableName, columnName, option.value);
                        }
                      }}
                    />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </View>
                ))}
              </View>
            );
        case "inline":
          const inlineFieldSets = inlineFields[label] || [];
          return (
            <View key={label} style={styles.inlineFieldContainer}>
              {inlineFieldSets.map((fieldSet, index) => (
                <View key={`${label}-${index}`} >
                  {fieldSet.map(({ type, columnName, value, options }) => {
                    const labelModificada = labels[columnName] || columnName; 
                    // Cria uma chave única para cada dropdown
                    const uniqueKey = `${columnName}-${index}`;
                    
                    if (type === "text") {
                      if (columnName === "cpf") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"cpf"}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, text);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (columnName.includes("horario")) {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labels_Modificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "99:99", // Máscara para horário (hh:mm)
                              }}
                              value={value}
                              onChangeText={(text) => {
                                handleInputChange(tableName, columnName, text);
                                if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                  funcaoChamada[columnName](tableName, columnName, text);
                                }
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      }
                      else if (columnName.startsWith("textarea")) {
                        return (
                          <View key={label} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}:</Text>
                            <TextInput
                              style={[styles.input, styles.textarea]}
                              multiline
                              numberOfLines={4}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                      
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                      
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, text);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                            />
                          </View>
                        );
                      }
                      
                      else if (   columnName[0] === "c" &&
                      columnName[1] === "n" &&
                      columnName[2] === "p" &&
                      columnName[3] === "j") {
                       
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "99.999.999/9999-99 ",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, text);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      }
                      else if (
                        columnName.startsWith("data")
                      ) {
                        const toggleCalendar = (key, isOpen) => {
                          setShowCalendarState((prevState) => ({
                            ...prevState,
                            [key]: isOpen,
                          }));
                        };
                      
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <View style={styles.row}>
                              <TextInputMask
                                type={"datetime"}
                                options={{
                                  format: "YYYY/MM/DD",
                                }}
                                value={value}
                                onChangeText={(text) => {
                                  setInlineFields((prevFields) => {
                                    const updatedFieldSet = [...prevFields[label]];
                                    updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                      field.columnName === columnName ? { ...field, value: text } : field
                                    );
                      
                                    setFormData((prevData) => ({
                                      ...prevData,
                                      [label]: updatedFieldSet,
                                    }));
                      
                                    if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                      funcaoChamada[columnName](tableName, columnName, text);
                                    }
                                    return { ...prevFields, [label]: updatedFieldSet };
                                  });
                                }}
                                style={[styles.input, { flex: 1 }]}
                                placeholder={labelModificada}
                              />
                              <TouchableOpacity
                                onPress={() => toggleCalendar(columnName, true)}
                                style={styles.calendarButton}
                              >
                                <Text style={styles.calendarButtonText}>📅</Text>
                              </TouchableOpacity>
                            </View>
                      
                            {showCalendarState[columnName] && (
                              <DateTimePicker
                                value={
                                  value ? new Date(value) : new Date()
                                }
                                mode="date"
                                display="calendar"
                                onChange={(event, selectedDate) => {
                                  toggleCalendar(columnName, false);
                                  if (selectedDate) {
                                    const formattedDate = selectedDate.toISOString().split("T")[0];
                                    setInlineFields((prevFields) => {
                                      const updatedFieldSet = [...prevFields[label]];
                                      updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                        field.columnName === columnName ? { ...field, value: formattedDate } : field
                                      );
                      
                                      setFormData((prevData) => ({
                                        ...prevData,
                                        [label]: updatedFieldSet,
                                      }));
                      
                                      if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                        funcaoChamada[columnName](tableName, columnName, formattedDate);
                                      }
                                      return { ...prevFields, [label]: updatedFieldSet };
                                    });
                                  }
                                }}
                              />
                            )}
                          </View>
                        );
                      }
                      
                      else if (columnName.startsWith("radio")) {
                        const dynamicOptions = radioOptions[columnName] || [];
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            {dynamicOptions.map((option) => (
                              <View key={option.value} style={styles.radioContainer}>
                                <RadioButton
                                  value={option.value}
                                  status={value === option.value ? "checked" : "unchecked"}
                                  onPress={() => {
                                    setInlineFields((prevFields) => {
                                      const updatedFieldSet = [...prevFields[label]];
                                      updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                        field.columnName === columnName ? { ...field, value: option.value } : field
                                      );
                      
                                      setFormData((prevData) => ({
                                        ...prevData,
                                        [label]: updatedFieldSet,
                                      }));
                      
                                      if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                        funcaoChamada[columnName](tableName, columnName, option.value);
                                      }
                                      return { ...prevFields, [label]: updatedFieldSet };
                                    });
                                  }}
                                />
                                <Text style={styles.radioLabel}>{option.label}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      
                       else if (columnName === "telefone") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "(99) 99999-9999",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, text);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      }
                       else if (
                        columnName[0] == "v" &&
                        columnName[1] == "a" &&
                        columnName[2] == "l" &&
                        columnName[3] == "o" &&
                        columnName[4] == "r" ||
                        columnName[0] == "p" && columnName[1] == "r" && columnName[2] == "e" && columnName[3] == "c" && columnName[4] == "o" 
                      ) {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"money"}
                              options={{
                                precision: 2,
                                separator: ".",
                                delimiter: "",
                                unit: "",
                                suffixUnit: "",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, text);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      } else if (columnName[0] == "a" && columnName[1] == "n" && columnName[2] == "o") {
                        return (
                          <View key={columnName} style={styles.fieldContainer}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <TextInputMask
                              type={"custom"}
                              options={{
                                mask: "9999",
                              }}
                              value={value}
                              onChangeText={(text) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: text } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, text);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                              style={styles.input}
                              placeholder={labelModificada}
                            />
                          </View>
                        );
                      }
                      
                      // Caso default (não é nenhum dos casos específicos)
                      return (
                        <View key={columnName} style={styles.fieldContainer}>
                          <Text style={styles.label}>{labelModificada}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder={labelModificada}
                            value={value}
                            onChangeText={(text) => {
                              setInlineFields((prevFields) => {
                                const updatedFieldSet = [...prevFields[label]];
                                updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                  field.columnName === columnName ? { ...field, value: text } : field
                                );
                    
                                setFormData((prevData) => ({
                                  ...prevData,
                                  [label]: updatedFieldSet,
                                }));
                    
                                if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                  funcaoChamada[columnName](tableName, columnName, text);
                                }
                                return { ...prevFields, [label]: updatedFieldSet };
                              });
                            }}
                          />
                        </View>
                      );
                    }
                    else if (type === "number"){
                      return (
                        <View key={columnName} style={styles.fieldContainer}>
                          <Text style={styles.label}>{labelModificada}</Text>
                          <TextInputMask
                            type={"only-numbers"}
                            value={value}
                            onChangeText={(text) => {
                              setInlineFields((prevFields) => {
                                const updatedFieldSet = [...prevFields[label]];
                                updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                  field.columnName === columnName ? { ...field, value: text } : field
                                );
                    
                                setFormData((prevData) => ({
                                  ...prevData,
                                  [label]: updatedFieldSet,
                                }));
                    
                                if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                  funcaoChamada[columnName](tableName, columnName, text);
                                }
                                return { ...prevFields, [label]: updatedFieldSet };
                              });
                            }}
                            style={styles.input}
                            placeholder={labelModificada}
                          />
                        </View>
                      );}
                      else if (type === "picker") {
                        // Função para atualizar o estado de abertura do dropdown usando a chave única
                        const handlePickerOpen = (key, isOpen) => {
                          setPickerOpenState((prevState) => ({
                            ...prevState,
                            [key]: isOpen,
                          }));
                          // Atualiza o estado global verificando se algum dropdown está aberto
                          setIsAnyPickerOpen(
                            Object.values({ ...isPickerOpenState, [key]: isOpen }).some(Boolean)
                          );
                        };
          
                        return (
                          <View key={uniqueKey} style={[styles.fieldContainer, { zIndex: isPickerOpenState[uniqueKey] ? 1000 : 1, position: 'relative' }]}>
                            <Text style={styles.label}>{labelModificada}</Text>
                            <DropDownPicker
                              open={isPickerOpenState[uniqueKey] || false}
                              setOpen={(isOpen) => handlePickerOpen(uniqueKey, isOpen)}
                              value={value}
                              setValue={(callback) => {
                                const newValue =
                                  typeof callback === "function" ? callback(value) : callback;
                                
                                // Aplicando lógica de inlineFields
                                setInlineFields((prevFields) => {
                                  const updatedFields = { ...prevFields };
                                  const fieldGroup = updatedFields[tableName] || [];
                
                                  fieldGroup[index] = fieldGroup[index].map((field) =>
                                    field.columnName === columnName
                                      ? { ...field, value: newValue }
                                      : field
                                  );
                
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [tableName]: fieldGroup,
                                  }));
                
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, newValue);
                                  }
                                  return updatedFields;
                                });
                              }}
                              items={options.map((option) => ({
                                label: option.label,
                                value: option.value,
                              }))}
                              searchable={true}
                              placeholder="Selecione uma opção"
                              searchPlaceholder="Buscar..."
                              style={styles.picker}
                              dropDownContainerStyle={[
                                styles.dropDownContainer,
                                { zIndex: 1000, maxHeight: 200, position: 'absolute' },
                              ]}
                              nestedScrollEnabled={true}
                              scrollViewProps={{
                                nestedScrollEnabled: true,
                              }}
                              listMode="SCROLLVIEW"
                            />
                          </View>
                        );
                      }        
                      
                    else if (type === 'checkbox'){               
                      return (
                        <View key={columnName} style={styles.checkboxContainer}>
                        <Text style={styles.checkboxLabel}>{labelModificada}</Text>
                        <Switch
                          value={value}
                                                    onValueChange={(newValue) => handleInputChange(tableName, columnName, newValue)}
                          trackColor={{ false: '#767577', true: '#81b0ff' }}
                          thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
                        />
</View>
                      );}
                    else if (type === "camera") {
                      return (
                        <View key={columnName} style={styles.fieldContainer}>
                          <Text style={styles.label}>{labelModificada}</Text>
                          <TouchableOpacity
                            style={styles.cameraButton}
                            onPress={() => setShowCamera(true)} 
                          >
                            <Text style={styles.cameraButtonText}>Abrir câmera</Text>
                          </TouchableOpacity>
                          {value ? (
                            <Image source={{ uri: value }} style={styles.previewImage} />
                          ) : (
                            <Text style={styles.noPhotoText}>Nenhuma foto capturada</Text>
                          )}
                          {showCamera && (
                            <CameraPhotoComponent
                              onPhotoTaken={(photoUri) => {
                                setInlineFields((prevFields) => {
                                  const updatedFieldSet = [...prevFields[label]];
                                  updatedFieldSet[index] = updatedFieldSet[index].map((field) =>
                                    field.columnName === columnName ? { ...field, value: photoUri } : field
                                  );
                    
                                  setFormData((prevData) => ({
                                    ...prevData,
                                    [label]: updatedFieldSet,
                                  }));
                    
                                  setShowCamera(false); 
                                  if (funcaoChamada && typeof funcaoChamada[columnName] === "function") {
                                    funcaoChamada[columnName](tableName, columnName, photoUri);
                                  }
                                  return { ...prevFields, [label]: updatedFieldSet };
                                });
                              }}
                            />
                          )}
                        </View>
                      );
                    }                
                    return null;
                  })}

<View style={styles.inlineActions}>
                 <TouchableOpacity
    onPress={() => handleRemoveInlineField(label, index)}
    style={styles.removeButton}
    activeOpacity={0.7}
  >
    <Icon name="delete" size={20} color="white" />
  </TouchableOpacity>
  </View>
                </View >
              ))}
              <View style={styles.inlineActions}>
              <TouchableOpacity
    onPress={() => {
      const inlineSubFields = campos.find((field) => field[0] === "inline" && field[1] === label)?.[2] || [];
      handleAddInlineField(label, inlineSubFields);
    }}
    style={styles.addButton}
    activeOpacity={0.7}
  >
    <Icon name="add" size={20} color="white" />
  </TouchableOpacity>
        </View>
            </View>
          );
    default:
      return null;
  }
};

  const limparCamposVaziosSemInline = (dados) => {
    const dadosLimpos = {};
    for (const tabela in dados) {
      if (dados[tabela]) {
        for (const campo in dados[tabela]) {
          if (dados[tabela][campo].trim() !== "") {
            dadosLimpos[campo] = dados[tabela][campo]; // Exclui a tabela, mantém o campo
          }
        }
      }
    }
    return dadosLimpos;
  };
  
  const limparCamposVaziosComInline = (formData) => {
    const cleanedData = {};
  
    Object.keys(formData).forEach((tableName) => {
      const tableData = formData[tableName];   
      // Verifica se é uma tabela inline (array de arrays)
      if (Array.isArray(tableData) && Array.isArray(tableData[0])) {
        cleanedData[tableName] = tableData.map((inlineRow) => {
          // Converte cada linha inline para JSON simples, ignorando campos vazios
          const cleanedRow = {};
          inlineRow.forEach(({ columnName, value }) => {
            if (value !== "") {
              cleanedRow[columnName] = value;
            }
          });
          return cleanedRow; // Retorna o JSON para a linha
        }).filter((row) => Object.keys(row).length > 0); // Remove linhas totalmente vazias
      } else {
        // Para tabelas não inline
        const cleanedRow = {};
        Object.entries(tableData).forEach(([key, value]) => {
          if (value !== "") {
            cleanedRow[key] = value;
          }
        });
        cleanedData[tableName] = cleanedRow;
      }
    });
  
    return cleanedData;
  };
  const confirmarSalvar = async () => {
    setModalVisible(false);
    console.log("jsonEnviado", jsonEnviado);
  
    if(isConnected == false ){ // Para API externa

      if(TipoSub == "CRIAR"){
        const removerPalavrasChaves = (obj, words) => {
          if (Array.isArray(obj)) {
            // Se o objeto atual for um array, iterar por seus elementos
            obj.forEach((item) => removerPalavrasChaves(item, words));
          } else if (typeof obj === 'object' && obj !== null) {
            // Se for um objeto, iterar por suas chaves
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                let newKey = key;
        
                // Remover palavras-chave da chave atual
                words.forEach((word) => {
                  newKey = newKey.replace(word, '');
                });
        
                if (newKey !== key) {
                  // Atualizar chave se ela foi modificada
                  obj[newKey] = obj[key];
                  delete obj[key];
                }
        
                // Recursão para o valor associado à chave
                removerPalavrasChaves(obj[newKey], words);
              }
            }
          }
        };
        // Define the list of keywords to be removed from object keys.
        // Currently, no keywords are specified, so the array is empty.
        const palavrasChaves = [];
      removerPalavrasChaves(jsonEnviado, palavrasChaves); 
      const databaseNameForApi = removeDbExtension(database); // 'database' é a prop principal
      console.log('jsonenviado', jsonEnviado);
       const resultadoSalvar  = await create(databaseNameForApi, tabelas[0], jsonEnviado);
       console.log("resultadoSalvar", resultadoSalvar); 
       if (resultadoSalvar != null) {
          console.log("Dados salvos no Postgre!");
          Alert.alert(
              "Sucesso!", // Título do alerta
              "Dados salvos com sucesso no banco de dados.", // Mensagem do alerta
              [
                  {
                      text: "OK", // Texto do botão
                      onPress: () => {
                          reset(); // Função a ser executada ao pressionar OK
                          console.log("Reset realizado após salvar os dados.");
                      },
                      style: "default", // Estilo do botão (pode ser "default", "cancel" ou "destructive")
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      } else {
          Alert.alert(
              "Erro", // Título do alerta
              "Ocorreu um erro ao salvar os dados. Por favor, tente novamente.", // Mensagem do alerta
              [
                  {
                      text: "Tentar novamente", // Texto do botão
                      onPress: () => {
                          console.log("Tentando salvar os dados novamente...");
                          // Aqui você pode adicionar a lógica para tentar salvar novamente
                      },
                  },
                  {
                      text: "Cancelar", // Texto do botão
                      onPress: () => console.log("Operação cancelada pelo usuário."),
                      style: "cancel", // Estilo do botão
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      }
      }else if (TipoSub == "EDITAR"){
        const databaseNameForApi = removeDbExtension(database); // 'database' é a prop principal
        console.log("corpo da requisição: ",)
        console.log("databaseNameForApi", databaseNameForApi);
        console.log("tabelas[0]", tabelas[0]);
        console.log("initialData", initialData);
        console.log("jsonEnviado", jsonEnviado);
        await update(databaseNameForApi, tabelas[0], initialData ,jsonEnviado); // 
        if(resultadoSalvar != null){  
        Alert.alert(
              "Sucesso!", // Título do alerta
              "Dados Editados com sucesso no banco de dados.", // Mensagem do alerta
              [
                  {
                      text: "OK", // Texto do botão
                      onPress: () => {
                          reset(); // Função a ser executada ao pressionar OK
                          console.log("Reset realizado após salvar os dados.");
                      },
                      style: "default", // Estilo do botão (pode ser "default", "cancel" ou "destructive")
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      } else {
          Alert.alert(
              "Erro", // Título do alerta
              "Ocorreu um erro ao editar os dados. Por favor, tente novamente.", // Mensagem do alerta
              [
                  {
                      text: "Tentar novamente", // Texto do botão
                      onPress: () => {
                          console.log("Tentando salvar os dados novamente...");
                          // Aqui você pode adicionar a lógica para tentar salvar novamente
                      },
                  },
                  {
                      text: "Cancelar", // Texto do botão
                      onPress: () => console.log("Operação cancelada pelo usuário."),
                      style: "cancel", // Estilo do botão
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      
      }   }
    }
  else{
    if(TipoSub == "CRIAR" ){
      
      if(inl == false){

        const resultadoSalvar = await sqlite.insert(database, tabelas[0], jsonEnviado); // SQLite usa 'database' (prop principal)
       const dadosql = await sqlite.getRecords(database, tabelas[0], 0);
        
          //  if(resultadoSalvar){
          //   console.log("Dados salvos no sqlite!");
          //   reset();
          // }
          
       }  else{
    
       const resultadoSalvar = await sqlite.insert(database, tabelas[0], jsonEnviado);
       const dadosql = await sqlite.getRecords(database, tabelas[0], 0);
      //  const dadosqll = await sqlite.getRecords(database, "CarrosVisitacao", 0);
      //  console.log("dadoss na tabela VeiculoMotorista: ", dadosqll);
           
            if (resultadoSalvar) {
              console.log("Dados salvos no sqlite!");
              Alert.alert(
                  "Sucesso!", // Título do alerta
                  "Dados salvos com sucesso no banco de dados.", // Mensagem do alerta
                  [
                      {
                          text: "OK", // Texto do botão
                          onPress: () => {
                              reset(); // Função a ser executada ao pressionar OK
                              console.log("Reset realizado após salvar os dados.");
                          },
                          style: "default", // Estilo do botão (pode ser "default", "cancel" ou "destructive")
                      },
                  ],
                  { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
              );
          } else {
              Alert.alert(
                  "Erro", // Título do alerta
                  "Ocorreu um erro ao salvar os dados. Por favor, tente novamente.", // Mensagem do alerta
                  [
                      {
                          text: "Tentar novamente", // Texto do botão
                          onPress: () => {
                              console.log("Tentando salvar os dados novamente...");
                              // Aqui você pode adicionar a lógica para tentar salvar novamente
                          },
                      },
                      {
                          text: "Cancelar", // Texto do botão
                          onPress: () => console.log("Operação cancelada pelo usuário."),
                          style: "cancel", // Estilo do botão
                      },
                  ],
                  { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
              );
          }
       };
       }
       
     else if (TipoSub == "EDITAR"){
      const nometb = tabelas[0];
      const novoJson = {
        [database]:{
        [nometb]:[
          jsonEnviado
      ]}}

       if(inl == false){
         const resultadoEditar = await sqlite.editRecords(novoJson);
         if (resultadoEditar != null) {
          console.log("Dados salvos no sqlite!");

          Alert.alert(
              "Sucesso!", // Título do alerta
              "Dados salvos com sucesso no banco de dados.", // Mensagem do alerta
              [
                  {
                      text: "OK", // Texto do botão
                      onPress: () => {
                          reset(); // Função a ser executada ao pressionar OK
                          console.log("Reset realizado após salvar os dados.");
                      },
                      style: "default", // Estilo do botão (pode ser "default", "cancel" ou "destructive")
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      } else {
        
          Alert.alert(
              "Erro", // Título do alerta
              "Ocorreu um erro ao salvar os dados. Por favor, tente novamente.", // Mensagem do alerta
              [
                  {
                      text: "Tentar novamente", // Texto do botão
                      onPress: () => {
                          console.log("Tentando salvar os dados novamente...");
                          // Aqui você pode adicionar a lógica para tentar salvar novamente
                      },
                  },
                  {
                      text: "Cancelar", // Texto do botão
                      onPress: () => console.log("Operação cancelada pelo usuário."),
                      style: "cancel", // Estilo do botão
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      }
       }else{
         const resultadoEditar = await sqlite.editRecords(novoJson);
         if (resultadoEditar != null || resultadoEditar == undefined) {
          console.log("Dados salvos no sqlite!");

          Alert.alert(
              "Sucesso!", // Título do alerta
              "Dados salvos com sucesso no banco de dados.", // Mensagem do alerta
              [
                  {
                      text: "OK", // Texto do botão
                      onPress: () => {
                          reset(); // Função a ser executada ao pressionar OK
                          console.log("Reset realizado após salvar os dados.");
                      },
                      style: "default", // Estilo do botão (pode ser "default", "cancel" ou "destructive")
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      } else {
        
          Alert.alert(
              "Erro", // Título do alerta
              "Ocorreu um erro ao salvar os dados. Por favor, tente novamente.", // Mensagem do alerta
              [
                  {
                      text: "Tentar novamente", // Texto do botão
                      onPress: () => {
                          console.log("Tentando salvar os dados novamente...");
                          // Aqui você pode adicionar a lógica para tentar salvar novamente
                      },
                  },
                  {
                      text: "Cancelar", // Texto do botão
                      onPress: () => console.log("Operação cancelada pelo usuário."),
                      style: "cancel", // Estilo do botão
                  },
              ],
              { cancelable: false } // Impede que o alerta seja fechado ao tocar fora dele
          );
      }
       } 
     }
  }
  if (funcaoChamadaSalvar && typeof funcaoChamadaSalvar === "function") {
    funcaoChamadaSalvar(jsonEnviado);
  }
  return true;
  };

  function atualizarJsonDinamico(jsonOriginal, referencias) {
    // Cria uma cópia do JSON original
    const jsonAtualizado = { ...jsonOriginal };
  
    // Itera sobre as chaves do JSON original
    for (const chave in jsonOriginal) {
      const valor = jsonOriginal[chave];
  
      // Verifica se o valor é um array
      if (Array.isArray(valor)) {
        jsonAtualizado[chave] = valor.map((item) => {
          if (typeof item === "object" && item !== null) {
            // Atualiza os campos dentro do objeto no array
            const itemAtualizado = { ...item };
            for (const subChave in item) {
              if (referencias[subChave]) {
                const referencia = referencias[subChave].find(
                  (ref) => ref.value === item[subChave]
                );
                if (referencia) {
                  itemAtualizado[subChave] = referencia.label;
                }
              }
            }
            return itemAtualizado;
          }
          return item; // Se não for objeto, retorna o valor original
        });
      }
      // Verifica se o valor é um campo simples com referência
      else if (referencias[chave]) {
        const referencia = referencias[chave].find(
          (ref) => ref.value === valor
        );
        if (referencia) {
          jsonAtualizado[chave] = referencia.label;
        }
      }
    }
  
    return jsonAtualizado;
  }
  const removerChavesNumericas = (data) => {
    if (Array.isArray(data)) {
      // Se for um array, percorre recursivamente, mas não faz nada com as chaves numéricas
      data.forEach((item, index) => {
        data[index] = removerChavesNumericas(item);
      });
    } else if (typeof data === "object" && data !== null) {
      // Se for um objeto, verifica se existem chaves numéricas
      Object.keys(data).forEach((key) => {
        if (!isNaN(key)) {
          // Se a chave for numérica, remove a chave
          delete data[key];
        } else {
          // Se não for numérica, aplica recursivamente
          data[key] = removerChavesNumericas(data[key]);
        }
      });
    }
    return data;
  };
  function removeNullValues(obj) {
    // Cria um novo objeto para armazenar os valores válidos
    if (Array.isArray(obj)) {
        // Filtra listas para manter apenas os valores não nulos (ou não vazios)
        return obj.map(removeNullValues).filter(value => value !== null && value !== undefined);
    } else if (typeof obj === "object" && obj !== null) {
        // Lida com objetos: remove propriedades nulas/indefinidas
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const cleanedValue = removeNullValues(value);
            if (cleanedValue !== null && cleanedValue !== undefined) {
                acc[key] = cleanedValue;
            }
            return acc;
        }, {});
    }
    // Retorna valores primitivos (não nulos ou indefinidos)
    return obj;
}
const processMultiFields = (obj, tabelaMulti) => {
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (key.startsWith("multi_") && Array.isArray(value)) {
      // Remove o prefixo "multi_" para deixar a chave "limpa"
      const newKey = key.replace("multi_", "");
      // Se tabelaMulti estiver definido, usa-o para montar o grupo, caso contrário, usa newKey
      const baseName = tabelaMulti ? tabelaMulti : newKey;
      const groupKey = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      // Transforma cada item do array em um objeto com a nova chave
      result[groupKey] = value.map((val) => ({ [newKey]: String(val) }));
    } else {
      result[key] = value;
    }
  });
  return result;
};
const proximaPagina = async () => {
  if (currentTableIndex < tabelas.length - 1) {
    setCurrentTableIndex(currentTableIndex + 1);
  } else {
    let dadosLimpos = {};
    let jsonFinal = {};

    if (!inl) {
      // Para dados sem inline, apenas limpa e mescla
      dadosLimpos = limparCamposVaziosSemInline(formData);
      Object.keys(dadosLimpos).forEach((chave) => {
        jsonFinal[chave] = dadosLimpos[chave];
      });
      // Agora, processa os campos multi (se houver)
      jsonFinal = processMultiFields(jsonFinal, tabelaMulti);
    } else {
      // Se houver campos inline
      dadosLimpos = limparCamposVaziosComInline(formData);
      console.log("DADOS LIMPOS", dadosLimpos);

      jsonFinal = tabelas.reduce((acc, tabela, index) => {
        if (dadosLimpos[tabela]) {
          if (index === 0) {
            // Tabela principal: mescla os dados mas processa os campos multi
            const processed = processMultiFields(dadosLimpos[tabela], tabelaMulti);
            Object.assign(acc, processed);
          } else {
            // Para tabelas filhas (inline), a lógica já monta um array de objetos
            // Se houver campos multi dentro do inline, você poderá iterar em cada linha
            const rows = dadosLimpos[tabela].map((row) =>
              processMultiFields(row, tabelaMulti)
            );
            acc[`${tabela}_set`] = rows;
          }
        }
        return acc;
      }, {});
    }

    console.log("JSON Gerado:", jsonFinal);
    setJsonEnviado(jsonFinal);

    // Aqui você pode atualizar o JSON (por exemplo, removendo os valores nulos)
    const Jsonatt = atualizarJsonDinamico(jsonFinal, valor);
    const jsonAtualizado = removeNullValues(Jsonatt);
    console.log("JSON Atualizado:", jsonAtualizado);
    abrirModalConfirmacao(jsonAtualizado);
  }
};
  
const voltarPagina = () => {  
  if (currentTableIndex > 0) {
    setCurrentTableIndex(currentTableIndex - 1);
  }
};
const abrirModalConfirmacao = (dados) => {
  setDadosParaConfirmacao(dados);
  setModalVisible(true);
};
return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    
    {abaNavegacao && renderNavigationBar()}
    <Text style={styles.title}>
       {labelsInline[tabelas[currentTableIndex]] || tabelas[currentTableIndex]}
    </Text>
    <FlatList
      data={[{ key: "form" }]} 
      keyExtractor={(item) => item.key}
      renderItem={() => (
        <View style={styles.mainContainer}>
          {visualizacao_form(campos || fields)}
          {currentTableIndex > 0 && (
            <TouchableOpacity
              onPress={voltarPagina}
              style={styles.VoltarSubmitButton}
              disabled={currentTableIndex === 0}
            >
              <Text style={[styles.submitButtonText]}>Voltar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={proximaPagina} style={[styles.submitButton, , ]}>
            <Text style={styles.submitButtonText}>
              {currentTableIndex === tabelas.length - 1 ? "Salvar" : "Próximo"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      scrollEnabled={!isAnyPickerOpen} 
      nestedScrollEnabled={true} 
      keyboardShouldPersistTaps="handled"
    />

<Modal
  visible={modalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Confirmar Dados</Text>
      <ScrollView style={styles.modalBody}>
        {dadosParaConfirmacao ? (
          Object.entries(dadosParaConfirmacao).map(([chave, valor], index) => {
            // Verifica se a chave termina com "_set" e remove o sufixo
            const chaveSemSufixoSet = chave.endsWith("_set")
              ? chave.slice(0, -4)
              : chave;

            // Busca o label amigável ou usa a chave original
            const labelAmigavel = labels[chaveSemSufixoSet] || chave;

            let valorFormatado;

            if (Array.isArray(valor)) {
              // Formatação para arrays
              valorFormatado = valor.map((item, idx) => {
                if (typeof item === "object") {
                  return (
                    <View key={idx} style={styles.inlineGroup}>
                      {Object.entries(item).map(([subChave, subValor], subIdx) => (
                        <Text key={subIdx} style={styles.inlineField}>
                          - {subValor}
                        </Text>
                      ))}
                    </View>
                  );
                } else {
                  return (
                    <Text key={idx} style={styles.inlineField}>
                      - {item}
                    </Text>
                  );
                }
              });
            } else if (typeof valor === "object" && valor !== null) {
              // Formatação para objetos
              valorFormatado = Object.entries(valor).map(([subChave, subValor], idx) => (
                <Text key={idx} style={styles.inlineField}>
                  - {labels[subChave] || subChave}: {subValor}
                </Text>
              ));
            } else {
              // Formatação para strings ou valores simples
              valorFormatado = <Text style={styles.inlineField}>{valor}</Text>;
            }

            
              return (
                <View key={index} style={styles.fieldGroup}>
                  {typeof valor === "string" || typeof valor === "number" ? (
                   <View style={{ width: "100%" }}>
                   <Text style={styles.inlineField}>
                     <Text style={styles.fieldLabel}>{labelAmigavel}: </Text>
                     {valor}
                   </Text>
                 </View>
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>{labelAmigavel}:</Text>
                      {Array.isArray(valorFormatado) ? valorFormatado : <Text>{valorFormatado}</Text>}
                    </>
                  )}
                </View>
              );
              
           
          })
        ) : (
          <Text>Nenhum dado para confirmar</Text>
        )}
      </ScrollView>

      <View style={styles.modalActions}>
        <TouchableOpacity
          onPress={() => setModalVisible(false)}
          style={styles.cancelButton}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmarSalvar}
          style={styles.confirmButton}
        >
          <Text style={styles.buttonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

  </KeyboardAvoidingView>
);
};

const styles =  StyleSheet.create({
  // Barra de Navegação
  navBar: {
    flexDirection: "row",
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    backgroundColor: "#0051ff",
    padding: 1,
    alignItems: 'center', 
  },
  tooltipContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: "#f8d7da",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  tooltipText: {
    color: "#721c24",
    fontSize: 12,
  },
  navItem: {
    padding: 10,
    marginRight: 5,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  exibiContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 5,
  },
 
    // ...existing styles...
    exibiText: {
      fontSize: 16,
      color: '#333',
      fontWeight: 'bold',
    },
    // ...existing styles...
  
  activeNavItem: {
    backgroundColor: "#007bff",
  },
  navText: {
    color: "#fff",
    fontSize: 16,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalBody: {
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  confirmButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },

  // Formulários e Inputs
  formContainer: {
    paddingVertical: 10, 
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  inlineGroup: {
    marginLeft: 10,
    marginTop: 5,
  },
  inlineField: {
    marginLeft: 10,
  },
  
  label: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: "flex-start",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
  },
  textarea: {
    height: 100,
    verticalAlign: "top",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
  },

  // Botões
  submitButton: {
    backgroundColor: "#0051ff",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  VoltarSubmitButton: {
    backgroundColor: "#696969",
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
  
  scanButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  calendarButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarButtonText: {
    fontSize: 18,
    color: "#555",
  },

  // Checkbox e Radio
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    marginRight: 10,
    color: "#333",
  },
  checkboxGroup: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radioLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },

  // Scanner e QR Code
  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorInput: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12 },
  scannerOverlayText: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 10,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 5,
    borderRadius: 8,
  },
  qrCodeValueContainer: {
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "gray",
  },
  qrCodeValueLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  qrCodeValue: {
    fontSize: 16,
    marginTop: 5,
  },

  // Upload de Arquivos
  uploadContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  fileNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  fileNameText: {
    fontSize: 14,
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#ff4d4d',
    padding: 14, // Aumentei o tamanho do botão
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 5, // Aumentei a sombra para destacar mais
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginLeft: 10,
  },
  
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    
  },
  
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  
  imagePreviewContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  imagePreviewItem: {
    marginRight: 10,
    alignItems: "center",
  },
  imagePreview: {
    width: 300,
    height: 300,
    borderRadius: 5,
  },

  // Outros
  errorText: {
    overflowWrap: "break-word",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  picker: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 14,
    paddingLeft: 8,
    marginVertical: 5,
    zIndex: 1000, // Adicione esta linha
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginVertical: 20,
  },

  // inline extra
  // inlineFieldContainer: {
  //   paddingLeft: -50,
  // }
});

export default FormComponent;