// ============================================================
// Funcionario.js — Model de Funcionário
// ============================================================

const { ready, query, run, get } = require('../database/sqlite');
const bcrypt = require('bcryptjs');

// Formata funcionário para retorno
function formatarFuncionario(row) {
  if (!row) return null;

  return {
    _id:       row.id,
    id:        row.id,
    nome:      row.nome,
    email:     row.email,
    cargo:     row.cargo,
    ativo:     row.ativo === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const Funcionario = {

  async findAll() {
    await ready;

    const rows = query(`
      SELECT id, nome, email, cargo, ativo, created_at, updated_at
      FROM funcionarios
      ORDER BY created_at DESC
    `);

    return rows.map(formatarFuncionario);
  },

  async findByEmail(email) {
    await ready;

    return get(
      'SELECT * FROM funcionarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );
  },

  async findById(id) {
    await ready;

    const row = get(`
      SELECT id, nome, email, cargo, ativo, created_at, updated_at
      FROM funcionarios WHERE id = ?
    `, [id]);

    return formatarFuncionario(row);
  },

  async create({ nome, email, senha, cargo = 'Operador' }) {
    await ready;

    // Criptografa senha
    const hash = await bcrypt.hash(senha, 10);

    const info = run(
      'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
      [nome.trim(), email.toLowerCase().trim(), hash, cargo]
    );

    return this.findById(info.lastInsertRowid);
  },

  async update(id, { nome, email, senha, cargo, ativo }) {
    await ready;

    const atual = get('SELECT * FROM funcionarios WHERE id = ?', [id]);
    if (!atual) return null;

    let senhaFinal = atual.senha;

    // Se veio nova senha, criptografa
    if (senha) {
      senhaFinal = await bcrypt.hash(senha, 10);
    }

    run(`
      UPDATE funcionarios SET
        nome       = ?,
        email      = ?,
        senha      = ?,
        cargo      = ?,
        ativo      = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `, [
      nome   ?? atual.nome,
      email  ?? atual.email,
      senhaFinal,
      cargo  ?? atual.cargo,
      ativo !== undefined ? (ativo ? 1 : 0) : atual.ativo,
      id
    ]);

    return this.findById(id);
  },

  async delete(id) {
    await ready;

    const info = run('DELETE FROM funcionarios WHERE id = ?', [id]);
    return info.changes > 0;
  },

  // Verifica senha no login
  verificarSenha(senhaDigitada, hashSalvo) {
    return bcrypt.compare(senhaDigitada, hashSalvo);
  },
};

module.exports = Funcionario;