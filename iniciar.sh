#!/bin/bash

# Limpeza de processos antigos para evitar conflitos
pkill cloudflared
pkill node

echo "------------------------------------------"
echo "🌍 1. Gerando Túnel Cloudflare..."
echo "------------------------------------------"
# Inicia o túnel e joga o log para um arquivo temporário
cloudflared tunnel --url http://127.0.0.1:3000 > tunnel.log 2>&1 &

# Espera o Cloudflare gerar o link (ajustado para sua conexão)
sleep 10

# Extrai o link .trycloudflare.com do arquivo de log
LINK_PUBLICO=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' tunnel.log | head -n 1)

if [ -z "$LINK_PUBLICO" ]; then
    echo "❌ Erro ao capturar o link. Verifique sua conexão."
    exit 1
fi

echo "🔗 Link capturado: $LINK_PUBLICO"

# 2. INJEÇÃO AUTOMÁTICA NO SCRIPT.JS (Caminho corrigido para sua raiz)
sed -i "s|const BASE_URL = .*|const BASE_URL = '$LINK_PUBLICO';|g" script.js

echo "------------------------------------------"
echo "📦 2. Sincronizando com GitHub..."
echo "------------------------------------------"
git config http.sslVerify false
git add .
git commit -m "Sistema atualizado - Link: $LINK_PUBLICO"
git push origin main --force

echo "------------------------------------------"
echo "🚀 3. Servidor Online!"
echo "📍 Local: http://localhost:3000"
echo "📍 Público: $LINK_PUBLICO"
echo "📍 GitHub Pages: https://lucas3012.github.io/Pdv/"
echo "------------------------------------------"

# Inicia o servidor e mantém o terminal aberto
node server.js
