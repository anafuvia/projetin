// ============================================================
// Cliente.js — Model de Cliente (sql.js)
// ============================================================

// Importa funções auxiliares do banco SQLite
const { ready, query, run, get } = require('../database/sqlite');

// Função para formatar o objeto retornado do banco
function formatarCliente(row) {
  if (!row) return null;

  return {
    _id:        row.id,
    id:         row.id,
    nome:       row.nome,
    telefone:   row.telefone,
    endereco:   JSON.parse(row.endereco || '{}'),
    observacoes: row.observacoes,
    ativo:      row.ativo === 1,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

// Objeto que representa o model Cliente
const Cliente = {

  // Busca todos os clientes (com opção de filtro por nome/telefone)
  async findAll(busca = '') {
    await ready;
    let rows;

    if (busca) {
      const t = `%${busca}%`;
      rows = query(
        'SELECT * FROM clientes WHERE ativo = 1 AND (nome LIKE ? OR telefone LIKE ?) ORDER BY nome',
        [t, t]
      );
    } else {
      rows = query('SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome');
    }

    return rows.map(formatarCliente);
  },

  // Busca um cliente pelo ID
  async findById(id) {
    await ready;
    return formatarCliente(get('SELECT * FROM clientes WHERE id = ?', [id]));
  },

  // Cria um novo cliente (empresa que solicita peças)
  async create({ nome, telefone, endereco = {}, observacoes = '' }) {
    await ready;

    const info = run(
      'INSERT INTO clientes (nome, telefone, endereco, observacoes) VALUES (?, ?, ?, ?)',
      [nome.trim(), telefone.trim(), JSON.stringify(endereco), observacoes]
    );

    return this.findById(info.lastInsertRowid);
  },

  // Atualiza um cliente existente
  async update(id, { nome, telefone, endereco, observacoes, ativo }) {
    await ready;

    const atual = get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!atual) return null;

    const endAtual = JSON.parse(atual.endereco || '{}');
    const endFinal = endereco ? { ...endAtual, ...endereco } : endAtual;

    run(`
      UPDATE clientes SET
        nome        = ?,
        telefone    = ?,
        endereco    = ?,
        observacoes = ?,
        ativo       = ?,
        updated_at  = datetime('now')
      WHERE id = ?
    `, [
      nome        ?? atual.nome,
      telefone    ?? atual.telefone,
      JSON.stringify(endFinal),
      observacoes ?? atual.observacoes,
      ativo !== undefined ? (ativo ? 1 : 0) : atual.ativo,
      id
    ]);

    return this.findById(id);
  },

  // Remove um cliente pelo ID
  async delete(id) {
    await ready;

    const info = run('DELETE FROM clientes WHERE id = ?', [id]);

    return info.changes > 0;
  },
};

// Exporta o model
module.exports = Cliente;