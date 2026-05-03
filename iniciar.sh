#!/bin/bash

echo "------------------------------------------"
echo "🔄 Ajustando segurança e Sincronizando..."
echo "------------------------------------------"

# Desativa verificação de SSL para evitar o erro TLS no Termux
git config http.sslVerify false

# Tenta puxar novidades
git pull origin main --rebase

# Adiciona e faz o commit
git add .
read -p "Mensagem do commit: " msg
if [ -z "$msg" ]; then msg="ajustes sistema $(date +'%H:%M')"; fi
git commit -m "$msg"

# Envia
if git push origin main; then
    echo "✅ GitHub atualizado com sucesso!"
else
    echo "❌ Erro no push. Tentando forçar..."
    git push origin main --force
fi

echo "------------------------------------------"
echo "🌐 Iniciando servidor PDV..."
node server.js
