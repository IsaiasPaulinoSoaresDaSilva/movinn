# Arquitetura do MOVINN

## Estado atual

O MVP usa Next.js App Router e TypeScript estrito. A rota pública (`/`) apresenta o produto e a rota `/configurar` concentra o estúdio interativo. O configurador permanece como Client Component porque depende de estado, `localStorage`, downloads no navegador e React Three Fiber.

```
app/
  page.tsx                 landing estática
  configurar/page.tsx      entrada do estúdio 3D
  api/export/blend/route   conversão opcional no servidor
components/
  configurator.tsx         orquestra UI, persistência local e exportações
  wheelchair-model.tsx     visualização procedural modular em metros
lib/
  catalog.ts               tipos, catálogo, compatibilidade e BOM
  projects.ts              biblioteca local e migração de configurações
```

## Decisões

- O modelo procedural é demonstrativo; cada grupo nomeado (`MODULE_*`) é uma fronteira para futura troca por GLB/CAD validado.
- A biblioteca local é a implementação de protótipo. `lib/projects.ts` evita acoplamento prematuro ao Supabase e já concentra a fronteira de persistência.
- GLB representa a visualização; STL é disponibilizado por módulo, mas não recebe o status de peça pronta para fabricação.
- Referências SUS orientam presets públicos. Não são prescrição clínica nem validação estrutural.
- O modo Kit de impressão é deliberadamente marcado como prototipagem. Pinos impressos não são uniões estruturais.

## Próximas fronteiras

1. Extrair o estado do configurador para uma store Zustand com adaptador local/Supabase.
2. Definir esquema Supabase, RLS e autenticação somente após credenciais e projeto serem fornecidos.
3. Trocar geometria demonstrativa por catálogo de módulos GLB/CAD com metadados de fabricação.
4. Adicionar validação de malha/manufatura antes de qualificar qualquer exportação STL.
