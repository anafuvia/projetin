 // ============================================================
// Pedido.js — Model de Pedido (sql.js)
// ============================================================

// Importa funções do banco
const { ready, query, run, get } = require('../database/sqlite');

// Query base com JOIN de cliente
const SELECT_PEDIDO = `
  SELECT
    p.*,
    c.nome     AS cliente_nome,
    c.telefone AS cliente_telefone
  FROM pedidos p
  LEFT JOIN clientes c ON c.id = p.cliente_id
`;

// Função que transforma dados do banco em objeto JS
function formatarPedido(row, itens = []) {
  if (!row) return null;

  return {
    _id:           row.id,
    id:            row.id,
    numeroPedido:  row.numero_pedido,

    cliente: {
      _id:      row.cliente_id,
      id:       row.cliente_id,
      nome:     row.cliente_nome,
      telefone: row.cliente_telefone,
    },

    // Lista de itens do pedido
    itens: itens.map(it => ({
      _id:           it.id,
      produto:       it.produto_id,
      nomeProduto:   it.nome_produto,
      quantidade:    it.quantidade,
      precoUnitario: it.preco_unitario,
      subtotal:      it.subtotal,
    })),

    subtotal:       row.subtotal,
    total:          row.total,
    formaPagamento: row.forma_pagamento,
    status:         row.status,
    observacoes:    row.observacoes,
    origem:         row.origem,
    funcionario:    row.funcionario_id,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

const Pedido = {

  // ================= LISTAR PEDIDOS =================
  async findAll({ funcionarioId } = {}) {
    await ready;

    let rows;

    // Filtra por funcionário se necessário
    if (funcionarioId) {
      rows = query(
        `${SELECT_PEDIDO} WHERE p.funcionario_id = ? ORDER BY p.created_at DESC`,
        [funcionarioId]
      );
    } else {
      rows = query(`${SELECT_PEDIDO} ORDER BY p.created_at DESC`);
    }

    return rows.map(row => {
      const itens = query(
        'SELECT * FROM itens_pedido WHERE pedido_id = ?',
        [row.id]
      );
      return formatarPedido(row, itens);
    });
  },

  // ================= BUSCAR POR ID =================
  async findById(id) {
    await ready;

    const row = get(`${SELECT_PEDIDO} WHERE p.id = ?`, [id]);
    if (!row) return null;

    const itens = query(
      'SELECT * FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );

    return formatarPedido(row, itens);
  },

  // ================= CRIAR PEDIDO =================
  async create({
    clienteId,
    itens,
    formaPagamento,
    observacoes = '',
    origem = 'fabrica',
    funcionarioId = null
  }) {
    await ready;

    const Produto = require('./Produto');

    let subtotal = 0;
    const itensProcessados = [];

    // Processa cada item do pedido
    for (const item of itens) {
      const produto = await Produto.findById(item.produto);

      if (!produto) {
        throw new Error(`Produto ID ${item.produto} não encontrado`);
      }

      const preco   = produto.precos?.unitario || 0;
      const subItem = preco * item.quantidade;

      subtotal += subItem;

      itensProcessados.push({
        produtoId:     produto.id,
        nomeProduto:   produto.nome,
        quantidade:    item.quantidade,
        precoUnitario: preco,
        subtotal:      subItem,
      });
    }

    const total = subtotal;

    // Gera número do pedido
    const contagem     = get('SELECT COUNT(*) as total FROM pedidos');
    const numeroPedido = (contagem?.total || 0) + 1;

    // Insere pedido
    const infoPedido = run(`
      INSERT INTO pedidos
        (numero_pedido, cliente_id, subtotal, total,
         forma_pagamento, observacoes, origem, funcionario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      numeroPedido,
      clienteId,
      subtotal,
      total,
      formaPagamento,
      observacoes,
      origem,
      funcionarioId
    ]);

    const pedidoId = infoPedido.lastInsertRowid;

    // Insere itens do pedido
    for (const it of itensProcessados) {
      run(`
        INSERT INTO itens_pedido
          (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        pedidoId,
        it.produtoId,
        it.nomeProduto,
        it.quantidade,
        it.precoUnitario,
        it.subtotal
      ]);
    }

    return this.findById(pedidoId);
  },

  // ================= ATUALIZAR STATUS =================
  async updateStatus(id, status) {
    await ready;

    const info = run(
      "UPDATE pedidos SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );

    return info.changes > 0 ? this.findById(id) : null;
  },

  // ================= DELETAR =================
  async delete(id) {
    await ready;

    run('DELETE FROM itens_pedido WHERE pedido_id = ?', [id]);

    const info = run('DELETE FROM pedidos WHERE id = ?', [id]);

    return info.changes > 0;
  },
};

module.exports = Pedido;