const express = require('express');
const Datastore = require('nedb');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Define o caminho para a pasta data na raiz do projeto
const dataPath = path.join(__dirname, 'data');

// Inicializa os bancos de dados dentro da pasta data
const db = {};
db.produtos = new Datastore({ filename: path.join(dataPath, 'produtos.db'), autoload: true });
db.movimentacoes = new Datastore({ filename: path.join(dataPath, 'movimentacoes.db'), autoload: true });
db.usuarios = new Datastore({ filename: path.join(dataPath, 'usuarios.db'), autoload: true });

// Rota de teste para verificar se o servidor está vivo
app.get('/api/status', (req, res) => {
    res.json({ status: "online", database: "data/" });
});

// Exemplo de rota de Dashboard
app.get('/api/dashboard', (req, res) => {
    db.produtos.count({}, (err, totalProdutos) => {
        db.movimentacoes.count({ tipo: 'saida' }, (err, totalVendas) => {
            res.json({ totalProdutos, totalVendas });
        });
    });
});

// Rota para listar produtos
app.get('/api/produtos', (req, res) => {
    db.produtos.find({}, (err, docs) => res.json(docs));
});

// Servir arquivos estáticos (index, script, style) da raiz
app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`📂 Banco de dados sincronizado na pasta: ${dataPath}`);
});
