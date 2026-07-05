# Arquitetura dos Pipelines

## Orquestradores principais

### coletar_municipio_sp.py — Sprint 1
Coleta completa para municípios registrados em paths.py (SP).
Fases: SICONFI RREO → SICONFI DCA → SICONFI RGF → FNS → SIOPS → SIOPE/FNDE → Transferências Federais → Fazenda-SP → Publicar.
Uso: `python pipelines/coletar_municipio_sp.py --municipio campinas`

### coletar_sao_paulo.py — SP Capital
Orquestrador específico para São Paulo capital (volume muito maior).

### coletar_municipios_brasil.py — Sprint 2
Coleta fontes federais para qualquer município via IBGE CSV (5571 municípios).
Não requer registro em paths.py — usa env vars MUNICIPIO_IBGE/NOME/UF.
Suporte a `--paralelas N` para coletas simultâneas.
FONTES_FEDERAIS: 11 fontes (3 Portal Transparência + 8 SICONFI).
Uso: `python pipelines/coletar_municipios_brasil.py --uf SP`

### publicar_municipios_brasil.py — Publicação Sprint 2
Publica dados coletados do Sprint 2 para data/public/.
Trata slug collision (IBGE divergente) corretamente.

## Padrão de paths — paths.py
Municípios Sprint 1 são registrados em `pipelines/paths.py`:
```python
MUNICIPIOS = {
    "sorocaba": {"ibge": "3552205", "nome": "Sorocaba", "uf": "SP", "sefaz_sp": "..."},
    "campinas":  {"ibge": "3509502", "nome": "Campinas", "uf": "SP"},
    ...
}
```
Extractors lêem `CFG = MUNICIPIOS[MUNICIPIO]` onde `MUNICIPIO` é env var.
Sprint 2 bypassa paths.py via: `IBGE_SOROCABA = int(os.environ.get("MUNICIPIO_IBGE") or CFG["ibge"])`

## Slug collision — sprint2_keys.py
Municípios com mesmo nome em estados diferentes (ex: Palmas/TO e Palmas/PR) recebem
sufixo de UF: `palmas_to`, `palmas_pr`.
Funções:
- `municipio_storage_key(m, duplicated)` → chave canônica com sufixo
- `municipio_input_keys(m, duplicated)` → (canônica, legado) para busca retrocompatível

## Publicação — publicar_municipios_brasil.py
Lógica de IBGE divergente:
- Se dado está num diretório legado (sem sufixo) mas o IBGE não bate → IGNORADO (não REJEITADO)
- Isso evita ~952 falsos rejeites de municípios homônimos

## Coleta noturna — scripts/coleta_noturna.sh
Horário: 00:00 BRT (03:00 UTC) via cron.
Fluxo: Sync raw GDrive → Sync extracted GDrive → Coletar SP Capital → Sprint 1 → Gerar catálogo → Sync extracted para GDrive → Sync public para GDrive.

## Sprint 2 Rotação — scripts/sprint2_rotacao.sh
Horário: 00:05 BRT (03:05 UTC) via cron.
20 grupos de UFs, processa 1 grupo/noite (ciclo completo ~20 noites = ~3 semanas).
Estado persistido em `_logs/sprint2_rotacao/estado.txt`.
Timeout: 2h por execução.
