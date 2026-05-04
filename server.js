const express = require('express');
const Datastore = require('nedb');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Caminho para a pasta data
const dataPath = path.join(__dirname, 'data');

// Inicialização dos Bancos de Dados
const db = {};
db.produtos = new Datastore({ filename: path.join(dataPath, 'produtos.db'), autoload: true });
db.movimentacoes = new Datastore({ filename: path.join(dataPath, 'movimentacoes.db'), autoload: true });
db.usuarios = new Datastore({ filename: path.join(dataPath, 'usuarios.db'), autoload: true });

// --- ROTAS DO DASHBOARD ---
app.get('/api/dashboard', (req, res) => {
    db.produtos.count({}, (err, totalProdutos) => {
        db.movimentacoes.count({ tipo: 'saida' }, (err, totalVendas) => {
            res.json({ totalProdutos: totalProdutos || 0, totalVendas: totalVendas || 0 });
        });
    });
});

// --- ROTAS DE PRODUTOS ---
app.get('/api/produtos', (req, res) => {
    db.produtos.find({}).sort({ nome: 1 }).exec((err, docs) => res.json(docs));
});

app.post('/api/produtos', (req, res) => {
    const novo = { ...req.body, estoque: parseInt(req.body.estoque) || 0, preco: parseFloat(req.body.preco) || 0 };
    db.produtos.insert(novo, (err, doc) => res.json(doc));
});

// --- ROTAS DE MOVIMENTAÇÃO (HISTÓRICO) ---
app.get('/api/historico', (req, res) => {
    db.movimentacoes.find({}).sort({ data: -1 }).exec((err, docs) => res.json(docs));
});

app.post('/api/movimentacao', (req, res) => {
    const { produto_id, quantidade, tipo } = req.body;
    const qtd = parseInt(quantidade);

    db.produtos.findOne({ _id: produto_id }, (err, produto) => {
        if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

        const novoEstoque = tipo === 'entrada' ? produto.estoque + qtd : produto.estoque - qtd;
        if (novoEstoque < 0) return res.status(400).json({ erro: "Estoque insuficiente" });

        db.produtos.update({ _id: produto_id }, { $set: { estoque: novoEstoque } }, {}, () => {
            db.movimentacoes.insert({
                produto_id,
                produto_nome: produto.nome,
                quantidade: qtd,
                tipo,
                data: new Date()
            }, (err, doc) => res.json(doc));
        });
    });
});

// --- ROTAS DE USUÁRIOS (ADMIN) ---
app.get('/api/usuarios', (req, res) => {
    db.usuarios.find({}, (err, docs) => res.json(docs));
});

app.post('/api/usuarios', (req, res) => {
    db.usuarios.insert(req.body, (err, doc) => res.json(doc));
});

app.delete('/api/usuarios/:id', (req, res) => {
    db.usuarios.remove({ _id: req.params.id }, {}, (err, num) => res.json({ removidos: num }));
});

// Servir arquivos estáticos
app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor pronto na porta ${PORT}`);
});
