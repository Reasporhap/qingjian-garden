import * as THREE from 'three';
import * as materialSource from './materials.js';

import * as terrain from './terrain-rocks.js';
import * as water from './water-life.js';
import * as hall from './hall-timber.js';
import * as stones from './cloud-stones.js';
import * as walls from './corridor-walls.js';
import * as plants from './plants-bonsai.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sunLight = new THREE.DirectionalLight(0xffddaa, 3);
sunLight.position.set(30, 7, -30); 
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.6)); 

// 【核心修复】：暴力穿透解析材质
const materialRegistry = new Map();
const palette = materialSource.materials || materialSource;

// 把可能包裹材质的对象全展开
const rawMaterials = palette.materials || palette;

for (const [key, val] of Object.entries(rawMaterials)) {
    if (val && typeof val === 'object' && !key.includes('random') && !key.includes('rule')) {
        materialRegistry.set(key, new THREE.MeshStandardMaterial({
            color: val.color ?? 0x888888,
            roughness: val.roughness ?? 0.8,
            metalness: val.metalness ?? 0
        }));
    }
}

// 终极兜底：就算你没写颜色，我也硬塞几个进去防止报错
const fallbackColors = {
    'slate': 0x666666, 'water': 0x336699, 'plaster': 0xeeeeee, 
    'chestnutwood': 0x4a2e1b, 'lakeStone': 0x777777, 'foliage': 0x2e5c1a,
    'bud': 0xffb6c1, 'roofTile': 0x333333
};
for (const [key, color] of Object.entries(fallbackColors)) {
    if (!materialRegistry.has(key)) {
        materialRegistry.set(key, new THREE.MeshStandardMaterial({ color }));
    }
}

const context = { engine: THREE, materials: materialRegistry };
const modules = [terrain, water, hall, stones, walls, plants];
let loadedCount = 0;
let errMsg = "";

for (const mod of modules) {
    if (typeof mod.createModule === 'function') {
        try {
            const instance = mod.createModule(context);
            if (instance && instance.root) {
                scene.add(instance.root);
                loadedCount++;
            }
        } catch (e) {
            errMsg += e.message + " | ";
        }
    }
}

const ui = document.getElementById('ui');
if (ui) {
    ui.innerText = `清涧园 - 已加载 ${loadedCount} 个模块`;
    if (loadedCount < 6) {
        ui.innerText += ` | 报错信息: ${errMsg}`; // 把报错直接印在屏幕上
        ui.style.color = 'red';
        ui.style.fontSize = '20px';
    }
}

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime() % 30;
    camera.position.x = Math.sin(t * 0.1) * 25;
    camera.position.z = Math.cos(t * 0.1) * 25;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
