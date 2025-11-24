// 3D渲染器工具类 - 基于Three.js
class Three3DRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        // 初始化Three.js场景
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.earth = null;
        this.animationId = null;
        
        this.init();
    }

    init() {
        // 创建场景
        this.scene.background = new THREE.Color(0x000011);
        
        // 创建相机
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // 添加轨道控制器（需要OrbitControls，我们将使用鼠标控制）
        this.setupControls();
        
        // 添加光源
        this.setupLights();
        
        // 处理窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 开始渲染循环
        this.animate();
    }

    setupControls() {
        // 简单的鼠标控制实现
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            // 旋转相机
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const distance = this.camera.position.length();
            const newDistance = distance + e.deltaY * 0.01;
            if (newDistance > 2 && newDistance < 10) {
                this.camera.position.normalize().multiplyScalar(newDistance);
            }
        });
    }

    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 方向光（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);
        
        // 点光源
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-5, 3, -5);
        this.scene.add(pointLight);
    }

    createEarth(radius = 2, showAtmosphere = false) {
        // 创建地球几何体
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        
        // 创建地球材质
        const material = new THREE.MeshPhongMaterial({
            color: 0x4a90e2,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        
        this.earth = new THREE.Mesh(geometry, material);
        this.scene.add(this.earth);
        
        // 添加大气层（可选）
        if (showAtmosphere) {
            const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.05, 64, 64);
            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                color: 0x87ceeb,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            this.scene.add(atmosphere);
        }
        
        return this.earth;
    }

    createAtmosphereLayers(earthRadius = 2) {
        const layers = [
            { name: '对流层', radius: 0.01, color: 0xe3f2fd, opacity: 0.6 },
            { name: '平流层', radius: 0.02, color: 0xbbdefb, opacity: 0.5 },
            { name: '高层大气', radius: 0.03, color: 0x90caf9, opacity: 0.4 }
        ];
        
        const layerMeshes = [];
        layers.forEach((layer, index) => {
            const geometry = new THREE.SphereGeometry(
                earthRadius + layer.radius * (index + 1),
                64,
                64
            );
            const material = new THREE.MeshPhongMaterial({
                color: layer.color,
                transparent: true,
                opacity: layer.opacity,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            layerMeshes.push(mesh);
        });
        
        return layerMeshes;
    }

    createWindField(earthRadius = 2, windData = []) {
        // 创建风场可视化
        const windGroup = new THREE.Group();
        
        windData.forEach(wind => {
            const { lat, lon, direction, speed } = wind;
            
            // 将经纬度转换为3D坐标（球面上的点）
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            
            const x = (earthRadius + 0.1) * Math.sin(phi) * Math.cos(theta);
            const y = (earthRadius + 0.1) * Math.cos(phi);
            const z = (earthRadius + 0.1) * Math.sin(phi) * Math.sin(theta);
            
            const position = new THREE.Vector3(x, y, z);
            const normal = position.clone().normalize();
            
            // 计算风向向量（基于direction角度，相对于切平面）
            const dirRad = direction * (Math.PI / 180);
            // 创建切平面上的方向向量
            const tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
            const bitangent = normal.clone().cross(tangent).normalize();
            const windDir = tangent.clone().multiplyScalar(Math.cos(dirRad))
                .add(bitangent.clone().multiplyScalar(Math.sin(dirRad)))
                .normalize();
            
            // 创建箭头表示风向
            const arrowLength = speed * 0.15;
            const arrowHelper = new THREE.ArrowHelper(
                windDir,
                position,
                arrowLength,
                0x00ff00,
                arrowLength * 0.3,
                arrowLength * 0.2
            );
            windGroup.add(arrowHelper);
        });
        
        this.scene.add(windGroup);
        return windGroup;
    }

    createPressureBelt(earthRadius = 2, lat, width, color, label) {
        // 创建气压带可视化
        const beltGroup = new THREE.Group();
        
        const phi = (90 - lat) * (Math.PI / 180);
        const beltWidth = width * (Math.PI / 180);
        
        // 创建环形几何体
        const segments = 64;
        const geometry = new THREE.RingGeometry(
            earthRadius + 0.05,
            earthRadius + 0.15,
            segments
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2 - phi;
        beltGroup.add(ring);
        
        this.scene.add(beltGroup);
        return beltGroup;
    }

    addGridHelper(size = 5, divisions = 10) {
        const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
        this.scene.add(gridHelper);
    }

    addAxisHelper(size = 3) {
        const axesHelper = new THREE.AxesHelper(size);
        this.scene.add(axesHelper);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // 旋转地球（如果存在）
        if (this.earth) {
            this.earth.rotation.y += 0.005;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 清理场景
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }

    // 切换视图模式
    setViewMode(mode) {
        if (mode === 'top') {
            this.camera.position.set(0, 5, 0);
            this.camera.lookAt(0, 0, 0);
        } else if (mode === 'side') {
            this.camera.position.set(5, 0, 0);
            this.camera.lookAt(0, 0, 0);
        } else if (mode === 'default') {
            this.camera.position.set(0, 0, 5);
            this.camera.lookAt(0, 0, 0);
        }
    }
}

