# MOVINN — configurador modular

MVP de uma plataforma para personalização de cadeiras de rodas com visualização 3D em tempo real.

## Identidade MOVINN

A interface segue o brand board em `assets/brand/movinn-brand-board-v1.png`:

- Midnight Navy `#0B1F3B`
- Electric Coral `#FF6B3D`
- Mint `#2ECCB0`
- Warm White `#FAF7F2`

O símbolo, wordmark, favicon, tipografia geométrica e linguagem visual foram aplicados ao configurador.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## O que já funciona

- Modelagem paramétrica do assento: largura, profundidade, altura, espessura da base, elevação frontal/declive, apoios laterais e elevação central.
- Presets de assento plano, em declive e postural, todos editáveis.
- Escolha de diâmetro e desenho das rodas.
- Alternância de apoio para os pés e manoplas.
- Personalização das cores da estrutura e do estofamento.
- Rotação e zoom do modelo 3D.
- Resumo dimensional atualizado em tempo real.
- Catálogo técnico local com códigos, disponibilidade e peso por componente.
- Validação de compatibilidade entre medidas, rodas e apoio para os pés.
- Lista de materiais e ficha técnica dinâmica.
- Exportação JSON com configuração, compatibilidade e componentes selecionados.
- Download de ficha técnica em texto com dimensões, materiais, componentes, peso estimado e avisos de uso.
- Biblioteca local com múltiplos projetos, troca rápida e duplicação de configurações.
- Migração automática da configuração antiga para o novo formato de projetos.
- Modelo procedural em escala métrica, organizado por módulos nomeados.
- Chassi rígido ou dobrável, cambagem, rodízios, encosto, inclinação do assento, apoios de braço, almofada e anti-tombo configuráveis.
- Camada inicial de geometria mecânica: tubo de estrutura com diâmetro e parede ajustáveis, placas de eixo reguláveis, eixos de liberação rápida, travessas, suportes de eixo e garfos com kingpin e trail configurável.
- Regras preliminares para posição do eixo, trail do rodízio e estrutura para larguras amplas; servem à prototipagem e não substituem FEA, ensaio físico ou certificação.
- Seleção da peça a exportar (assento, encosto, estrutura, rodas, rodízios e demais módulos) ou do conjunto completo.
- Mesa de trabalho por peça: cada módulo pode ser escolhido no painel ou clicado no 3D, recebendo destaque visual, controles contextuais e exportação já direcionada à seleção.
- Fluxo inicial de modelagem paramétrica do assento, com presets e controles de base, declive frontal, apoio lateral e elevação central aplicados a uma malha fechada individualmente exportável.
- Editores paramétricos adicionais: encosto com reclinação, suporte lombar e abas laterais; placas de eixo com espessura e faixa de regulagem; apoio para os pés com altura, extensão e inclinação.
- Modo Referência SUS com presets de dispensação pública para 38,5/40/40, 40,5/40/40, 42,5/40/40, 45,5/40/40 e perfil bariátrico de 60 cm/160 kg. São referências de compra, não substitutos da prescrição individual por profissional habilitado.
- Exportação real em GLB 2.0 e STL binário; o STL é normalizado na origem e usa milímetros.
- Conversão da peça selecionada para `.blend` por worker Blender configurável no servidor.
- Modo Kit de impressão: exportação modular com kit separado de oito pinos de alinhamento, diâmetro e folga configuráveis; os receptores ficam visíveis no assento e no chassi para testes de encaixe.

## Exportação `.blend`

A rota `POST /api/export/blend` recebe o GLB da peça selecionada e executa o Blender em modo headless. Em desenvolvimento, instale o Blender e, se ele não estiver em um dos caminhos padrão, informe o executável:

```bash
BLENDER_PATH=/caminho/para/blender npm run dev
```

Sem um executável disponível, a interface mantém STL e GLB operacionais e explica que o worker Blender precisa ser configurado.

## Kit de impressão e referência SUS

Em **Estrutura → Produção / montagem**, selecione **Kit de impressão**. Exporte o chassi, o assento e o **Kit de conectores** separadamente; o configurador gera quatro interfaces de encaixe e oito pinos (quatro de uso e quatro reservas), com folga selecionável para impressão FDM.

Esse recurso é destinado à maquete, à validação de encaixe e ao desenvolvimento. Os pinos poliméricos impressos não são elementos estruturais para transporte de pessoa. Os presets SUS continuam sendo referências dimensionais públicas e a configuração final exige prescrição profissional, ferragens adequadas, engenharia, ensaio e conformidade aplicável.

## Próximas etapas

- Autenticação e sincronização dos projetos em nuvem.
- Integração do catálogo com componentes homologados e preços reais.
- Geração paramétrica com kernel CAD.
- Kernel CAD/B-rep para STEP, análise por elementos finitos e validação física avançada para fabricação.
- Validação clínica e de manufatura.

## Modelo 3D de referência

O configurador usa agora uma cadeira procedural própria, construída em módulos separados e em escala métrica. O ativo CC0 anterior permanece no repositório apenas como referência histórica. A geometria atual é adequada para configuração, visualização e prototipagem, mas ainda não é um CAD validado para fabricação.

- Fonte: https://www.innerscene.com/tools/library/3d-parts/seated-adult-in-a-manual-wheelchair-05d08277
- Licença: https://creativecommons.org/publicdomain/zero/1.0/
