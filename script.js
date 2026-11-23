import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('penguinCanvas');


const scene = new THREE.Scene();


const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;


const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;



const camera = new THREE.PerspectiveCamera(
    35,
    canvas.clientWidth / canvas.clientHeight || 1,
    0.1,
    100
);


const hemiLight = new THREE.HemisphereLight(0xffffff, 0x555555, 0.5);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.enablePan = false;
const loader = new GLTFLoader();

loader.load(
    './images_models/club_penguin.glb',

    (gltf) => {
        console.log('PINGUIM CARREGADO!');

        const penguin = gltf.scene;

        
        penguin.traverse((child) => {
            if (child.isMesh) {
                console.log('Mesh:', child.name, {
                    cor: child.material.color,
                    textura: child.material.map ? 'sim' : 'não'
                });
            }
        });

        
        let box = new THREE.Box3().setFromObject(penguin);
        const size = box.getSize(new THREE.Vector3());
        const scale = 2 / Math.max(size.x, size.y, size.z);
        penguin.scale.setScalar(scale);

        scene.add(penguin);

       
        box = new THREE.Box3().setFromObject(penguin);
        const center = box.getCenter(new THREE.Vector3());
        penguin.position.sub(center);

        
        box = new THREE.Box3().setFromObject(penguin);
        const finalSize = box.getSize(new THREE.Vector3());
        const radius = finalSize.length() / 2;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (radius / Math.sin(fov / 2)) * 1.1;

        camera.position.set(0, 0, distance);
        camera.near = distance / 100;
        camera.far = distance * 10;
        camera.updateProjectionMatrix();


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

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
