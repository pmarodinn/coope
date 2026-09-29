"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Lavoura ao meio-dia, com colheitadeira em operação.
 *
 * Cada lâmina é uma instância e a curvatura acontece no vertex shader, então o
 * campo inteiro custa uma chamada de desenho. Três coisas fazem a diferença
 * entre parecer grama e parecer tapete:
 *
 * 1. A lâmina verga. Uma tira reta lê como palito; a curvatura por
 *    `aBend`, crescendo com o quadrado da altura, dá o arco natural.
 * 2. Luz atravessa a folha. Grama é fina e translúcida, então o que a faz
 *    brilhar não é o reflexo, é a luz que passa por trás. O termo de
 *    translucidez pesa mais que o difuso.
 * 3. Nem tudo é verde. Na colheita convivem folha nova e palha seca, e a
 *    variação de matiz é o que quebra a aparência sintética.
 *
 * A faixa já colhida não é geometria separada: o shader compara a posição da
 * lâmina com a da máquina e encurta o que ficou para trás. O corte acontece em
 * tempo real, de graça.
 */

const COR = {
  base: new THREE.Color("#25431c"),
  meio: new THREE.Color("#4f8a2e"),
  ponta: new THREE.Color("#93c24a"),
  palha: new THREE.Color("#c8a951"),
  solo: new THREE.Color("#b6a074"),
  // A neblina usa a cor do horizonte: assim o fim do campo dissolve no céu.
  neblina: new THREE.Color("#dfe9ea"),
};

/** Direção de onde vem o sol. Baixo e à frente, para a luz atravessar a folha. */
const SOL = new THREE.Vector3(-0.38, 0.3, -0.87).normalize();

/** Relevo da encosta: sobe para o fundo, com ondulação suave. */
function altura(x: number, z: number) {
  return (
    -z * 0.075 +
    Math.sin(x * 0.055) * 1.3 +
    Math.cos(z * 0.07) * 0.8 +
    Math.sin((x * 0.6 + z) * 0.03) * 1.5
  );
}

const CAMERA = { x: 0, y: 10.5, z: 14 };
const OLHAR = new THREE.Vector3(0, 0.5, -52);

/** Faixa em que a colheitadeira trabalha. */
const LAVRA = { z: -64, largura: 9.5, inicio: -14, fim: 54 };

