"use client"

import React, { useState } from "react"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TheoGuide from "@/components/theo/theo-guide"
import { Terminal, Lightbulb, Compass, Award, Code2 } from "lucide-react"

const S = {
  container: { maxWidth: "1012px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--blue-40)",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  },
}

const CHIPS_SUGERIDOS = [
  { text: "Qual a missão da ONG?", icon: Award, query: "Qual é o propósito e a missão da ONG?" },
  { text: "Quais tecnologias são usadas?", icon: Code2, query: "Como este site foi desenvolvido e qual é a stack tecnológica?" },
  { text: "O que é o workspace Omega?", icon: Terminal, query: "Como funciona a organização de arquivos e o workspace Omega?" },
  { text: "Qual o roadmap de 90 dias?", icon: Compass, query: "O que o projeto está construindo nos próximos meses (Roadmap)?" },
  { text: "Como ajudar e ser voluntário?", icon: Lightbulb, query: "Como posso ser voluntário e ajudar o projeto?" },
  { text: "Como funcionam as IAs do projeto?", icon: Code2, query: "O que são os Agentes Inteligentes e o Maestro do projeto?" },
]

export default function SandboxPage() {
  const [selectedQuery, setSelectedQuery] = useState("")
  const [trigger, setTrigger] = useState(0)

  function handleChipClick(queryText: string) {
    // Mantém a query setada (a resposta permanece na tela). O contador 'trigger'
    // muda a key do TheoGuide, permitindo reprocessar mesmo o mesmo chip — sem
    // zerar a resposta (o reset por timeout fazia a janela abrir e fechar).
    setSelectedQuery(queryText)
    setTrigger((t) => t + 1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      
      <main id="conteudo" className="flex-1 bg-[var(--bg-base)]">
        
        {/* Titulo do Sandbox */}
        <section className="border-b border-[var(--border-01)] bg-[var(--bg-elevated)] py-12 md:py-16">
          <div className="mx-auto px-6" style={S.container}>
            <p style={S.label}>Ambiente de Simulação e Treinamento</p>
            <h1
              className="font-semibold mt-3"
              style={{
                fontSize: "clamp(26px, 3.5vw, 38px)",
                lineHeight: "1.15",
                color: "var(--text-01)",
                marginBottom: "12px",
              }}
            >
              Laboratório do Théo · Sandbox
            </h1>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "22px",
                color: "var(--text-03)",
                maxWidth: "680px",
              }}
            >
              Esta é a página oficial de testes e treinamento do Théo, a inteligência artificial especialista da ONG. 
              Aqui ele está configurado em um sandbox completo para responder tudo sobre o nosso propósito, a stack de 
              código do site, a arquitetura de pastas (Omega) e o nosso roadmap cívico.
            </p>
          </div>
        </section>

        {/* Workspace Central do Théo */}
        <section className="py-12">
          <div className="mx-auto px-6" style={S.container}>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Painel do Chat - 2 Colunas no desktop */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Janela de chat premium */}
                <div 
                  className="rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] p-6 md:p-8"
                  style={{ boxShadow: "var(--theme-glow)" }}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-01)] pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--support-success)] animate-pulse" />
                      <span className="text-xs font-bold text-[var(--text-01)] uppercase tracking-wider">
                        Théo v1.2 (Treinado)
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-04)] font-mono">
                      STATUS: SANDBOX_ACTIVE
                    </span>
                  </div>

                  {/* Componente do Théo passando a query selecionada via chips */}
                  <TheoGuide key={trigger} initialQuery={selectedQuery} />
                </div>

                {/* Chips de Perguntas Sugeridas */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-[var(--text-03)] uppercase tracking-wider">
                    Experimente Perguntas Rápidas de Treinamento:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {CHIPS_SUGERIDOS.map((chip) => {
                      const Icon = chip.icon
                      return (
                        <button
                          key={chip.text}
                          onClick={() => handleChipClick(chip.query)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-full border border-[var(--border-01)] bg-[var(--bg-elevated)] text-[var(--text-02)] hover:text-[var(--text-01)] hover:border-[var(--border-02)] hover:bg-[var(--bg-raised)] transition-all duration-150 cursor-pointer shadow-sm"
                        >
                          <Icon size={12} className="text-[var(--blue-40)]" />
                          <span>{chip.text}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Painel Explicativo lateral - 1 Coluna */}
              <div className="flex flex-col gap-6">
                
                {/* Card de Ficha Técnica */}
                <div className="rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] p-6">
                  <h3 className="text-xs font-bold text-[var(--text-01)] uppercase tracking-wider border-b border-[var(--border-01)] pb-3 mb-4">
                    Como o Théo Funciona?
                  </h3>
                  <ul className="text-xs space-y-3.5 text-[var(--text-02)] leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-[var(--blue-40)] font-bold">1.</span>
                      <span>
                        <strong>Roteamento Semântico:</strong> Ele usa pontuação por palavras-chave em tempo real para encontrar a rota de conhecimento ideal.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--blue-40)] font-bold">2.</span>
                      <span>
                        <strong>Detecção de Formalidade:</strong> Analisa gírias, risos ou pontuação excessiva para escolher entre respostas detalhadas (padrão) ou diretas (simples).
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--blue-40)] font-bold">3.</span>
                      <span>
                        <strong>Rastreabilidade de Fontes:</strong> Todas as respostas contêm rodapé com o arquivo fonte e as limitações do dado.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Card do Laboratório Cívico */}
                <div className="rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] p-6">
                  <h3 className="text-xs font-bold text-[var(--text-01)] uppercase tracking-wider border-b border-[var(--border-01)] pb-3 mb-4">
                    Arquitetura da ONG
                  </h3>
                  <div className="text-xs text-[var(--text-03)] space-y-3 leading-relaxed">
                    <p>
                      O <strong>Anatomia do Gasto</strong> preza por transparência absoluta em todas as camadas.
                    </p>
                    <p>
                      Nosso pipeline é versionado no GitHub e operamos com um ecossistema de dados auditados divididos entre o <code>data/public</code> (site) e dados brutos locais fora do repositório para economia de custos.
                    </p>
                    <p className="text-[var(--blue-40)] font-medium">
                      O Théo ajuda a conectar o cidadão comum ao big data fiscal da prefeitura.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

      </main>

      <PageFooter />
    </div>
  )
}
