// 配置模块 - 存储所有配置数据
const Config = {
    // 行星数据（相对大小和轨道距离已缩放以便可视化）
    planetData: [
        { name: '水星', color: 0x8c7853, size: 0.38, distance: 50, speed: 0.04, rotationSpeed: 0.004 },
        { name: '金星', color: 0xffc649, size: 0.95, distance: 70, speed: 0.015, rotationSpeed: 0.002 },
        { name: '地球', color: 0x6b93d6, size: 1.0, distance: 100, speed: 0.01, rotationSpeed: 0.01 },
        { name: '火星', color: 0xc1440e, size: 0.53, distance: 150, speed: 0.008, rotationSpeed: 0.009 },
        { name: '木星', color: 0xd8ca9d, size: 11.2, distance: 250, speed: 0.002, rotationSpeed: 0.025 },
        { name: '土星', color: 0xfad5a5, size: 9.4, distance: 350, speed: 0.0009, rotationSpeed: 0.023 },
        { name: '天王星', color: 0x4fd0e7, size: 4.0, distance: 450, speed: 0.0004, rotationSpeed: 0.012 },
        { name: '海王星', color: 0x4b70dd, size: 3.9, distance: 550, speed: 0.0001, rotationSpeed: 0.011 }
    ],

    // 行星详细信息
    planetInfo: {
        '水星': '太阳系最内侧的行星，表面温度极高。',
        '金星': '最热的行星，有厚厚的大气层。',
        '地球': '我们的家园，唯一已知有生命的行星。',
        '火星': '红色星球，可能有水存在。',
        '木星': '太阳系最大的行星，是一颗气态巨行星。',
        '土星': '以其美丽的光环而闻名。',
        '天王星': '冰巨星，自转轴几乎横躺着。',
        '海王星': '太阳系最外侧的行星，风速极高。'
    },

    // 卫星数据
    moonData: {
        '地球': [
            { name: '月球', size: 0.27, distance: 15, speed: 0.05, color: 0xaaaaaa }
        ],
        '木星': [
            { name: '木卫一（伊欧）', size: 0.4, distance: 25, speed: 0.08, color: 0xffaa44 },
            { name: '木卫二（欧罗巴）', size: 0.35, distance: 30, speed: 0.06, color: 0x88ccff },
            { name: '木卫三（盖尼米得）', size: 0.5, distance: 35, speed: 0.04, color: 0x666666 },
            { name: '木卫四（卡利斯托）', size: 0.45, distance: 40, speed: 0.03, color: 0x555555 }
        ]
    },

    // 场景配置
    scene: {
        backgroundColor: 0x000000,
        fogDensity: 0.0003
    },

    // 相机配置
    camera: {
        fov: 60,
        near: 0.1,
        far: 2000,
        initialPosition: { x: 0, y: 200, z: 600 }
    },

    // 控制器配置
    controls: {
        enableDamping: true,
        dampingFactor: 0.05,
        minDistance: 100,
        maxDistance: 1500,
        enablePan: true,
        zoomSpeed: 1.2,  // 缩放速度（优化后更平滑）
        enableZoom: true
    },

    // 小行星带配置
    asteroidBelt: {
        innerRadius: 180,
        outerRadius: 220,
        count: 150  // 从500减少到150以提升性能
    },

    // 星空配置
    starField: {
        count: 2000,  // 从5000减少到2000以提升性能
        range: 2000
    },

    // 聚焦动画配置
    focus: {
        duration: 2000, // 动画持续时间（毫秒）
        easing: 'easeInOutCubic', // 缓动函数
        // 太阳聚焦配置
        sun: {
            position: { x: 0, y: 50, z: 100 },
            lookAt: { x: 0, y: 0, z: 0 }
        },
        // 行星聚焦配置（相对于行星大小的倍数）
        planet: {
            offset: { x: 0, y: 3, z: 5 } // y和z是相对于行星大小的倍数
        }
    },

    // 彗星配置
    comet: {
        maxCount: 3 // 最大彗星数量
    },

    // 彗星数据
    cometData: [
        {
            name: '哈雷彗星',
            coreSize: 1.5,
            coreColor: 0xaaaaaa,
            perihelion: 30,  // 近日点距离
            aphelion: 600,   // 远日点距离
            speed: 0.003,
            rotationSpeed: 0.02,
            tailLength: 40,
            tailColor: 0x88ccff,
            tailParticleCount: 150  // 从300减少到150以提升性能
        },
        {
            name: '海尔-波普彗星',
            coreSize: 2.0,
            coreColor: 0xcccccc,
            perihelion: 50,
            aphelion: 800,
            speed: 0.002,
            rotationSpeed: 0.015,
            tailLength: 50,
            tailColor: 0xaaccff,
            tailParticleCount: 200  // 从400减少到200以提升性能
        },
        {
            name: '彗星C/2020',
            coreSize: 1.2,
            coreColor: 0x999999,
            perihelion: 40,
            aphelion: 700,
            speed: 0.0025,
            rotationSpeed: 0.018,
            tailLength: 35,
            tailColor: 0x99ddff,
            tailParticleCount: 120  // 从250减少到120以提升性能
        }
    ],

    // 事件系统配置
    events: {
        // 行星对齐事件配置
        alignment: {
            enabled: false,  // 是否启用对齐检测（一键禁用）
            showHighlight: false,  // 是否显示视觉高亮（黄色环）
            showNotification: false,  // 是否显示通知
            threshold: 50,  // 对齐检测阈值
            checkFrequency: 0.1  // 检测频率（0-1，表示每次update的概率）
        },
        // 行星会合事件配置
        conjunction: {
            enabled: false,
            showHighlight: false,
            showNotification: false,
            minDistance: 80,  // 会合的最小距离阈值
            checkFrequency: 0.1
        },
        // 彗星接近事件配置
        cometApproach: {
            enabled: false,
            showHighlight: false,
            showNotification: false,
            checkFrequency: 0.05
        }
    }
};

