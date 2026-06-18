# Parecer LAI/LGPD — Folha Nominal de Servidores (SP Capital)

Autor: Claude Code (Fable 5) · 2026-06-13 · Anatomia do Gasto. Parte do hub `EXPANSAO-SP-CAPITAL.md`.
Aplica-se aos datasets SP: `folha-de-pagamentos`, `lista-de-servidores`, `servidores-ativos-da-prefeitura`, `remuneracao-servidores-prefeitura-de-sao-paulo`.

## 1. Pode publicar nome + remuneração? SIM — precedente direto

**STF, ARE 652777 / Tema 483** (Plenário, unânime, 01/07/2015): *"É legítima a publicação, inclusive em sítio eletrônico mantido pela Administração Pública, dos nomes de seus servidores e do valor dos correspondentes vencimentos e vantagens pecuniárias."*

- O caso foi movido **pelo próprio Município de São Paulo** (portal "De Olho nas Contas") — ou seja, a tese é diretamente aplicável à folha municipal de SP.
- Fundamento: princípio da **publicidade** (CF art. 37) e transparência (LAI, Lei 12.527/2011) prevalecem sobre privacidade quanto a **nome + remuneração** de agente público, que é informação de interesse coletivo.

## 2. LGPD não derruba isso — mas impõe limites de re-uso

A LGPD (13.709/2018) é posterior a 2015 e **convive** com o Tema 483:
- Base legal para a ONG processar: **interesse público / exercício regular de direitos** (LGPD art. 7º, II e IX) sobre **dado já tornado público pela Administração** (art. 7º, §3º — re-uso lícito desde que preservada a **finalidade**, a boa-fé e o interesse público que motivaram a divulgação original).
- A finalidade da ONG (controle social / transparência fiscal) é **compatível** com a finalidade original. Não pode haver **desvio de finalidade** (ex.: usar a folha para marketing, scoring, cruzamento que exponha o indivíduo além do que o Estado expôs).

## 3. O que NUNCA republicar (dado sensível / pessoal excedente)

Arquivos de folha às vezes vazam campos além do Tema 483. **Gate de scrub obrigatório antes de `public`** — remover:
- **CPF, RG, PIS/PASEP** (identificadores diretos)
- **Endereço residencial, telefone, e-mail pessoal**
- **Conta/agência bancária**
- **Dados de saúde** (afastamentos médicos, CID, licença-saúde, perícia) → **sensível, art. 5º II / art. 11**
- **Filiação sindical, origem racial, religião, dados de dependentes/menores**
- **Estagiários e menores aprendizes**: tratar com cautela extra (podem ser menores) — avaliar agregação em vez de nominal.

**Pode manter** (núcleo Tema 483): nome, cargo/função, órgão/lotação, vínculo, remuneração bruta, descontos legais (agregados), vantagens, jornada. Matrícula funcional: manter só se necessária para unicidade; nunca o CPF como chave.

## 4. Regras operacionais para o pipeline (Codex)

1. Coletar a folha em `raw` (vai p/ GDrive) **sem filtrar** (preservar a fonte como veio).
2. Na **extração** (`extracted`), aplicar o **scrub de colunas sensíveis** (lista §3) — manter só o núcleo Tema 483.
3. Manifest registra: base legal (**LAI + Tema 483**), data da fonte, colunas removidas no scrub, e classificação de lacuna se a fonte não trouxer um campo.
4. **Promoção a `public` só com autorização do autor** + checagem de que o scrub passou (nenhuma coluna da lista §3 presente).
5. **Minimização**: a ONG não deve *acrescentar* inferência ou cruzamento que revele mais que o Estado já revelou (ex.: não ligar folha a outros bancos para inferir patrimônio individual).

## 5. Direitos do titular & governança (LGPD art. 18)

- A ONG precisa manter **política de privacidade** pública + **canal de correção/retificação** e de pedido de revisão (já previsto na governança do projeto — confirmar que cobre folha nominal).
- Pedidos de remoção: avaliar caso a caso; dado de remuneração de agente público **não** é, em regra, removível (interesse público), mas **erro factual** deve ser corrigido e dado sensível vazado deve ser removido imediatamente.
- Aposentados/pensionistas: mesma lógica de agente público; pensão a **dependente** pode revelar terceiro → preferir agregação.

## 6. Veredito

Publicar **nome + cargo + lotação + remuneração** da folha de SP é **lícito e respaldado por precedente do STF específico de SP**. O risco real não é publicar — é **republicar campo sensível por descuido**. Logo: o controle-chave é o **gate de scrub na camada `extracted`**, documentado em manifest, antes de qualquer `public`. Seguir o padrão já usado em Sorocaba e reforçá-lo com a lista §3.
