const express = require('express');
const Datastore = require('nedb');
const path = require('path');
const cors = require('cors');

const app = express();

// Configurações essenciais para leitura de JSON e acesso externo
app.use(express.json());
app.use(cors());

// Caminho para a pasta de dados na raiz do projeto
const dataPath = path.join(__dirname, 'data');

// Inicialização dos bancos de dados (NeDB)
const db = {};
db.produtos = new Datastore({ filename: path.join(dataPath, 'produtos.db'), autoload: true });
db.movimentacoes = new Datastore({ filename: path.join(dataPath, 'movimentacoes.db'), autoload: true });
db.usuarios = new Datastore({ filename: path.join(dataPath, 'usuarios.db'), autoload: true });

// --- ROTAS DE DASHBOARD ---
app.get('/api/dashboard', (req, res) => {
    db.produtos.count({}, (err, totalProdutos) => {
        db.movimentacoes.count({ tipo: 'saida' }, (err, totalVendas) => {
            res.json({ 
                totalProdutos: totalProdutos || 0, 
                totalVendas: totalVendas || 0 
            });
        });
    });
});

// --- ROTAS DE PRODUTOS ---
app.get('/api/produtos', (req, res) => {
    db.produtos.find({}).sort({ nome: 1 }).exec((err, docs) => {
        if (err) return res.status(500).json(err);
        res.json(docs);
    });
});

app.post('/api/produtos', (req, res) => {
    const novo = { 
        nome: req.body.nome, 
        preco: parseFloat(req.body.preco) || 0, 
        estoque: parseInt(req.body.estoque) || 0,
        data: new Date()
    };
    db.produtos.insert(novo, (err, doc) => {
        if (err) return res.status(500).json(err);
        res.json(doc);
    });
});

// --- ROTAS DE MOVIMENTAÇÃO (ESTOQUE E HISTÓRICO) ---
app.get('/api/historico', (req, res) => {
    db.movimentacoes.find({}).sort({ data: -1 }).exec((err, docs) => {
        if (err) return res.status(500).json(err);
        res.json(docs);
    });
});

app.post('/api/movimentacao', (req, res) => {
    const { produto_id, quantidade, tipo } = req.body;
    const qtd = parseInt(quantidade);

    db.produtos.findOne({ _id: produto_id }, (err, produto) => {
        if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

        const novoEstoque = tipo === 'entrada' ? produto.estoque + qtd : produto.estoque - qtd;
        
        if (tipo === 'saida' && novoEstoque < 0) {
            return res.status(400).json({ erro: "Estoque insuficiente para venda" });
        }

        db.produtos.update({ _id: produto_id }, { $set: { estoque: novoEstoque } }, {}, () => {
            const registro = {
                produto_id,
                produto_nome: produto.nome,
                quantidade: qtd,
                tipo,
                data: new Date()
            };
            db.movimentacoes.insert(registro, (err, doc) => {
                if (err) return res.status(500).json(err);
                res.json(doc);
            });
        });
    });
});

// --- ROTAS DE USUÁRIOS (CONFIGURAÇÕES) ---
app.get('/api/usuarios', (req, res) => {
    db.usuarios.find({}).sort({ nome: 1 }).exec((err, docs) => {
        if (err) return res.status(500).json(err);
        res.json(docs);
    });
});

app.post('/api/usuarios', (req, res) => {
    const novoUsuario = {
        nome: req.body.nome,
        dataCriacao: new Date()
    };
    db.usuarios.insert(novoUsuario, (err, doc) => {
        if (err) return res.status(500).json(err);
        res.json(doc);
    });
});

app.delete('/api/usuarios/:id', (req, res) => {
    db.usuarios.remove({ _id: req.params.id }, {}, (err, numRemoved) => {
        if (err) return res.status(500).json(err);
        res.json({ removidos: numRemoved });
    });
});

// Servir arquivos estáticos (HTML, JS, CSS)
app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor ON na porta ${PORT}`);
});
