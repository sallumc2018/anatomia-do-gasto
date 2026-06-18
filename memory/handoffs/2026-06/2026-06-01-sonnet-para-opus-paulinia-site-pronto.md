# Handoff Sonnet → Opus — Paulínia: site pronto para revisão (2026-06-01)

**Para:** Opus. **Assunto:** camada de site de Paulínia concluída. Aguarda revisão e deploy.

**Commit:** `1ffdd67` · Branch: `codex/institutional-audit-data-catalog`

## O que foi entregue

### 7 páginas novas em `apps/web/app/paulinia/`

| Rota | Tipo Next.js | Dado principal |
|------|-------------|----------------|
| `/paulinia` | Static | executivo (anos disponíveis) |
| `/paulinia/executivo` | Dynamic (searchParams) | RREO Anexo 02 · SICONFI |
| `/paulinia/receita` | Dynamic (searchParams) | RREO Anexo 01 · SICONFI |
| `/paulinia/saude-fiscal` | Static | RGF (pessoal + dívida) · SICONFI |
| `/paulinia/seguranca` | Static | RREO Anexo 02 · SICONFI |
| `/paulinia/transporte` | Static | RREO + DCA · SICONFI |
| `/paulinia/transferencias` | Static | Fazenda/SP + Portal Transp. Federal |

**Páginas omitidas (sem dado público):** saude, educacao, camara-municipal, emendas, fornecedores, autarquias, controle-externo — documentado no `page.tsx` principal como "em coleta".

### `fluxo-data.ts` atualizado
- `PAULINIA_2024`: `status: "live"`, Sankey com receita 2.995M e liquidado 2.586M (dados reais SICONFI 2024).
- Paulínia aparece como município ativo no `/fluxo-financeiro`.

### Nota metodológica 2022 — IMPLEMENTADA
Em `/paulinia/executivo`, há box amarelo que aparece sempre (todos os anos) explicando que o SICONFI é o oficial e que o TCE difere 0,4% em 2022. Está em conformidade com DECISIONS.md.

### Build
```
✓ Compiled successfully
✓ Generating static pages (87/87)
Zero erros TypeScript.
```

## O que NÃO foi feito (decisão consciente)

| Item | Motivo |
|------|--------|
| `/paulinia/seguranca` subfunções | Paulínia não tem `despesas_seguranca_paulinia_*.csv` — só `rreo_seguranca_*`. Declarado na página. |
| Mapa-interativo (mindmap-data.ts) | Arquivo gerado por script — "Do not edit by hand". Requer `generate-mindmap-data.py`. |
| `gerar_datasets_json.py` | Parametrização é feature separada — não bloqueou lançamento. |
| Deploy | Portão Opus: revisar o site e rodar `vercel deploy --prod --yes` |

## Próximos passos para o Opus

1. **Revisar o site** — conferir textos, IBGE code, fontes declaradas em cada página
2. **Texto editorial contas 2020** — história das contas rejeitadas pelo TCE-SP (tarefa Plínio)
3. **Deploy** — `vercel deploy --prod --yes` da raiz do repo (não via GitHub — integração cancela)
4. **Opcional pós-deploy:** `generate-mindmap-data.py` para adicionar Paulínia ao mapa-interativo

## Referências
- `STATUS.md` — atualizar seção Paulínia
- `DECISIONS.md` — nota TCE×SICONFI 2022 já registrada (handoff anterior)
- Memória: `project_paulinia_coleta_completa`, `feedback_model_economy_split`
