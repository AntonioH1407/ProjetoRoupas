import { useEffect } from "react";
import { get, create, update } from "./Api"; // Importe também o update da sua API
import SQLite from "./SQliteComponent"; // Importe o componente SQLite

const tablesToDowload = {
	colabore: ["Tipo", "Area", "Local", "Status", "Questionario", "Questao"],
	maquinas: ["TipoProblema", "Categoria", "Medida", "Instituicao", "Setor",
		"Modelo", "Marca", "Fornecedor", "Combustivel", "Maquina", "Local", 
		"Implemento", "Ferramenta", "Peca", "Servico",
		"ControleFerramentas", "PrecoCombustivel"],
	seguranca: ["Local", "Percurso", "PercursoLocal"],
	// florestas: ["especies", "plantios"],
	transito: ["Cor", "Marca", "Modelo", "CarroVisitacao"],
	florestas: ["Bioma", "Utilizacao", "TipoFruto", "Reino", "Divisao", "Classe", "Ordem", "Familia", "Genero", "Especie",
		"Planta", "LocalPlantio", "Lote", "Funcionario", "QuadraPlantio", "Canteiro", "AreaDaMuda"],
	produtos: ["Fabricante", "Modelo", "Marca", "Produto", "TipoEmbalagem", "DetalheProduto", "SetorSuper", "Setor", "SetorSub", "DetalheProdutoEstoque", "Transacao"],
	solicita: ["TipoServico", "TipoRecurso", "TipoEPI", "Area", "Pessoa", "SuperSetor", "Recurso", "EPI", "Setor", "Talhao", "Produto",
		"Producao", "Servico", "ServicoTipoRecurso", "Etapa", "EtapaServico", "EtapaEPI", "SubSetor", "OrdemServico","OrdemServicoAndamento",
		"OrdemServicoAndamentoPessoa", "Recurso", "EPI", "Setor", "Talhao", "Producao"]
};

const tablesToUpload = {
	maquinas: ["Manutencao", "ManutencaoServico", "ManutencaoPeca", "Abastecimento"],
	colabore: ["Feedback", "Comentario"],
	solicita: ["OrdemServico","ServicoOrdemServico","ServicoOrdemServicoPessoa","OrdemServicoAndamento",
		"RecursoOrdemServico"],
	transito: ["CarroVisitacao"],
	seguranca: ["Ronda", "RelatorioLocal", "Ocorrencia"],
	produtos: ["MovimentacaoProduto", "ProdutoMovimentoItem"],
	florestas: ["Plantio", "PlantioEspecie", "PlantioResponsavel", "PlantioLote", "Talhao", "NomePopular", "NomeAutor", "Cliente",
		"ProducaoSementes", "Semeio", "ResponsavelSemeio", "PlantaDesenvolvimento", "DesenvolvimentoPlanta",
		"AreaDePlenoSol", "FormacaoDeMudaPlanta", "FormacaoDeMudaPessoa", "MudancaLocalDeMuda",
	],
};

