#!/bin/bash

# Initialize version type flag
increment_type="patch"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --major)
      increment_type="major"
      shift
      ;;
    --minor)
      increment_type="minor"
      shift
      ;;
    *)
      # Unknown option
      shift
      ;;
  esac
done

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

  # Incrementar versão baseado no tipo especificado
  case $increment_type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      echo "Incrementando versão major: $major.$minor.$patch"
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      echo "Incrementando versão minor: $major.$minor.$patch"
      ;;
    patch|*)
      patch=$((patch + 1))
      echo "Incrementando versão patch: $major.$minor.$patch"
      ;;
  esac

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