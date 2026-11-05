"use client";

import { ContactShadows, Environment, Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { ChairConfig } from "@/lib/catalog";

export type { ChairConfig } from "@/lib/catalog";

type ModelReady = (model: THREE.Group | null) => void;
export type ModelModuleId =
  | "MODULE_SEATING"
  | "MODULE_BACKREST"
  | "MODULE_FRAME"
  | "MODULE_AXLE_PLATES"
  | "MODULE_REAR_WHEELS"
  | "MODULE_CASTERS"
  | "MODULE_FOOTREST"
  | "MODULE_ARMRESTS"
  | "MODULE_PUSH_HANDLES"
  | "MODULE_ANTI_TIP"
  | "MODULE_BRAKES"
  | "MODULE_CONNECTORS";

function SelectionOverlay({ selected, config }: { selected: ModelModuleId; config: ChairConfig }) {
  const width = config.seatWidth / 100;
  const depth = config.seatDepth / 100;
  const seatY = config.seatHeight / 100;
  const rearRadius = config.wheelSize * 0.0127;
  const casterRadius = config.casterSize * 0.0127;
  const rearWheelZ = config.rearAxlePosition / 100;
  const frontZ = depth / 2 + 0.16;
  const bounds: Record<ModelModuleId, { position: [number, number, number]; size: [number, number, number] }> = {
    MODULE_SEATING: { position: [0, seatY + 0.045, 0.01], size: [width + 0.025, 0.13, depth + 0.025] },
    MODULE_BACKREST: { position: [0, seatY + config.backrestHeight / 2, -depth / 2], size: [width + 0.04, config.backrestHeight + 0.04, 0.1 + config.backrestWingDepth / 100] },
    MODULE_FRAME: { position: [0, seatY * 0.53, 0], size: [width + 0.16, seatY + 0.17, depth + 0.36] },
    MODULE_AXLE_PLATES: { position: [0, rearRadius, rearWheelZ], size: [width + 0.16, 0.22, 0.18] },
    MODULE_REAR_WHEELS: { position: [0, rearRadius, rearWheelZ], size: [width + 0.43, rearRadius * 2.08, rearRadius * 2.08] },
    MODULE_CASTERS: { position: [0, casterRadius + 0.11, frontZ - config.casterTrail / 200], size: [width + 0.11, casterRadius * 2.5, 0.22] },
    MODULE_FOOTREST: { position: [0, config.footrestHeight / 100, frontZ + 0.04 + config.footrestExtension / 100], size: [width * 0.82, 0.14, 0.28] },
    MODULE_ARMRESTS: { position: [0, seatY + 0.16, 0.02], size: [width + 0.17, 0.34, 0.43] },
    MODULE_PUSH_HANDLES: { position: [0, seatY + config.backrestHeight + 0.045, -depth / 2 - 0.08], size: [width + 0.1, 0.27, 0.18] },
    MODULE_ANTI_TIP: { position: [0, 0.13, -depth / 2 - 0.18], size: [width + 0.14, 0.2, 0.28] },
    MODULE_BRAKES: { position: [0, seatY - 0.02, 0.08], size: [width + 0.2, 0.26, 0.22] },
    MODULE_CONNECTORS: { position: [0, seatY - 0.05, 0.01], size: [width - 0.08, 0.08, depth - 0.12] },
  };
  const active = bounds[selected];
  return <group name="EDITOR_OVERLAY" userData={{ exportable: false }}>
    <mesh position={active.position} renderOrder={2} raycast={() => null}>
      <boxGeometry args={active.size} />
      <meshBasicMaterial color="#ff6b3d" transparent opacity={0.1} depthWrite={false} />
    </mesh>
    <lineSegments position={active.position} renderOrder={3} raycast={() => null}>
      <edgesGeometry args={[new THREE.BoxGeometry(...active.size)]} />
      <lineBasicMaterial color="#ff6b3d" transparent opacity={0.95} depthTest={false} />
    </lineSegments>
  </group>;
}

function Tube({ from, to, radius = 0.014, color, name }: { from: [number, number, number]; to: [number, number, number]; radius?: number; color: string; name: string }) {
  const transform = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = end.clone().sub(start);
    return {
      position: start.add(end).multiplyScalar(0.5),
      length: direction.length(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
    };
  }, [from, to]);

  return (
    <mesh name={name} position={transform.position} quaternion={transform.quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, transform.length, 16]} />
      <meshPhysicalMaterial color={color} metalness={0.78} roughness={0.24} clearcoat={0.35} />
    </mesh>
  );
}

