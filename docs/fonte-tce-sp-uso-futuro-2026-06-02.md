# TCE-SP como fonte auxiliar - Sorocaba - 2026-06-02

Decisao: manter o inventario TCE-SP generico no projeto.

O arquivo `data/extracted/sorocaba/tce/contas_anuais/inventario_pdfs_contas_anuais.csv` nao deve ser usado como evidencia direta de contas municipais de Sorocaba, porque o inventario atual nao traz referencias a Sorocaba nos campos de rotulo, arquivo ou URL.

Mesmo assim, o TCE-SP continua util para:

- cruzar receitas, despesas, transferencias, Camara, autarquias e empresas municipais;
- validar dados enviados ao Tribunal contra dados publicados pela Prefeitura;
- encontrar processos, alertas, pareceres e fiscalizacoes que complementem a trilha municipal;
- apoiar obras, contratos e pagamentos quando o portal municipal nao trouxer granularidade suficiente.

Regra operacional para Codex e Claude: nao descartar TCE-SP. Tratar a fonte generica como auxiliar de controle e cruzamento; tratar apenas links/processos explicitamente municipais como evidencia de contas de Sorocaba.

Fonte municipal especifica atualmente preferida: `data/extracted/sorocaba/tce/contas_municipais/pareceres_tce_sorocaba.csv`.
