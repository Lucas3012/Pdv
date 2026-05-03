// O ficheiro iniciar.sh irá preencher esta variável automaticamente entre as aspas
const BASE_URL = 'https://oriental-bradley-statements-purpose.trycloudflare.com';

/**
 * Função Inteligente de URL
 * Se estiveres no telemóvel (localhost), usa o caminho local.
 * Se estiveres no link do GitHub, usa o túnel do Cloudflare (BASE_URL).
 */
function getUrl(endpoint) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const prefix = isLocal ? '' : BASE_URL;
    return prefix + endpoint;
}

// --- NAVEGAÇÃO ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

async function showSection(section) {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');

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
    try {
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
    } catch (e) { console.error("Erro no Dashboard:", e); }
}

// --- PRODUTOS ---
async function renderProdutos() {
    try {
        const res = await fetch(getUrl('/api/produtos'));
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
    } catch (e) { Swal.fire('Erro', 'Falha ao ligar ao servidor', 'error'); }
}

async function novoProduto() {
    const { value: f } = await Swal.fire({
        title: 'Novo Produto',
        html: '<input id="n" class="swal2-input" placeholder="Nome"><input id="p" type="number" class="swal2-input" placeholder="Preço">',
        preConfirm: () => ({ nome: document.getElementById('n').value, preco: document.getElementById('p').value })
    });
    if (f && f.nome) {
        await fetch(getUrl('/api/produtos'), { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(f) 
        });
        renderProdutos();
    }
}

// --- MOVIMENTAÇÕES (ENTRADA / VENDA) ---
function renderFormMovimentacao(tipo) {
    const isS = tipo === 'saida';
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>${isS ? '🛒 Realizar Venda' : '📥 Entrada de Estoque'}</h1>
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
    try {
        const res = await fetch(getUrl('/api/movimentacao'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                produto_id: document.getElementById('pId').value, 
                quantidade: document.getElementById('pQtd').value, 
                tipo 
            })
        });
        if (res.ok) { 
            Swal.fire('Sucesso!', 'Stock atualizado', 'success'); 
            showSection('dashboard'); 
        } else { 
            Swal.fire('Erro', 'Verifique o ID ou o Stock', 'error'); 
        }
    } catch (e) { Swal.fire('Erro', 'Servidor Offline', 'error'); }
}

// --- HISTÓRICO E PDF ---
async function renderHistorico() {
    try {
        const res = await fetch(getUrl('/api/historico'));
        const dados = await res.json();
        document.getElementById('content').innerHTML = `
            <div class="section-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h1>📜 Histórico</h1>
                    <button onclick="gerarPDF()" style="background:#273c75; font-size:12px;">📥 Gerar PDF</button>
                </div>
                <table id="tab-hist">
                    <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th></tr></thead>
                    <tbody>
                        ${dados.map(h => `<tr>
                            <td>${new Date(h.data).toLocaleString()}</td>
                            <td><b>${h.produto}</b></td>
                            <td style="color:${h.tipo==='saida'?'var(--danger)':'var(--success)'}">${h.tipo.toUpperCase()}</td>
                            <td>${h.quantidade}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (e) { console.error(e); }
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Movimentação", 14, 15);
    doc.autoTable({ 
        html: '#tab-hist', 
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] }
    });
    doc.save(`relatorio_${new Date().getTime()}.pdf`);
}

// --- PAINEL ADM ---
async function renderAdm() {
    try {
        const res = await fetch(getUrl('/api/usuarios'));
        const us = await res.json();
        document.getElementById('content').innerHTML = `
            <div class="section-container">
                <h1>⚙️ Painel ADM</h1>
                <button onclick="novoUsuario()" style="background:#8e44ad; margin-bottom:20px">+ Novo Usuário</button>
                <table>
                    <thead><tr><th>Nome</th><th>Login</th><th>Ações</th></tr></thead>
                    <tbody>
                        ${us.map(u => `<tr>
                            <td>${u.nome}</td>
                            <td>${u.usuario}</td>
                            <td><button onclick="delU('${u.id}')" style="background:var(--danger)">Excluir</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (e) { console.error(e); }
}

async function novoUsuario() {
    const { value: f } = await Swal.fire({
        title: 'Novo Usuário',
        html: '<input id="un" class="swal2-input" placeholder="Nome"><input id="ul" class="swal2-input" placeholder="Login">',
        preConfirm: () => ({ nome: document.getElementById('un').value, usuario: document.getElementById('ul').value })
    });
    if (f) { 
        await fetch(getUrl('/api/usuarios'), { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(f) 
        }); 
        renderAdm(); 
    }
}

async function delU(id) {
    await fetch(getUrl(`/api/usuarios/${id}`), { method: 'DELETE' });
    renderAdm();
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    const btn = document.getElementById('btn-menu');
    if(btn) btn.addEventListener('click', toggleMenu);
    renderDashboard();
};
