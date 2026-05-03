#!/bin/bash

# --- CONFIGURAÇÃO ---
# Se você ainda não configurou seu Git, descomente as linhas abaixo e coloque seus dados
# git config --global user.email "seu-email@exemplo.com"
# git config --global user.name "Seu Nome"

echo "------------------------------------------"
echo "🚀 Iniciando Processo de Deploy e Servidor"
echo "------------------------------------------"

# 1. Fazendo o Push para o GitHub
echo "📂 Adicionando arquivos ao Git..."
git add .

echo "📝 Criando commit..."
read -p "Digite a mensagem do commit (ou aperte Enter para 'update'): " msg
if [ -z "$msg" ]; then
    msg="update"
fi
git commit -m "$msg"

echo "⬆️ Enviando para o GitHub..."
git push

echo "------------------------------------------"
echo "✅ GitHub atualizado com sucesso!"
echo "------------------------------------------"

# 2. Iniciando o servidor Node.js
echo "🌐 Iniciando servidor Node.js..."
echo "Acesse em: http://localhost:3000"
echo "------------------------------------------"

node server.js
