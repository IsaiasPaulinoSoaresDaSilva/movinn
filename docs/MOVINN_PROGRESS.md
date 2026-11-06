# Progresso do MOVINN

## 2026-11-06 — ciclo de hardening do MVP

### Concluído anteriormente e validado

- Configurador 3D procedural modular, seleção por componente, rotação e zoom.
- Parâmetros de medidas, assento, estrutura, rodas, acabamento e regras de compatibilidade.
- Projetos locais com criação, salvamento, recuperação e duplicação.
- Exportações JSON, GLB e STL por módulo; rota de conversão `.blend` condicionada a worker Blender real.
- Presets de referência SUS e modo Kit de impressão, ambos com avisos de prototipagem.

### Neste ciclo

- Criada branch local `codex/mvp-hardening`.
- Documentada a arquitetura e as fronteiras de segurança/fabricação.
- Landing page pública criada em `/`, com entrada clara para o estúdio preservado em `/configurar`.
- Configuração Vitest adicionada; quatro testes de catálogo cobrem configuração base, incompatibilidade de apoio, aviso do kit e manifesto de conectores.
- Ficha técnica baixável adicionada ao fluxo de exportação.
- Próxima tarefa ativa: extrair o estado do configurador para uma store com adaptador de persistência e preparar testes de interação.

### Bloqueios externos

- Supabase/Auth não são configurados: não criar credenciais, tabelas ou políticas sem o projeto Supabase fornecido.
- O ambiente não disponibiliza automação de navegador local; usar build, testes e verificações HTTP locais como validação complementar.

## 2026-11-06 — ciclo de confiabilidade e acessibilidade

- Estado da configuração centralizado em Zustand; a biblioteca de projetos continua sendo a fonte persistida localmente.
- Histórico básico por projeto implementado, com retenção dos últimos 20 salvamentos e migração de dados locais existentes.
- Catálogo técnico agora identifica versão e status de validação demonstrativo/protótipo por item.
- A ficha técnica oferece impressão/salvamento como PDF pelo navegador, com folha de impressão isolada e avisos de escopo.
- Acrescentados link de pulo, landmarks nomeados, alternativa textual ao 3D, foco visível, mensagens vivas e alvos maiores na lista de módulos.
- Testes unitários ampliados para store e histórico; especificação E2E de navegação preparada em Playwright.
- O teste E2E não pôde ser executado neste ambiente: após três tentativas, o download do Chromium compatível foi interrompido antes de concluir. A especificação está pronta para execução com `npx playwright install chromium && npm run test:e2e` em ambiente com download disponível.
