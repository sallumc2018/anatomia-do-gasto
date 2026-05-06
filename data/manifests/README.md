# Manifests De Dados

Esta pasta registra o ciclo de vida dos dados usados pelo projeto.

Estados:

- `raw`: fonte bruta preservada.
- `extracted`: saída mecânica dos extratores.
- `validated`: aprovado por verificação local.
- `public`: disponível para o site oficial.

Antes de mover qualquer CSV para `data/public`, registre a origem e a validação em um manifesto.