// Função para atualizar ou inserir dados no SQLite
const updateOrInsertData = async (app, table, apiData) => {
	try {
		// Obtém todos os registros locais da tabela
		const localRecords = await SQLite.getRecords(app, table); // Suponha que isso retorna todos os registros
		const localIds = localRecords.map(record => record.id); // Extrai os IDs dos registros locais
		const apiIds = apiData.map(record => record.id); // Extrai os IDs dos registros da API

		// Obter o esquema da tabela para filtrar os campos válidos
		const schema = await SQLite.getTableSchema(app, table);
		const validColumns = schema.map(col => col.columnName);

		// Filtrar registros da API para conter apenas campos válidos
		const filteredApiData = apiData.map(record => {
			const filtered = {};
			for (const key in record) {
				if (validColumns.includes(key)) {
					filtered[key] = record[key];
				}
			}
			return filtered;
		});

		// // Identifica os IDs que existem localmente, mas não estão na API
		// const idsToDelete = localIds.filter(id => !apiIds.includes(id));

		// // Formata os IDs para o formato esperado pelo SQLite.deleteRecords
		// const tablesAndIds = idsToDelete.map(id => ({
		// 	tableName: table,
		// 	id: id,
		// }));

		// Itera sobre cada registro retornado pela API
		for (const record of filteredApiData) {
			const { id } = record;

			// Verifica se o registro já existe no SQLite
			const existingRecord = await SQLite.getRecords(app, table, 0, id); // Suponha que você tenha uma função getRecord

			if (existingRecord[0]) {
				// Se existir, atualiza o registro
				// console.log(`Atualizando registro com ID ${id} na tabela ${table} do banco ${app}`);
				const updateJson = {
					[app]: {
						[table]: [record], // Formato esperado pelo SQLite.editRecords
					},
				};
				await SQLite.editRecords(updateJson);
			} else {
				// Se não existir, insere o novo registro
				console.log(`Inserindo novo registro com ID ${id} na tabela ${table} do banco ${app}`);
				await SQLite.insert(app, table, [record]); // Insere o registro no SQLite
			}

			// Exclui os registros que não estão mais na API
			// if (tablesAndIds.length > 0) {
			// 	// console.log(`Excluindo registros com IDs: ${tablesAndIds.map(item => item.id).join(", ")} da tabela ${table} do banco ${app}`);
			// 	await SQLite.deleteRecords(app, tablesAndIds); // Chama o método deleteRecords com o formato correto
			// }
		}
	} catch (error) {
		console.log(`Erro ao processar dados para ${app}.${table}:`, error);
	}
};

// Função para extrair o nome do app a partir da tela atual
function getAppKeyFromScreen(screen) {
	if (!screen || typeof screen !== 'string') return null;
	if (screen.startsWith('Home')) {
		return screen.substring(4).toLowerCase();
	}
	return null;
}

// Função para sincronizar apenas um app específico
const syncDownload = async (currentScreen) => {
	try {
		const appKey = getAppKeyFromScreen(currentScreen);
		if (!appKey) return;
		console.log(`Iniciando sincronização de download para o app: ${appKey}`);
		const tables = tablesToDowload[appKey];
		if (!tables) return;
		for (const table of tables) {
			const apiData = await get(appKey, table);
			await updateOrInsertData(`${appKey}.db`, table, apiData);
		}
		console.log(`Sincronização de download concluída para o app: ${appKey}`);
	} catch (error) {
		console.error(`Erro durante a sincronização de download para a tela ${currentScreen}:`, error);
	}
};


