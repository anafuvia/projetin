// ============================================================
// Produto.js — Model de Produto
// ============================================================

const { ready, query, run, get } = require('../database/sqlite');

// Formata produto (converte JSON de preços)
function formatarProduto(row) {
  if (!row) return null;

  return {
    _id:         row.id,
    id:          row.id,
    nome:        row.nome,
    descricao:   row.descricao,
    material:    row.material,

    // Converte string JSON para objeto
    precos:      JSON.parse(row.precos || '{"unitario":0}'),

    disponivel:  row.disponivel === 1,
    categoria:   row.categoria,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

const Produto = {

  async findAll() {
    await ready;

    return query('SELECT * FROM produtos ORDER BY categoria, nome')
      .map(formatarProduto);
  },

  async findById(id) {
    await ready;

    return formatarProduto(
      get('SELECT * FROM produtos WHERE id = ?', [id])
    );
  },

  async create({
    nome,
    descricao = '',
    material,
    precos = {},
    disponivel = true,
    categoria = 'metal'
  }) {
    await ready;

    const info = run(
      `INSERT INTO produtos
       (nome, descricao, material, precos, disponivel, categoria)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        descricao.trim(),
        material.trim(),
        JSON.stringify({
          unitario: precos.unitario || 0
        }),
        disponivel ? 1 : 0,
        categoria
      ]
    );

    return this.findById(info.lastInsertRowid);
  },

  async update(id, { nome, descricao, material, precos, disponivel, categoria }) {
    await ready;

    const atual = get('SELECT * FROM produtos WHERE id = ?', [id]);
    if (!atual) return null;

    const precosAtuais = JSON.parse(atual.precos);

    const precosFinal = precos
      ? {
          unitario: precos.unitario ?? precosAtuais.unitario
        }
      : precosAtuais;

    run(`
      UPDATE produtos SET
        nome        = ?,
        descricao   = ?,
        material    = ?,
        precos      = ?,
        disponivel  = ?,
        categoria   = ?,
        updated_at  = datetime('now')
      WHERE id = ?
    `, [
      nome        ?? atual.nome,
      descricao   ?? atual.descricao,
      material    ?? atual.material,
      JSON.stringify(precosFinal),
      disponivel !== undefined ? (disponivel ? 1 : 0) : atual.disponivel,
      categoria   ?? atual.categoria,
      id
    ]);

    return this.findById(id);
  },

  async delete(id) {
    await ready;

    const info = run('DELETE FROM produtos WHERE id = ?', [id]);
    return info.changes > 0;
  },
};

module.exports = Produto;