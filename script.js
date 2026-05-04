// O link será injetado pelo iniciar.sh nesta variável
const BASE_URL = 'https://historical-boat-module-techno.trycloudflare.com';

// Resolve a URL dependendo de onde o sistema está rodando
function getUrl(endpoint) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? endpoint : BASE_URL + endpoint;
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// Navegação entre seções
async function showSection(section) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');

    const content = document.getElementById('content');
    content.innerHTML = `<div class="section-container" style="text-align:center; padding-top:50px;">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--primary);"></i>
        <p>Carregando...</p>
    </div>`;

    switch (section) {
        case 'dashboard': await renderDashboard(); break;
        case 'produtos': await renderProdutos(); break;
        case 'entrada': renderFormMov('entrada'); break;
        case 'saida': renderFormMov('saida'); break;
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
    } catch (e) { console.error(e); }
}

// --- PRODUTOS ---
async function renderProdutos() {
    try {
        const res = await fetch(getUrl('/api/produtos'));
        const produtos = await res.json();
        document.getElementById('content').innerHTML = `
            <div class="section-container">
                <h1>📦 Estoque de Produtos</h1>
                <button onclick="novoProduto()" class="btn-main" style="margin-bottom:20px">+ Adicionar Novo Produto</button>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Nome</th><th>Preço</th><th>Qtd</th><th>ID (Copiar)</th></tr></thead>
                        <tbody>
                            ${produtos.map(p => `<tr>
                                <td><b>${p.nome}</b></td>
                                <td>R$ ${parseFloat(p.preco).toFixed(2)}</td>
                                <td><span class="badge">${p.estoque}</span></td>
                                <td><small style="cursor:pointer; color:var(--primary)" onclick="copyToClipboard('${p._id}')">${p._id}</small></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    } catch (e) { console.error(e); }
}

async function novoProduto() {
    const { value: formValues } = await Swal.fire({
        title: 'Novo Produto',
        html:
            '<input id="sw-nome" class="swal2-input" placeholder="Nome">' +
            '<input id="sw-preco" type="number" class="swal2-input" placeholder="Preço">' +
            '<input id="sw-qtd" type="number" class="swal2-input" placeholder="Estoque Inicial">',
        focusConfirm: false,
        preConfirm: () => {
            return {
                nome: document.getElementById('sw-nome').value,
                preco: document.getElementById('sw-preco').value,
                estoque: document.getElementById('sw-qtd').value
            }
        }
    });

    if (formValues && formValues.nome) {
        const res = await fetch(getUrl('/api/produtos'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formValues)
        });
        if (res.ok) { 
            Swal.fire('Sucesso', 'Produto salvo!', 'success'); 
            renderProdutos(); 
        }
    }
}

// --- MOVIMENTAÇÕES ---
function renderFormMov(tipo) {
    document.getElementById('content').innerHTML = `
        <div class="section-container">
            <h1>${tipo === 'saida' ? '🛒 Registrar Venda' : '📥 Registrar Entrada'}</h1>
            <div class="pdv-box">
                <label>ID do Produto (Clique no ID na lista para copiar):</label>
                <input type="text" id="pId" placeholder="Cole o ID aqui">
                <label>Quantidade:</label>
                <input type="number" id="pQtd" value="1">
                <button onclick="salvarMov('${tipo}')" style="background:${tipo==='saida'?'var(--danger)':'var(--success)'}; border:none; padding:15px; color:white; width:100%; border-radius:8px; cursor:pointer; font-weight:bold;">
                    Confirmar ${tipo.toUpperCase()}
                </button>
            </div>
        </div>`;
}

async function salvarMov(tipo) {
    const produto_id = document.getElementById('pId').value;
    const quantidade = document.getElementById('pQtd').value;

    if(!produto_id) return Swal.fire('Erro', 'Informe o ID do produto', 'error');

    const res = await fetch(getUrl('/api/movimentacao'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id, quantidade, tipo })
    });

    if (res.ok) { 
        Swal.fire('Sucesso', 'Movimentação concluída', 'success'); 
        showSection('dashboard'); 
    } else {
        const err = await res.json();
        Swal.fire('Erro', err.erro || 'Falha na operação', 'error');
    }
}

// --- HISTÓRICO ---
async function renderHistorico() {
    try {
        const res = await fetch(getUrl('/api/historico'));
        const dados = await res.json();
        document.getElementById('content').innerHTML = `
            <div class="section-container">
                <h1>📜 Histórico de Movimentações</h1>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Data/Hora</th><th>Produto</th><th>Tipo</th><th>Qtd</th></tr></thead>
                        <tbody>
                            ${dados.map(h => `<tr>
                                <td>${new Date(h.data).toLocaleString()}</td>
                                <td>${h.produto_nome || h.produto_id}</td>
                                <td style="color:${h.tipo==='saida'?'var(--danger)':'var(--success)'}; font-weight:bold;">${h.tipo.toUpperCase()}</td>
                                <td>${h.quantidade}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    } catch (e) { console.error(e); }
}

// --- ADMIN / CONFIGURAÇÕES ---
async function renderAdm() {
    try {
        const res = await fetch(getUrl('/api/usuarios'));
        const usuarios = await res.json();
        document.getElementById('content').innerHTML = `
            <div class="section-container">
                <h1>⚙️ Configurações / Usuários</h1>
                <button onclick="novoUsuario()" class="btn-main" style="background:var(--secondary); margin-bottom:20px">+ Adicionar Usuário</button>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Nome</th><th>Criado em</th><th>Ações</th></tr></thead>
                        <tbody>
                            ${usuarios.map(u => `<tr>
                                <td>${u.nome}</td>
                                <td>${new Date(u.dataCriacao).toLocaleDateString()}</td>
                                <td><button onclick="delUser('${u._id}')" style="background:var(--danger); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Remover</button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    } catch (e) { console.error(e); }
}

async function novoUsuario() {
    const { value: nome } = await Swal.fire({
        title: 'Novo Usuário',
        input: 'text',
        inputLabel: 'Nome do Usuário',
        showCancelButton: true
    });

    if (nome) {
        const res = await fetch(getUrl('/api/usuarios'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });
        if (res.ok) { 
            Swal.fire('Sucesso', 'Usuário criado!', 'success');
            renderAdm(); 
        }
    }
}

async function delUser(id) {
    const confirm = await Swal.fire({ title: 'Tem certeza?', icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
        await fetch(getUrl('/api/usuarios/' + id), { method: 'DELETE' });
        renderAdm();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        Swal.fire({ title: 'Copiado!', text: 'ID copiado para a área de transferência', icon: 'success', timer: 1500, showConfirmButton: false });
    });
}

// Inicialização
window.onload = () => {
    const btnMenu = document.getElementById('btn-menu');
    if (btnMenu) btnMenu.addEventListener('click', toggleMenu);
    showSection('dashboard');
};
