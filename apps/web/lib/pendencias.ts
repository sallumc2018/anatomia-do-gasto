// Roadmap/pendências do painel interno. Mantido manualmente — atualizar
// conforme o trabalho avança (não é gerado por script).

export type Pendencia = {
  titulo: string
  descricao: string
  area: "coleta" | "publicacao" | "portal" | "juridico" | "infra"
  prioridade: "alta" | "media" | "baixa"
  atualizadoEm: string // YYYY-MM-DD
}

export const PENDENCIAS: Pendencia[] = [
  {
    titulo: "Rodar ranking de transferências (emendas federais)",
    descricao:
      "Coleta nacional de emendas federais (Sprint 2) segue rodando na janela noturna. Após avançar, rodar pipelines/gerar_ranking_transferencias.py para consolidar o ranking com o novo volume de dados.",
    area: "coleta",
    prioridade: "alta",
    atualizadoEm: "2026-07-11",
  },
  {
    titulo: "Decidir onde citar a conformidade CGU no portal",
    descricao:
      "docs/contexto-conformidade-dados-abertos-federal.md documenta a frase de contexto permitida sobre conformidade CGU, mas não está referenciada em nenhuma página do site. Falta decidir entre /fontes e /politica-de-dados.",
    area: "portal",
    prioridade: "baixa",
    atualizadoEm: "2026-07-11",
  },
  {
    titulo: "Definir escopo do 'hotspot refactor' (P2 Confiabilidade)",
    descricao:
      "Limpeza de lint (ruff) concluída. A segunda parte de P2 — refatorar hotspots de confiabilidade/DRY-SOLID — não tem escopo definido em nenhum doc. É domínio do Codex pela tabela de roteamento do CLAUDE.md; falta decisão de prioridade ou despacho.",
    area: "infra",
    prioridade: "media",
    atualizadoEm: "2026-07-11",
  },
  {
    titulo: "fase_publicar() sempre WARN para áreas SICONFI em coletar_municipio_sp.py",
    descricao:
      "A fase de publicação da coleta noturna Sprint 1 (municípios SP) gera WARN para as áreas executivo/fiscal/receita/transporte/segurança porque checa uma pasta 'validated' que não deveria existir para essas áreas (elas vão direto de extracted → public). A publicação sempre dependeu de um passo manual. Não investigado se afeta só SP ou também outros estados.",
    area: "publicacao",
    prioridade: "media",
    atualizadoEm: "2026-07-11",
  },
  {
    titulo: "datasets.csv sem registro para municípios Sprint 1/Sprint 2 recentes",
    descricao:
      "16 municípios de SP (Sprint 1) e a maior parte dos 491+ municípios do Sprint 2 nacional não têm entrada em data/manifests/datasets.csv, o que bloqueia publicar_dados.py para eles. Decisão de escopo parada há dias — requer definir se o cadastro é automatizado ou manual por lote.",
    area: "publicacao",
    prioridade: "media",
    atualizadoEm: "2026-07-11",
  },
  {
    titulo: "AGEM Sorocaba — LAI pendente dentro do prazo legal",
    descricao:
      "Pedido de acesso à informação junto à AGEM Sorocaba segue sem resposta, mas dentro do prazo legal (~19/07/2026). Sem ação necessária até o vencimento.",
    area: "juridico",
    prioridade: "baixa",
    atualizadoEm: "2026-07-11",
  },
  {
    titulo: "3 commits locais aguardando push/deploy",
    descricao:
      "Commits de correção do IBGE de Itaquaquecetuba, limpeza de lint e atualização de status seguem apenas locais — não enviados ao remoto nem deployados. Requer autorização explícita para publicar.",
    area: "infra",
    prioridade: "media",
    atualizadoEm: "2026-07-11",
  },
]
