// Importa o framework Express (para criar API)
const express  = require('express');

// Importa biblioteca para trabalhar com JWT (autenticação)
const jwt      = require('jsonwebtoken');

// Cria um roteador
const router   = express.Router();

// Middleware de autenticação
const auth     = require('../middlewares/auth');

// Models
const Funcionario  = require('../models/Funcionario');
const Produto      = require('../models/Produto');
const Cliente      = require('../models/Cliente');
const Pedido       = require('../models/Pedido');


// ========================== LOGIN ==========================
router.post('/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha)
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });

    const funcionario = await Funcionario.findByEmail(email);

    if (!funcionario)
      return res.status(401).json({ erro: 'Credenciais inválidas' });

    const ok = await Funcionario.verificarSenha(senha, funcionario.senha);

    if (!ok)
      return res.status(401).json({ erro: 'Credenciais inválidas' });

    const token = jwt.sign(
      {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo
      }
    });

  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== PRODUTOS ==========================

// Lista todos os produtos
router.get('/produtos', auth, async (req, res) => {
  try {
    res.json(await Produto.findAll());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Busca produto por ID
router.get('/produtos/:id', auth, async (req, res) => {
  try {
    const p = await Produto.findById(req.params.id);

    if (!p)
      return res.status(404).json({ erro: 'Produto não encontrado' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Cria produto
router.post('/produtos', auth, async (req, res) => {
  try {
    if (!req.body.nome || !req.body.material)
      return res.status(400).json({ erro: 'Nome e material são obrigatórios' });

    res.status(201).json(await Produto.create(req.body));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Atualiza produto
router.put('/produtos/:id', auth, async (req, res) => {
  try {
    const p = await Produto.update(req.params.id, req.body);

    if (!p)
      return res.status(404).json({ erro: 'Produto não encontrado' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Deleta produto
router.delete('/produtos/:id', auth, async (req, res) => {
  try {
    const ok = await Produto.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Produto não encontrado' });

    res.json({ mensagem: 'Produto deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== CLIENTES ==========================

router.get('/clientes', auth, async (req, res) => {
  try {
    res.json(await Cliente.findAll(req.query.busca));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.get('/clientes/:id', auth, async (req, res) => {
  try {
    const c = await Cliente.findById(req.params.id);

    if (!c)
      return res.status(404).json({ erro: 'Cliente não encontrado' });

    res.json(c);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/clientes', auth, async (req, res) => {
  try {
    if (!req.body.nome || !req.body.telefone)
      return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });

    res.status(201).json(await Cliente.create(req.body));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.put('/clientes/:id', auth, async (req, res) => {
  try {
    const c = await Cliente.update(req.params.id, req.body);

    if (!c)
      return res.status(404).json({ erro: 'Cliente não encontrado' });

    res.json(c);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.delete('/clientes/:id', auth, async (req, res) => {
  try {
    const ok = await Cliente.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Cliente não encontrado' });

    res.json({ mensagem: 'Cliente deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== PEDIDOS ==========================

router.get('/pedidos', auth, async (req, res) => {
  try {
    const filtros = {};

    if (req.query.funcionario)
      filtros.funcionarioId = req.query.funcionario;

    res.json(await Pedido.findAll(filtros));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.get('/pedidos/:id', auth, async (req, res) => {
  try {
    const p = await Pedido.findById(req.params.id);

    if (!p)
      return res.status(404).json({ erro: 'Pedido não encontrado' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/pedidos', auth, async (req, res) => {
  try {
    const { cliente, itens, formaPagamento } = req.body;

    if (!cliente || !itens?.length || !formaPagamento)
      return res.status(400).json({ erro: 'cliente, itens e formaPagamento são obrigatórios' });

    const novo = await Pedido.create({
      clienteId: cliente,
      itens,
      formaPagamento,
      observacoes: req.body.observacoes,
      origem: req.body.origem,
      funcionarioId: req.body.funcionario || req.funcionario?.id,
    });

    res.status(201).json(novo);

  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

router.patch('/pedidos/:id/status', auth, async (req, res) => {
  try {
    const validos = ['em_producao','finalizado','entregue','cancelado'];

    if (!validos.includes(req.body.status))
      return res.status(400).json({ erro: 'Status inválido' });

    const p = await Pedido.updateStatus(req.params.id, req.body.status);

    if (!p)
      return res.status(404).json({ erro: 'Pedido não encontrado' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.delete('/pedidos/:id', auth, async (req, res) => {
  try {
    const ok = await Pedido.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Pedido não encontrado' });

    res.json({ mensagem: 'Pedido deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== FUNCIONÁRIOS (ADMIN) ==========================

router.get('/funcionarios', auth, async (req, res) => {
  try {
    if (req.funcionario.cargo !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    res.json(await Funcionario.findAll());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.post('/funcionarios', auth, async (req, res) => {
  try {
    if (req.funcionario.cargo !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    const { nome, email, senha, cargo } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });

    res.status(201).json(await Funcionario.create({ nome, email, senha, cargo }));

  } catch (e) {
    if (e.message?.includes('UNIQUE'))
      return res.status(400).json({ erro: 'E-mail já cadastrado' });

    res.status(500).json({ erro: e.message });
  }
});

router.put('/funcionarios/:id', auth, async (req, res) => {
  try {
    if (req.funcionario.cargo !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    const u = await Funcionario.update(req.params.id, req.body);

    if (!u)
      return res.status(404).json({ erro: 'Funcionário não encontrado' });

    res.json(u);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.delete('/funcionarios/:id', auth, async (req, res) => {
  try {
    if (req.funcionario.cargo !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    const ok = await Funcionario.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Funcionário não encontrado' });

    res.json({ mensagem: 'Funcionário deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// Exporta as rotas
module.exports = router;