const syncUpload = async (currentScreen) => {

  try {
	const appKey = getAppKeyFromScreen(currentScreen);
	if (!appKey) return;
	console.log(`Iniciando sincronização de upload para o app: ${appKey}`);
	await ensureSyncFields(appKey);
	const tables = tablesToUpload[appKey];
	if (!tables) return;
	for (const table of tables) {
	  const allRecords = await SQLite.getRecords(`${appKey}.db`, table);
	  if (allRecords.length > 0) {
		// 1. Upload de registros criados offline (foi_criado === false)
		const newRecords = allRecords.filter(record => (
		  record.hasOwnProperty('foi_criado') && record.foi_criado === 'false'
		));
		// 2. Upload de registros atualizados offline (foi_atualizado === false)
		const updatedRecords = allRecords.filter(record => (
		  record.hasOwnProperty('foi_atualizado') && record.foi_atualizado === 'false'
		));

		// Função para formatar datas
		function formatDateToISO(dateString) {
		  if (!dateString) return null;
		  let [datePart, timePart] = dateString.split(',');
		  if (!timePart && dateString.includes(' ')) {
			[datePart, timePart] = dateString.split(' ');
		  }
		  if (!datePart || !timePart) return null;
		  datePart = datePart.trim().replace(/\//g, '-');
		  timePart = timePart.trim().replace(/(AM|PM|am|pm)/, '').trim();
		  const [day, month, year] = datePart.split('-');
		  if (!day || !month || !year) return null;
		  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
		}

		// Upload de novos registros
		for (const record of newRecords) {
		  try {
			const { id: localId, id_novo, ...payload } = record;
			let nestedPayload = await getNestedRecord(`${appKey}.db`, table, record);
			if (nestedPayload.data_hora_inicio) {
			  const formatted = formatDateToISO(nestedPayload.data_hora_inicio);
			  if (formatted) nestedPayload.data_hora_inicio = formatted;
			}
			if (nestedPayload.data_hora_termino) {
			  const formatted = formatDateToISO(nestedPayload.data_hora_termino);
			  if (formatted) nestedPayload.data_hora_termino = formatted;
			}
			if (nestedPayload.horario_entrada) {
			  const formatted = formatDateToISO(nestedPayload.horario_entrada);
			  if (formatted) nestedPayload.horario_entrada = formatted;
			}
			const { id, foi_criado, foi_atualizado, id_novo: _id_novo, data_hora, data_cadastro, data_atualizacao, ...finalPayload } = nestedPayload;
			const serverResponse = await create(appKey, table, finalPayload);
			const serverId = serverResponse?.id;
			if (serverId && serverId !== localId) {
			  await SQLite.editRecords({ [`${appKey}.db`]: { [table]: [{ id: localId, id_novo: serverId, foi_criado: "True" }] } });
			} else {
			  await SQLite.editRecords({ [`${appKey}.db`]: { [table]: [{ id: localId, foi_criado: "True" }] } });
			}
		  } catch (apiError) {
			console.error(`Erro ao enviar registro criado offline com ID ${record.id} para ${appKey}.${table}:`, apiError);
		  }
		}

		// Upload de registros atualizados offline
		for (const record of updatedRecords) {
		  try {
			const { id: localId, id_novo, ...payload } = record;
			let nestedPayload = await getNestedRecord(`${appKey}.db`, table, record);
			if (nestedPayload.data_hora_inicio) {
			  const formatted = formatDateToISO(nestedPayload.data_hora_inicio);
			  if (formatted) nestedPayload.data_hora_inicio = formatted;
			}
			if (nestedPayload.data_hora_termino) {
			//   const formatted = formatDateToISO(nestedPayload.data_hora_termino);
			//   if (formatted) nestedPayload.data_hora_termino = formatted;
			console.log("nestedPayload.data_hora_termino:", nestedPayload.data_hora_termino);
			}
			if (nestedPayload.horario_entrada) {
			  const formatted = formatDateToISO(nestedPayload.horario_entrada);
			  if (formatted) nestedPayload.horario_entrada = formatted;
			}
			if (nestedPayload.dh_fim) {
			  const formatted = formatDateToISO(nestedPayload.dh_fim);
			  if (formatted) nestedPayload.dh_fim = formatted;
			}
			if (nestedPayload.dh_inicio) {
			  const formatted = formatDateToISO(nestedPayload.dh_inicio);
			  if (formatted) nestedPayload.dh_inicio = formatted;
			}
			const { id, foi_criado, foi_atualizado, id_novo: _id_novo, data_hora, data_cadastro, data_atualizacao, ...finalPayload } = nestedPayload;
			console.log('id ou id_novo:', id, id_novo);
			// Para update, precisa do id_novo (id do servidor)
			const serverId = id_novo || id;
			if (!serverId) {
			  console.warn(`Registro atualizado offline sem id_novo/id: ${JSON.stringify(record)}`);
			  continue;
			}
			console.log('Enviando registro atualizado offline:')
			// Chama a API de update (pode ser PUT/PATCH, depende da sua API)
			console.log(`Enviando registro atualizado para ${appKey}.${table} com ID ${serverId}`, finalPayload);
			await update(appKey, table, serverId, finalPayload);
		  } catch (apiError) {
			console.error(`Erro ao enviar registro atualizado offline com ID ${record.id} para ${appKey}.${table}:`, apiError);
		  }
		}
	  }
	}
	console.log(`Sincronização de upload concluída para o app: ${appKey}`);
  } catch (error) {
	console.log(`Erro durante a sincronização de upload para a tela ${currentScreen}:`, error);
  }
};

// Garante os campos de sincronização (foi_criado, foi_atualizado, id_novo)
const ensureSyncFields = async (appKey = null) => {
  try {
	if (appKey) {
	  const tables = tablesToUpload[appKey];
	  if (!tables) return;
	  const db = `${appKey}.db`;
	  const tablesAndFields = tables.map((table) => ({
		tableName: table,
		newFields: [
		  {
			name: "foi_criado",
			type: "TEXT",
			nullable: true,
		  },
		  {
			name: "foi_atualizado",
			type: "TEXT",
			nullable: true,
		  },
		  {
			name: "id_novo",
			type: "INTEGER",
			nullable: true,
		  },
		],
	  }));
	  await SQLite.editTables([db], tablesAndFields);
	}
  } catch (error) {
	console.error("Erro ao garantir os campos de sincronização:", error);
  }
};

const getNestedRecord = async (db, table, record) => {
	const schema = await SQLite.getTableSchema(db, table);
	const result = { ...record };

	const foreignKeyFields = schema.filter(col => col.isForeignKey);
	const schemaColumns = schema.map(col => col.columnName);

	// 1. Processar relacionamentos One-to-Many / Many-to-One (chaves estrangeiras)
	for (const column of foreignKeyFields) {
		const { table: relatedTable, column: relatedColumn } = column.relationship;

		if (record[column.columnName]) {
			// ✅ Definir relatedId com base no valor do campo da tabela atual
			const relatedId = record[column.columnName];

			// Buscar todos os registros da tabela relacionada (não suporta filtro avançado)
			const relatedRecords = await SQLite.getRecords(db, relatedTable);

			// ✅ Buscar registro relacionado por id ou id_novo
			const filtered = relatedRecords.find(r =>
				r.id === relatedId || r.id_novo === relatedId
			);

			// ✅ Verificar se encontrou o registro antes de acessar [0]
			if (filtered) {
				// Usar id_novo se disponível, senão usar id
				const finalId = filtered.id_novo !== null && filtered.id_novo !== undefined
					? filtered.id_novo
					: filtered.id;

				// Atribuir apenas o valor do ID, não o objeto completo
				result[column.columnName] = finalId;
			}
		}
	}

	// 2. Processar relacionamentos Many-to-Many
	for (const key in record) {
		if (!schemaColumns.includes(key)) {
			const relatedTableName = key.charAt(0).toUpperCase() + key.slice(1);
			const relatedRecords = record[key];

			if (Array.isArray(relatedRecords)) {
				result[key] = relatedRecords.map(item => {
					const { id_novo, id } = item;

					// 🔄 Usar id_novo se disponível
					return id_novo !== null && id_novo !== undefined ? id_novo : id;
				});
			}
		}
	}

	// 3. Substituir `id` pelo `id_novo` se disponível
	if (record.id_novo !== null && record.id_novo !== undefined) {
		result.id = record.id_novo;
	}

	return result;
};

// const updateRelatedTables = async (app, tableName, oldId, newId) => {
// 	const db = `${app}.db`;
// 	const tables = await SQLite.getTables([db]); // Lista todas as tabelas do banco

// 	for (const tableObj of tables) {
// 		for (const table of tableObj.tables) {
// 			const schema = await SQLite.getTableSchema(db, table);

// 			for (const column of schema) {
// 				if (column.isForeignKey && column.relationship?.table === tableName) {
// 					const fkColumn = column.columnName;

// 					// Buscar todos os registros que referenciam o oldId
// 					const relatedRecords = await SQLite.getRecords(db, table);
// 					const filteredRecords = relatedRecords.filter(r => r[fkColumn] === oldId);

// 					if (filteredRecords.length > 0) {
// 						console.log(`Atualizando ${relatedRecords.length} registros na tabela ${table} que referenciam ${tableName}#${oldId}`);

// 						// Atualizar cada registro com o novo ID
// 						const updateJson = {
// 							[db]: {
// 								[table]: relatedRecords.map(record => ({
// 									id: record.id,
// 									[fkColumn]: newId,
// 								})),
// 							},
// 						};

// 						await SQLite.editRecords(updateJson);
// 					}
// 				}
// 			}
// 		}
// 	}
// };

// Hook de sincronização automática, agora recebendo a tela atual
const useSync = (currentScreen = null) => {
	useEffect(() => {
		let intervalD;
		let intervalU;
		const startSync = () => {
			intervalU = setInterval(() => {
				if (currentScreen && currentScreen !== "Home") {
					syncUpload(currentScreen);
				}
			}, 15 * 60 * 1000);
			intervalD = setInterval(() => {
				if (currentScreen && currentScreen !== "Home") {
					syncDownload(currentScreen);
				}
			}, 15 * 60 * 1000);
		};
		startSync();
		return () => {
			clearInterval(intervalU);
			clearInterval(intervalD);
		};
	}, [currentScreen]);
};

export default useSync;
export { syncDownload, syncUpload };