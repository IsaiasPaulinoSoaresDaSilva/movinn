import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

async function findBlender() {
  const candidates = [
    process.env.BLENDER_PATH,
    "/Applications/Blender.app/Contents/MacOS/Blender",
    "/opt/homebrew/bin/blender",
    "/usr/local/bin/blender",
  ].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try next location. */ }
  }
  return null;
}

function runBlender(binary: string, inputPath: string, outputPath: string) {
  const expression = [
    "import bpy",
    "bpy.ops.wm.read_factory_settings(use_empty=True)",
    `bpy.ops.import_scene.gltf(filepath=${JSON.stringify(inputPath)})`,
    `bpy.ops.wm.save_as_mainfile(filepath=${JSON.stringify(outputPath)})`,
  ].join("; ");
  return new Promise<void>((resolve, reject) => {
    const process = spawn(binary, ["--background", "--factory-startup", "--python-expr", expression], { stdio: ["ignore", "ignore", "pipe"] });
    let errorLog = "";
    const timeout = setTimeout(() => { process.kill("SIGKILL"); reject(new Error("Tempo limite do Blender excedido.")); }, 120_000);
    process.stderr.on("data", (chunk) => { errorLog += String(chunk).slice(0, 4000); });
    process.on("error", (error) => { clearTimeout(timeout); reject(error); });
    process.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(errorLog || `Blender finalizou com código ${code}.`));
    });
  });
}

export async function POST(request: Request) {
  const blender = await findBlender();
  if (!blender) {
    return Response.json({ error: "O worker Blender não está instalado. Configure BLENDER_PATH no servidor." }, { status: 503 });
  }
  const input = await request.arrayBuffer();
  if (input.byteLength === 0 || input.byteLength > 50 * 1024 * 1024) {
    return Response.json({ error: "Arquivo GLB vazio ou acima do limite de 50 MB." }, { status: 400 });
  }

  const workdir = await mkdtemp(join(tmpdir(), "movinn-blend-"));
  const inputPath = join(workdir, "module.glb");
  const outputPath = join(workdir, "module.blend");
  try {
    await writeFile(inputPath, Buffer.from(input));
    await runBlender(blender, inputPath, outputPath);
    const output = await readFile(outputPath);
    return new Response(output, {
      headers: {
        "Content-Type": "application/x-blender",
        "Content-Disposition": "attachment; filename=movinn-module.blend",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao gerar o arquivo BLEND." }, { status: 500 });
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}
