#!/bin/bash
# "Ignored Build Step" da Vercel — decide se um push merece build.
#
# Contrato da Vercel (atencao, e invertido em relacao ao habitual):
#   exit 0  -> IGNORA o build (pula)
#   exit 1  -> PROSSEGUE com o build
#
# POR QUE ISTO EXISTE
# O DECISIONS.md registrava que a integracao GitHub -> Vercel fora desativada
# porque "cancela deploys automaticamente". Isso nao era escolha de politica: e
# o que acontece quando um repositorio recebe ~7 pushes/dia. Hoje sao: o worker
# a cada 25 municipios (~5/dia), a fase diaria (1/dia) e o robo do GitHub
# Actions (1/dia) — quase todos so de dado.
#
# Cada push dispararia um build que le ~25.500 JSONs e prerenderiza 267 paginas.
# A Vercel enfileira e cancela os superados, que e comportamento correto dela,
# mas gera ruido e desperdicio.
#
# Com este filtro, o deploy automatico volta a ser viavel: constroi quando algo
# que MUDA O SITE mudou, e pula os commits incrementais de coleta. Assim nao e
# preciso Deploy Hook nenhum — o proprio push publica, que e mais simples e nao
# exige guardar credencial de deploy na VPS.
#
# REGRA
#   1. Codigo, configuracao ou dado curado mudou  -> constroi
#   2. Commit incremental do worker (so data/)    -> pula
#   3. Qualquer outra coisa, ou duvida            -> constroi
#
# A duvida sempre constroi. Um build a mais custa minutos; um build a menos
# deixa o site desatualizado sem ninguem perceber — que foi exatamente o estado
# entre 20/06 e 16/08/2026.

set -uo pipefail

MSG=$(git log -1 --pretty=%s 2>/dev/null || echo "")

# Sem historico para comparar (primeiro build, clone raso): constroi.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "sem commit anterior para comparar — construindo"
  exit 1
fi

MUDOU=$(git diff --name-only HEAD^ HEAD 2>/dev/null || echo "")
if [ -z "$MUDOU" ]; then
  echo "nao consegui listar o diff — construindo por seguranca"
  exit 1
fi

# Qualquer coisa fora de data/ afeta o site: codigo, config, workflows, docs
# que viram pagina. Nesse caso constroi sem pensar mais.
if echo "$MUDOU" | grep -qvE '^data/'; then
  echo "mudanca fora de data/ — construindo"
  exit 1
fi

# So data/ mudou. Os manifestos do Sprint 2 alimentam /municipios e
# /municipios/[uf], que sao estaticas: sem build, o municipio novo nao aparece.
# Entao o commit DIARIO constroi; os incrementais do worker, nao.
case "$MSG" in
  "chore(coleta): coleta noturna"*)
    echo "commit da coleta diaria — construindo"
    exit 1
    ;;
  "chore(coleta): sprint2 24x7"*)
    echo "commit incremental do worker (so data/) — pulando build"
    exit 0
    ;;
  "data(automatic):"*)
    echo "atualizacao agendada de manifestos (so data/) — pulando build"
    exit 0
    ;;
esac

echo "commit de dado nao reconhecido — construindo por seguranca"
exit 1
