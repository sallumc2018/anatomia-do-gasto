#!/bin/bash
set -e

# Cores para output formatado
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Iniciando Configuração do Ecossistema Linux (Anatomia do Gasto) ===${NC}"

# 1. Configurar RTK
echo -e "\n${YELLOW}[1/3] Configurando RTK Token Economy...${NC}"
if command -v rtk &> /dev/null; then
    echo "RTK encontrado em: $(which rtk)"
    echo "Inicializando ganchos do RTK..."
    # Inicializar hooks globais
    rtk init -g || true
    rtk init -g --gemini || true
    echo -e "${GREEN}RTK configurado com sucesso!${NC}"
else
    echo "AVISO: RTK não está no PATH. Certifique-se de que ~/.local/bin está no seu PATH."
    echo "Para instalar o RTK: curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"
fi

# 2. Instalar Dependências no Venv
echo -e "\n${YELLOW}[2/3] Instalando dependências de IA (GPTCache, LLMLingua, HuggingFace)...${NC}"
if [ -d ".venv" ]; then
    echo "Venv encontrado. Ativando e instalando..."
    .venv/bin/pip install --upgrade pip
    
    # Instalar gptcache, llmlingua, e dependências para buscas locais de embeddings
    .venv/bin/pip install gptcache llmlingua faiss-cpu sentence-transformers
    
    echo -e "${GREEN}Dependências instaladas no venv com sucesso!${NC}"
else
    echo "AVISO: Pasta .venv não encontrada neste diretório. Execute a instalação do venv primeiro."
fi

# 3. Testar a inicialização do Cache local
echo -e "\n${YELLOW}[3/3] Validando funcionamento do GPTCache...${NC}"
if [ -f "tools/cache/gptcache_init.py" ]; then
    .venv/bin/python tools/cache/gptcache_init.py --test
    echo -e "${GREEN}Validação do GPTCache concluída!${NC}"
else
    echo "Erro: Script gptcache_init.py não encontrado."
fi

echo -e "\n${GREEN}=== Configuração Concluída com Sucesso! ===${NC}"
echo "Nota: Adicione suas chaves de API nos campos correspondentes em ~/.gemini/antigravity/mcp_config.json para ativar os MCPs externos."
