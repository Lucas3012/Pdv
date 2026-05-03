// --- NAVEGAÇÃO ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

async function showSection(section) {
    document.getElementById('sidebar').classList.remove('active');
    switch (section) {
        case 'dashboard': await renderDashboard(); break;
        case 'entrada': renderFormMovimentacao('entrada'); break;
        case 'saida': renderFormMovimentacao('saida'); break;
        case 'produtos': await renderProdutos(); break;
        case 'historico': await renderHistorico(); break;
        case 'adm': await renderAdm(); break;
    }
}

// --- DASHBOARD ---
async function renderDashboard() {
    const res = await fetch('/api/dashboard');
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

// --- PRODUTOS ---
async function renderProdutos() {
    const res = await fetch('/api/produtos');
    const produtos = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>📦 Meus Produtos</h1>
            <button onclick="novoProduto()" class="btn-main">+ Novo Produto</button>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Nome</th><th>Preço</th><th>Estoque</th><th>ID</th></tr></thead>
                    <tbody>
                        ${produtos.map(p => `
                            <tr>
                                <td><b>${p.nome}</b></td>
                                <td>R$ ${p.preco.toFixed(2)}</td>
                                <td><span class="badge">${p.estoque}</span></td>
                                <td><code style="font-size:10px">${p.id}</code></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

async function novoProduto() {
    const { value: f } = await Swal.fire({
        title: 'Novo Produto',
        html: '<input id="n" class="swal2-input" placeholder="Nome"><input id="p" type="number" class="swal2-input" placeholder="Preço">',
        preConfirm: () => ({ nome: document.getElementById('n').value, preco: document.getElementById('p').value })
    });
    if (f && f.nome) {
        await fetch('/api/produtos', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(f) });
        renderProdutos();
    }
}

// --- ENTRADA / SAÍDA ---
function renderFormMovimentacao(tipo) {
    const isS = tipo === 'saida';
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>${isS ? '🛒 Venda' : '📥 Entrada'}</h1>
            <div class="pdv-box">
                <label>ID do Produto:</label>
                <input type="text" id="pId" placeholder="Cole o ID aqui">
                <label>Quantidade:</label>
                <input type="number" id="pQtd" value="1" min="1">
                <button onclick="salvarMov('${tipo}')" style="background:${isS?'var(--danger)':'var(--success)'}">Confirmar</button>
            </div>
        </div>`;
}

async function salvarMov(tipo) {
    const res = await fetch('/api/movimentacao', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ produto_id: document.getElementById('pId').value, quantidade: document.getElementById('pQtd').value, tipo })
    });
    if (res.ok) { Swal.fire('Sucesso!', 'Estoque atualizado', 'success'); showSection('dashboard'); }
    else { Swal.fire('Erro', 'Verifique o ID', 'error'); }
}

// --- HISTÓRICO E PDF ---
async function renderHistorico() {
    const res = await fetch('/api/historico');
    const dados = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h1>📜 Histórico</h1>
                <button onclick="gerarPDF()" style="background:#273c75; font-size:12px;">📥 PDF</button>
            </div>
            <table id="tab-hist">
                <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th></tr></thead>
                <tbody>
                    ${dados.map(h => `<tr>
                        <td>${new Date(h.data).toLocaleString()}</td>
                        <td>${h.produto}</td>
                        <td style="color:${h.tipo==='saida'?'red':'green'}">${h.tipo.toUpperCase()}</td>
                        <td>${h.quantidade}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatorio de Movimentacao", 14, 15);
    doc.autoTable({ html: '#tab-hist', startY: 20 });
    doc.save(`relatorio_${new Date().getTime()}.pdf`);
}

// --- ADM ---
async function renderAdm() {
    const res = await fetch('/api/usuarios');
    const us = await res.json();
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>⚙️ ADM</h1>
            <button onclick="novoUsuario()" style="background:#8e44ad; margin-bottom:20px">+ Usuário</button>
            <table>
                ${us.map(u => `<tr><td>${u.nome}</td><td><button onclick="delU('${u.id}')" style="background:red">Excluir</button></td></tr>`).join('')}
            </table>
        </div>`;
}

async function novoUsuario() {
    const { value: f } = await Swal.fire({
        title: 'Novo Usuário',
        html: '<input id="un" class="swal2-input" placeholder="Nome"><input id="ul" class="swal2-input" placeholder="Login">',
        preConfirm: () => ({ nome: document.getElementById('un').value, usuario: document.getElementById('ul').value })
    });
    if (f) { await fetch('/api/usuarios', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(f) }); renderAdm(); }
}

async function delU(id) {
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    renderAdm();
}

window.onload = () => {
    document.getElementById('btn-menu').addEventListener('click', toggleMenu);
    renderDashboard();
};
