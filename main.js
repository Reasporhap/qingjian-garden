import * as THREE from 'three';
import { layout } from './layout.js';
import { materials as materialParams } from './materials.js';
import { cameraSchedule } from './camera-schedule.js';

import * as terrain from './terrain-rocks.js';
import * as water from './water-life.js';
import * as hall from './hall-timber.js';
import * as stones from './cloud-stones.js';
import * as walls from './corridor-walls.js';
import * as plants from './plants-bonsai.js';

// 1. 基础场景搭建
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.FogExp2(0x87CEEB, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// 强行把相机放在高处往下看，保证一定能看到
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 2. 日出光照
const sunLight = new THREE.DirectionalLight(0xffddaa, 2.5);
sunLight.position.set(30, 7, -30); 
sunLight.castShadow = true;
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.6)); 

// 3. 暴力材质兼容（防止找不到材质报错）
const materialRegistry = new Map();
const getColor = (obj) => {
    if (!obj) return 0x888888;
    return obj.color ?? obj.hex ?? 0x888888;
};

for (const [key, val] of Object.entries(materialParams)) {
    if (val && typeof val === 'object') {
        materialRegistry.set(key, new THREE.MeshStandardMaterial({
            color: getColor(val),
            roughness: val.roughness ?? 0.8,
        }));
    }
}
// 如果实在没有，硬塞几个兜底
if (materialRegistry.size === 0) {
    materialRegistry.set('plaster', new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    materialRegistry.set('slate', new THREE.MeshStandardMaterial({ color: 0x666666 }));
    materialRegistry.set('water', new THREE.MeshStandardMaterial({ color: 0x336699 }));
}

// 4. 加载模块
const context = { engine: THREE, materials: materialRegistry };
const modules = [terrain, water, hall, stones, walls, plants];
let loadedCount = 0;

for (const mod of modules) {
    if (typeof mod.createModule === 'function') {
        try {
            const instance = mod.createModule(context);
            if (instance && instance.root) {
                scene.add(instance.root);
                loadedCount++;
            }
        } catch (e) {
            console.warn("某个模块加载遇到问题：", e.message); // 强行忽略，继续加载下一个
        }
    }
}
document.getElementById('ui').innerText = `清涧园 - 已加载 ${loadedCount} 个模块`;

// 5. 动画循环
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const t = (clock.getElapsedTime() % 30);
    
    // 强制缓慢旋转，只要能看到东西就行
    const angle = t * 0.1; 
    camera.position.x = Math.sin(angle) * 25;
    camera.position.z = Math.cos(angle) * 25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
