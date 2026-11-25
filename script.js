import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const themeToggle = document.getElementById('themeToggle');
const header = document.querySelector('.header-principal');
const root = document.documentElement;
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light') root.dataset.theme = 'light';

function updateThemeButton() {
    const isLight = root.dataset.theme === 'light';
    themeToggle?.setAttribute('aria-label', `Ativar modo ${isLight ? 'escuro' : 'claro'}`);
    if (themeToggle) themeToggle.innerHTML = `${isLight ? '☾' : '☀'} <span>Modo ${isLight ? 'escuro' : 'claro'}</span>`;
}

updateThemeButton();
themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (nextTheme === 'dark') delete root.dataset.theme;
    else root.dataset.theme = nextTheme;
    localStorage.setItem('portfolio-theme', nextTheme);
    updateThemeButton();
});

if (header) {
    const magneticItems = header.querySelectorAll('.menu-lista a, .acoes .btn');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (canHover) {
        header.addEventListener('pointermove', (event) => {
            const bounds = header.getBoundingClientRect();
            header.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
            header.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);

            magneticItems.forEach((item) => {
                const itemBounds = item.getBoundingClientRect();
                const offsetX = event.clientX - (itemBounds.left + itemBounds.width / 2);
                const offsetY = event.clientY - (itemBounds.top + itemBounds.height / 2);
                const distance = Math.hypot(offsetX, offsetY);
                const strength = Math.max(0, 1 - distance / 110) * 0.16;
                item.style.setProperty('--mag-x', `${offsetX * strength}px`);
                item.style.setProperty('--mag-y', `${offsetY * strength}px`);
            });
        });

        header.addEventListener('pointerleave', () => {
            magneticItems.forEach((item) => {
                item.style.setProperty('--mag-x', '0px');
                item.style.setProperty('--mag-y', '0px');
            });
        });
    }

    let previousStickyState = false;
    window.addEventListener('scroll', () => {
        const isStuck = window.scrollY > 24;
        if (isStuck !== previousStickyState) {
            header.classList.toggle('is-stuck', isStuck);
            previousStickyState = isStuck;
        }
    }, { passive: true });
}

// A cápsula acompanha o item sob o ponteiro ou foco e retorna para a seção atual.
const menu = document.querySelector('.menu-lista');
const capsule = menu?.querySelector('.capsula-hover');
const navLinks = menu ? [...menu.querySelectorAll('a[href^="#"]')] : [];
if (menu && capsule && navLinks.length) {
    let hoveredLink = null;
    let currentLink = navLinks[0];

    const moveCapsule = (link) => {
        if (!link) return;
        const menuBox = menu.getBoundingClientRect();
        const linkBox = link.getBoundingClientRect();
        capsule.style.width = `${linkBox.width}px`;
        capsule.style.height = `${linkBox.height}px`;
        capsule.style.transform = `translate(${linkBox.left - menuBox.left}px, ${linkBox.top - menuBox.top}px)`;
        capsule.classList.add('is-visible');
    };

    const setCurrent = (link) => {
        if (!link) return;
        currentLink = link;
        navLinks.forEach((item) => {
            if (item === link) item.setAttribute('aria-current', 'location');
            else item.removeAttribute('aria-current');
        });
        if (!hoveredLink) moveCapsule(currentLink);
    };

    navLinks.forEach((link) => {
        link.addEventListener('pointerenter', () => { hoveredLink = link; moveCapsule(link); });
        link.addEventListener('focus', () => moveCapsule(link));
        link.addEventListener('blur', () => moveCapsule(currentLink));
    });
    menu.addEventListener('pointerleave', () => {
        hoveredLink = null;
        moveCapsule(currentLink);
    });

    const sections = navLinks.map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
        .filter(({ section }) => section);
    const updateCurrentSection = () => {
        const marker = window.innerHeight * 0.38;
        let visible = sections.filter(({ section }) => {
            const box = section.getBoundingClientRect();
            return box.top <= marker && box.bottom > marker;
        }).at(-1);
        if (!visible && window.scrollY < 80) visible = sections[0];
        if (visible) setCurrent(visible.link);
    };

    window.addEventListener('scroll', updateCurrentSection, { passive: true });
    window.addEventListener('resize', () => moveCapsule(hoveredLink || currentLink));
    requestAnimationFrame(() => {
        updateCurrentSection();
        moveCapsule(currentLink);
    });
}

const canvas = document.getElementById('penguinCanvas');
const spriteCanvas = document.querySelector('.penguin');

// Cada PNG da pasta é um quadro de 498 × 498 da dança.
if (spriteCanvas) {
    const spriteContext = spriteCanvas.getContext('2d');
    const frames = Array.from({ length: 33 }, (_, index) => {
        const image = new Image();
        image.src = `./Animação_CBP/sprite_danca_${index + 1}.png`;
        return image;
    });
    let frameIndex = 0;
    let lastFrameTime = 0;
    const frameDuration = 1000 / 12;

    function drawSprite(time = 0) {
        const bounds = spriteCanvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.round(bounds.width * pixelRatio);
        const height = Math.round(bounds.height * pixelRatio);
        if (spriteCanvas.width !== width || spriteCanvas.height !== height) {
            spriteCanvas.width = width;
            spriteCanvas.height = height;
        }

        if (!spriteCanvas.matches(':hover') && time - lastFrameTime >= frameDuration) {
            frameIndex = (frameIndex + 1) % frames.length;
            lastFrameTime = time;
        }

        const frame = frames[frameIndex];
        if (frame.complete && frame.naturalWidth) {
            spriteContext.clearRect(0, 0, width, height);
            spriteContext.drawImage(frame, 0, 0, width, height);
        }
        requestAnimationFrame(drawSprite);
    }
    Promise.all(frames.map(frame => new Promise(resolve => {
        frame.onload = resolve;
        frame.onerror = resolve;
    }))).then(() => requestAnimationFrame(drawSprite));
}


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