const VERT = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aYaw;
  attribute float aScale;
  attribute float aTint;
  attribute float aPhase;
  attribute float aBend;
  attribute float aDry;

  uniform float uTime;
  uniform vec3  uGust;      // xy = centro da rajada, z = força
  uniform float uLargura;
  uniform float uCorteX;    // até onde a máquina já passou
  uniform float uLavraZ;
  uniform float uLavraW;

  varying float vT;
  varying float vTint;
  varying float vDry;
  varying float vEnergia;
  varying vec3  vNormal;
  varying vec3  vVista;

  mat2 giro(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }

  void main() {
    float t = uv.y;                 // 0 na base, 1 na ponta
    vT = t;
    vTint = aTint;

    // Colhido: o que ficou atrás da máquina vira restolho seco.
    float naFaixa = step(abs(aOffset.z - uLavraZ), uLavraW);
    float atras   = step(aOffset.x, uCorteX);
    vDry = max(aDry, naFaixa * atras * 0.85);
    float corte   = mix(1.0, 0.26, naFaixa * atras);

    vec3 p = position;
    p.x *= uLargura * (1.0 - t * 0.88);   // afina para a ponta
    p.y *= aScale * corte;

    // O arco da folha. Sem isto a lâmina lê como palito espetado.
    float arco = aBend * t * t * aScale * corte;
    p.z += arco;

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

    // Orienta a lâmina e leva a normal junto: é dela que sai a luz.
    mat2 r = giro(aYaw);
    vec2 xz = r * p.xz;
    p.x = xz.x;
    p.z = xz.y;

    vec3 n = vec3(0.0, 0.0, 1.0);
    // A inclinação do arco derruba a normal para cima conforme sobe.
    n = normalize(vec3(n.x, arco * 0.55, n.z));
    vec2 nxz = r * n.xz;
    vNormal = normalize(vec3(nxz.x, n.y, nxz.y));

    vec3 mundo = p + aOffset + desl;
    // Ao vergar, a ponta também baixa — senão a lâmina parece esticar.
    mundo.y -= (abs(desl.x) + abs(desl.z)) * 0.22;

    vec4 posVista = modelViewMatrix * vec4(mundo, 1.0);
    vVista = normalize(-posVista.xyz);

    gl_Position = projectionMatrix * posVista;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uBase;
  uniform vec3  uMeio;
  uniform vec3  uPonta;
  uniform vec3  uPalha;
  uniform vec3  uNeblina;
  uniform vec3  uSol;
  uniform float uPerto;
  uniform float uLonge;

  varying float vT;
  varying float vTint;
  varying float vDry;
  varying float vEnergia;
  varying vec3  vNormal;
  varying vec3  vVista;

  void main() {
    // Só o terço superior pega a cor clara — espalhar o verde por toda a
    // altura é o que faz o campo parecer grama sintética.
    vec3 c = mix(uBase, uMeio, smoothstep(0.0, 0.62, vT));
    c = mix(c, uPonta, smoothstep(0.68, 1.0, vT));

    // Palha: lâminas secas puxam para o dourado, mais forte na ponta.
    c = mix(c, uPalha, vDry * smoothstep(0.15, 1.0, vT));

    c *= 0.78 + vTint * 0.3;

    vec3 n = normalize(vNormal);
    vec3 v = normalize(vVista);

    // Difuso com as duas faces, já que a folha é fina.
    float dif = abs(dot(n, uSol)) * 0.55 + 0.45;

    // Translucidez: a luz que atravessa a lâmina. É o que faz grama brilhar
    // contra o sol, e pesa mais que qualquer reflexo.
    float trans = pow(max(dot(v, -uSol), 0.0), 3.0) * smoothstep(0.1, 1.0, vT);

    // Oclusão na base: sem isto o campo perde o chão.
    float ao = mix(0.55, 1.0, smoothstep(0.0, 0.45, vT));

    c *= dif * ao;
    c += uPonta * trans * 0.85;
    c += vEnergia * 0.06 * vT;     // o movimento pega um pouco mais de luz

    float prof = gl_FragCoord.z / gl_FragCoord.w;
    c = mix(c, uNeblina, smoothstep(uPerto, uLonge, prof));

    gl_FragColor = vec4(c, 1.0);
  }
`;

function Campo({
  quantidade,
  reduzido,
  corteX,
}: {
  quantidade: number;
  reduzido: boolean;
  corteX: React.RefObject<number>;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const geometria = useMemo(() => {
    // Seis segmentos: o arco precisa de resolução para não facetar.
    const lamina = new THREE.PlaneGeometry(1, 1, 1, 6);
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
    const arco = new Float32Array(quantidade);
    const seca = new Float32Array(quantidade);

    for (let i = 0; i < quantidade; i += 1) {
      // Densidade concentrada perto da câmera: distribuir uniformemente num
      // campo grande deixa menos de duas lâminas por metro quadrado.
      const z = 8 - Math.pow(Math.random(), 1.5) * 108;
      const dist = CAMERA.z - z;
      const meia = 4.0 + dist * 0.86;
      const x = (Math.random() - 0.5) * 2 * meia;

      off[i * 3] = x;
      off[i * 3 + 1] = altura(x, z);
      off[i * 3 + 2] = z;

      yaw[i] = Math.random() * Math.PI;
      esc[i] = 1.05 + Math.random() * 1.35;
      tint[i] = Math.random();
      fase[i] = Math.random() * Math.PI * 2;
      // Arco com sinal, senão o campo inteiro verga para o mesmo lado.
      arco[i] = (0.22 + Math.random() * 0.5) * (Math.random() < 0.5 ? -1 : 1);
      // Um quinto de palha, em manchas — não espalhado uniformemente.
      seca[i] = Math.random() < 0.22 ? 0.35 + Math.random() * 0.5 : 0;
    }

    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute("aYaw", new THREE.InstancedBufferAttribute(yaw, 1));
    g.setAttribute("aScale", new THREE.InstancedBufferAttribute(esc, 1));
    g.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 1));
    g.setAttribute("aPhase", new THREE.InstancedBufferAttribute(fase, 1));
    g.setAttribute("aBend", new THREE.InstancedBufferAttribute(arco, 1));
    g.setAttribute("aDry", new THREE.InstancedBufferAttribute(seca, 1));

    // A lâmina não é descartada: seus atributos são os mesmos objetos usados
    // pela geometria instanciada, e liberá-los apagaria o campo inteiro.
    return g;
  }, [quantidade]);

  useEffect(() => () => geometria.dispose(), [geometria]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGust: { value: new THREE.Vector3(0, -300, 0) },
      uLargura: { value: 0.2 },
      uCorteX: { value: LAVRA.inicio },
      uLavraZ: { value: LAVRA.z },
      uLavraW: { value: LAVRA.largura },
      uBase: { value: COR.base },
      uMeio: { value: COR.meio },
      uPonta: { value: COR.ponta },
      uPalha: { value: COR.palha },
      uNeblina: { value: COR.neblina },
      uSol: { value: SOL },
      uPerto: { value: 46 },
      uLonge: { value: 165 },
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

    u.uCorteX.value = corteX.current ?? LAVRA.inicio;

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
      forca.current += (Math.min(velocidade * 0.055, 1.25) - forca.current) * Math.min(dt * 2.4, 1);
    } else {
      forca.current += (0 - forca.current) * Math.min(dt * 1.6, 1);
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

/** Solo visível na faixa colhida e no horizonte. */
function Chao() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, -34]}>
      <planeGeometry args={[400, 260]} />
      <meshBasicMaterial color={COR.solo} />
    </mesh>
  );
}

/**
 * Colheitadeira em primitivas.
 *
 * Proporção importa mais que detalhe: plataforma larga na frente, rodas
 * dianteiras grandes, cabine envidraçada recuada e o tubo de descarga em
 * diagonal. Essa silhueta o produtor reconhece de longe.
 */
function Colheitadeira({ corteX }: { corteX: React.RefObject<number> }) {
  const grupo = useRef<THREE.Group>(null);
  const molinete = useRef<THREE.Mesh>(null);

  const verde = useMemo(() => new THREE.MeshLambertMaterial({ color: "#2f6b30" }), []);
  const amarelo = useMemo(() => new THREE.MeshLambertMaterial({ color: "#e0b93a" }), []);
  const escuro = useMemo(() => new THREE.MeshLambertMaterial({ color: "#20281f" }), []);
  const vidro = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: "#bcd9e6",
        transparent: true,
        opacity: 0.55,
      }),
    [],
  );

  useFrame((_, dt) => {
    if (!grupo.current) return;
    // Avanço lento: a máquina atravessa a lavoura em pouco mais de um minuto.
    let x = (corteX.current ?? LAVRA.inicio) + dt * 1.9;
    if (x > LAVRA.fim) x = LAVRA.inicio;
    corteX.current = x;
    grupo.current.position.x = x;
    if (molinete.current) molinete.current.rotation.x -= dt * 2.4;
  });

  const y = altura(0, LAVRA.z);

  return (
    <group ref={grupo} position={[LAVRA.inicio, y, LAVRA.z]} rotation={[0, Math.PI / 2, 0]} scale={1.05}>
      {/* corpo */}
      <mesh position={[0, 3.1, 0]} material={verde}>
        <boxGeometry args={[4.2, 2.6, 7.4]} />
      </mesh>
      {/* tanque graneleiro */}
      <mesh position={[0, 4.7, -0.6]} material={verde}>
        <boxGeometry args={[4.6, 1.5, 4.2]} />
      </mesh>
      {/* cabine */}
      <mesh position={[0, 5.0, 2.5]} material={vidro}>
        <boxGeometry args={[3.0, 2.0, 2.6]} />
      </mesh>
      <mesh position={[0, 6.1, 2.5]} material={escuro}>
        <boxGeometry args={[3.2, 0.3, 2.8]} />
      </mesh>
      {/* plataforma de corte */}
      <mesh position={[0, 1.5, 6.2]} material={amarelo}>
        <boxGeometry args={[13.5, 1.3, 2.4]} />
      </mesh>
      <mesh position={[0, 0.85, 7.2]} material={escuro}>
        <boxGeometry args={[13.5, 0.25, 0.7]} />
      </mesh>
      {/* molinete */}
      <mesh ref={molinete} position={[0, 2.8, 6.9]} rotation={[0, 0, Math.PI / 2]} material={amarelo}>
        <cylinderGeometry args={[1.25, 1.25, 12.8, 7, 1, true]} />
      </mesh>
      {/* tubo de descarga */}
      <mesh position={[-3.0, 5.4, -1.0]} rotation={[0, 0, Math.PI / 2.6]} material={verde}>
        <cylinderGeometry args={[0.42, 0.42, 6.4, 10]} />
      </mesh>
      {/* rodas */}
      <mesh position={[2.3, 1.7, 3.1]} rotation={[0, 0, Math.PI / 2]} material={escuro}>
        <cylinderGeometry args={[1.75, 1.75, 1.1, 16]} />
      </mesh>
      <mesh position={[-2.3, 1.7, 3.1]} rotation={[0, 0, Math.PI / 2]} material={escuro}>
        <cylinderGeometry args={[1.75, 1.75, 1.1, 16]} />
      </mesh>
      <mesh position={[1.9, 1.0, -2.9]} rotation={[0, 0, Math.PI / 2]} material={escuro}>
        <cylinderGeometry args={[1.0, 1.0, 0.8, 14]} />
      </mesh>
      <mesh position={[-1.9, 1.0, -2.9]} rotation={[0, 0, Math.PI / 2]} material={escuro}>
        <cylinderGeometry args={[1.0, 1.0, 0.8, 14]} />
      </mesh>
    </group>
  );
}

/** Deriva leve da câmera com o ponteiro. */
function Deriva({ reduzido }: { reduzido: boolean }) {
  const { camera } = useThree();
  const alvo = useRef({ x: CAMERA.x, y: CAMERA.y });

  useFrame((state, dt) => {
    if (reduzido) return;
    alvo.current.x = CAMERA.x + state.pointer.x * 1.5;
    alvo.current.y = CAMERA.y - state.pointer.y * 0.9;
    const k = 1 - Math.pow(0.001, dt);
    camera.position.x += (alvo.current.x - camera.position.x) * k;
    camera.position.y += (alvo.current.y - camera.position.y) * k;
    camera.lookAt(OLHAR);
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
  const corteX = useRef<number>(LAVRA.inicio);

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

  // Sem WebGL: um degradê que sugere a lavoura ao sol, sem buraco na página.
  if (!ok) {
    return (
      <div
        ref={raiz}
        className={`${className} bg-[linear-gradient(to_bottom,#dfe9ea_0%,#cfe0d4_38%,#6d9a4a_58%,#3d6b2a_100%)]`}
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
        camera={{ position: [CAMERA.x, CAMERA.y, CAMERA.z], fov: 52, near: 0.1, far: 260 }}
        onCreated={({ camera }) => {
          camera.lookAt(OLHAR);
          setPronto(true);
        }}
        style={{
          opacity: pronto ? 1 : 0,
          transition: "opacity 1.1s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <hemisphereLight args={["#eaf3f6", "#4a5a3a", 1.25]} />
        <directionalLight position={[SOL.x * 60, SOL.y * 60, SOL.z * 60]} intensity={1.5} />
        <Chao />
        <Campo quantidade={quantidade} reduzido={reduzido} corteX={corteX} />
        <Colheitadeira corteX={corteX} />
        <Deriva reduzido={reduzido} />
      </Canvas>
    </div>
  );
}
