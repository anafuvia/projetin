// ===============================
// SCRIPT CORRIGIDO - METALÚRGICA
// Ajustado para bater com o backend
// ===============================

const API = '/api';

let cProdutos = [];
let cClientes = [];

let TOKEN = localStorage.getItem('pz_token') || '';
let USUARIO_LOGADO = JSON.parse(localStorage.getItem('pz_usuario') || 'null');

// ================= LOGIN =================
async function fazerLogin() {
  const email = document.getElementById('l-email').value.trim();
  const senha = document.getElementById('l-senha').value;

  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro no login');

    // 🔥 CORREÇÃO PRINCIPAL
    TOKEN = data.token;
    USUARIO_LOGADO = data.funcionario;

    localStorage.setItem('pz_token', TOKEN);
    localStorage.setItem('pz_usuario', JSON.stringify(USUARIO_LOGADO));

    aplicarPerfil(USUARIO_LOGADO);
    document.body.classList.add('logado');

  } catch (e) {
    alert(e.message);
  }
}

// ================= API =================
async function api(method, url, body) {
  const res = await fetch(API + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();

  if (res.status === 401) {
    sair();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) throw new Error(data.erro || 'Erro');

  return data;
}

// ================= PERFIL =================
function aplicarPerfil(usuario) {
  const perfil = usuario.cargo; // 🔥 corrigido

  const isAdmin = perfil === 'Administrador';
  const isOperador = perfil === 'Operador';

  console.log('Perfil:', perfil);

  // exemplo simples
  if (!isAdmin) {
    const el = document.getElementById('menu-admin');
    if (el) el.style.display = 'none';
  }
}

// ================= PRODUTOS =================
async function carregarProdutos() {
  const el = document.getElementById('tbl-produtos');
  el.innerHTML = 'Carregando...';

  try {
    // 🔥 pizzas -> produtos
    cProdutos = await api('GET', '/produtos');

    el.innerHTML = cProdutos.map(p => `
      <div>
        <strong>${p.nome}</strong> - R$ ${p.preco}
      </div>
    `).join('');

  } catch (e) {
    el.innerHTML = e.message;
  }
}

// ================= CLIENTES =================
async function carregarClientes() {
  const el = document.getElementById('tbl-clientes');
  el.innerHTML = 'Carregando...';

  try {
    cClientes = await api('GET', '/clientes');

    el.innerHTML = cClientes.map(c => `
      <div>${c.nome} - ${c.telefone}</div>
    `).join('');

  } catch (e) {
    el.innerHTML = e.message;
  }
}

// ================= PEDIDOS =================
async function carregarPedidos() {
  const el = document.getElementById('tbl-pedidos');
  el.innerHTML = 'Carregando...';

  try {
    const pedidos = await api('GET', '/pedidos');

    el.innerHTML = pedidos.map(p => `
      <div>
        Pedido #${p._id} - ${p.status}
      </div>
    `).join('');

  } catch (e) {
    el.innerHTML = e.message;
  }
}

// ================= FUNCIONÁRIOS =================
async function carregarFuncionarios() {
  const el = document.getElementById('tbl-usuarios');
  el.innerHTML = 'Carregando...';

  try {
    // 🔥 usuarios -> funcionarios
    const lista = await api('GET', '/funcionarios');

    el.innerHTML = lista.map(u => `
      <div>
        ${u.nome} - ${u.cargo}
      </div>
    `).join('');

  } catch (e) {
    el.innerHTML = e.message;
  }
}

// ================= LOGOUT =================
function sair() {
  TOKEN = '';
  USUARIO_LOGADO = null;
  localStorage.removeItem('pz_token');
  localStorage.removeItem('pz_usuario');
  location.reload();
}

// ================= INIT =================
if (TOKEN && USUARIO_LOGADO) {
  aplicarPerfil(USUARIO_LOGADO);
  document.body.classList.add('logado');
}
