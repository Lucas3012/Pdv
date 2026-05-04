#!/bin/bash

# 1. Limpeza de processos antigos
pkill cloudflared
pkill node

echo "------------------------------------------"
echo "📂 1. Preparando Ambiente e Banco de Dados..."
echo "------------------------------------------"
# Garante que a pasta data exista e tenha permissões
mkdir -p data
chmod 777 data

echo "------------------------------------------"
echo "🌍 2. Gerando Túnel Cloudflare..."
echo "------------------------------------------"
# Inicia o túnel e salva o log
cloudflared tunnel --url http://127.0.0.1:3000 > tunnel.log 2>&1 &

# Aguarda o link ser gerado (10 segundos é o ideal)
sleep 10

# Extrai o link público do Cloudflare
LINK_PUBLICO=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' tunnel.log | head -n 1)

if [ -z "$LINK_PUBLICO" ]; then
    echo "❌ Erro ao capturar o link. Verifique sua conexão."
    exit 1
fi

echo "🔗 Link capturado: $LINK_PUBLICO"

# 3. INJEÇÃO NO SCRIPT.JS (Caminho corrigido para a raiz)
# Isso remove o erro 'No such file or directory' que você teve
sed -i "s|const BASE_URL = .*|const BASE_URL = '$LINK_PUBLICO';|g" script.js

echo "------------------------------------------"
echo "📦 4. Sincronizando com GitHub..."
echo "------------------------------------------"
# Configurações para evitar erros de SSL no Termux
git config http.sslVerify false
git add .
git commit -m "Update: Link $LINK_PUBLICO e pasta data"
git push origin main --force

echo "------------------------------------------"
echo "🚀 5. Sistema Online!"
echo "📍 Público: $LINK_PUBLICO"
echo "📍 GitHub: https://lucas3012.github.io/Pdv/"
echo "------------------------------------------"

# Inicia o backend
node server.js
