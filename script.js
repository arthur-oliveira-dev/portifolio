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

/// =================================
// Skills — navegação e detalhes dirigidos pelos dados do HTML
// =================================
const skillsSection = document.querySelector('.skills-section');
const skillsPreview = document.querySelector('[data-skill-preview]');
const skillsDialog = document.querySelector('.skills-dialog');

if (skillsSection && skillsPreview && skillsDialog) {
    const previewImage = skillsPreview.querySelector('[data-preview-image]');
    const previewTitle = skillsPreview.querySelector('[data-preview-title]');
    const previewCategory = skillsPreview.querySelector('[data-preview-category]');
    const previewDescription = skillsPreview.querySelector('[data-preview-description]');
    const previewInfo = skillsPreview.querySelector('[data-preview-info]');
    const previewActions = skillsPreview.querySelector('.skill-preview__actions');
    const dialogTitle = skillsDialog.querySelector('#skills-dialog-title');
    const dialogCover = skillsDialog.querySelector('[data-detail-cover]');
    const dialogCategory = skillsDialog.querySelector('[data-detail-category]');
    const dialogActions = skillsDialog.querySelector('[data-detail-actions]');
    const dialogMetadata = skillsDialog.querySelector('[data-detail-metadata]');
    const dialogDescription = skillsDialog.querySelector('[data-detail-description]');
    const descriptionBlock = skillsDialog.querySelector('[data-description-block]');
    const mainGroups = skillsDialog.querySelector('[data-main-groups]');
    const sideGroups = skillsDialog.querySelector('[data-side-groups]');
    const filesSection = skillsDialog.querySelector('[data-files-section]');
    const fileFilter = skillsDialog.querySelector('[data-file-filter]');
    const fileList = skillsDialog.querySelector('[data-file-list]');
    const filesSummary = skillsDialog.querySelector('[data-files-summary]');
    const practicalSection = skillsDialog.querySelector('[data-practical-section]');
    const practicalGroups = skillsDialog.querySelector('[data-practical-groups]');
    const closeButton = skillsDialog.querySelector('[data-skill-close]');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeCard = null;
    let activeTrigger = null;
    let hidePreviewTimer = 0;
    let showPreviewTimer = 0;
    let closeDialogTimer = 0;
    let savedBodyOverflow = '';
    let savedScrollY = 0;
    let activeProject = '';
    let suppressTriggerFocusPreview = false;

    const cardSource = (card) => card?.querySelector('.skill-card__source')?.content;
    const sourceText = (source, selector) => source?.querySelector(selector)?.textContent.trim() || '';

    function readWebLink(source, selector) {
        const link = source?.querySelector(selector);
        const href = link?.getAttribute('href')?.trim();
        if (!href || href.startsWith('#')) return null;
        try {
            const url = new URL(href, window.location.href);
            if (!['http:', 'https:'].includes(url.protocol)) return null;
            return { link, url: url.href };
        } catch {
            return null;
        }
    }

    function copyAction(source, selector, target, kind) {
        const result = readWebLink(source, selector);
        if (!result || !target) {
            if (target) target.hidden = true;
            return false;
        }

        target.href = result.url;
        target.target = '_blank';
        target.rel = 'noopener noreferrer';
        target.hidden = false;
        if (kind === 'demo') {
            const icon = document.createElement('span');
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '▶';
            target.replaceChildren(icon, document.createTextNode(result.link.textContent.trim()));
        }
        return true;
    }

    function positionPreview() {
        if (!activeCard || !skillsPreview.classList.contains('is-visible')) return;
        const trigger = activeCard.querySelector('[data-skill-trigger]');
        const track = activeCard.closest('.skills-row__track');
        if (!trigger || !track) return;

        const anchor = trigger.getBoundingClientRect();
        const trackBounds = track.getBoundingClientRect();
        if (anchor.right < trackBounds.left || anchor.left > trackBounds.right) {
            closePreview();
            return;
        }
        const previewBounds = skillsPreview.getBoundingClientRect();
        const width = previewBounds.width;
        const height = previewBounds.height;
        const desiredLeft = anchor.left + anchor.width / 2 - width / 2;
        const viewportMin = 10;
        const viewportMax = Math.max(viewportMin, window.innerWidth - width - 10);
        const trackMin = Math.max(viewportMin, trackBounds.left + 4);
        const trackMax = Math.min(viewportMax, trackBounds.right - width - 4);
        const minLeft = trackMax >= trackMin ? trackMin : viewportMin;
        const maxLeft = trackMax >= trackMin ? trackMax : viewportMax;
        const left = Math.min(maxLeft, Math.max(minLeft, desiredLeft));
        const desiredTop = anchor.top - 26;
        const maxTop = Math.max(10, window.innerHeight - height - 10);
        const top = Math.min(maxTop, Math.max(10, desiredTop));

        skillsPreview.style.left = `${left}px`;
        skillsPreview.style.top = `${top}px`;
    }

    function focusTriggerWithoutPreview(trigger) {
        if (!trigger) return;
        suppressTriggerFocusPreview = true;
        trigger.focus();
        queueMicrotask(() => { suppressTriggerFocusPreview = false; });
    }

    function closePreview(restoreFocus = true) {
        window.clearTimeout(hidePreviewTimer);
        const triggerToRestore = restoreFocus && skillsPreview.contains(document.activeElement) ? activeTrigger : null;
        skillsPreview.classList.remove('is-visible');
        skillsPreview.setAttribute('aria-hidden', 'true');
        skillsPreview.inert = true;
        activeCard = null;
        activeTrigger = null;
        focusTriggerWithoutPreview(triggerToRestore);
    }

    function scheduleHidePreview() {
        if (document.activeElement === activeTrigger || skillsPreview.contains(document.activeElement)) return;
        window.clearTimeout(hidePreviewTimer);
        hidePreviewTimer = window.setTimeout(closePreview, 210);
    }

    function showPreview(card) {
        const source = cardSource(card);
        const title = sourceText(source, '.skill-detail__title');
        const image = card.querySelector('.skill-card__image');
        if (!source || !title || !image) return;

        window.clearTimeout(showPreviewTimer);
        window.clearTimeout(hidePreviewTimer);
        activeCard = card;
        activeTrigger = card.querySelector('[data-skill-trigger]');
        previewImage.src = image.currentSrc || image.src;
        previewImage.alt = image.alt;
        previewTitle.textContent = title;
        previewCategory.textContent = sourceText(source, '.skill-detail__category');
        previewDescription.textContent = sourceText(source, '.skill-detail__description');
        previewCategory.hidden = !previewCategory.textContent;
        previewDescription.hidden = !previewDescription.textContent;
        copyAction(source, '[data-demo-link]', previewActions.querySelector('[data-preview-demo]'), 'demo');
        copyAction(source, '[data-source-link]', previewActions.querySelector('[data-preview-source]'), 'source');
        previewInfo.setAttribute('aria-label', `Abrir detalhes de ${title}`);
        skillsPreview.inert = false;
        skillsPreview.setAttribute('aria-hidden', 'false');
        skillsPreview.classList.add('is-visible');
        positionPreview();
    }

    function appendGroups(source, selector, target) {
        const groups = source?.querySelectorAll(selector);
        if (!groups?.length) return 0;
        let count = 0;
        groups.forEach((group) => {
            const usefulContent = [...group.children].some((child) =>
                !child.matches('h1, h2, h3, h4, h5, h6') && child.textContent.trim()
            );
            if (!usefulContent) return;
            target.append(group.cloneNode(true));
            count += 1;
        });
        return count;
    }

    function fillMetadata(source) {
        dialogMetadata.replaceChildren();
        const category = sourceText(source, '.skill-detail__category');
        const context = sourceText(source, '.skill-detail__context');
        const project = sourceText(source, '[data-skill-project]');
        [category, context, project].filter(Boolean).forEach((value) => {
            const chip = document.createElement('span');
            chip.textContent = value;
            dialogMetadata.append(chip);
        });
        const metadata = source?.querySelector('.skill-detail__metadata');
        metadata?.querySelectorAll('span').forEach((item) => {
            if (item.textContent.trim()) dialogMetadata.append(item.cloneNode(true));
        });
    }

    function setupFileList(source) {
        const files = source?.querySelectorAll('[data-skill-file]');
        fileList.replaceChildren();
        fileFilter.replaceChildren(fileFilter.querySelector('option[value="all"]').cloneNode(true));
        filesSummary.textContent = '';
        if (!files?.length) {
            filesSection.hidden = true;
            const practicalCount = appendGroups(source, '[data-detail-placement="practical"]', practicalGroups)
                || appendGroups(source, '[data-detail-placement="main"]', practicalGroups);
            practicalSection.hidden = practicalCount === 0;
            return;
        }

        const project = sourceText(source, '[data-skill-project]');
        const categories = new Set();
        files.forEach((file) => {
            const category = file.dataset.fileCategory?.trim();
            if (category) categories.add(category);
            const item = file.cloneNode(true);
            const projectLabel = item.querySelector('[data-file-project]');
            if (projectLabel) projectLabel.textContent = project;
            const link = item.querySelector('[data-file-link]');
            if (link) {
                const href = link.getAttribute('href')?.trim();
                try {
                    const url = href ? new URL(href, window.location.href) : null;
                    if (!url || !['http:', 'https:'].includes(url.protocol) || href.startsWith('#')) link.remove();
                    else {
                        link.href = url.href;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    }
                } catch { link.remove(); }
            }
            fileList.append(item);
        });

        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            fileFilter.append(option);
        });

        filesSection.hidden = false;
        practicalSection.hidden = true;
        updateFileSummary();
    }

    function updateFileSummary() {
        const selected = fileFilter.value;
        let count = 0;
        fileList.querySelectorAll('[data-skill-file]').forEach((file) => {
            const visible = selected === 'all' || file.dataset.fileCategory === selected;
            file.hidden = !visible;
            if (visible) count += 1;
        });
        const category = selected === 'all' ? 'Todos os arquivos' : selected;
        filesSummary.textContent = `${activeProject ? `${activeProject} · ` : ''}${category} · ${count} ${count === 1 ? 'item' : 'itens'}`;
    }

    function openDetails(card) {
        const source = cardSource(card);
        const title = sourceText(source, '.skill-detail__title');
        const image = card.querySelector('.skill-card__image');
        if (!source || !title || !image) return;

        closePreview(false);
        window.clearTimeout(closeDialogTimer);
        skillsDialog.classList.remove('is-closing');
        activeTrigger = card.querySelector('[data-skill-trigger]');
        activeProject = sourceText(source, '[data-skill-project]');
        dialogTitle.textContent = title;
        dialogCategory.textContent = sourceText(source, '.skill-detail__category');
        dialogCover.src = image.currentSrc || image.src;
        dialogCover.alt = image.alt;
        dialogDescription.textContent = sourceText(source, '.skill-detail__description');
        descriptionBlock.hidden = false;
        fillMetadata(source);
        mainGroups.replaceChildren();
        sideGroups.replaceChildren();
        practicalGroups.replaceChildren();
        const mainGroupCount = appendGroups(source, '[data-detail-placement="main"]', mainGroups);
        descriptionBlock.hidden = !dialogDescription.textContent.trim() && mainGroupCount === 0;
        const sideCount = appendGroups(source, '[data-detail-placement="side"]', sideGroups);
        sideGroups.hidden = sideCount === 0;
        copyAction(source, '[data-demo-link]', dialogActions.querySelector('[data-detail-demo]'), 'demo');
        copyAction(source, '[data-source-link]', dialogActions.querySelector('[data-detail-source]'), 'source');
        setupFileList(source);

        if (!skillsDialog.open) {
            savedScrollY = window.scrollY;
            savedBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            skillsDialog.showModal();
        }
        closeButton.focus();
    }

    function closeDialog() {
        if (!skillsDialog.open || skillsDialog.classList.contains('is-closing')) return;
        if (reducedMotion.matches) {
            skillsDialog.close();
            return;
        }
        skillsDialog.classList.add('is-closing');
        closeDialogTimer = window.setTimeout(() => {
            if (skillsDialog.open) skillsDialog.close();
        }, 180);
    }

    skillsSection.querySelectorAll('[data-skill-trigger]').forEach((trigger) => {
        const card = trigger.closest('[data-skill-card]');
        const title = sourceText(cardSource(card), '.skill-detail__title');
        if (title) trigger.setAttribute('aria-label', `Pré-visualizar ${title}`);
    });

    skillsSection.addEventListener('pointerover', (event) => {
        if (!finePointer.matches) return;
        const trigger = event.target.closest('[data-skill-trigger]');
        if (!trigger || trigger.contains(event.relatedTarget)) return;
        window.clearTimeout(showPreviewTimer);
        showPreviewTimer = window.setTimeout(() => showPreview(trigger.closest('[data-skill-card]')), 105);
    });

    skillsSection.addEventListener('pointerout', (event) => {
        if (!finePointer.matches) return;
        const trigger = event.target.closest('[data-skill-trigger]');
        if (trigger && !trigger.contains(event.relatedTarget)) scheduleHidePreview();
    });

    skillsSection.addEventListener('focusin', (event) => {
        const trigger = event.target.closest('[data-skill-trigger]');
        if (trigger && !suppressTriggerFocusPreview) showPreview(trigger.closest('[data-skill-card]'));
    });

    skillsSection.addEventListener('click', (event) => {
        const scrollButton = event.target.closest('[data-scroll]');
        if (scrollButton) {
            const track = scrollButton.closest('.skills-row')?.querySelector('.skills-row__track');
            if (track) track.scrollBy({ left: Number(scrollButton.dataset.scroll) * track.clientWidth * .8, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
            return;
        }
        const trigger = event.target.closest('[data-skill-trigger]');
        if (trigger) showPreview(trigger.closest('[data-skill-card]'));
    });

    skillsSection.addEventListener('keydown', (event) => {
        const track = event.target.closest('.skills-row__track');
        if (track && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            track.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * track.clientWidth * .8, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        }
        if (event.key === 'Tab' && !event.shiftKey && event.target.matches('[data-skill-trigger]')) {
            if (activeCard !== event.target.closest('[data-skill-card]')) return;
            event.preventDefault();
            const firstAction = skillsPreview.querySelector('a:not([hidden]), button:not([hidden])');
            firstAction?.focus();
        }
        if (event.key === 'Escape' && !skillsDialog.open && skillsPreview.classList.contains('is-visible')) closePreview();
    });

    skillsPreview.addEventListener('pointerenter', () => window.clearTimeout(hidePreviewTimer));
    skillsPreview.addEventListener('pointerleave', scheduleHidePreview);
    skillsPreview.addEventListener('click', (event) => {
        if (event.target.closest('[data-preview-info]') && activeCard) openDetails(activeCard);
    });
    skillsPreview.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const trigger = activeTrigger;
            closePreview();
            trigger?.focus();
            return;
        }
        if (event.key !== 'Tab') return;
        const actions = [...skillsPreview.querySelectorAll('a:not([hidden]), button:not([hidden])')];
        if (!actions.length) return;
        const first = actions[0];
        const last = actions[actions.length - 1];
        if (event.shiftKey && event.target === first) {
            event.preventDefault();
            activeTrigger?.focus();
        } else if (!event.shiftKey && event.target === last) {
            const triggers = skillsSection.querySelectorAll('[data-skill-trigger]');
            let focusNext = false;
            triggers.forEach((trigger) => {
                if (focusNext) {
                    trigger.focus();
                    focusNext = false;
                } else if (trigger === activeTrigger) focusNext = true;
            });
            if (focusNext) triggers[0]?.focus();
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('[data-skill-trigger], [data-skill-preview]')) return;
        if (!skillsDialog.open) closePreview();
    });

    window.addEventListener('scroll', positionPreview, { passive: true });
    window.addEventListener('resize', positionPreview);
    skillsSection.addEventListener('scroll', positionPreview, { passive: true, capture: true });
    fileFilter.addEventListener('change', updateFileSummary);

    closeButton.addEventListener('click', closeDialog);
    skillsDialog.addEventListener('click', (event) => {
        if (event.target === skillsDialog) closeDialog();
    });
    skillsDialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeDialog();
    });
    skillsDialog.addEventListener('close', () => {
        window.clearTimeout(closeDialogTimer);
        skillsDialog.classList.remove('is-closing');
        document.body.style.overflow = savedBodyOverflow;
        window.scrollTo(0, savedScrollY);
        focusTriggerWithoutPreview(activeTrigger);
        activeTrigger = null;
    });
}
