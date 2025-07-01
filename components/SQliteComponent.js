import * as SQLite from "expo-sqlite";
import { Alert } from "react-native";

// Função para abrir o banco de dados
const openDatabase = async (databaseName) => {
    try {
        const db = await SQLite.openDatabaseAsync(databaseName);

        // Enable foreign key constraints
        await db.execAsync("PRAGMA foreign_keys = ON;");

        return db;
    } catch (error) {
        console.error("Erro ao abrir o banco de dados:", error);
        Alert.alert("Erro", "Operação falhou, feche e abra o aplicativo novamente");
        return false;
    }
};

// Função para registrar logs de operações no banco
const logDatabaseOperation = (operation, query, params = []) => {
    // console.log(`[${operation}] Query: ${query} | Parâmetros: ${params}`);
};

// Função para criar ou atualizar uma tabela
const createTable = async (databaseName, tableName, columns) => {
    try {
        db = await openDatabase(databaseName);
        if (!db) return false;

        const columnDefinitions = columns.map((column) => {
            let columnDef = `${column.name} ${column.type}`;
            if (column.primaryKey) {
                columnDef += " PRIMARY KEY";
                if (column.autoIncrement) {
                    columnDef += " AUTOINCREMENT";
                }
            }
            if (column.unique) {
                columnDef += " UNIQUE";
            }
            if (column.notNull) {
                columnDef += " NOT NULL";
            }
            if (column.defaultValue !== undefined) {
                columnDef += ` DEFAULT ${column.defaultValue}`;
            }
            if (column.foreignKey) {
                const onDeleteAction =
                    column.foreignKey.on_delete || "NO ACTION";
                columnDef += ` REFERENCES ${column.foreignKey.table}(${column.foreignKey.column
                    }) ON DELETE ${onDeleteAction.toUpperCase()}`;
                if (column.foreignKey.onDelete) {
                    columnDef += ` ON DELETE ${column.foreignKey.onDelete}`;
                }
            }
            return columnDef;
        });

        const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions.join(
            ", "
        )})`;

        console.log(`Criando tabela: ${query}`);
        await db.runAsync(query);
        console.log(
            `Tabela '${tableName}' criada com sucesso no banco de dados '${databaseName}'.`
        );
        return true;
    } catch (error) {
        console.error(
            `Erro ao criar a tabela '${tableName}' no banco de dados '${databaseName}':`,
            error
        );
        Alert.alert("Erro", "Operação falhou, feche e abra o aplicativo novamente");
        return false;
    }
};

// Função para excluir tabelas de múltiplos bancos de dados
const deleteTables = async (databaseNames, tableNames) => {
    for (let databaseName of databaseNames) {

        let db;
        db = await openDatabase(databaseName);

        const tables = await getTables([databaseName], "");
        console.log(`Tabelas encontradas no banco '${databaseName}':`, tables);

        if (tables.length != 0) {
            let remainingTables = tableNames.includes("__all__")
                ? tables[0].tables
                : [...tableNames];

            let attempts = 0;

            while (remainingTables.length > 0) {
                console.log(
                    `Tentativa ${attempts + 1}: Tabelas restantes -`,
                    remainingTables
                );

                for (let i = remainingTables.length - 1; i >= 0; i--) {
                    const tableName = remainingTables[i];
                    const query = `DROP TABLE IF EXISTS ${tableName}`;

                    try {
                        await db.runAsync(query);
                        console.log(
                            `Tabela '${tableName}' excluída com sucesso.`
                        );
                        remainingTables.splice(i, 1); // Remove a tabela excluída do array
                    } catch (error) {
                        console.warn(
                            `Erro ao excluir a tabela '${tableName}':`,
                            error
                        );
                    }
                }

                attempts++;

                if (
                    remainingTables.length === 1 &&
                    remainingTables[0] == "sqlite_sequence"
                ) {
                    console.log("tabela ", remainingTables[0]);
                    break;
                } else if (attempts > tableNames.length) {
                    console.error(
                        "Loop detectado! Algumas tabelas podem não ser removidas devido a restrições de chave estrangeira."
                    );
                    break;
                }
            }

            console.log(
                `Processo de deleção concluído para o banco '${databaseName}'.`
            );
        }
    }
};

// Função para editar ou criar tabelas em múltiplos bancos de dados
const editTables = async (databaseNames, tablesAndFields) => {
    try {
        let db;
        for (let databaseName of databaseNames) {
            db = await openDatabase(databaseName);
            if (!db) return false;

            console.log('db', db);

            for (let { tableName, newFields } of tablesAndFields) {
                try {
                    // Verificar se a tabela já existe
                    const checkQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
                    const result = await db.getAllAsync(checkQuery);

                    if (result.length === 0) {
                        // Se a tabela não existir, criamos uma nova tabela
                        console.log(
                            `A tabela '${tableName}' não existe.`
                        );
                    } else {
                        // Se a tabela existir, verificamos as colunas existentes
                        const existingColumns = await getTableSchema(
                            databaseName,
                            tableName,
                        );

                        // Adicionar os campos novos
                        const addColumns = newFields.filter(
                            (field) =>
                                !existingColumns.some(
                                    (col) => col.columnName === field.name
                                )
                        );
                        if (addColumns.length > 0) {
                            for (const col of addColumns) {
                                const addColumnQuery = `ALTER TABLE ${tableName} ADD COLUMN ${col.name
                                    } ${col.type}${col.primaryKey
                                        ? " PRIMARY KEY AUTOINCREMENT"
                                        : ""
                                    }`;
                                await db.runAsync(addColumnQuery);
                                console.log(
                                    `Campo '${col.name}' adicionado à tabela '${tableName}'`
                                );
                            }
                        }

                        // Caso haja necessidade de editar dados mais complexos, como renomear colunas, você pode adicionar lógica extra aqui
                    }
                } catch (error) {
                    console.error(
                        `Erro ao editar ou criar a tabela '${tableName}' no banco '${databaseName}':`,
                        error
                    );
                    return false;
                }
            }
        }
        return true;
    } catch (error) {
        console.error("Erro ao editar tabelas:", error);
        return false;
    }
};

// Função para obter todas as tabelas de múltiplos bancos de dados
const getTables = async (databaseNames, filter = "") => {
    let db;
    try {
        const tables = [];

        for (let databaseName of databaseNames) {
            db = await openDatabase(databaseName);
            if (!db) return false;

            try {
                // Consultar as tabelas do banco de dados
                const query =
                    "SELECT name FROM sqlite_master WHERE type='table'";
                const result = await db.getAllAsync(query);

                // Filtrar as tabelas com base no filtro (se fornecido)
                const filteredTables = result.filter((table) =>
                    table.name.includes(filter)
                );
                if (filteredTables.length > 0) {
                    tables.push({
                        database: databaseName,
                        tables: filteredTables.map((table) => table.name),
                    });
                }
            } catch (error) {
                console.error(
                    `Erro ao obter tabelas do banco de dados '${databaseName}':`,
                    error
                );
                return false;
            }
        }

        // Exibir as tabelas
        if (tables.length > 0) {
            console.log("Tabelas encontradas:", tables);
        } else {
            console.log("Nenhuma tabela encontrada.");
        }

        return tables;
    } catch (error) {
        console.error(
            `Erro ao obter tabelas do banco de dados '${databaseName}':`,
            error
        );
        return false;
    }
};

const insert = async (databaseName, tableName, records, parentInfo = null) => {
    let db;
    try {
        db = await openDatabase(databaseName);
        if (!db) return false;

        if (!records || records.length === 0) {
            console.log("Nenhum registro para inserir.");
            return false;
        }
        // Desenrolar arrays aninhados até chegar em um elemento que não seja array
        while (Array.isArray(records) && records.length === 1 && Array.isArray(records[0])) {
            records = records[0];
        }
        console.log('records', records);

        // Obter o esquema da tabela
        const schema = await getTableSchema(databaseName, tableName);

        const insertRecord = async (record, parentInfo) => {
            const columns = [];
            const values = [];
            let placeholders = [];
            const childRecords = {};

            for (const key in record) {
                const fieldSchema = schema.find((f) => f.columnName === key);

                if (key.endsWith("_set")) {
                    // Skip properties like 'insumos_servicos_set'
                    childRecords[key] = record[key];
                } else if (fieldSchema && fieldSchema.isForeignKey) {
                    // Se o campo é uma chave estrangeira
                    const relatedTable = fieldSchema.relationship.table;
                    if (typeof record[key] === "object" && record[key] !== null) {
                        // If the value is an object, insert the related record first
                        const relatedRecord = record[key];
                        const relatedRecordId = await insert(databaseName, relatedTable, [relatedRecord], null, false);
                        record[key] = relatedRecordId;
                    }
                    columns.push(key);
                    values.push(record[key]);
                    placeholders.push("?");
                } else {
                    columns.push(key);
                    values.push(record[key]);
                    placeholders.push("?");
                }
            }

            if (parentInfo !== null) {
                const [parentTableName, parentId] = parentInfo;

                // Obter o esquema da tabela atual
                const schema = await getTableSchema(databaseName, tableName);
                // Encontrar a coluna que referencia a tabela pai
                const parentColumn = schema.find(
                    (field) => field.relationship?.table === parentTableName
                )?.columnName;

                if (parentColumn) {
                    columns.push(parentColumn);
                    placeholders.push("?");
                    values.push(parentId);
                }
            }

            const query = `INSERT INTO ${tableName} (${columns.join(
                ", "
            )}) VALUES (${placeholders.join(", ")})`;

            try {
                const result = await db.runAsync(query, values);
                const newRecordId = result.lastInsertRowId;

                for (const childTableName in childRecords) {
                    const childRecordsArray = Array.isArray(
                        childRecords[childTableName]
                    )
                        ? childRecords[childTableName]
                        : [childRecords[childTableName]];
                    const childTable = childTableName.replace("_set", "");

                    for (const childRecord of childRecordsArray) {
                        // Obter o esquema da tabela filha
                        const childSchema = await getTableSchema(databaseName, childTable);

                        // Encontrar o campo de chave estrangeira que referencia a tabela pai
                        const foreignKeyField = childSchema.find(
                            (field) => field.relationship?.table === tableName
                        )?.columnName;

                        if (foreignKeyField) {
                            // Atribuir o ID do registro pai ao campo de chave estrangeira
                            childRecord[foreignKeyField] = newRecordId;

                            // Inserir o registro filho na tabela filha
                            console.log('childRecord', childRecord);
                            await insert(databaseName, childTable, [childRecord]);
                        } else {
                            console.error(`Campo de chave estrangeira não encontrado para a tabela '${childTable}' referenciando '${tableName}'.`);
                        }
                    }
                }

                return newRecordId;
            } catch (error) {
                console.error(
                    `Erro ao inserir o registro na tabela '${tableName}' no banco de dados '${databaseName}':`,
                    error
                );
                return false;
            }
        };

        if (Array.isArray(records)) {
            for (const record of records) {
                await insertRecord(record, parentInfo);
            }
        } else {
            await insertRecord(records, parentInfo);
        }
        return true;
    } catch (error) {
        console.error("Erro ao inserir registros:", error);
        return false;
    }
};

// Função para excluir um registro de uma tabela
const deleteRecords = async (databaseName, tablesAndIds) => {
    try {
        const db = await openDatabase(databaseName);
        if (!db) return false;

        // Validar a entrada
        if (!Array.isArray(tablesAndIds) || tablesAndIds.length === 0) {
            throw new Error(
                "O array de tabelas e IDs é inválido ou está vazio."
            );
        }

        try {
            // Iniciar a transação
            await db.execAsync("BEGIN TRANSACTION");

            // Processar as tabelas na ordem reversa para respeitar hierarquias
            for (let i = tablesAndIds.length - 1; i >= 0; i--) {
                const { tableName, id } = tablesAndIds[i];

                if (!tableName || typeof id === "undefined") {
                    throw new Error("Nome da tabela ou ID inválido.");
                }


                const query = `DELETE FROM ${tableName} WHERE id = ?`;
                logDatabaseOperation?.("DELETE", query, [id]);

                try {
                    await db.runAsync(query, [id]);
                    console.log(
                        `Registro excluído com sucesso da tabela ${tableName} (id = ${id})`
                    );
                } catch (error) {
                    console.error(
                        `Erro ao excluir o registro da tabela ${tableName} (id = ${id}):`,
                        error
                    );
                    throw error;
                }
            }

            // Confirmar a transação
            await db.execAsync("COMMIT");
            console.log("Todos os registros foram excluídos com sucesso!");
            return true;
        } catch (error) {
            // Reverter a transação em caso de erro
            await db.execAsync("ROLLBACK");
            console.error(
                "Erro ao excluir registros com hierarquias. Transação revertida.",
                error
            );
            return false;
        }
    } catch (error) {
        console.error("Erro ao excluir registros:", error);
        return false;
    }
};

const editRecords = async (updateData) => {
    let db;
    try {
        // Iterar sobre os bancos de dados no JSON
        for (const [databaseName, tables] of Object.entries(updateData)) {
            console.log(`Abrindo banco de dados: ${databaseName}`);
            db = await openDatabase(databaseName);
            if (!db) return false;

            // Iterar sobre as tabelas e seus registros
            for (const [tableName, records] of Object.entries(tables)) {
                console.log(`Processando tabela: ${tableName}`);

                // Garantir que os registros sejam um array
                const recordsArray = Array.isArray(records)
                    ? records
                    : [records];

                for (const record of recordsArray) {
                    // Separar campos normais de campos de relação inversa (_set)
                    const { id, ...updateFields } = record;
                    const relatedSets = {};

                    for (const [field, value] of Object.entries(updateFields)) {
                        if (field.endsWith("_set")) {
                            // Campo de relação inversa (_set)
                            relatedSets[field] = value;
                        }
                    }

                    // Remover os campos _set do registro principal
                    Object.keys(relatedSets).forEach(
                        (key) => delete updateFields[key]
                    );

                    // Atualizar a tabela principal
                    if (id) {
                        // Garantir que existem campos para atualizar
                        if (Object.keys(updateFields).length > 0) {
                            const columns = Object.keys(updateFields);
                            const values = Object.values(updateFields);

                            console.log("antes do map", values);

                            // Pré-processar os valores antes de montar a query
                            const processedValues = values.map((value) =>
                                typeof value === "object" &&
                                    value !== null &&
                                    "id" in value
                                    ? value.id
                                    : value
                            );

                            console.log("depois do map", processedValues);

                            const setClause = columns
                                .map((col) => `${col} = ?`)
                                .join(", ");
                            const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
                            const params = [...processedValues, id];

                            console.log(
                                `Executando query: ${query} com valores: ${JSON.stringify(
                                    params
                                )}`
                            );

                            try {
                                const result = await db.runAsync(query, params);
                                console.log(
                                    `Registro com id ${id} atualizado na tabela '${tableName}' do banco '${databaseName}'.`
                                );
                            } catch (error) {
                                console.error(
                                    `Erro ao atualizar o registro com id ${id} na tabela '${tableName}': ${error.message}`
                                );
                                return false;
                            }
                        }
                    } else {
                        console.error(
                            `O campo 'id' é obrigatório para atualizar um registro na tabela '${tableName}'.`
                        );
                        return false;
                    }

                    // Atualizar as tabelas relacionadas (campos _set)
                    for (const [setField, relatedRecords] of Object.entries(
                        relatedSets
                    )) {
                        const relatedTable = setField.replace("_set", "");
                        console.log(
                            `Atualizando registros relacionados na tabela: ${relatedTable}`
                        );

                        // Garantir que os registros relacionados sejam um array
                        const relatedArray = Array.isArray(relatedRecords)
                            ? relatedRecords
                            : [relatedRecords];

                        for (const relatedRecord of relatedArray) {
                            console.log("related", relatedRecord);
                            const { id: relatedId, ...relatedFields } =
                                relatedRecord;
                            console.log(relatedId);
                            console.log(id);

                            if (relatedId) {
                                // Atualizar registro existente na tabela relacionada
                                const columns = Object.keys(relatedFields);
                                const values = Object.values(relatedFields);

                                console.log("antes do map", values);

                                // Pré-processar os valores antes de montar a query
                                const processedValues = values.map((value) =>
                                    typeof value === "object" &&
                                        value !== null &&
                                        "id" in value
                                        ? value.id
                                        : value
                                );

                                console.log("depois do map", processedValues);

                                const setClause = columns
                                    .map((col) => `${col} = ?`)
                                    .join(", ");
                                const query = `UPDATE ${relatedTable} SET ${setClause} WHERE id = ?`;
                                const params = [...processedValues, relatedId];

                                console.log(
                                    `Executando query para tabela relacionada: ${query} com valores: ${JSON.stringify(
                                        params
                                    )}`
                                );

                                try {
                                    const result = await db.runAsync(
                                        query,
                                        params
                                    );
                                    console.log(
                                        `Registro relacionado com id ${relatedId} atualizado na tabela '${relatedTable}'.`
                                    );
                                } catch (error) {
                                    console.error(
                                        `Erro ao atualizar registro relacionado com id ${relatedId} na tabela '${relatedTable}': ${error.message}`
                                    );
                                    return false;
                                }
                            } else {
                                // Inserir novo registro na tabela relacionada
                                const columns = Object.keys(relatedFields);
                                const values = Object.values(relatedFields);

                                // Pré-processar os valores antes de montar a query
                                const processedValues = values.map((value) =>
                                    typeof value === "object" &&
                                        value !== null &&
                                        "id" in value
                                        ? value.id
                                        : value
                                );

                                const placeholders = columns
                                    .map(() => "?")
                                    .join(", ");
                                const query = `INSERT INTO ${relatedTable} (${columns.join(
                                    ", "
                                )}) VALUES (${placeholders})`;
                                const params = [...processedValues];

                                console.log(
                                    `Executando query para inserir registro relacionado: ${query} com valores: ${JSON.stringify(
                                        params
                                    )}`
                                );

                                try {
                                    const result = await db.runAsync(
                                        query,
                                        params
                                    );
                                    console.log(
                                        `Novo registro relacionado inserido na tabela '${relatedTable}'.`
                                    );
                                } catch (error) {
                                    console.error(
                                        `Erro ao inserir novo registro relacionado na tabela '${relatedTable}': ${error.message}`
                                    );
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    } catch (error) {
        console.error("Erro ao editar registros dinamicamente:", error);
        return false;
    }
};

// Recursive helper to resolve foreign keys in an object up to the given depth
const resolveForeignKeys = async (record, db, depth, tableName) => {
    if (depth <= 0) return record;

    // Obter o esquema da tabela atual
    const schema = await getTableSchema(db, tableName);

    for (const key in record) {
        // Verificar se o campo é uma chave estrangeira usando o esquema
        const fieldSchema = schema.find((field) => field.columnName === key && field.isForeignKey);

        if (fieldSchema) {
            const foreignKeyTable = fieldSchema.relationship.table;
            const foreignKeyValue = record[key];

            if (foreignKeyValue != null && typeof foreignKeyValue !== "object") {
                // Consultar o registro relacionado na tabela de referência
                const query = `SELECT * FROM ${foreignKeyTable} WHERE id = ?`;
                const foreignKeyRecord = await db.getAllAsync(query, [foreignKeyValue]);

                if (foreignKeyRecord.length > 0) {
                    // Recursivamente resolver chaves estrangeiras aninhadas com profundidade reduzida
                    record[key] = await resolveForeignKeys(
                        foreignKeyRecord[0],
                        db,
                        depth - 1,
                        foreignKeyTable
                    );
                }
            }
        } else if (typeof record[key] === "object" && record[key] !== null) {
            // Resolve foreign keys in nested objects or arrays
            if (Array.isArray(record[key])) {
                for (let i = 0; i < record[key].length; i++) {
                    record[key][i] = await resolveForeignKeys(
                        record[key][i],
                        db,
                        depth - 1,
                        tableName
                    );
                }
            } else {
                record[key] = await resolveForeignKeys(
                    record[key],
                    db,
                    depth - 1,
                    tableName
                );
            }
        }
    }
    return record;
};

const getRecords = async (databaseName, tableName, depth = 0, id = null) => {
    let db;
    try {
        db = await openDatabase(databaseName);
        if (!db) return false;

        // Não fechar o banco ao chamar getTableSchema internamente
        const schema = await getTableSchema(databaseName, tableName);

        let query = `SELECT * FROM ${tableName}`;
        const params = [];
        if (id !== null) {
            query += ` WHERE id = ?`;
            params.push(id);
        }
        logDatabaseOperation("SELECT", query, params);
        let results = await db.getAllAsync(query, params);

        if (depth > 0) {
            for (const record of results) {
                // Não fechar o banco ao chamar findChildTables internamente
                const childTables = await findChildTables(databaseName, tableName);
                for (const childTable of childTables) {
                    // Não fechar o banco ao chamar getTableSchema internamente
                    const childSchema = await getTableSchema(databaseName, childTable);
                    const foreignKeyColumn = childSchema.find(
                        (field) => field.relationship?.table === tableName
                    )?.columnName;
                    if (foreignKeyColumn) {
                        const childQuery = `SELECT * FROM ${childTable} WHERE ${foreignKeyColumn} = ?`;
                        logDatabaseOperation("SELECT", childQuery, [record.id]);
                        const childRecords = await db.getAllAsync(childQuery, [record.id]);
                        record[`${childTable}_set`] = childRecords;
                    }
                }
                for (const field in record) {
                    const fieldSchema = schema.find((f) => f.columnName === field && f.isForeignKey);
                    if (fieldSchema) {
                        const foreignKeyTable = fieldSchema.relationship.table;
                        const foreignKeyQuery = `SELECT * FROM ${foreignKeyTable} WHERE id = ?`;
                        logDatabaseOperation("SELECT", foreignKeyQuery, [record[field]]);
                        const foreignKeyRecord = await db.getAllAsync(foreignKeyQuery, [record[field]]);
                        if (foreignKeyRecord.length > 0) {
                            record[field] = foreignKeyRecord[0]; // Substitui o id pelo objeto completo
                        }
                    }
                    if (field.includes("_set")) {
                        const childRecords = record[field];
                        if (childRecords && childRecords.length > 0) {
                            for (let i = 0; i < childRecords.length; i++) {
                                for (const childField in childRecords[i]) {
                                    // Não fechar o banco ao chamar getTableSchema internamente
                                    const childSchema = await getTableSchema(databaseName, field.split("_set")[0]);
                                    const childFieldSchema = childSchema.find(
                                        (f) => f.columnName === childField && f.isForeignKey
                                    );
                                    if (childFieldSchema) {
                                        const foreignKeyTable = childFieldSchema.relationship.table;
                                        const foreignKeyQuery = `SELECT * FROM ${foreignKeyTable} WHERE id = ?`;
                                        logDatabaseOperation("SELECT", foreignKeyQuery, [childRecords[i][childField]]);
                                        const foreignKeyRecord = await db.getAllAsync(foreignKeyQuery, [childRecords[i][childField]]);
                                        if (foreignKeyRecord.length > 0) {
                                            childRecords[i][childField] = foreignKeyRecord[0];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return results;
    } catch (error) {
        console.error(
            `Erro ao buscar registros da tabela '${tableName}':`,
            error
        );
        return false;
    }
};

// Função para encontrar tabelas filhas baseadas na presença de colunas <tabela_pai>_id
const findChildTables = async (databaseName, parentTable) => {
    let db;
    try {
        db = await openDatabase(databaseName);
        const query = `SELECT name FROM sqlite_master WHERE type='table'`;
        const tables = await db.getAllAsync(query);

        const childTables = [];
        for (const table of tables) {
            const tableName = table.name;
            // Não fechar o banco ao chamar getTableSchema internamente
            const schema = await getTableSchema(databaseName, tableName);
            const hasForeignKey = schema.some(
                (field) => field.isForeignKey && field.relationship?.table === parentTable
            );
            if (hasForeignKey) {
                childTables.push(tableName);
            }
        }
        return childTables;
    } catch (error) {
        console.error("Erro ao buscar tabelas filhas:", error);
        throw error;
    }
}

// Função para obter informações de chaves estrangeiras de uma tabela
const getForeignKeyInfo = async (db, tableName) => {
    const query = `PRAGMA foreign_key_list(${tableName})`;
    try {
        const results = await db.getAllAsync(query);
        return results.map((row) => ({
            columnName: row.from, // Coluna na tabela filha
            table: row.table, // Nome da tabela filha
            to: row.to, // Coluna referenciada na tabela pai
        }));
    } catch (error) {
        console.error(
            `Erro ao obter informações de chaves estrangeiras da tabela '${tableName}':`,
            error
        );
        throw error;
    }
};

// Função para verificar se uma coluna existe em uma tabela
const columnExists = async (db, tableName, columnName) => {
    const query = `PRAGMA table_info(${tableName})`;
    const results = await db.getAllAsync(query);
    return results.some((row) => row.name === columnName);
};

// Função genérica para executar operações no banco de dados
const executeOperations = async (operations) => {
    try {
        for (const operation of operations) {
            const { func, args } = operation;
            await func(...args);
        }
        return true;
    } catch (error) {
        console.error(`Erro ao executar a operação ${func.name}:`, error);
        return false;
    }
};

// Função para agrupar registros por uma coluna relacionada (ex.: livros por autor)
const getGroupedRecords = async (
    databaseName,
    mainTable,
    relatedTable,
    groupByColumn,
    foreignKey
) => {
    const db = await openDatabase(databaseName);
    const query = `
    SELECT ${mainTable}.name AS ${groupByColumn}, ${relatedTable}.* 
    FROM ${mainTable}
    JOIN ${relatedTable} ON ${mainTable}.id = ${relatedTable}.${foreignKey}
    ORDER BY ${mainTable}.${groupByColumn}
  `;

    try {
        const groupedResults = await db.getAllAsync(query);
        return groupedResults;
    } catch (error) {
        console.error(
            `Erro ao agrupar registros de ${relatedTable} por ${groupByColumn}:`,
            error
        );
        throw error;
    }
};
// Função para obter informações sobre as chaves estrangeiras de uma tabela
const obterForKeyInfo = async (databaseName, tableName) => {
    const db = await openDatabase(databaseName);

    // Consultas SQL
    const tableInfoQuery = `PRAGMA table_info(${tableName})`;
    const foreignKeyQuery = `PRAGMA foreign_key_list(${tableName})`;

    try {
        // Obter informações da tabela
        const tableInfo = await db.getAllAsync(tableInfoQuery);

        // Obter informações das chaves estrangeiras
        const foreignKeys = await db.getAllAsync(foreignKeyQuery);

        // Criar um mapa para relacionamentos
        const relationships = foreignKeys.reduce((acc, fk) => {
            acc[fk.from] = {
                databaseName: databaseName,
                tableName: fk.table,
                fieldName: fk.to,
                displayField: "nome", // Você pode definir como um padrão ou obter dinamicamente
            };
            return acc;
        }, {});

        // Processar o esquema da tabela
        const schema = tableInfo.map((row) => {
            const match = row.type.match(/(\w+)(\((\d+)\))?/);
            return {
                columnName: row.name,
                dataType: match ? match[1] : row.type,
                isForeignKey: !!relationships[row.name],
                relationship: relationships[row.name] || null,
            };
        });

        // Retornar o esquema processado
        return schema;
    } catch (error) {
        console.error(`Erro ao obter o esquema da tabela ${tableName}:`, error);
        throw error;
    }
};

const getTableSchema = async (databaseName, tableName) => {
    let db;
    try {
        db = await openDatabase(databaseName);

        // Get table info
        const tableInfoQuery = `PRAGMA table_info(${tableName})`;

        // Get foreign key info
        const foreignKeyQuery = `
        SELECT 
          m.name as tableName,
          p."from" as columnName,
          p."to" as columnRef,
          p."table" as refTableName
        FROM sqlite_master m
        JOIN pragma_foreign_key_list(m.name) p
        WHERE m.name = ?
      `;

        // Get basic column info
        const tableInfo = await db.getAllAsync(tableInfoQuery);
        const foreignKeys = await db.getAllAsync(foreignKeyQuery, [tableName]);
        const fkMap = foreignKeys.reduce((acc, fk) => {
            acc[fk.columnName] = {
                table: fk.refTableName,
                column: fk.columnRef,
            };
            return acc;
        }, {});
        const schema = tableInfo.map((row) => ({
            columnName: row.name,
            dataType: mapSQLTypeToFieldType(row.type),
            notNull: row.notnull === 1,
            defaultValue: row.dflt_value,
            primaryKey: row.pk === 1,
            isForeignKey: !!fkMap[row.name],
            relationship: fkMap[row.name],
        }));

        return schema;
    } catch (error) {
        console.error(`Erro ao obter o esquema da tabela ${tableName}:`, error);
        throw error;
    }
};

// Helper function to map SQL types to form field types
const mapSQLTypeToFieldType = (sqlType) => {
    const type = sqlType.toLowerCase();

    if (type.includes("int")) {
        return "number";
    } else if (
        type.includes("text") ||
        type.includes("varchar") ||
        type.includes("char")
    ) {
        return "text";
    } else if (type.includes("boolean")) {
        return "checkbox";
    } else if (type.includes("date")) {
        return "date";
    } else if (type.includes("time")) {
        return "time";
    } else if (type.includes("blob")) {
        return "file";
    }

    return "text"; // default type
};

// Adicionar a função getRecordById

// Exporta todas as funções
export default {
    openDatabase,
    createTable,
    deleteTables,
    editTables,
    getTables,
    insert,
    getRecords,
    deleteRecords,
    editRecords,
    getTableSchema,
    executeOperations,
    obterForKeyInfo,
    getGroupedRecords,
};