function SocketCollar({ position, outerRadius, innerRadius, height, name }: { position: [number, number, number]; outerRadius: number; innerRadius: number; height: number; name: string }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const bore = new THREE.Path();
    bore.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(bore);
    return new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 20 });
  }, [outerRadius, innerRadius, height]);

  return <mesh name={name} position={position} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
    <primitive object={geometry} attach="geometry" />
    <meshPhysicalMaterial color="#ff6b3d" metalness={0.34} roughness={0.42} />
  </mesh>;
}

function Wheel({ side, radius, style, camber, x, z }: { side: -1 | 1; radius: number; style: ChairConfig["wheelStyle"]; camber: number; x: number; z: number }) {
  const spokeCount = style === "sport" ? 6 : 18;
  const angle = THREE.MathUtils.degToRad(camber * side);
  return (
    <group name={`rear-wheel-${side < 0 ? "left" : "right"}`} position={[side * x, radius, z]} rotation={[0, 0, angle]}>
      <mesh name="tire" rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[radius, 0.018, 16, 72]} />
        <meshStandardMaterial color="#15191b" roughness={0.72} />
      </mesh>
      <mesh name="handrim" rotation={[0, Math.PI / 2, 0]} position={[side * 0.024, 0, 0]}>
        <torusGeometry args={[radius * 0.88, 0.006, 10, 64]} />
        <meshStandardMaterial color="#aeb9bd" metalness={0.92} roughness={0.16} />
      </mesh>
      {style === "solid" ? (
        <mesh name="wheel-disc" rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.91, radius * 0.91, 0.012, 64]} />
          <meshPhysicalMaterial color="#263139" metalness={0.35} roughness={0.28} transparent opacity={0.92} />
        </mesh>
      ) : Array.from({ length: spokeCount }, (_, index) => {
        const a = (index / spokeCount) * Math.PI * 2;
        return <Tube key={index} name={`spoke-${index}`} from={[0, 0, 0]} to={[0, Math.cos(a) * radius * 0.91, Math.sin(a) * radius * 0.91]} radius={style === "sport" ? 0.007 : 0.0025} color={style === "sport" ? "#56646a" : "#aeb9bd"} />;
      })}
      <mesh name="hub" rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.026, 0.026, 0.085, 18]} />
        <meshStandardMaterial color="#7d8a8e" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh name="quick-release-axle" position={[side * 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.1, 14]} />
        <meshStandardMaterial color="#c5d0d2" metalness={0.92} roughness={0.13} />
      </mesh>
    </group>
  );
}

function AxlePlate({ side, x, y, z, tubeRadius, thickness, travel }: { side: -1 | 1; x: number; y: number; z: number; tubeRadius: number; thickness: number; travel: number }) {
  const outerX = side * (x + tubeRadius + 0.016);
  const plateThickness = thickness / 1000;
  const holeOffset = travel / 200;
  return (
    <group name={`axle-plate-${side < 0 ? "left" : "right"}`} position={[outerX, y, z]}>
      <mesh name="adjustable-axle-plate" castShadow receiveShadow>
        <boxGeometry args={[plateThickness, 0.17, 0.13]} />
        <meshPhysicalMaterial color="#536268" metalness={0.9} roughness={0.2} />
      </mesh>
      {[-holeOffset, 0, holeOffset].map((offset) => <mesh key={offset} name="axle-adjustment-hole" position={[side * (plateThickness / 2 + 0.001), offset, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, plateThickness + 0.003, 16]} />
        <meshStandardMaterial color="#172025" metalness={0.8} roughness={0.26} />
      </mesh>)}
      <mesh name="axle-receiver" position={[side * (plateThickness / 2 + 0.01), 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.04, 18]} />
        <meshStandardMaterial color="#9ca9ad" metalness={0.92} roughness={0.16} />
      </mesh>
    </group>
  );
}

