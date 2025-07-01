import SQLComponent from '../../components/SQliteComponent';

const NomeDatabase = 'biblioteca.db';


const createAutorTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'Autor', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'nome', type: 'TEXT' },
            { name: 'data_nascimento', type: 'TEXT' },
    ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Autor":', error);
    }
    };

const createCategoriaTable = async () => {
    try {
    await SQLComponent.createTable(NomeDatabase, 'Categoria', [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'nome', type: 'TEXT' },
    ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Categoria":', error);
    }
    };

const createLivroTable = async () => {
    try {
    await SQLComponent.createTable(NomeDatabase, 'Livro', [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'titulo', type: 'TEXT' },
        { name: 'categoria', type: 'INTEGER', foreignKey: { table: 'Categoria', column: 'id' } },
        { name: 'ano_publicacao', type: 'TEXT' },
        { name: 'capa', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Livro":', error);
}
};

const createLivroAutorTable = async () => {
    try{
        await SQLComponent.createTable(NomeDatabase, 'LivroAutor', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'livro', type: 'INTEGER', foreignKey: {table: 'Livro', column: 'id' } },
            { name: 'autor', type: 'INTEGER', foreignKey: {table: 'Autor', column: 'id' } },

        ])
    }
    catch (error){
        console.error('Erro ao criar tabela "AutorLivro":', erro);
    }

};

const createEmprestimoTable = async () => {
    try {
        await SQLComponent.createTable(NomeDatabase, 'Emprestimo', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'livro', type: 'INTEGER', foreignKey: { table: 'Livro', column: 'id' } },
            { name: 'data_emprestimo', type: 'TEXT' },
            { name: 'data_devolucao', type: 'TEXT' },
            { name: 'usuario', type: 'TEXT' },
        ]);
    } catch (error) {
        console.error('Erro ao criar a tabela "Emprestimo":', error);  
}
};

export async function setupBibliotecaDatabase() {
    await createAutorTable();
    await createCategoriaTable();
    await createLivroTable();
    await createEmprestimoTable();
    await createLivroAutorTable();
     
    try {
    
    const autores = await SQLComponent.getRecords(NomeDatabase, 'Autor');
    if (!autores || autores.length == 0) {
        await SQLComponent.insert(NomeDatabase, 'Autor', { nome: 'Machado de Assis', data_nascimento: '1839-06-21' });
        await SQLComponent.insert(NomeDatabase, 'Autor', { nome: 'Clarice Lispector', data_nascimento: '1920-12-10' });
    }
     
    const categorias = await SQLComponent.getRecords(NomeDatabase, 'Categoria');
    if (!categorias || categorias.length == 0) {
        await SQLComponent.insert(NomeDatabase, 'Categoria', { nome: 'Romance' });
        await SQLComponent.insert(NomeDatabase, 'Categoria', { nome: 'Conto' });
        await SQLComponent.insert(NomeDatabase, 'Categoria', { nome: 'Poesia' });
    }
    } catch (error) {
        console.error('Erro ao inserir autores ou categorias padrão:', error);
    }}
    