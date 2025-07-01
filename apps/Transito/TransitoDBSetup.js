import SQLComponent from '../../components/SQliteComponent';
import sq from '../../components/SQliteComponent';

const NomeDatabase = 'transito.db';

export async function setupTransitoDatabase() {
    await createMarcaTable();
    await createModeloTable();
    await createCorTable();
    await createCarroVisitacaoTable();
    await initializeDefaultData();
}

const createMarcaTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'Marca', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'data_cadastro', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Marca":', error);
    }
};

const createModeloTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'Modelo', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'marca', type: 'INTEGER', foreignKey: { table: 'Marca', column: 'id' } },
            { name: 'data_cadastro', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Modelo":', error);
    }
};

const createCorTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'Cor', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'data_cadastro', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Cor":', error);
    }
};

const createCarroVisitacaoTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'CarroVisitacao', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'placa', type: 'TEXT' },
            { name: 'modelo', type: 'INTEGER', foreignKey: { table: 'Modelo', column: 'id' } },
            { name: 'cor', type: 'INTEGER', foreignKey: { table: 'Cor', column: 'id' } },
            { name: 'motivo_visitacao', type: 'TEXT' },
            { name: 'horario_entrada', type: 'TEXT' },
            { name: 'data_cadastro', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "CarroVisitacao":', error);
    }
};

const addMarcaBanco = async (marca) => {
    try {
        const result = await sq.insert(NomeDatabase, 'Marca', { nome: marca });
        // O insert deve retornar o ID da marca inserida (ajuste conforme seu SQliteComponent)
        return result?.insertId || result; // compatível com diferentes retornos
    } catch (error) {
        console.error("Erro ao inserir a Marca:", error);
        return null;
    }
};

const addModeloBanco = async (modelo, marcaId) => {
    try {
        await sq.insert(NomeDatabase, 'Modelo', { nome: modelo, marca: marcaId });
    } catch (error) {
        console.error("Erro ao inserir o Modelo:", error);
    }
};

const addNovaCorBanco = async (cor) => {
    try {
        await sq.insert(NomeDatabase, 'Cor', { nome: cor });
    } catch (error) {
        console.error("Erro ao inserir a Cor:", error);
    }
};

const initializeDefaultData = async () => {
    try {
        // Verifica se há registros na tabela Marca
        const marcasRecords = await SQLComponent.getRecords(NomeDatabase, 'Marca');
        let marcaIds = [];
        if (!marcasRecords || marcasRecords.length === 0) {
            // Adiciona até 2 marcas padrão
            const id1 = await addMarcaBanco('Ford');
            const id2 = await addMarcaBanco('Hyundai');
            marcaIds = [id1, id2].filter(Boolean);
            console.log("Marcas padrão inseridas.");
        } else {
            // Se já existem marcas, use os dois primeiros IDs
            marcaIds = marcasRecords.slice(0, 2).map(m => m.id);
        }

        // Verifica se há registros na tabela Modelo
        const modelosRecords = await SQLComponent.getRecords(NomeDatabase, 'Modelo');
        if (!modelosRecords || modelosRecords.length === 0) {
            // Adiciona modelos padrão associados às marcas
            if (marcaIds[0]) await addModeloBanco('KA', marcaIds[0]);
            if (marcaIds[1]) await addModeloBanco('HB20', marcaIds[1]);
            console.log("Modelos padrão inseridos.");
        }

        // Verifica se há registros na tabela Cor
        const corRecords = await SQLComponent.getRecords(NomeDatabase, 'Cor');
        if (!corRecords || corRecords.length === 0) {
            // Adiciona cores padrão
            await addNovaCorBanco('Branco');
            await addNovaCorBanco('Azul');
            await addNovaCorBanco('Preto');
            await addNovaCorBanco('Prata');
            await addNovaCorBanco('Vermelho');
            console.log("Cores padrão inseridas.");
        }
    } catch (error) {
        console.error("Erro ao inserir dados padrão:", error);
    }
};
