import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('penguinCanvas');


// ========================
// CENA
// ========================

const scene = new THREE.Scene();


// ========================
// CÂMERA
// ========================

const camera = new THREE.PerspectiveCamera(
    35,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
);

camera.position.set(0, 1, 4);


// ========================
// RENDERIZADOR
// ========================

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setSize(
    canvas.clientWidth,
    canvas.clientHeight,
    false
);

renderer.outputColorSpace = THREE.SRGBColorSpace;


// ========================
// LUZ
// ========================

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    2
);

scene.add(ambientLight);


const light = new THREE.DirectionalLight(
    0xffffff,
    3
);

light.position.set(3, 5, 4);

scene.add(light);


// ========================
// CONTROLES
// ========================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.enablePan = false;

controls.minDistance = 2;
controls.maxDistance = 6;


// ========================
// MODELO
// ========================

const loader = new GLTFLoader();

loader.load(

    './images_models/club_penguin.glb',

    function (gltf) {

        console.log('PINGUIM CARREGADO!');

        const penguin = gltf.scene;

        scene.add(penguin);


        // Descobrir tamanho do modelo
        const box = new THREE.Box3().setFromObject(penguin);

        const center = box.getCenter(
            new THREE.Vector3()
        );

        const size = box.getSize(
            new THREE.Vector3()
        );


        // Centralizar
        penguin.position.x -= center.x;
        penguin.position.z -= center.z;
        penguin.position.y -= box.min.y;


        // Ajustar câmera ao tamanho do pinguim
        const maxSize = Math.max(
            size.x,
            size.y,
            size.z
        );

        camera.position.set(
            0,
            maxSize * 0.5,
            maxSize * 2.8
        );


        controls.target.set(
            0,
            maxSize * 0.5,
            0
        );

        controls.update();

    },

    function (progress) {

        console.log(
            'Carregando:',
            Math.round(
                (progress.loaded / progress.total) * 100
            ) + '%'
        );

    },

    function (error) {

        console.error(
            'ERRO AO CARREGAR O PINGUIM:',
            error
        );

    }

);


// ========================
// TAMANHO DA JANELA
// ========================

function resize() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height,
        false
    );

}

window.addEventListener(
    'resize',
    resize
);


// ========================
// ANIMAÇÃO
// ========================

function animate() {

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(
        scene,
        camera
    );

}

animate();