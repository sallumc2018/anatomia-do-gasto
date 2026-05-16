# Perguntas Frequentes (FAQ)

## Para o Cidadão

### O que é o Anatomia do Gasto?

É uma plataforma gratuita e de código aberto que coleta, organiza e exibe dados de gastos públicos de forma simples. O foco é mostrar, em linguagem clara, como o dinheiro do imposto é usado.

### O projeto é de algum partido ou governo?

Não. O projeto é independente, apartidário e mantido por um cidadão, sem vínculo com partidos, governos ou empresas.

### Os dados são confiáveis?

Os datasets publicados neste site vêm de portais oficiais de transparência. Para cada área publicada (saúde, educação, segurança, transporte), o pipeline de extração é automatizado, a fonte é declarada na página e a integridade dos totais é verificada. Para temas em construção ou mapeamento, declaramos o escopo e as limitações antes de publicar qualquer número — dado ausente não é tratado como zero.

### O site mostra irregularidades?

O site mostra dados oficiais de forma organizada e declara explicitamente quando um número está ausente ou quando a fonte não permite granularidade maior. **Não** faz auditoria jurídica nem emite juízos de valor — a interpretação final cabe ao cidadão e aos órgãos de controle. Funcionalidades de cruzamento por fornecedor, CNPJ ou contrato ainda não estão publicadas.

### Por que só tem Sorocaba?

O projeto começou por Sorocaba como prova de conceito. A meta é expandir para outros municípios. Veja o [roadmap](roadmap.md).

### Posso sugerir minha cidade?

Sim. Abra uma [issue no GitHub](https://github.com/sallumc2018/anatomia-do-gasto/issues) com o nome do município e, se possível, o link do portal da transparência local.

---

## Para o Jornalista

### Como usar os dados em uma reportagem?

Os CSVs publicados ficam em `data/public/`. Dados extraídos, mas ainda não validados, ficam em `data/extracted/` e não devem ser tratados como publicação oficial. Você pode abrir os CSVs no Excel ou Google Sheets; para cruzamentos mais avançados, recomendamos Python (pandas) ou R.

### Preciso creditar o projeto?

Sim. Pedimos que cite "Fonte: Anatomia do Gasto (anatomiadogasto.ong.br)" e, quando possível, coloque o link para a página consultada.

### O projeto faz investigações sob demanda?

Não. Mas aceitamos sugestões de pautas e podemos incluir novas fontes de dados no pipeline se houver viabilidade técnica.

---

## Para o Desenvolvedor

### Qual a stack do projeto?

Python (pdfplumber, pandas) para o pipeline de dados e Next.js (TypeScript, Tailwind CSS, Recharts) para o frontend. Veja [arquitetura.md](arquitetura.md) para detalhes.

### Como rodar localmente?

Siga as instruções no [README.md](../README.md#4-como-executar).

### Como contribuir com código?

Leia o [CONTRIBUTING.md](../CONTRIBUTING.md). Pull requests são bem-vindos.

### Os dados estão disponíveis via API?

Ainda não. O site lê CSVs publicados em `data/public/` diretamente do sistema de arquivos durante o build/render do Next.js. Uma API pública está no radar para uma fase futura.

### Posso usar os dados em meu próprio projeto?

Sim. O projeto está sob licença MIT. Os dados são públicos e podem ser reutilizados livremente, com a devida citação da fonte.
