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
