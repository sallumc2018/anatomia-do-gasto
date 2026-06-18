# Pipeline de Deploy — Vercel Produção

## Regra fundamental

**Deploy EXCLUSIVAMENTE via Antigravity (agy).** Nunca via integração GitHub.  
Todos os GitHub auto-deploys estão configurados como CANCELED no projeto Vercel.

## Pré-requisitos

1. Branch `main` com todos os commits desejados
2. `data/public/` com os dados mais recentes
3. `datasets_status.json` gerado após última mudança em data/public

## Checklist obrigatório (executar antes do deploy)

```bash
# 1. Rodar o gate automatizado
python3 tools/gates/pre_deploy.py

# 2. Verificar se o gate passou sem erros
# Se falhar → corrigir o problema reportado antes de continuar

# 3. Verificar build local (opcional mas recomendado após mudanças em next.config.ts)
cd apps/web && npm run build
```

## Execução do deploy (via Antigravity)

```bash
cd ~/Documents/Omega/02-repos/00-anatomia-do-gasto
git push origin main
npx vercel deploy --prod --yes
```

## Verificação pós-deploy

1. Abrir `https://anatomiadogasto.ong.br` e verificar páginas principais
2. Nos build logs Vercel: verificar se alguma Lambda ultrapassa 250MB
3. Testar endpoints críticos:
   - `/sorocaba/autarquias` — deve mostrar tabelas com dados
   - `/sorocaba/camara-municipal` — deve mostrar despesas TCE
   - `/paulinia/transferencias` — deve mostrar downloads disponíveis

## Limites de Lambda (Vercel)

| Tipo de dado | Tamanho | Estratégia |
|---|---|---|
| Despesas prefeitura Sorocaba | ~90MB | Redirect para GitHub Raw |
| Autarquias Sorocaba | ~58MB | `outputFileTracingIncludes` cirúrgico |
| Empenhos Sorocaba | ~44MB | Redirect para GitHub Raw |
| Paulínia completo | ~38MB | Bundled na Lambda API |
| Framework Next.js | ~30MB | Fixo |
| **Total Lambda API** | **~89MB** | **< 250MB ✅** |

## Troubleshooting

### Lambda > 250MB
- Verificar se `outputFileTracingExcludes` está ativo para `/api/dados/[...slug]`
- Verificar se `/*turbopackIgnore: true*/` está em todos `process.cwd()` das páginas SSR
- Nunca usar `next build --webpack` — apenas Turbopack

### Página SSR mostra dados vazios no Vercel (mas funciona local)
- Página provavelmente usa `process.cwd()` sem `turbopackIgnore`
- Adicionar entrada em `outputFileTracingIncludes` no `next.config.ts`
- Ver commit `48add5b` para exemplo de fix

### GitHub auto-deploy disparado acidentalmente
- Isso é esperado — o projeto está configurado para CANCELAR deploys automáticos
- Apenas deploys via `npx vercel deploy --prod --yes` são executados
