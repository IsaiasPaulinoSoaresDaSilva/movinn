import Link from "next/link";
import { ArrowUpRight, Box, CircleGauge, Cuboid, Ruler, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="MOVINN, página inicial"><span aria-hidden="true">m</span>movinn</Link>
        <Link href="/configurar" className="landing-nav-link">Abrir estúdio <ArrowUpRight size={16} /></Link>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p>Configuração modular de mobilidade</p>
          <h1 id="landing-title">Uma cadeira começa pela pessoa, não por um tamanho único.</h1>
          <p className="landing-lede">Explore proporções, módulos e acabamentos em um estúdio 3D. Salve alternativas, compare decisões e gere os arquivos do seu projeto de prototipagem.</p>
          <div className="landing-actions">
            <Link href="/configurar" className="landing-primary">Iniciar configuração <ArrowUpRight size={18} /></Link>
            <a href="#como-funciona" className="landing-secondary">Como funciona</a>
          </div>
        </div>
        <div className="landing-hero-object" aria-label="Representação abstrata de módulos de uma cadeira de rodas">
          <div className="landing-wheel landing-wheel-back" />
          <div className="landing-frame"><i /><i /><i /></div>
          <div className="landing-seat" />
          <div className="landing-wheel landing-wheel-front" />
          <span>Active 01<br />manual · modular</span>
        </div>
      </section>

      <section id="como-funciona" className="landing-process" aria-labelledby="process-title">
        <div><p>Do ajuste à próxima iteração</p><h2 id="process-title">Um fluxo claro para prototipar com responsabilidade.</h2></div>
        <ol>
          <li><Ruler aria-hidden="true" /><div><b>Defina a base</b><span>Comece por medidas demonstrativas ou por uma referência pública SUS.</span></div></li>
          <li><Cuboid aria-hidden="true" /><div><b>Monte por módulos</b><span>Assento, chassi, rodas e apoios podem ser selecionados separadamente.</span></div></li>
          <li><CircleGauge aria-hidden="true" /><div><b>Inspecione em 3D</b><span>Gire, aproxime e revise as regras preliminares de compatibilidade.</span></div></li>
          <li><Box aria-hidden="true" /><div><b>Leve para a oficina</b><span>Exporte o módulo visual em GLB ou STL e o manifesto técnico em JSON.</span></div></li>
        </ol>
      </section>

      <section className="landing-note" aria-label="Limite de uso da plataforma">
        <ShieldCheck size={21} aria-hidden="true" />
        <p><b>Ferramenta de configuração e prototipagem.</b> O MOVINN não certifica segurança clínica, estrutural ou de fabricação. Prescrição, materiais, ferragens e ensaios exigem profissionais responsáveis.</p>
      </section>

      <footer className="landing-footer"><span>MOVINN / laboratório de mobilidade</span><Link href="/configurar">Abrir configurador</Link></footer>
    </main>
  );
}
