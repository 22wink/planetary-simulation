// 场景管理模块 - 负责创建和管理Three.js场景
class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(Config.scene.backgroundColor);
        this.scene.fog = new THREE.FogExp2(Config.scene.backgroundColor, Config.scene.fogDensity);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            Config.camera.fov,
            window.innerWidth / window.innerHeight,
            Config.camera.near,
            Config.camera.far
        );
        this.camera.position.set(
            Config.camera.initialPosition.x,
            Config.camera.initialPosition.y,
            Config.camera.initialPosition.z
        );
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 创建轨道控制器
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = Config.controls.enableDamping;
            this.controls.dampingFactor = Config.controls.dampingFactor;
            this.controls.minDistance = Config.controls.minDistance;
            this.controls.maxDistance = Config.controls.maxDistance;
            this.controls.enablePan = Config.controls.enablePan;
            this.controls.enableZoom = Config.controls.enableZoom !== false;
            if (Config.controls.zoomSpeed !== undefined) {
                this.controls.zoomSpeed = Config.controls.zoomSpeed;
            }
        }

        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize(), false);

        return {
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            controls: this.controls
        };
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

