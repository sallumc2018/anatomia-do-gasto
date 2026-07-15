# Handoff: Treinamento e protocolo dos agentes
**De:** Claude Opus (sessão Setup Claude Code — 2026-06-03)
**Para:** Claude Opus (próximas sessões de treinamento)
**Aprovado por:** NeoLogos em 2026-06-03

---

## Mapa completo dos agentes

| Agente | Invocação | Persona | Papel | Modelo correto |
|---|---|---|---|---|
| **Maestro** | `/maestro` | Dispatcher | Roteia tarefas, aprende padrões | Haiku (roteamento) / Sonnet (complexo) |
| **Catão** | `/catao` `/seguranca` | Fiscal romano | Segurança, watchdog, supply chain | Sonnet (execução) / Opus (decisões irreversíveis) |
| **Plínio** | `/plinio` `/analista` | Enciclopedista | **Analista + DBA** (escopo estendido 2026-06-03) | Sonnet (análise) / Opus (schema permanente) |
| **Vitrúvio** | `/vitruvio` | Polímata técnico | Full-stack: frontend + backend + infra + deploy | Sonnet (implementação) / Opus (arquitetura) |
| **Frontino** | `/frontino` `/cobertura` | Curador das águas | Auditor LAI, score de cobertura, e-SIC | Sonnet (execução) |
| **Théo** | interno | Aprendiz | C0 log-only, escopo ONG/LAI | Haiku / Sonnet quando promovido |

### Nota sobre Plínio (escopo estendido)
Plínio era Plínio, o Velho — autor da Naturalis Historia, o maior catálogo
de todo conhecimento da Roma antiga. Um catalogador é naturalmente um DBA:
sabe o que existe, como está organizado, como deve ser descrito.
Escopo estendido: além de interpretar dados para cidadãos, Plínio agora define
schemas, contratos de dados e estratégia de banco para escala nacional.
**Restrição:** decisões de schema que afetam `data/public/` exigem Opus.

---

## Gates de autonomia

| Gate | O que permite | Quem tem |
|---|---|---|
| C0 | Log-only — observa, não age | Théo |
| C1 | Propõe, humano aprova | — (futuro) |
| C2 | Executa com notificação | Maestro (route-readonly) |
| C3 | Executa autonomamente no escopo definido | — (a conquistar) |
| C4 | Autonomia total | — (não conceder ainda) |

Meta: Catão, Plínio, Vitrúvio e Frontino chegarem a C3 em seus escopos.

---

## Ordem de treinamento

### 1. Catão (segurança) — PRIMEIRO
**Por quê primeiro:** segurança antes de autonomia. Nenhum agente deve ter C3
antes de Catão estar treinado e confiável.

**Sessão de treinamento:**
1. Invocar `/catao` e pedir auditoria completa do repo
2. Observar o que ele encontra (comparar com os gaps já identificados)
3. Se encontrar algo não mapeado: registrar em `memory/knowledge/solutions.csv`
4. Se perder o escopo ou agir fora: corrigir e documentar o desvio
5. Meta: Catão executa GAPs 1 e 3 do handoff de segurança sem supervisão linha a linha

**O que Catão NÃO pode fazer sozinho (sempre precisa de aprovação):**
- Revogar tokens ou credenciais
- Modificar permissões de acesso
- Deletar arquivos de dados

---

### 2. Frontino (cobertura LAI) — SEGUNDO
**Por quê segundo:** saber o que falta antes de automatizar coleta.

**Sessão de treinamento:**
1. Invocar `/frontino` e pedir score LAI atual de Sorocaba
2. Verificar se o mapeamento dele bate com `data/manifests/datasets.csv`
3. Pedir que identifique os 3 maiores gaps de cobertura
4. Verificar se as sugestões de e-SIC fazem sentido (conteúdo e forma)
5. Meta: Frontino gera relatório de gaps e minutas de e-SIC sem revisão manual

**O que Frontino pode fazer sozinho:**
- Ler manifestos e calcular scores
- Identificar gaps e priorizar por impacto
- Redigir minutas de e-SIC (nunca enviar sem aprovação explícita)

---

### 3. Vitrúvio (full-stack) — TERCEIRO
**Por quê terceiro:** só constrói o que tem dado validado (depende de Catão + Frontino).

**Sessão de treinamento:**
1. Pedir que leia `sitemap.ts` e descreva o estado atual do site
2. Pedir que implemente uma melhoria pequena (ex: link "Ver fonte" em uma página)
3. Verificar se ele usa o padrão correto (Next.js, tailwind, sem npm install)
4. Verificar se ele commita com `[Claude]` e não faz deploy sem autorização
5. Meta: Vitrúvio implementa componentes e faz deploy sem supervisão linha a linha

**O que Vitrúvio NÃO pode fazer sozinho:**
- `vercel deploy --prod` sem aprovação
- Modificar `data/public/` diretamente
- Mudar rotas principais sem aprovação

---

### 4. Plínio (analista + DBA) — QUARTO
**Por quê quarto:** análise é o produto final — depende dos três acima.

**Sessão de treinamento:**
1. Pedir que leia `data/public/sorocaba/` e produza uma análise cidadã
2. Verificar se segue o padrão CER (Chão, Evidência, Rastro)
3. Pedir que defina o schema de um novo dataset (ex: transferências 2025)
4. Verificar se o schema é compatível com `datasets.csv` e BDD
5. Meta: Plínio produz análises e schemas sem revisão linha a linha

**Plínio no papel de DBA:**
- Define schemas para novos datasets (propõe — Opus valida)
- Documenta contratos de dados em `tools/qa/schemas/`
- Verifica compatibilidade entre fontes (SICONFI × TCE × BDD)

---

## Protocolo de supervisão (todas as sessões)

```
1. Invocar o agente com objetivo claro e escopo explícito
2. Primeiro turno: observar — não interromper, não corrigir no meio
3. Ao final: avaliar contra os critérios acima
4. Se acertou: registrar "lição aprendida" em agent_<nome>_identity.md
5. Se errou: registrar o desvio + correção em memory/knowledge/problems.csv
6. Nunca promover gate sem pelo menos 3 execuções corretas consecutivas
```

---

## Áreas não cobertas pelos agentes atuais

| Área | Quem cobre hoje | Gap |
|---|---|---|
| **Orquestração** (scheduler) | Ninguém | Agendamento dos 26 scripts |
| **Monitoramento** (site, dados) | Catão parcialmente | Sem alerta de data stale ou site down |
| **API pública** | Vitrúvio pode construir | Não existe ainda |
| **Testes automatizados** | Ninguém | Sem testes para scripts de coleta |
| **Backup** | Ninguém | G: drive = único ponto de falha |
| **Editorial** (texto cidadão) | Plínio + CER | Processo existe mas não automatizado |

Estas áreas vão para TASKS.md como itens de backlog.
