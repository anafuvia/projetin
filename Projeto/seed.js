// Carrega variáveis de ambiente
require('dotenv').config();

// Banco
const { ready, run } = require('./src/database/sqlite');

// Criptografia
const bcrypt = require('bcryptjs');

// Função principal
async function seed() {
  try {
    await ready;

    console.log('🧹 Limpando banco...');

    // Limpeza (ordem importante)
    run('DELETE FROM itens_pedido');
    run('DELETE FROM pedidos');
    run('DELETE FROM produtos');
    run('DELETE FROM clientes');
    run('DELETE FROM funcionarios');

    try {
      run("DELETE FROM sqlite_sequence WHERE name IN ('itens_pedido','pedidos','produtos','clientes','funcionarios')");
    } catch (_) {}

    console.log('✅ Banco limpo');

    // Senha padrão
    const hash = await bcrypt.hash('123456', 10);

    // ================= FUNCIONÁRIOS =================
    run(
      'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
      ['Administrador Master', 'admin@metal.com', hash, 'Administrador']
    );

    run(
      'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
      ['Operador CNC', 'operador@metal.com', hash, 'Operador']
    );

    run(
      'INSERT INTO funcionarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
      ['Supervisor Produção', 'supervisor@metal.com', hash, 'Supervisor']
    );

    console.log('✅ 3 funcionários criados');

    // ================= CLIENTES =================
    const clientes = [
      ['João Pedro Silva',        '11990000001', { cidade: 'São Paulo' }, 'Cliente recorrente'],
      ['Maria Eduarda Souza',     '11990000002', { cidade: 'Guarulhos' }, ''],
      ['Carlos Henrique Lima',    '11990000003', { cidade: 'Campinas' }, 'Entrega urgente'],
      ['Ana Beatriz Rocha',       '11990000004', { cidade: 'Osasco' }, ''],
      ['Lucas Gabriel Martins',   '11990000005', { cidade: 'Santos' }, 'Cliente VIP'],
      ['Fernanda Alves Costa',    '11990000006', { cidade: 'São Paulo' }, ''],
      ['Rafael Pereira Gomes',    '11990000007', { cidade: 'Guarulhos' }, 'Prefere contato por WhatsApp'],
      ['Juliana Ribeiro Santos',  '11990000008', { cidade: 'São Paulo' }, ''],
      ['Bruno Carvalho Mendes',   '11990000009', { cidade: 'Campinas' }, ''],
      ['Patrícia Fernandes Lima', '11990000010', { cidade: 'Osasco' }, ''],
      ['Thiago Oliveira Souza',   '11990000011', { cidade: 'Santos' }, ''],
      ['Camila Nunes Barbosa',    '11990000012', { cidade: 'São Paulo' }, 'Cliente frequente'],
      ['Diego Castro Ferreira',   '11990000013', { cidade: 'Guarulhos' }, ''],
      ['Larissa Teixeira Alves',  '11990000014', { cidade: 'Campinas' }, ''],
      ['Felipe Rocha Pinto',      '11990000015', { cidade: 'Osasco' }, '']
    ];

    for (const [nome, tel, end, obs] of clientes) {
      run(
        'INSERT INTO clientes (nome, telefone, endereco, observacoes) VALUES (?, ?, ?, ?)',
        [nome, tel, JSON.stringify(end), obs]
      );
    }

    console.log('✅ Clientes criados');

    // ================= PRODUTOS =================
    const produtos = [
      ['Chapa de Aço', 'Chapa industrial resistente', 'Aço', { unitario: 150 }, 'materia_prima'],
      ['Barra de Ferro', 'Barra para construção', 'Ferro', { unitario: 80 }, 'materia_prima'],
      ['Parafuso Industrial', 'Alta resistência', 'Aço', { unitario: 2 }, 'fixacao'],
      ['Engrenagem', 'Peça para máquinas', 'Liga metálica', { unitario: 300 }, 'mecanico'],
      ['Eixo Mecânico', 'Eixo de transmissão', 'Aço temperado', { unitario: 500 }, 'mecanico'],
      ['Chapa Inox', 'Resistente à corrosão', 'Inox', { unitario: 220 }, 'materia_prima'],
      ['Porca Sextavada', 'Fixação industrial', 'Aço', { unitario: 1.5 }, 'fixacao'],
      ['Rolamento', 'Alta precisão', 'Aço', { unitario: 120 }, 'mecanico']
    ];

    for (const [nome, desc, material, precos, cat] of produtos) {
      run(
        'INSERT INTO produtos (nome, descricao, material, precos, categoria) VALUES (?, ?, ?, ?, ?)',
        [nome, desc, material, JSON.stringify(precos), cat]
      );
    }

    console.log('✅ Produtos criados');

    // ================= PEDIDO EXEMPLO =================
    run(`
      INSERT INTO pedidos 
      (cliente_id, subtotal, total, forma_pagamento, status)
      VALUES (?, ?, ?, ?, ?)
    `, [1, 300, 300, 'boleto', 'em_producao']);

    run(`
      INSERT INTO itens_pedido
      (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [1, 1, 'Chapa de Aço', 2, 150, 300]);

    console.log('✅ Pedido exemplo criado');

    console.log('======================================');
    console.log('🏭 SEED EXECUTADO COM SUCESSO!');
    console.log('======================================');
    console.log('Login: admin@metal.com | Senha: 123456');
    console.log('======================================');

    process.exit(0);

  } catch (err) {
    console.error('❌ ERRO NO SEED:', err);
    process.exit(1);
  }
}

seed();