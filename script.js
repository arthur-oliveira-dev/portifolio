import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('penguinCanvas');

// ========================
// CENA
// ========================
const scene = new THREE.Scene();

// ========================
// RENDERIZADOR
// ========================
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

// ========================
// AMBIENTE (reflexos que dão cor e volume aos materiais)
// ========================
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// ========================
// CÂMERA
// ========================
const camera = new THREE.PerspectiveCamera(
    35,
    canvas.clientWidth / canvas.clientHeight || 1,
    0.1,
    100
);

// ========================
// LUZES
// ========================
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x555555, 1);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

// ========================
// CONTROLES
// ========================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// ========================
// MODELO
// ========================
const loader = new GLTFLoader();

loader.load(
    './images_models/club_penguin.glb',

    (gltf) => {
        console.log('PINGUIM CARREGADO!');

        const penguin = gltf.scene;

        // Diagnóstico: mostra se os meshes têm cor e textura
        penguin.traverse((child) => {
            if (child.isMesh) {
                console.log('Mesh:', child.name, {
                    cor: child.material.color,
                    textura: child.material.map ? 'sim' : 'não'
                });
            }
        });

        // 1. Normalizar o tamanho: o modelo passa a ter 2 unidades de altura
        let box = new THREE.Box3().setFromObject(penguin);
        const size = box.getSize(new THREE.Vector3());
        const scale = 2 / Math.max(size.x, size.y, size.z);
        penguin.scale.setScalar(scale);

        scene.add(penguin);

        // 2. Centralizar o modelo na origem
        box = new THREE.Box3().setFromObject(penguin);
        const center = box.getCenter(new THREE.Vector3());
        penguin.position.sub(center);

        // 3. Calcular distância da câmera pelo tamanho final
        box = new THREE.Box3().setFromObject(penguin);
        const finalSize = box.getSize(new THREE.Vector3());
        const radius = finalSize.length() / 2;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (radius / Math.sin(fov / 2)) * 1.1;

        camera.position.set(0, 0, distance);
        camera.near = distance / 100;
        camera.far = distance * 10;
        camera.updateProjectionMatrix();

        // 4. Limites de zoom proporcionais ao tamanho do modelo
        controls.target.set(0, 0, 0);
        controls.minDistance = distance * 0.6;
        controls.maxDistance = distance * 1.6;
        controls.update();
    },

    (progress) => {
        if (progress.total) {
            console.log(
                'Carregando:',
                Math.round((progress.loaded / progress.total) * 100) + '%'
            );
        }
    },

    (error) => {
        console.error('ERRO AO CARREGAR O PINGUIM:', error);
    }
);

// ========================
// TAMANHO DO CANVAS
// ========================
function resizeRenderer() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}

new ResizeObserver(resizeRenderer).observe(canvas);
window.addEventListener('resize', resizeRenderer);

// ========================
// ANIMAÇÃO
// ========================
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
