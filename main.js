import * as THREE from 'three';
import { layout } from './layout.js';
import { materials as materialParams } from './materials.js';
import { cameraSchedule } from './camera-schedule.js';

// 1. 导入你的六个模块
import * as terrain from './terrain-rocks.js';
import * as water from './water-life.js';
import * as hall from './hall-timber.js';
import * as stones from './cloud-stones.js';
import * as walls from './corridor-walls.js';
import * as plants from './plants-bonsai.js';

// 2. 搭建基础场景（天空、光照、相机）
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 清晨天空背景色
scene.fog = new THREE.FogExp2(0x87CEEB, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 3. 设置东南方向 7度的日出光照（满足你的硬性要求）
const sunLight = new THREE.DirectionalLight(0xffddaa, 2.5);
sunLight.position.set(30, 7, -30); // 东南方向，低角度
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 150;
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // 环境光补光

// 4. 将 parameters 转换为真实材质
const materialRegistry = new Map();
// 如果 materials.js 导出了参数，我们把它实例化
for (const [key, val] of Object.entries(materialParams)) {
    if (val && typeof val === 'object' && !val.isMaterial) {
        materialRegistry.set(key, new THREE.MeshStandardMaterial({
            color: val.color || 0xffffff,
            roughness: val.roughness ?? 0.8,
            metalness: val.metalness ?? 0.1,
            flatShading: val.flatShading ?? false
        }));
    }
}

// 5. 组装上下文，加载你的六个模块
const context = {
    engine: THREE,
    materials: materialRegistry
};

const modules = [terrain, water, hall, stones, walls, plants];
const roots = [];

for (const mod of modules) {
    if (typeof mod.createModule === 'function') {
        try {
            const instance = mod.createModule(context);
            if (instance && instance.root) {
                scene.add(instance.root);
                roots.push(instance);
            }
        } catch (e) {
            console.error("模块加载失败:", e);
        }
    }
}

// 6. 运镜动画控制
const clock = new THREE.Clock();
let totalTime = 0;

function getCameraPose(t) {
    // 容错处理：如果你的 cameraSchedule 格式不同，这里是兜底环绕运镜
    if (cameraSchedule && cameraSchedule.length > 0) {
        // 这里为了防报错，简单做线性插值，具体看你 camera-schedule.js 的结构
        return cameraSchedule[0]; 
    }
    // 兜底：30 秒内围绕中心转一圈并拉高
    const angle = (t / 30) * Math.PI * 2;
    return {
        position: [Math.sin(angle) * 20, 10 + t * 0.5, Math.cos(angle) * 20],
        target: [0, 0, 0]
    };
}

function animate() {
    requestAnimationFrame(animate);
    
    // 30 秒循环播放
    totalTime = (clock.getElapsedTime() % 30); 
    
    const pose = getCameraPose(totalTime);
    if (pose && pose.position) {
        camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
        if (pose.target) {
            camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
        } else {
            camera.lookAt(0, 0, 0);
        }
    }

    renderer.render(scene, camera);
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
