#!/bin/bash
# Script para instalar o lazygit localmente na pasta ~/.local/bin (sem necessidade de sudo)

echo "========================================================="
echo "Instalando o LazyGit localmente..."
echo "========================================================="

# Obter a versão mais recente do GitHub API
echo "Obtendo a versão mais recente do repositório..."
LAZYGIT_VERSION=$(curl -s "https://api.github.com/repositories/165284503/releases/latest" | grep -Po '"tag_name": *"v\K[^"]*')

if [ -z "$LAZYGIT_VERSION" ]; then
    echo "Não foi possível detectar a versão do LazyGit automaticamente."
    echo "Tentando usar a versão de fallback v0.42.0..."
    LAZYGIT_VERSION="0.42.0"
fi

echo "Versão selecionada: v$LAZYGIT_VERSION"

# Baixar o binário oficial tar.gz
echo "Baixando o arquivo compactado..."
curl -Lo /tmp/lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/download/v${LAZYGIT_VERSION}/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"

if [ $? -ne 0 ]; then
    echo "Erro ao fazer o download do LazyGit."
    exit 1
fi

# Descompactar o binário
echo "Descompactando o binário..."
tar -xf /tmp/lazygit.tar.gz -C /tmp lazygit

if [ ! -f /tmp/lazygit ]; then
    echo "Erro: binário lazygit não foi encontrado dentro do arquivo compactado."
    exit 1
fi

# Criar a pasta ~/.local/bin se ela não existir
mkdir -p ~/.local/bin

# Instalar na pasta de binários locais do usuário (já inclusa no PATH)
echo "Instalando o executável em ~/.local/bin/lazygit..."
install /tmp/lazygit -D -t ~/.local/bin/

# Limpar arquivos temporários
rm -f /tmp/lazygit /tmp/lazygit.tar.gz

echo "========================================================="
echo "LazyGit instalado com sucesso!"
echo "Para rodar, basta executar no seu terminal:"
echo "  lazygit"
echo "========================================================="
