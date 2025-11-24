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

    // 行星详细数据（科学数据）
    planetDetailedData: {
        '水星': {
            mass: '3.3×10²³ kg',
            volume: '6.08×10¹⁰ km³',
            density: '5.43 g/cm³',
            surfaceTemp: '427°C (白天) / -173°C (夜晚)',
            atmosphere: '极稀薄，主要为氦和钠',
            orbitalPeriod: '88 地球日',
            rotationPeriod: '59 地球日',
            moons: 0,
            facts: [
                '水星是太阳系中最小和最内侧的行星',
                '水星的一天比一年还长（自转周期59天，公转周期88天）',
                '水星表面有巨大的温度变化，从427°C到-173°C',
                '水星没有大气层来保持热量'
            ],
            missions: [
                { name: '水手10号', year: 1974, description: '首次近距离探测水星' },
                { name: '信使号', year: 2011, description: '进入水星轨道，详细研究其表面和磁场' },
                { name: '贝皮可伦坡号', year: 2025, description: '计划中的欧日联合任务' }
            ]
        },
        '金星': {
            mass: '4.87×10²⁴ kg',
            volume: '9.28×10¹¹ km³',
            density: '5.24 g/cm³',
            surfaceTemp: '462°C',
            atmosphere: '浓厚，96%二氧化碳，表面压力是地球的92倍',
            orbitalPeriod: '225 地球日',
            rotationPeriod: '243 地球日（逆向自转）',
            moons: 0,
            facts: [
                '金星是太阳系中最热的行星，表面温度高达462°C',
                '金星逆向自转，太阳从西边升起',
                '金星的一天比一年还长',
                '金星表面被厚厚的云层覆盖，主要由硫酸组成'
            ],
            missions: [
                { name: '金星9号', year: 1975, description: '首次在金星表面成功着陆' },
                { name: '麦哲伦号', year: 1990, description: '使用雷达绘制金星表面地图' },
                { name: '金星快车', year: 2006, description: '研究金星大气和表面' }
            ]
        },
        '地球': {
            mass: '5.97×10²⁴ kg',
            volume: '1.08×10¹² km³',
            density: '5.51 g/cm³',
            surfaceTemp: '平均15°C',
            atmosphere: '78%氮气，21%氧气，1%其他',
            orbitalPeriod: '365.25 地球日',
            rotationPeriod: '24 小时',
            moons: 1,
            facts: [
                '地球是唯一已知有生命的行星',
                '地球表面71%被水覆盖',
                '地球有强大的磁场，保护我们免受太阳风影响',
                '地球是太阳系中密度最大的行星'
            ],
            missions: [
                { name: '阿波罗11号', year: 1969, description: '人类首次登月' },
                { name: '国际空间站', year: 1998, description: '持续运行的空间实验室' },
                { name: '詹姆斯·韦伯太空望远镜', year: 2021, description: '最强大的太空望远镜' }
            ]
        },
        '火星': {
            mass: '6.39×10²³ kg',
            volume: '1.63×10¹¹ km³',
            density: '3.93 g/cm³',
            surfaceTemp: '平均-65°C，最高20°C',
            atmosphere: '稀薄，95%二氧化碳',
            orbitalPeriod: '687 地球日',
            rotationPeriod: '24.6 小时',
            moons: 2,
            facts: [
                '火星被称为"红色星球"，因为表面富含氧化铁',
                '火星有太阳系最大的火山——奥林匹斯山',
                '火星曾经可能有液态水和更厚的大气层',
                '火星的两极有冰盖，主要由水冰和干冰组成'
            ],
            missions: [
                { name: '海盗1号', year: 1976, description: '首次在火星表面成功着陆' },
                { name: '好奇号', year: 2012, description: '大型火星车，寻找生命迹象' },
                { name: '毅力号', year: 2021, description: '收集火星样本，准备返回地球' },
                { name: '天问一号', year: 2021, description: '中国首次火星探测任务' }
            ]
        },
        '木星': {
            mass: '1.90×10²⁷ kg',
            volume: '1.43×10¹⁵ km³',
            density: '1.33 g/cm³',
            surfaceTemp: '云顶约-110°C',
            atmosphere: '主要是氢和氦，有彩色云带',
            orbitalPeriod: '12 地球年',
            rotationPeriod: '9.9 小时',
            moons: 79,
            facts: [
                '木星是太阳系最大的行星，质量是所有其他行星总和的2.5倍',
                '木星有著名的大红斑，是一个持续了数百年的巨大风暴',
                '木星有79颗已知卫星，包括4颗大型伽利略卫星',
                '木星强大的引力帮助保护内太阳系免受小行星撞击'
            ],
            missions: [
                { name: '旅行者1号', year: 1979, description: '首次近距离飞越木星' },
                { name: '伽利略号', year: 1995, description: '进入木星轨道，研究其卫星' },
                { name: '朱诺号', year: 2016, description: '研究木星内部结构和磁场' }
            ]
        },
        '土星': {
            mass: '5.68×10²⁶ kg',
            volume: '8.27×10¹⁴ km³',
            density: '0.69 g/cm³',
            surfaceTemp: '云顶约-140°C',
            atmosphere: '主要是氢和氦',
            orbitalPeriod: '29 地球年',
            rotationPeriod: '10.7 小时',
            moons: 82,
            facts: [
                '土星以其美丽的光环而闻名，主要由冰粒和岩石碎片组成',
                '土星是太阳系中密度最小的行星，可以浮在水上',
                '土星有82颗已知卫星，包括最大的土卫六（泰坦）',
                '土星的光环系统非常薄，只有约10米厚'
            ],
            missions: [
                { name: '旅行者2号', year: 1981, description: '首次近距离飞越土星' },
                { name: '卡西尼号', year: 2004, description: '进入土星轨道，研究土星及其卫星13年' },
                { name: '惠更斯号', year: 2005, description: '在土卫六表面成功着陆' }
            ]
        },
        '天王星': {
            mass: '8.68×10²⁵ kg',
            volume: '6.83×10¹³ km³',
            density: '1.27 g/cm³',
            surfaceTemp: '云顶约-195°C',
            atmosphere: '主要是氢、氦和甲烷',
            orbitalPeriod: '84 地球年',
            rotationPeriod: '17.2 小时',
            moons: 27,
            facts: [
                '天王星的自转轴几乎横躺着，倾斜角度达98度',
                '天王星呈现蓝绿色，因为大气中的甲烷吸收了红光',
                '天王星有13个细小的光环',
                '天王星是太阳系中最冷的行星之一'
            ],
            missions: [
                { name: '旅行者2号', year: 1986, description: '唯一一次近距离飞越天王星' }
            ]
        },
        '海王星': {
            mass: '1.02×10²⁶ kg',
            volume: '6.25×10¹³ km³',
            density: '1.64 g/cm³',
            surfaceTemp: '云顶约-200°C',
            atmosphere: '主要是氢、氦和甲烷',
            orbitalPeriod: '165 地球年',
            rotationPeriod: '16.1 小时',
            moons: 14,
            facts: [
                '海王星是太阳系最外侧的行星',
                '海王星有太阳系中最强的风速，可达每小时2100公里',
                '海王星呈现蓝色，因为大气中的甲烷',
                '海王星有一个巨大的暗斑，类似于木星的大红斑'
            ],
            missions: [
                { name: '旅行者2号', year: 1989, description: '唯一一次近距离飞越海王星' }
            ]
        }
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

    // 距离缩放配置
    // scale: 场景单位与天文单位(AU)的换算比例
    // 例如：scale = 100 表示 100 个场景单位 = 1 AU
    // 地球的 distance = 100，对应 1 AU = 1.496×10^8 km
    scale: 100,

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
        },
        // 日食事件配置
        solarEclipse: {
            enabled: true,
            showHighlight: true,
            showNotification: true,
            checkFrequency: 0.2,  // 检测频率
            alignmentThreshold: 0.15,  // 对齐阈值（弧度，约8.6度）
            shadowIntensity: 0.7  // 阴影强度
        },
        // 月食事件配置
        lunarEclipse: {
            enabled: true,
            showHighlight: true,
            showNotification: true,
            checkFrequency: 0.2,
            alignmentThreshold: 0.15,
            darkenIntensity: 0.6  // 变暗强度
        },
        // 流星雨事件配置
        meteorShower: {
            enabled: true,
            showNotification: true,
            checkFrequency: 0.01,  // 检测频率（较低，因为流星雨是周期性事件）
            duration: 30000,  // 流星雨持续时间（毫秒）
            intensity: 3  // 流星雨强度倍数（正常流星的倍数）
        },
        // 行星凌日事件配置
        planetTransit: {
            enabled: true,
            showHighlight: true,
            showNotification: true,
            checkFrequency: 0.15,  // 检测频率
            alignmentThreshold: 0.1,  // 对齐阈值（弧度）
            planets: ['水星', '金星']  // 可以发生凌日的行星
        },
        // 行星逆行事件配置
        retrograde: {
            enabled: true,
            showHighlight: true,
            showNotification: true,
            checkFrequency: 0.2,  // 检测频率
            planets: ['火星', '木星', '土星', '天王星', '海王星']  // 可以发生逆行的外行星
        },
        // 大合相事件配置（3颗以上行星对齐）
        grandConjunction: {
            enabled: true,
            showHighlight: true,
            showNotification: true,
            checkFrequency: 0.05,  // 检测频率（较低，因为大合相很罕见）
            minPlanets: 3,  // 最少需要3颗行星
            threshold: 60,  // 对齐阈值（距离）
            angleThreshold: 0.2  // 角度阈值（弧度）
        },
        // 小行星接近事件配置
        asteroidApproach: {
            enabled: true,
            showHighlight: true,
            showNotification: true,
            checkFrequency: 0.02,  // 检测频率
            spawnInterval: 30000,  // 生成间隔（毫秒）
            minDistance: 80,  // 最小接近距离（场景单位）
            maxDistance: 200,  // 最大接近距离
            safeDistance: 150,  // 安全距离（绿色）
            warningDistance: 120,  // 警告距离（黄色）
            dangerDistance: 100  // 危险距离（红色）
        }
    },

    // 流星雨数据（基于真实流星雨）
    meteorShowerData: [
        {
            name: '英仙座流星雨',
            peakDate: { month: 8, day: 12 },  // 8月12日
            duration: 7,  // 持续7天
            radiant: { x: 0.5, y: 0.8, z: 0.3 },  // 辐射点方向
            color: 0x00ffff,
            description: '每年8月最活跃的流星雨之一，每小时可观测到60-100颗流星'
        },
        {
            name: '双子座流星雨',
            peakDate: { month: 12, day: 14 },  // 12月14日
            duration: 5,
            radiant: { x: 0.3, y: 0.6, z: 0.7 },
            color: 0xffff00,
            description: '每年12月最活跃的流星雨，每小时可观测到120颗流星'
        },
        {
            name: '狮子座流星雨',
            peakDate: { month: 11, day: 17 },  // 11月17日
            duration: 3,
            radiant: { x: 0.7, y: 0.4, z: 0.5 },
            color: 0xff6600,
            description: '著名的周期性流星雨，每33年出现一次高峰'
        },
        {
            name: '象限仪座流星雨',
            peakDate: { month: 1, day: 4 },  // 1月4日
            duration: 4,
            radiant: { x: 0.4, y: 0.9, z: 0.2 },
            color: 0x00ff00,
            description: '每年1月初的流星雨，每小时可观测到40-100颗流星'
        }
    ],

    // 历史天文事件（基于真实日期）
    historicalEvents: [
        {
            name: '哈雷彗星回归 (1986)',
            date: { year: 1986, month: 2, day: 9 },  // 1986年2月9日
            type: 'comet',
            description: '哈雷彗星最近一次回归，每76年出现一次',
            color: '#00ffff'
        },
        {
            name: '旅行者1号发射',
            date: { year: 1977, month: 9, day: 5 },  // 1977年9月5日
            type: 'mission',
            description: '旅行者1号探测器发射，现已飞出太阳系',
            color: '#4fc3f7'
        },
        {
            name: '旅行者2号发射',
            date: { year: 1977, month: 8, day: 20 },  // 1977年8月20日
            type: 'mission',
            description: '旅行者2号探测器发射，唯一访问过天王星和海王星的探测器',
            color: '#4fc3f7'
        },
        {
            name: '阿波罗11号登月',
            date: { year: 1969, month: 7, day: 20 },  // 1969年7月20日
            type: 'mission',
            description: '人类首次登月，阿姆斯特朗和奥尔德林踏上月球表面',
            color: '#ffd700'
        },
        {
            name: '卡西尼号到达土星',
            date: { year: 2004, month: 7, day: 1 },  // 2004年7月1日
            type: 'mission',
            description: '卡西尼号进入土星轨道，开始13年的探索任务',
            color: '#ff6b6b'
        },
        {
            name: '新视野号飞越冥王星',
            date: { year: 2015, month: 7, day: 14 },  // 2015年7月14日
            type: 'mission',
            description: '新视野号首次近距离飞越冥王星，传回高清图像',
            color: '#9b59b6'
        },
        {
            name: '朱诺号到达木星',
            date: { year: 2016, month: 7, day: 4 },  // 2016年7月4日
            type: 'mission',
            description: '朱诺号进入木星轨道，研究木星内部结构和磁场',
            color: '#f39c12'
        },
        {
            name: '毅力号登陆火星',
            date: { year: 2021, month: 2, day: 18 },  // 2021年2月18日
            type: 'mission',
            description: '毅力号火星车成功登陆，寻找古代生命迹象',
            color: '#e74c3c'
        },
        {
            name: '哈雷彗星下次回归',
            date: { year: 2061, month: 7, day: 28 },  // 2061年7月28日
            type: 'comet',
            description: '哈雷彗星下一次回归的预测日期',
            color: '#00ffff'
        },
        {
            name: '木星大合相',
            date: { year: 2020, month: 12, day: 21 },  // 2020年12月21日
            type: 'conjunction',
            description: '木星和土星近800年来最接近的一次大合相',
            color: '#ffd700'
        }
    ],

    // 太空探测器数据
    spaceMissions: [
        {
            name: '旅行者1号',
            launchDate: { year: 1977, month: 9, day: 5 },
            target: '外太阳系',
            status: 'active',  // active, completed, lost
            color: 0x4fc3f7,
            size: 0.3,
            description: '1977年发射，已飞出太阳系，是距离地球最远的人造物体',
            trajectory: {
                type: 'flyby',  // flyby, orbit, lander
                targets: ['木星', '土星'],
                currentDistance: 800,  // 当前距离太阳的距离（场景单位）
                speed: 0.00005,
                angle: 0
            }
        },
        {
            name: '旅行者2号',
            launchDate: { year: 1977, month: 8, day: 20 },
            target: '外太阳系',
            status: 'active',
            color: 0x4fc3f7,
            size: 0.3,
            description: '1977年发射，唯一访问过天王星和海王星的探测器',
            trajectory: {
                type: 'flyby',
                targets: ['木星', '土星', '天王星', '海王星'],
                currentDistance: 650,
                speed: 0.00004,
                angle: Math.PI / 4
            }
        },
        {
            name: '卡西尼号',
            launchDate: { year: 1997, month: 10, day: 15 },
            target: '土星',
            status: 'completed',
            color: 0xff6b6b,
            size: 0.35,
            description: '1997年发射，2004年进入土星轨道，2017年任务结束',
            trajectory: {
                type: 'orbit',
                targets: ['土星'],
                currentDistance: 350,
                speed: 0.0008,
                angle: Math.PI / 3,
                orbitRadius: 20
            }
        },
        {
            name: '朱诺号',
            launchDate: { year: 2011, month: 8, day: 5 },
            target: '木星',
            status: 'active',
            color: 0xf39c12,
            size: 0.3,
            description: '2011年发射，2016年进入木星轨道，研究木星内部结构',
            trajectory: {
                type: 'orbit',
                targets: ['木星'],
                currentDistance: 250,
                speed: 0.002,
                angle: Math.PI / 2,
                orbitRadius: 15
            }
        },
        {
            name: '新视野号',
            launchDate: { year: 2006, month: 1, day: 19 },
            target: '冥王星',
            status: 'active',
            color: 0x9b59b6,
            size: 0.3,
            description: '2006年发射，2015年飞越冥王星，传回高清图像',
            trajectory: {
                type: 'flyby',
                targets: ['冥王星'],
                currentDistance: 600,
                speed: 0.00006,
                angle: Math.PI / 6
            }
        },
        {
            name: '好奇号',
            launchDate: { year: 2011, month: 11, day: 26 },
            target: '火星',
            status: 'active',
            color: 0xe74c3c,
            size: 0.25,
            description: '2011年发射，2012年登陆火星，持续探索火星表面',
            trajectory: {
                type: 'lander',
                targets: ['火星'],
                currentDistance: 150,
                speed: 0.008,
                angle: 0,
                orbitRadius: 2
            }
        },
        {
            name: '毅力号',
            launchDate: { year: 2020, month: 7, day: 30 },
            target: '火星',
            status: 'active',
            color: 0xe74c3c,
            size: 0.25,
            description: '2020年发射，2021年登陆火星，收集样本准备返回地球',
            trajectory: {
                type: 'lander',
                targets: ['火星'],
                currentDistance: 150,
                speed: 0.008,
                angle: Math.PI / 8,
                orbitRadius: 2.5
            }
        }
    ]
};