function CasterAssembly({ side, radius, x, z, trail }: { side: -1 | 1; radius: number; x: number; z: number; trail: number }) {
  const pivotY = 0.2;
  const pivotZ = z - trail;
  return (
    <group name={`front-caster-${side < 0 ? "left" : "right"}`}>
      <mesh name="caster-tire" position={[side * x, radius, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[radius, 0.014, 12, 40]} />
        <meshStandardMaterial color="#181c1e" roughness={0.76} />
      </mesh>
      <mesh name="caster-hub" position={[side * x, radius, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.055, 16]} />
        <meshStandardMaterial color="#879397" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh name="caster-kingpin" position={[side * x, pivotY, pivotZ]}>
        <cylinderGeometry args={[0.012, 0.012, 0.09, 16]} />
        <meshStandardMaterial color="#59676c" metalness={0.9} roughness={0.19} />
      </mesh>
      {([-0.022, 0.022] as const).map((offset) => <Tube key={offset} name="caster-fork-arm" from={[side * x + offset, radius, z]} to={[side * x + offset, pivotY - 0.035, pivotZ]} radius={0.007} color="#5b696e" />)}
      <Tube name="caster-mount" from={[side * x, pivotY + 0.045, pivotZ]} to={[side * x, pivotY + 0.13, pivotZ]} radius={0.01} color="#5b696e" />
    </group>
  );
}

function createContouredSeatGeometry(config: ChairConfig) {
  const width = config.seatWidth / 100;
  const depth = config.seatDepth / 100;
  const base = config.seatBaseThickness / 100;
  const frontRise = config.seatFrontRise / 100;
  const lateralRise = config.seatLateralSupport / 100;
  const pommelRise = config.seatPommelHeight / 100;
  const nx = 20;
  const nz = 22;
  const vertices: number[] = [];
  const indices: number[] = [];
  const row = nx + 1;
  const layerSize = row * (nz + 1);

  for (let layer = 0; layer < 2; layer += 1) {
    for (let zIndex = 0; zIndex <= nz; zIndex += 1) {
      const zRatio = zIndex / nz;
      const z = -depth / 2 + zRatio * depth;
      for (let xIndex = 0; xIndex <= nx; xIndex += 1) {
        const xRatio = xIndex / nx;
        const x = -width / 2 + xRatio * width;
        const xNorm = (x / width) * 2;
        const front = frontRise * Math.pow(zRatio, 1.65);
        const lateral = lateralRise * Math.pow(Math.abs(xNorm), 4.5) * (0.7 + zRatio * 0.3);
        const pommelX = x / Math.max(width * 0.13, 0.01);
        const pommelZ = (z - depth * 0.18) / Math.max(depth * 0.16, 0.01);
        const pommel = pommelRise * Math.exp(-(pommelX * pommelX + pommelZ * pommelZ));
        vertices.push(x, layer === 0 ? base + front + lateral + pommel : 0, z);
      }
    }
  }

  const top = (x: number, z: number) => z * row + x;
  const bottom = (x: number, z: number) => layerSize + z * row + x;
  for (let z = 0; z < nz; z += 1) {
    for (let x = 0; x < nx; x += 1) {
      const a = top(x, z); const b = top(x + 1, z); const c = top(x, z + 1); const d = top(x + 1, z + 1);
      indices.push(a, c, b, b, c, d);
      const ba = bottom(x, z); const bb = bottom(x + 1, z); const bc = bottom(x, z + 1); const bd = bottom(x + 1, z + 1);
      indices.push(ba, bb, bc, bb, bd, bc);
    }
  }
  for (let z = 0; z < nz; z += 1) {
    let t0 = top(0, z); let t1 = top(0, z + 1); let b0 = bottom(0, z); let b1 = bottom(0, z + 1);
    indices.push(t0, b0, t1, t1, b0, b1);
    t0 = top(nx, z); t1 = top(nx, z + 1); b0 = bottom(nx, z); b1 = bottom(nx, z + 1);
    indices.push(t0, t1, b0, t1, b1, b0);
  }
  for (let x = 0; x < nx; x += 1) {
    let t0 = top(x, 0); let t1 = top(x + 1, 0); let b0 = bottom(x, 0); let b1 = bottom(x + 1, 0);
    indices.push(t0, t1, b0, t1, b1, b0);
    t0 = top(x, nz); t1 = top(x + 1, nz); b0 = bottom(x, nz); b1 = bottom(x + 1, nz);
    indices.push(t0, b0, t1, t1, b0, b1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function ModularWheelchair({ config, onModelReady, selectedModule, onSelectModule }: { config: ChairConfig; onModelReady?: ModelReady; selectedModule: ModelModuleId; onSelectModule?: (module: ModelModuleId) => void }) {
  const width = config.seatWidth / 100;
  const depth = config.seatDepth / 100;
  const seatY = config.seatHeight / 100;
  const backHeight = config.backrestHeight / 100;
  const rearRadius = config.wheelSize * 0.0127;
  const casterRadius = config.casterSize * 0.0127;
  const frameX = width / 2 + 0.025;
  const rearX = width / 2 + 0.07;
  const frontZ = depth / 2 + 0.16;
  const rearZ = -depth / 2 + 0.06;
  const rearWheelZ = config.rearAxlePosition / 100;
  const casterTrail = config.casterTrail / 100;
  const frameTubeRadius = config.frameTubeDiameter / 2000;
  const footrestY = config.footrestHeight / 100;
  const footrestZ = frontZ + 0.04 + config.footrestExtension / 100;
  const frame = config.frameColor;
  const upholstery = config.upholsteryColor;
  const seatGeometry = useMemo(() => createContouredSeatGeometry(config), [config]);
  const connectorRadius = config.printConnectorDiameter / 2000;
  const socketRadius = connectorRadius + config.printClearance / 1000;
  const attachmentPoints = ([-1, 1] as const).flatMap((side) => ([-1, 1] as const).map((front) => [side * (width / 2 - 0.07), seatY - 0.043, front * (depth / 2 - 0.09)] as [number, number, number]));

  return (
    <group ref={onModelReady} name="MOVINN_Active_01" userData={{ manufacturer: "MOVINN", product: "Active 01", units: "meters", parametric: true }}>
      <group name="MODULE_FRAME" userData={{ module: "frame", type: config.frameType }} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_FRAME"); }}>
        {([-1, 1] as const).map((side) => <group key={side}>
          <Tube name="seat-rail" from={[side * frameX, seatY - 0.035, -depth / 2]} to={[side * frameX, seatY - 0.035, depth / 2]} radius={frameTubeRadius} color={frame} />
          <Tube name="rear-upright" from={[side * frameX, seatY - 0.03, rearZ]} to={[side * frameX, seatY + backHeight, -depth / 2]} radius={frameTubeRadius} color={frame} />
          <Tube name="front-drop" from={[side * frameX, seatY - 0.03, depth / 2]} to={[side * frameX, 0.17, frontZ - 0.02]} radius={frameTubeRadius} color={frame} />
          <Tube name="lower-rail" from={[side * frameX, 0.17, frontZ - 0.02]} to={[side * frameX, 0.18, rearZ]} radius={frameTubeRadius} color={frame} />
          <Tube name="rear-brace" from={[side * frameX, 0.18, rearZ]} to={[side * frameX, seatY - 0.03, rearZ]} radius={frameTubeRadius} color={frame} />
          <Tube name="axle-support" from={[side * frameX, seatY - 0.04, rearZ]} to={[side * frameX, rearRadius, rearWheelZ]} radius={frameTubeRadius * 0.78} color={frame} />
          <Tube name="caster-support" from={[side * frameX, 0.17, frontZ - 0.02]} to={[side * frameX, 0.33, frontZ - casterTrail]} radius={frameTubeRadius * 0.72} color={frame} />
        </group>)}
        <Tube name="rear-crossbar" from={[-frameX, 0.2, rearZ]} to={[frameX, 0.2, rearZ]} radius={frameTubeRadius} color={frame} />
        <Tube name="front-crossbar" from={[-frameX, 0.18, frontZ - 0.02]} to={[frameX, 0.18, frontZ - 0.02]} radius={frameTubeRadius} color={frame} />
        <Tube name="seat-crossbar" from={[-frameX, seatY - 0.035, 0.02]} to={[frameX, seatY - 0.035, 0.02]} radius={frameTubeRadius * 0.78} color={frame} />
        {config.printAssemblyMode === "kit" && attachmentPoints.map(([x, y, z], index) => <SocketCollar key={index} name="frame-connector-socket" position={[x, y - 0.016, z]} outerRadius={socketRadius + 0.006} innerRadius={socketRadius} height={0.016} />)}
        {config.frameType === "folding" && <>
          <Tube name="folding-brace-a" from={[-frameX, 0.21, -0.08]} to={[frameX, seatY - 0.06, 0.08]} radius={0.01} color="#909b9e" />
          <Tube name="folding-brace-b" from={[frameX, 0.21, -0.08]} to={[-frameX, seatY - 0.06, 0.08]} radius={0.01} color="#909b9e" />
        </>}
      </group>

      <group name="MODULE_AXLE_PLATES" userData={{ module: "axle-plates", adjustable: true }} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_AXLE_PLATES"); }}>
        {([-1, 1] as const).map((side) => <AxlePlate key={side} side={side} x={frameX} y={rearRadius} z={rearWheelZ} tubeRadius={frameTubeRadius} thickness={config.axlePlateThickness} travel={config.axlePlateTravel} />)}
      </group>

      <group name="MODULE_SEATING" userData={{ module: "seat", printable: true }} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_SEATING"); }}>
        <mesh name="contoured-seat" position={[0, seatY, 0.01]} rotation={[THREE.MathUtils.degToRad(-config.seatAngle), 0, 0]} castShadow receiveShadow>
          <primitive object={seatGeometry} attach="geometry" />
          <meshPhysicalMaterial color={upholstery} roughness={0.72} clearcoat={0.08} />
        </mesh>
        {config.printAssemblyMode === "kit" && attachmentPoints.map(([x, y, z], index) => <SocketCollar key={index} name="seat-connector-socket" position={[x, y + 0.003, z]} outerRadius={socketRadius + 0.006} innerRadius={socketRadius} height={0.014} />)}
      </group>

      {config.printAssemblyMode === "kit" && <group name="MODULE_CONNECTORS" userData={{ module: "connectors", printable: true, count: 8, diameterMm: config.printConnectorDiameter, clearanceMm: config.printClearance }} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_CONNECTORS"); }}>
        {attachmentPoints.map(([x, y, z], index) => <mesh key={index} name={`alignment-pin-${index + 1}`} position={[x, y - 0.003, z]} castShadow receiveShadow>
          <cylinderGeometry args={[connectorRadius, connectorRadius, 0.052, 20]} />
          <meshPhysicalMaterial color="#ff6b3d" metalness={0.3} roughness={0.4} />
        </mesh>)}
        {attachmentPoints.map(([x, y, z], index) => <mesh key={`spare-${index}`} name={`alignment-pin-spare-${index + 1}`} position={[x, y - 0.003, z + 0.012]} castShadow receiveShadow>
          <cylinderGeometry args={[connectorRadius, connectorRadius, 0.052, 20]} />
          <meshPhysicalMaterial color="#ff6b3d" metalness={0.3} roughness={0.4} />
        </mesh>)}
      </group>}
      <group name="MODULE_BACKREST" userData={{ module: "backrest", parametric: true }} position={[0, seatY + backHeight / 2, -depth / 2 + 0.015]} rotation={[THREE.MathUtils.degToRad(-config.backrestRecline), 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_BACKREST"); }}>
        <mesh name="back-upholstery" castShadow>
          <boxGeometry args={[width - 0.035, backHeight - 0.05, 0.035]} />
          <meshPhysicalMaterial color={upholstery} roughness={0.7} clearcoat={0.06} />
        </mesh>
        {config.backrestLumbarSupport > 0 && <mesh name="lumbar-support" position={[0, -backHeight * 0.12, 0.038]} scale={[width * 0.29, 0.1, config.backrestLumbarSupport / 100]} castShadow>
          <sphereGeometry args={[1, 24, 16]} /><meshPhysicalMaterial color={upholstery} roughness={0.67} clearcoat={0.08} />
        </mesh>}
        {config.backrestWingDepth > 0 && ([-1, 1] as const).map((side) => <mesh key={side} name="backrest-side-wing" position={[side * (width / 2 - 0.035), 0, config.backrestWingDepth / 200]} castShadow>
          <boxGeometry args={[0.035, backHeight - 0.09, config.backrestWingDepth / 100]} /><meshPhysicalMaterial color={upholstery} roughness={0.7} clearcoat={0.06} />
        </mesh>)}
      </group>

      <group name="MODULE_REAR_WHEELS" onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_REAR_WHEELS"); }}>
        <Wheel side={-1} x={rearX} z={rearWheelZ} radius={rearRadius} style={config.wheelStyle} camber={config.camber} />
        <Wheel side={1} x={rearX} z={rearWheelZ} radius={rearRadius} style={config.wheelStyle} camber={config.camber} />
      </group>

      <group name="MODULE_CASTERS" onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_CASTERS"); }}>
        <CasterAssembly side={-1} radius={casterRadius} x={frameX} z={frontZ} trail={casterTrail} />
        <CasterAssembly side={1} radius={casterRadius} x={frameX} z={frontZ} trail={casterTrail} />
      </group>

      <group name="MODULE_FOOTREST" userData={{ module: "footrest", type: config.footrest }} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_FOOTREST"); }}>
        {([-1, 1] as const).map((side) => <Tube key={side} name="footrest-hanger" from={[side * frameX, 0.18, frontZ - 0.02]} to={[side * width * 0.22, footrestY + 0.02, footrestZ]} radius={0.01} color={frame} />)}
        {config.footrest === "single" ? <mesh name="single-footplate" position={[0, footrestY, footrestZ]} rotation={[THREE.MathUtils.degToRad(-config.footrestAngle), 0, 0]} castShadow>
          <boxGeometry args={[width * 0.72, 0.025, 0.18]} /><meshStandardMaterial color="#252b2e" metalness={0.45} roughness={0.38} />
        </mesh> : ([-1, 1] as const).map((side) => <mesh key={side} name={`split-footplate-${side}`} position={[side * width * 0.22, footrestY, footrestZ]} rotation={[THREE.MathUtils.degToRad(-config.footrestAngle), 0, 0]} castShadow>
          <boxGeometry args={[width * 0.34, 0.025, 0.17]} /><meshStandardMaterial color="#252b2e" metalness={0.45} roughness={0.38} />
        </mesh>)}
      </group>

      {config.armrest !== "none" && <group name="MODULE_ARMRESTS" userData={{ module: "armrests", type: config.armrest }} onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_ARMRESTS"); }}>
        {([-1, 1] as const).map((side) => <group key={side}>
          <Tube name="armrest-post" from={[side * frameX, seatY + 0.03, -0.08]} to={[side * frameX, seatY + 0.24, -0.08]} radius={0.01} color={frame} />
          <mesh name="arm-pad" position={[side * frameX, seatY + 0.25, config.armrest === "desk" ? -0.01 : 0.04]} castShadow>
            <boxGeometry args={[0.055, 0.035, config.armrest === "desk" ? 0.22 : 0.32]} /><meshStandardMaterial color="#202628" roughness={0.74} />
          </mesh>
        </group>)}
      </group>}

      {config.pushHandles && <group name="MODULE_PUSH_HANDLES" onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_PUSH_HANDLES"); }}>
        {([-1, 1] as const).map((side) => <group key={side}>
          <Tube name="push-handle" from={[side * frameX, seatY + backHeight - 0.02, -depth / 2]} to={[side * frameX, seatY + backHeight + 0.09, -depth / 2 - 0.08]} radius={0.011} color={frame} />
          <Tube name="push-grip" from={[side * frameX, seatY + backHeight + 0.09, -depth / 2 - 0.08]} to={[side * frameX, seatY + backHeight + 0.09, -depth / 2 - 0.17]} radius={0.016} color="#202628" />
        </group>)}
      </group>}

      {config.antiTip && <group name="MODULE_ANTI_TIP" onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_ANTI_TIP"); }}>
        {([-1, 1] as const).map((side) => <group key={side}>
          <Tube name="anti-tip-bar" from={[side * frameX, 0.18, rearZ]} to={[side * frameX, 0.085, rearZ - 0.22]} radius={0.009} color={frame} />
          <mesh name="anti-tip-wheel" position={[side * frameX, 0.06, rearZ - 0.23]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.035, 0.009, 10, 28]} /><meshStandardMaterial color="#1c2022" roughness={0.8} />
          </mesh>
        </group>)}
      </group>}

      <group name="MODULE_BRAKES" onClick={(event) => { event.stopPropagation(); onSelectModule?.("MODULE_BRAKES"); }}>
        {([-1, 1] as const).map((side) => <group key={side} position={[side * (rearX - 0.015), seatY - 0.06, 0.06]}>
          <mesh name="brake-clamp" castShadow><boxGeometry args={[0.035, 0.04, 0.12]} /><meshStandardMaterial color="#4d5a5e" metalness={0.8} roughness={0.22} /></mesh>
          <Tube name="brake-lever" from={[0, 0.01, 0]} to={[0, 0.12, 0.08]} radius={0.006} color="#252a2d" />
        </group>)}
      </group>
      <SelectionOverlay selected={selectedModule} config={config} />
    </group>
  );
}

export function ChairViewer({ config, onModelReady, selectedModule = "MODULE_SEATING", onSelectModule }: { config: ChairConfig; onModelReady?: ModelReady; selectedModule?: ModelModuleId; onSelectModule?: (module: ModelModuleId) => void }) {
  return <Canvas shadows dpr={[1, 1.7]} camera={{ position: [1.55, 1.15, 1.8], fov: 35 }} gl={{ antialias: true }}>
    <color attach="background" args={["#f1f4f2"]} /><fog attach="fog" args={["#f1f4f2", 3.5, 7]} />
    <ambientLight intensity={0.8} /><directionalLight position={[2.5, 4, 3]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} /><directionalLight position={[-2, 1.5, -2]} intensity={0.7} color="#b7dce4" />
    <ModularWheelchair config={config} onModelReady={onModelReady} selectedModule={selectedModule} onSelectModule={onSelectModule} />
    <ContactShadows position={[0, -0.005, 0]} opacity={0.34} scale={3} blur={2.4} far={2} /><Environment preset="studio" />
    <Grid position={[0, -0.006, 0]} args={[8, 8]} cellSize={0.1} cellThickness={0.45} cellColor="#c8cecc" sectionSize={0.5} sectionThickness={0.9} sectionColor="#abb3b0" fadeDistance={4} fadeStrength={1.5} infiniteGrid />
    <OrbitControls makeDefault enablePan={false} minDistance={1.2} maxDistance={4} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.04} target={[0, 0.45, 0]} />
  </Canvas>;
}
