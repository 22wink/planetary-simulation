// 场景初始化
let scene, camera, renderer, controls;
let particles, particleSystem;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// 初始化场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        2000
    );
    camera.position.z = 1000;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 创建轨道控制器（如果可用）
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 300;
        controls.maxDistance = 2000;
    } else {
        // 如果OrbitControls不可用，使用简单的鼠标控制
        console.warn('OrbitControls未加载，使用基础鼠标控制');
        controls = null;
    }

    // 创建粒子系统
    createParticles();

    // 添加鼠标移动监听
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    // 开始动画
    animate();
}

// 创建粒子系统
function createParticles() {
    const particlesCount = 10000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);

    const color1 = new THREE.Color(0x4fc3f7); // 蓝色
    const color2 = new THREE.Color(0xff6b6b); // 红色
    const color3 = new THREE.Color(0x4ecdc4); // 青色
    const color4 = new THREE.Color(0xffe66d); // 黄色

    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;

        // 随机位置（球形分布）
        const radius = Math.random() * 1500 + 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        // 随机颜色
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.25) {
            color = color1;
        } else if (colorChoice < 0.5) {
            color = color2;
        } else if (colorChoice < 0.75) {
            color = color3;
        } else {
            color = color4;
        }

        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        // 随机大小
        sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建着色器材质
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pixelRatio: { value: window.devicePixelRatio }
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            uniform float time;
            uniform float pixelRatio;

            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                
                // 添加轻微的动画效果
                float wave = sin(time * 0.5 + position.x * 0.01) * 0.5 + 0.5;
                gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z) * (1.0 + wave * 0.3);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            
            void main() {
                float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                
                // 创建发光效果
                vec3 glowColor = vColor * (1.0 + alpha * 2.0);
                gl_FragColor = vec4(glowColor, alpha);
            }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// 鼠标移动事件
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.1;
    mouseY = (event.clientY - windowHalfY) * 0.1;
}

// 窗口大小调整
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    // 更新控制器
    if (controls) {
        controls.update();
    }

    // 更新粒子系统时间
    if (particleSystem) {
        particleSystem.material.uniforms.time.value += 0.01;
        
        // 缓慢旋转粒子系统
        particleSystem.rotation.y += 0.0005;
        particleSystem.rotation.x += 0.0003;
    }

    // 根据鼠标位置轻微调整相机
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// 启动应用
init();

