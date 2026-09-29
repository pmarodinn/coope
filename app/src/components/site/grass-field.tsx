"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Encosta de grama com brisa que segue o ponteiro.
 *
 * Cada lâmina é uma instância; a curvatura acontece no vertex shader, então o
 * campo inteiro custa uma chamada de desenho. A rajada é um decaimento radial
 * em torno de um ponto que persegue o cursor com atraso — é o atraso que faz
 * o vento parecer vento, e não um espelho do mouse.
 *
 * Isolado do restante da página de propósito: Three.js e Motion disputam os
 * mesmos frames quando convivem na mesma subárvore.
 */

const COR = {
  base: new THREE.Color("#03100a"),
  meio: new THREE.Color("#0b4128"),
  ponta: new THREE.Color("#1f8b55"),
  // O chão usa a cor da neblina: assim o fim do campo dissolve no céu em vez
  // de virar uma faixa preta no horizonte.
  neblina: new THREE.Color("#081410"),
  chao: new THREE.Color("#081410"),
};

/** Relevo da encosta: sobe para o fundo, com ondulação suave. */
function altura(x: number, z: number) {
  return (
    -z * 0.075 +
    Math.sin(x * 0.055) * 1.3 +
    Math.cos(z * 0.07) * 0.8 +
    Math.sin((x * 0.6 + z) * 0.03) * 1.5
  );
}

/** A câmera fica baixa, dentro do capim: é o que dá escala à encosta. */
const CAMERA = { x: 0, y: 6.0, z: 12 };
const OLHAR = new THREE.Vector3(0, 1.0, -30);

