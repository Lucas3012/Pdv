#!/bin/bash

# Limpeza de processos
pkill cloudflared
pkill node

echo "------------------------------------------"
echo "🌍 1. Gerando Túnel Cloudflare..."
echo "------------------------------------------"
# Inicia o túnel e joga o log para um arquivo
cloudflared tunnel --url http://127.0.0.1:3000 > tunnel.log 2>&1 &
sleep 10

# Extrai o link gerado
LINK_PUBLICO=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' tunnel.log | head -n 1)

if [ -z "$LINK_PUBLICO" ]; then
    echo "❌ Erro ao gerar link. Verifique a internet."
    exit 1
fi

echo "🔗 Link capturado: $LINK_PUBLICO"

# 2. INJEÇÃO AUTOMÁTICA NO SCRIPT.JS
# Procura a linha que começa com 'const BASE_URL' e substitui pelo novo link
sed -i "s|const BASE_URL = .*|const BASE_URL = '$LINK_PUBLICO';|g" public/js/script.js

echo "------------------------------------------"
echo "📦 2. Sincronizando com GitHub..."
echo "------------------------------------------"
git config http.sslVerify false
git add .
git commit -m "Sistema atualizado com link: $LINK_PUBLICO"
git push origin main --force

echo "------------------------------------------"
echo "🚀 3. Servidor Online!"
echo "📍 Local: http://localhost:3000"
echo "📍 Público: $LINK_PUBLICO"
echo "📍 GitHub Pages: https://lucas3012.github.io/Pdv/"
echo "------------------------------------------"

node server.js
