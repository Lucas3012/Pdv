const BASE_URL = 'https://labs-loop-printer-richard.trycloudflare.com';

function getUrl(endpoint) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? endpoint : BASE_URL + endpoint;
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

async function showSection(section) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');

    switch (section) {
        case 'dashboard': await renderDashboard(); break;
        case 'produtos': await renderProdutos(); break;
        case 'entrada': renderFormMov('entrada'); break;
        case 'saida': renderFormMov('saida'); break;
        case 'historico': await renderHistorico(); break;
        case 'adm': await renderAdm(); break;
    }
}

// DASHBOARD
async function renderDashboard() {
    const res = await fetch(getUrl('/api/dashboard'));
    const data = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>📊 Dashboard</h1>
            <div class="cards-grid">
                <div class="card"><h3>Produtos</h3><p>${data.totalProdutos}</p></div>
                <div class="card" style="border-color:var(--success)"><h3>Vendas</h3><p>${data.totalVendas}</p></div>
            </div>
        </div>`;
}

// PRODUTOS
async function renderProdutos() {
    const res = await fetch(getUrl('/api/produtos'));
    const produtos = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>📦 Estoque</h1>
            <button onclick="novoProduto()" class="btn-main">+ Adicionar Produto</button>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Nome</th><th>Preço</th><th>Estoque</th><th>ID</th></tr></thead>
                    <tbody>
                        ${produtos.map(p => `<tr>
                            <td><b>${p.nome}</b></td>
                            <td>R$ ${p.preco.toFixed(2)}</td>
                            <td><span class="badge">${p.estoque}</span></td>
                            <td><small>${p._id}</small></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

async function novoProduto() {
    const { value: f } = await Swal.fire({
        title: 'Novo Produto',
        html: '<input id="n" class="swal2-input" placeholder="Nome"><input id="p" type="number" class="swal2-input" placeholder="Preço"><input id="e" type="number" class="swal2-input" placeholder="Estoque Inicial">',
        preConfirm: () => ({ nome: document.getElementById('n').value, preco: document.getElementById('p').value, estoque: document.getElementById('e').value })
    });
    if (f) {
        await fetch(getUrl('/api/produtos'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(f) });
        renderProdutos();
    }
}

// MOVIMENTAÇÕES
function renderFormMov(tipo) {
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>${tipo === 'saida' ? '🛒 Venda' : '📥 Entrada'}</h1>
            <div class="pdv-box">
                <label>ID do Produto:</label>
                <input type="text" id="pId">
                <label>Quantidade:</label>
                <input type="number" id="pQtd" value="1">
                <button onclick="salvarMov('${tipo}')" style="background:${tipo==='saida'?'var(--danger)':'var(--success)'}">Confirmar</button>
            </div>
        </div>`;
}

async function salvarMov(tipo) {
    const res = await fetch(getUrl('/api/movimentacao'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ produto_id: document.getElementById('pId').value, quantidade: document.getElementById('pQtd').value, tipo })
    });
    if (res.ok) { Swal.fire('Sucesso', 'Estoque atualizado', 'success'); showSection('dashboard'); }
    else { Swal.fire('Erro', 'Verifique o ID ou Estoque', 'error'); }
}

// HISTÓRICO (CORRIGIDO)
async function renderHistorico() {
    const res = await fetch(getUrl('/api/historico'));
    const dados = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>📜 Histórico</h1>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th></tr></thead>
                    <tbody>
                        ${dados.map(h => `<tr>
                            <td>${new Date(h.data).toLocaleString()}</td>
                            <td>${h.produto_nome || h.produto_id}</td>
                            <td style="color:${h.tipo==='saida'?'var(--danger)':'var(--success)'}">${h.tipo.toUpperCase()}</td>
                            <td>${h.quantidade}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ADMIN (CORRIGIDO)
async function renderAdm() {
    const res = await fetch(getUrl('/api/usuarios'));
    const us = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>⚙️ Configurações</h1>
            <button onclick="novoUsuario()" class="btn-main" style="background:#8e44ad">+ Novo Usuário</button>
            <table>
                <thead><tr><th>Nome</th><th>Ações</th></tr></thead>
                <tbody>
                    ${us.map(u => `<tr><td>${u.nome}</td><td><button onclick="delU('${u._id}')">Remover</button></td></tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

async function novoUsuario() {
    const { value: n } = await Swal.fire({ title: 'Nome do Usuário', input: 'text' });
    if (n) {
        await fetch(getUrl('/api/usuarios'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nome: n }) });
        renderAdm();
    }
}

async function delU(id) {
    await fetch(getUrl('/api/usuarios/' + id), { method: 'DELETE' });
    renderAdm();
}

window.onload = () => {
    document.getElementById('btn-menu').addEventListener('click', toggleMenu);
    renderDashboard();
};
