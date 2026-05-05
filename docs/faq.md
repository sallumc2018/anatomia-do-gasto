# Perguntas Frequentes (FAQ)

## Para o Cidadão

### O que é o Anatomia do Gasto?

É uma plataforma gratuita e de código aberto que coleta, organiza e exibe dados de gastos públicos de forma simples. O foco é mostrar, em linguagem clara, como o dinheiro do imposto é usado.

### O projeto é de algum partido ou governo?

Não. O projeto é independente, apartidário e mantido por um cidadão, sem vínculo com partidos, governos ou empresas.

### Os dados são confiáveis?

Sim. Todos os dados vêm de portais oficiais de transparência. O pipeline de extração é automatizado e verificamos a integridade de cada valor extraído. A fonte e a data da coleta são sempre informadas.

### O site mostra irregularidades?

O site mostra os dados oficiais de forma organizada e aponta situações que merecem atenção (como emendas não pagas ou entidades com CNPJ irregular). Mas **não** faz auditoria jurídica nem emite juízos de valor. A interpretação final cabe ao cidadão e aos órgãos de controle.

### Por que só tem Sorocaba?

O projeto começou por Sorocaba como prova de conceito. A meta é expandir para outros municípios. Veja o [roadmap](roadmap.md).

### Posso sugerir minha cidade?

Sim. Abra uma [issue no GitHub](https://github.com/sallumc2018/anatomia-do-gasto/issues) com o nome do município e, se possível, o link do portal da transparência local.

---

## Para o Jornalista

### Como usar os dados em uma reportagem?

Todos os CSVs estão disponíveis no repositório (`frontend/data/`). Você pode baixá-los e abrir no Excel ou Google Sheets. Para cruzamentos mais avançados, recomendamos usar os dados brutos com ferramentas como Python (pandas) ou R. Se precisar de ajuda, entre em contato: [contato@anatomiadogasto.ong.br](mailto:contato@anatomiadogasto.ong.br).

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

Ainda não. O frontend lê CSVs diretamente do sistema de arquivos. Uma API pública está no radar para a Fase 3 do [roadmap](roadmap.md).

### Posso usar os dados em meu próprio projeto?

Sim. O projeto está sob licença MIT. Os dados são públicos e podem ser reutilizados livremente, com a devida citação da fonte.