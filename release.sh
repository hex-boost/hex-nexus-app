#!/bin/bash

# Obter a última tag no formato v*.*.* ordenada por versão
ultima_tag=$(git tag -l "v*.*.*" | sort -V | tail -n1)

if [ -z "$ultima_tag" ]; then
  echo "Nenhuma tag encontrada. Iniciando com v0.0.1"
  nova_tag="v0.0.1"
else
  echo "Última tag: $ultima_tag"

  # Extrair os componentes da versão
  versao=${ultima_tag#v}
  IFS='.' read -r major minor patch <<< "$versao"

  # Incrementar o patch
  patch=$((patch + 1))

  # Compor a nova tag
  nova_tag="v$major.$minor.$patch"
fi

echo "Criando nova tag: $nova_tag"

# Criar a nova tag
git tag $nova_tag

# Push da nova tag para o repositório
git push origin $nova_tag

git push origin main

echo "Tag $nova_tag criada e enviada para o repositório."
sleep 2