// Palavras funcionais em português que, isoladas, não carregam intenção —
// não devem contar como sinal de match parcial (ex. "esse" não pode ligar
// "esse site" a "esse numero" só por coincidência de palavra genérica).
export const STOPWORDS = new Set([
  "aqui", "ali", "essa", "esse", "essas", "esses", "esta", "este", "estas",
  "estes", "isso", "isto", "aquilo", "aquele", "aquela", "aqueles", "aquelas",
  "onde", "quando", "quem", "qual", "quais", "como", "porque",
  "quanto", "quanta", "quantos", "quantas", "porque",
  "para", "pelo", "pela", "pelos", "pelas", "sobre", "entre", "sendo",
  "sido", "muito", "muita", "muitos", "muitas", "pouco", "pouca", "mesmo",
  "mesma", "mesmos", "mesmas", "cada", "todo", "toda", "todos", "todas",
  "algum", "alguma", "alguns", "algumas", "nenhum", "nenhuma", "outro",
  "outra", "outros", "outras", "ainda", "tambem", "apenas", "so", "ja",
  "voce", "voces", "nosso", "nossa", "nossos", "nossas", "seu", "sua",
  "seus", "suas", "meu", "minha", "meus", "minhas",
  // Substantivos institucionais genéricos demais para desambiguar rota
  // sozinhos (aparecem em quase toda pergunta sobre dados/ONG/cidade).
  "projeto", "prefeitura", "cidade",
])
