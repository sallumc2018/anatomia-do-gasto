# Cláusulas Pétras — Anatomia do Gasto

**Versão:** v1 — 2026-05-24  
**Validade:** imutável até ocorrer ao menos uma das condições abaixo:
- Upgrade de hardware: RAM, SSD/HD, ou adição de GPU dedicada
- Novo major de modelo Claude (ex: Claude 5.x)
- Reestruturação significativa do ecossistema de ferramentas

**Revisão obrigatória** ao atingir qualquer condição. Versionar em git com tag `clausulas-petras-vN`.

---

## Bloco I — Stack Canônica

| Camada | Tecnologia | Regra |
|--------|-----------|-------|
| Frontend | Next.js + TypeScript | Única opção; sem frameworks alternativos |
| Pipeline | Python 3.x | Única opção para extração/transformação |
| Deploy | Vercel via **API REST** | Nunca usar CLI local (risco de OOM) |
| VCS | GitHub | Branch `main` = produção |
| Storage pesado | Google Drive (`G:\Meu Drive\Omega-data\`) via junction | `data/raw` e `data/extracted` nunca em C: |
| Token | RTK | Sempre ativo; `rtk gain` ao encerrar sessão |

---

## Bloco II — Agentes e Autoridade

**O Maestro é dispatcher puro.** Nunca executa o que é dos especializados.

| Agente | Domínio exclusivo |
|--------|------------------|
| Vitrúvio | Frontend + backend + infra + arquitetura |
| Catão | Segurança, npm, MCP, firewall |
| Plínio | Análise de dados em linguagem cidadã |
| Frontino | Cobertura LAI, score, e-SIC |

**Nenhum agente autoriza por conta própria:**
- commit, push ou deploy
- mover dados para `data/public/`
- deletar arquivos ou branches
- instalar dependências
- alterar DNS, domínio ou variáveis de ambiente

Toda ação nessa lista exige **confirmação explícita do usuário** antes de execução.

---

## Bloco III — Dados

1. **Proveniência obrigatória:** todo dataset deve documentar URL de origem + data de coleta.
2. **Pipeline canônico imutável:**
   ```
   raw → extracted → validated → QA → Plínio (interpretação) → public → commit
   ```
   Nunca pular etapas. Sem interpretação em linguagem cidadã aprovada = dado não vai para `data/public/`.
3. **QA é portão:** sem PASS do `/qa`, nenhum dado avança.
4. **Plínio é portão:** sem interpretação cidadã aprovada, nenhum dado é publicado — dados brutos não são transparência.
5. **Só `data/public/` vai no git.** `raw` e `extracted` ficam no Google Drive.
6. **Publicar antes de commitar** — o commit deve refletir o estado público final.
7. **Escala:** toda decisão de schema, pipeline e rota considera replicação para 5.570 municípios.

---

## Bloco IV — Segurança

1. **npm install/update/audit fix: proibido** enquanto alerta de worm ativo. Status em 2026-05-24: GitHub reconheceu publicamente; ataque comprometeu conta de funcionário via extensão VS Code — vetor VS Code extensions confirmado. Revisar mensalmente via Catão (rotina automática ativa: 1º de cada mês).
2. **Secrets nunca em repo:** `.env.local` e variáveis de ambiente Vercel são os únicos locais válidos.
3. **MCP:** auditar antes de instalar qualquer novo servidor (método: scan estático sem execução).
4. **`--no-verify` proibido** em commits e pushes — hooks existem por razão; pular é mascarar o problema.
5. **Ações destrutivas** (delete, reset --hard, force push) exigem confirmação explícita do usuário.
6. **Catão tem veto:** qualquer agente deve parar e escalar ao Catão se detectar anomalia de segurança.

---

## Bloco V — Missão ONG

1. **Transparência radical:** todos os dados produzidos são públicos por definição.
2. **LAI é direito, não cortesia:** quando dados não estão disponíveis publicamente, abrir e-SIC via Frontino.
3. **Linguagem cidadã:** dados só estão publicados quando Plínio os torna compreensíveis sem formação técnica.
4. **Sorocaba é o piloto:** fechar 100% de cobertura antes de onboarding de novo município.
5. **Nenhum dado fabricado:** se a fonte não existe ou está inacessível, registrar como `lacuna` — nunca inferir ou preencher.

---

## Bloco VI — Restrições de Hardware (setup 2026-05-24)

| Componente | Especificação real |
|-----------|-------------------|
| RAM | 8 GB |
| CPU | Intel i5-7200U — 2 cores / 4 threads |
| GPU | Intel HD 620 (integrada) — sem GPU dedicada |
| C: livre | ~13,5 GB (limpeza prevista 2026-05-24) |
| G: livre | ~12,9 GB (limpeza prevista 2026-05-24) |
| WSL | Ubuntu 22.04 (WSL 2.7.3) |

**Regras derivadas:**

1. **Streaming obrigatório** para qualquer arquivo > 200 MB — nunca carregar em memória inteira.
2. **Sem inferência local de ML** — sem GPU dedicada e RAM insuficiente.
3. **Alerta de disco:** avisar o usuário antes de qualquer operação que consuma > 5 GB em C: ou G:.
4. **Deploy local proibido** (`vercel build` localmente) — OOM confirmado. Usar API REST.
5. **Processar PDFs em lotes** (máx. ~50 por vez) para evitar OOM em extrações grandes.
