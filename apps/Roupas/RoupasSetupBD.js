import SQLComponent from '../../components/SQliteComponent';

const NomeDatabase = 'biblioteca.db';


const createProdutoTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'Produto', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'preco', type: 'NUMBER' },
            { name: 'descricao', type: 'TEXT' },
            { name: 'imagem', type: 'TEXT' },


    ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Produto":', error);
    }
    };

const createClienteTable = async () => {
    try {
    await SQLComponent.createTable(NomeDatabase, 'Cliente', [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'nome', type: 'TEXT' },
        { name: 'email', type: 'TEXT' },
        { name: 'telefone', type: 'NUMBER' },
        { name: 'endereco', type: 'TEXT' },
    ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Cliente":', error);
    }
    };

const createPedidoTable = async () => {
    try {
    await SQLComponent.createTable(NomeDatabase, 'Livro', [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'cliente', type: 'INTEGER', foreignKey: { table: 'Cliente', column: 'id' } },
        { name: 'produto', type: 'INTEGER', foreignKey: { table: 'Produto', column: 'id' } },
        { name: 'quantidade', type: 'NUMBER' },
        { name: 'data_pedido', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Pedido":', error);
}
};

export async function setupRoupaDatabase() {
    await createClienteTable();
    await createPedidoTable();
    await createProdutoTable();
     
}