const VERT = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aYaw;
  attribute float aScale;
  attribute float aTint;
  attribute float aPhase;

  uniform float uTime;
  uniform vec3  uGust;     // xy = centro da rajada no plano, z = força
  uniform float uLargura;

  varying float vT;
  varying float vTint;
  varying float vEnergia;

  mat2 giro(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }

  void main() {
    float t = uv.y;                 // 0 na base, 1 na ponta
    vT = t;
    vTint = aTint;

    vec3 p = position;
    p.x *= uLargura * (1.0 - t * 0.93);   // afina para a ponta
    p.y *= aScale;

    // Vento de fundo em duas oitavas: a soma é o que vira onda viajando.
    float onda =
        sin(uTime * 1.05 + aOffset.x * 0.20 + aOffset.z * 0.16 + aPhase)
      + 0.45 * sin(uTime * 2.30 + aOffset.x * 0.52 - aOffset.z * 0.29 + aPhase * 1.7);
    float brisa = onda * 0.13;

    // Rajada: empurra as lâminas para longe do ponto perseguido.
    vec2 d = aOffset.xz - uGust.xy;
    float dist = length(d);
    float raj = exp(-dist * dist * 0.0055) * uGust.z;
    vec2 dir = dist > 0.001 ? d / dist : vec2(1.0, 0.0);

    float rigidez = t * t;          // a base não sai do lugar

    vec3 desl = vec3(0.0);
    desl.xz += dir * raj * 2.1 * rigidez * aScale;
    desl.x  += brisa * rigidez * aScale;

    vEnergia = abs(brisa) * 0.6 + raj;

    vec2 xz = giro(aYaw) * p.xz;
    p.x = xz.x;
    p.z = xz.y;

    vec3 mundo = p + aOffset + desl;
    // Ao vergar, a ponta também baixa — senão a lâmina parece esticar.
    mundo.y -= (abs(desl.x) + abs(desl.z)) * 0.22;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(mundo, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uBase;
  uniform vec3  uMeio;
  uniform vec3  uPonta;
  uniform vec3  uNeblina;
  uniform float uPerto;
  uniform float uLonge;

  varying float vT;
  varying float vTint;
  varying float vEnergia;

  void main() {
    // Só o terço superior da lâmina pega a cor clara — espalhar o verde por
    // toda a altura é o que faz o campo parecer grama sintética.
    vec3 c = mix(uBase, uMeio, smoothstep(0.0, 0.62, vT));
    c = mix(c, uPonta, smoothstep(0.70, 1.0, vT));
    c *= 0.70 + vTint * 0.34;
    c += vEnergia * 0.075 * vT;     // o movimento pega um pouco mais de luz

    float prof = gl_FragCoord.z / gl_FragCoord.w;
    c = mix(c, uNeblina, smoothstep(uPerto, uLonge, prof));

    gl_FragColor = vec4(c, 1.0);
  }
`;

function Campo({ quantidade, reduzido }: { quantidade: number; reduzido: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const geometria = useMemo(() => {
    const lamina = new THREE.PlaneGeometry(1, 1, 1, 4);
    lamina.translate(0, 0.5, 0); // base no chão

    const g = new THREE.InstancedBufferGeometry();
    g.index = lamina.index;
    g.attributes.position = lamina.attributes.position;
    g.attributes.uv = lamina.attributes.uv;
    g.instanceCount = quantidade;

    const off = new Float32Array(quantidade * 3);
    const yaw = new Float32Array(quantidade);
    const esc = new Float32Array(quantidade);
    const tint = new Float32Array(quantidade);
    const fase = new Float32Array(quantidade);

    for (let i = 0; i < quantidade; i += 1) {
      // Densidade concentrada perto da câmera: distribuir uniformemente num
      // campo grande deixa menos de duas lâminas por metro quadrado, e o
      // capim some. O expoente puxa a amostragem para a frente da cena.
      const z = 8 - Math.pow(Math.random(), 1.55) * 70;
      const dist = CAMERA.z - z;
      const meia = 4.0 + dist * 0.86;
      const x = (Math.random() - 0.5) * 2 * meia;

      off[i * 3] = x;
      off[i * 3 + 1] = altura(x, z);
      off[i * 3 + 2] = z;

      yaw[i] = Math.random() * Math.PI;
      esc[i] = 1.35 + Math.random() * 1.45;
      tint[i] = Math.random();
      fase[i] = Math.random() * Math.PI * 2;
    }

    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute("aYaw", new THREE.InstancedBufferAttribute(yaw, 1));
    g.setAttribute("aScale", new THREE.InstancedBufferAttribute(esc, 1));
    g.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 1));
    g.setAttribute("aPhase", new THREE.InstancedBufferAttribute(fase, 1));

    // A lâmina não é descartada: seus atributos são os mesmos objetos usados
    // pela geometria instanciada, e liberá-los apagaria o campo inteiro.
    return g;
  }, [quantidade]);

  useEffect(() => () => geometria.dispose(), [geometria]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGust: { value: new THREE.Vector3(0, -300, 0) },
      uLargura: { value: 0.21 },
      uBase: { value: COR.base },
      uMeio: { value: COR.meio },
      uPonta: { value: COR.ponta },
      uNeblina: { value: COR.neblina },
      uPerto: { value: 30 },
      uLonge: { value: 112 },
    }),
    [],
  );

  // Estado do ponteiro mantido fora do React: são valores contínuos.
  const plano = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raio = useMemo(() => new THREE.Raycaster(), []);
  const alvo = useRef(new THREE.Vector3(0, 0, -20));
  const suave = useRef(new THREE.Vector3(0, 0, -20));
  const forca = useRef(0);

  useFrame((state, dt) => {
    const u = material.current?.uniforms;
    if (!u) return;

    if (reduzido) {
      u.uTime.value = 2.2;
      u.uGust.value.set(0, -200, 0);
      return;
    }

    u.uTime.value += Math.min(dt, 0.05);

    raio.setFromCamera(state.pointer as THREE.Vector2, camera);
    const achou = raio.ray.intersectPlane(plano, alvo.current);

    if (achou) {
      const antes = suave.current.clone();
      // Atraso: a brisa chega depois do cursor.
      suave.current.lerp(alvo.current, 1 - Math.pow(0.0025, dt));
      const velocidade = suave.current.distanceTo(antes) / Math.max(dt, 0.001);
      const desejada = Math.min(0.42 + velocidade * 0.035, 1.35);
      forca.current += (desejada - forca.current) * Math.min(1, dt * 3.2);
    } else {
      forca.current += (0 - forca.current) * Math.min(1, dt * 2);
    }

    u.uGust.value.set(suave.current.x, suave.current.z, forca.current);
  });

  return (
    <mesh geometry={geometria} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Chao() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(420, 260, 110, 90);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i += 1) {
      // O plano já nasce centrado em z = -60, então a altura usa a posição real.
      pos.setY(i, altura(pos.getX(i), pos.getZ(i) - 60) - 0.4);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo} position={[0, 0, -60]}>
      <meshBasicMaterial color={COR.chao} />
    </mesh>
  );
}

/** Deriva mínima da câmera com o ponteiro — dá volume sem virar enjoo. */
function Deriva({ reduzido }: { reduzido: boolean }) {
  useFrame((state, dt) => {
    if (reduzido) return;
    const k = 1 - Math.pow(0.02, dt);
    state.camera.position.x += (CAMERA.x + state.pointer.x * 1.0 - state.camera.position.x) * k;
    state.camera.position.y += (CAMERA.y + state.pointer.y * 0.55 - state.camera.position.y) * k;
    state.camera.lookAt(OLHAR);
  });
  return null;
}

function suportaWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function GrassField({ className = "" }: { className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const naTela = useInView(raiz, { margin: "120px 0px" });
  const [pronto, setPronto] = useState(false);
  const [ok, setOk] = useState(true);
  const [reduzido, setReduzido] = useState(false);
  const [quantidade, setQuantidade] = useState(34_000);

  useEffect(() => {
    setOk(suportaWebGL());

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplica = () => setReduzido(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);

    const estreito = window.innerWidth < 900;
    const fraco = (navigator.hardwareConcurrency ?? 8) <= 4;
    setQuantidade(estreito || fraco ? 30_000 : 78_000);

    return () => mq.removeEventListener("change", aplica);
  }, []);

  // Sem WebGL: um degradê que sugere a encosta, sem buraco na página.
  if (!ok) {
    return (
      <div
        ref={raiz}
        className={`${className} bg-[radial-gradient(120%_80%_at_50%_120%,#0e6b3f_0%,#04130b_55%,#07120d_100%)]`}
        aria-hidden
      />
    );
  }

  return (
    <div ref={raiz} className={className} aria-hidden>
      <Canvas
        // Fora da tela o laço para: sem isto o campo seguiria desenhando
        // dezenas de milhares de lâminas durante toda a leitura da página.
        frameloop={naTela ? "always" : "never"}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [CAMERA.x, CAMERA.y, CAMERA.z], fov: 52, near: 0.1, far: 240 }}
        onCreated={({ camera }) => {
          camera.lookAt(OLHAR.x, OLHAR.y, OLHAR.z);
          setPronto(true);
        }}
        style={{
          opacity: pronto ? 1 : 0,
          transition: "opacity 1.1s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <Chao />
        <Campo quantidade={quantidade} reduzido={reduzido} />
        <Deriva reduzido={reduzido} />
      </Canvas>
    </div>
  );
}
