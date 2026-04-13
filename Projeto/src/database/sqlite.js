// ============================================================
// sqlite.js — Conexão com SQLite usando sql.js
// ============================================================

const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

// Caminho do banco (mantido padrão)
const DB_PATH = process.env.DB_PATH
  || path.join(__dirname, '..', '..', 'metalurgica.db');

// Estado interno (singleton)
const state = { db: null };

// Promise que inicializa o banco
const ready = (async () => {
  const SQL = await initSqlJs();

  // Se banco já existe, carrega
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    state.db = new SQL.Database(fileBuffer);
  } else {
    // Senão cria novo
    state.db = new SQL.Database();
  }

  const db = state.db;

  // Ativa chaves estrangeiras
  db.run('PRAGMA foreign_keys = ON');

  // ================= CRIAÇÃO DAS TABELAS =================

  // FUNCIONÁRIOS (mesma estrutura de usuarios)
  db.run(`
    CREATE TABLE IF NOT EXISTS funcionarios (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      senha       TEXT    NOT NULL,
      cargo       TEXT    NOT NULL DEFAULT 'Operador',
      ativo       INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // CLIENTES (igual)
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      telefone    TEXT    NOT NULL,
      endereco    TEXT    NOT NULL DEFAULT '{}',
      observacoes TEXT    NOT NULL DEFAULT '',
      ativo       INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // PRODUTOS (mesma estrutura de pizzas)
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      descricao    TEXT    NOT NULL DEFAULT '',
      material     TEXT    NOT NULL,
      precos       TEXT    NOT NULL DEFAULT '{"unitario":0}',
      disponivel   INTEGER NOT NULL DEFAULT 1,
      categoria    TEXT    NOT NULL DEFAULT 'metal',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // PEDIDOS (mesma lógica, adaptado)
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_pedido   INTEGER,
      cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
      subtotal        REAL    NOT NULL DEFAULT 0,
      taxa_servico    REAL    NOT NULL DEFAULT 0,
      total           REAL    NOT NULL DEFAULT 0,
      forma_pagamento TEXT    NOT NULL,
      desconto        REAL    NOT NULL DEFAULT 0,
      status          TEXT    NOT NULL DEFAULT 'recebido',
      observacoes     TEXT    NOT NULL DEFAULT '',
      setor           TEXT,
      origem          TEXT    NOT NULL DEFAULT 'fabrica',
      funcionario_id  INTEGER REFERENCES funcionarios(id),
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ITENS DO PEDIDO (igual estrutura)
  db.run(`
    CREATE TABLE IF NOT EXISTS itens_pedido (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id      INTEGER NOT NULL REFERENCES pedidos(id),
      produto_id     INTEGER NOT NULL REFERENCES produtos(id),
      nome_produto   TEXT    NOT NULL,
      tipo           TEXT    NOT NULL,
      quantidade     INTEGER NOT NULL DEFAULT 1,
      preco_unitario REAL    NOT NULL DEFAULT 0,
      subtotal       REAL    NOT NULL DEFAULT 0
    )
  `);

  salvar();

  console.log('SQLite conectado:', DB_PATH);

  return db;
})();

// ================= FUNÇÕES AUXILIARES =================

// Salva banco
function salvar() {
  if (!state.db) return;

  const data = state.db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// SELECT vários
function query(sql, params = []) {
  const stmt    = state.db.prepare(sql);
  const results = [];

  stmt.bind(params);

  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();
  return results;
}

// INSERT / UPDATE / DELETE
function run(sql, params = []) {
  state.db.run(sql, params);

  const meta = query('SELECT last_insert_rowid() as id, changes() as changes');

  salvar();

  return {
    lastInsertRowid: meta[0]?.id,
    changes:         meta[0]?.changes,
  };
}

// SELECT único
function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

module.exports = { ready, query, run, get, salvar };