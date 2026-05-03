const express = require('express');
const Datastore = require('@seald-io/nedb');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
// Usa a porta do ambiente ou a 3000 por padrão
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicialização dos Bancos de Dados
const db = {};
db.usuarios = new Datastore({ filename: './data/usuarios.db', autoload: true });
db.produtos = new Datastore({ filename: './data/produtos.db', autoload: true });
db.movimentacoes = new Datastore({ filename: './data/movimentacoes.db', autoload: true });

// --- DASHBOARD ---
app.get('/api/dashboard', (req, res) => {
    db.produtos.count({}, (err, totalProdutos) => {
        db.movimentacoes.find({ tipo: 'saida' }, (err, movs) => {
            const totalVendas = movs.reduce((acc, curr) => acc + curr.quantidade, 0);
            res.json({ totalProdutos, totalVendas });
        });
    });
});

// --- PRODUTOS ---
app.get('/api/produtos', (req, res) => {
    db.produtos.find({}, (err, docs) => {
        if (err) return res.status(500).json([]);
        res.json(docs.map(p => ({ 
            ...p, 
            id: p._id, 
            preco: parseFloat(p.preco) || 0, 
            estoque: parseInt(p.estoque) || 0 
        })));
    });
});

app.post('/api/produtos', (req, res) => {
    const novo = { 
        nome: req.body.nome, 
        preco: parseFloat(req.body.preco) || 0, 
        estoque: 0 
    };
    db.produtos.insert(novo, (err, doc) => {
        if (err) return res.status(400).json(err);
        res.json({ ...doc, id: doc._id });
    });
});

// --- MOVIMENTAÇÃO (ENTRADA/SAÍDA) ---
app.post('/api/movimentacao', (req, res) => {
    const { produto_id, tipo, quantidade } = req.body;
    const qtd = parseInt(quantidade);

    db.produtos.findOne({ _id: produto_id }, (err, produto) => {
        if (!produto) return res.status(404).json({ error: "Produto não encontrado" });

        const novoEstoque = tipo === 'entrada' ? (produto.estoque + qtd) : (produto.estoque - qtd);

        db.produtos.update({ _id: produto_id }, { $set: { estoque: novoEstoque } }, {}, () => {
            db.movimentacoes.insert({ 
                produto_id, 
                tipo, 
                quantidade: qtd, 
                data: new Date() 
            }, () => {
                res.json({ message: "Sucesso" });
            });
        });
    });
});

// --- HISTÓRICO ---
app.get('/api/historico', (req, res) => {
    db.movimentacoes.find({}).sort({ data: -1 }).exec((err, movs) => {
        db.produtos.find({}, (err, prods) => {
            const prodMap = {};
            prods.forEach(p => prodMap[p._id] = p.nome);
            res.json(movs.map(m => ({
                id: m._id,
                produto: prodMap[m.produto_id] || "Excluído",
                tipo: m.tipo,
                quantidade: m.quantidade,
                data: m.data
            })));
        });
    });
});

// --- USUÁRIOS (ADM) ---
app.get('/api/usuarios', (req, res) => {
    db.usuarios.find({}, (err, docs) => { res.json(docs.map(u => ({ ...u, id: u._id }))); });
});

app.post('/api/usuarios', (req, res) => {
    db.usuarios.insert(req.body, (err, doc) => { res.json({ ...doc, id: doc._id }); });
});

app.delete('/api/usuarios/:id', (req, res) => {
    db.usuarios.remove({ _id: req.params.id }, {}, () => { res.json({ message: "Removido" }); });
});

// Inicia na porta definida, ouvindo em todas as interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => { 
    console.log(`🚀 Servidor rodando internamente na porta ${PORT}`); 
});
