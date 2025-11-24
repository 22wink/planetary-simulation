// 彗星管理模块 - 负责彗星的创建和管理
class CometManager {
    constructor(scene) {
        this.scene = scene;
        this.comets = [];
        this.maxComets = Config.comet.maxCount || 3;
    }

    createComet() {
        const cometData = Config.cometData[Math.floor(Math.random() * Config.cometData.length)];
        
        // 创建彗星核
        const coreGeometry = new THREE.SphereGeometry(cometData.coreSize, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: cometData.coreColor,
            emissive: cometData.coreColor,
            emissiveIntensity: 0.5
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        
        // 创建彗星组
        const cometGroup = new THREE.Group();
        cometGroup.add(core);
        
        // 创建彗星尾（使用粒子系统）
        const tailParticles = this.createTail(cometData);
        cometGroup.add(tailParticles);
        
        // 设置初始位置（在远日点）
        const initialAngle = Math.random() * Math.PI * 2;
        const perihelion = cometData.perihelion; // 近日点距离
        const aphelion = cometData.aphelion; // 远日点距离
        const semiMajorAxis = (perihelion + aphelion) / 2;
        const eccentricity = (aphelion - perihelion) / (aphelion + perihelion);
        
        // 初始位置在远日点
        const initialDistance = aphelion;
        cometGroup.position.set(
            Math.cos(initialAngle) * initialDistance,
            (Math.random() - 0.5) * 50, // 随机高度
            Math.sin(initialAngle) * initialDistance
        );
        
        // 存储彗星数据
        core.userData = {
            isComet: true,
            name: cometData.name,
            angle: initialAngle,
            perihelion: perihelion,
            aphelion: aphelion,
            semiMajorAxis: semiMajorAxis,
            eccentricity: eccentricity,
            speed: cometData.speed,
            rotationSpeed: cometData.rotationSpeed || 0.01,
            tailParticles: tailParticles,
            tailLength: cometData.tailLength || 30,
            tailColor: cometData.tailColor || 0x88ccff
        };
        
        cometGroup.userData = {
            isComet: true,
            core: core
        };
        
        this.scene.add(cometGroup);
        this.comets.push(cometGroup);
        
        return cometGroup;
    }

    createTail(cometData) {
        const particleCount = cometData.tailParticleCount || 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const tailColor = new THREE.Color(cometData.tailColor || 0x88ccff);
        const tailColor2 = new THREE.Color(0xffffff);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // 粒子位置（沿着尾巴方向）
            const t = i / particleCount;
            const distance = t * (cometData.tailLength || 30);
            const spread = (1 - t) * 5; // 尾巴越远越宽
            
            positions[i3] = -distance; // 尾巴向后延伸
            positions[i3 + 1] = (Math.random() - 0.5) * spread;
            positions[i3 + 2] = (Math.random() - 0.5) * spread;
            
            // 颜色渐变（从白色到蓝色）
            const color = new THREE.Color().lerpColors(tailColor2, tailColor, t);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // 大小渐变
            sizes[i] = (1 - t) * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData.isTail = true;
        
        return particles;
    }

    updateComets(delta, sunPosition) {
        this.comets.forEach((cometGroup, index) => {
            const core = cometGroup.userData.core;
            const data = core.userData;
            
            if (!data) return;
            
            // 计算椭圆轨道位置
            // 使用开普勒方程简化版
            data.angle += data.speed * delta;
            
            // 椭圆轨道计算
            const trueAnomaly = data.angle;
            const r = data.semiMajorAxis * (1 - data.eccentricity * data.eccentricity) / 
                     (1 + data.eccentricity * Math.cos(trueAnomaly));
            
            // 更新位置
            cometGroup.position.x = Math.cos(trueAnomaly) * r;
            cometGroup.position.z = Math.sin(trueAnomaly) * r;
            
            // 自转
            core.rotation.y += data.rotationSpeed * delta;
            
            // 更新尾巴方向和长度（根据距离太阳的远近）
            const distanceToSun = cometGroup.position.length();
            const minDistance = data.perihelion;
            const maxDistance = data.aphelion;
            const normalizedDistance = (distanceToSun - minDistance) / (maxDistance - minDistance);
            const tailIntensity = 1 - normalizedDistance; // 越近太阳，尾巴越长
            
            // 调整尾巴方向（指向远离太阳的方向）
            if (sunPosition) {
                const directionToSun = new THREE.Vector3()
                    .subVectors(cometGroup.position, sunPosition)
                    .normalize();
                
                // 旋转彗星组使其尾巴指向正确方向
                cometGroup.lookAt(
                    cometGroup.position.clone().add(directionToSun.multiplyScalar(-1))
                );
            }
            
            // 更新尾巴粒子透明度
            if (data.tailParticles) {
                const opacity = Math.max(0.3, tailIntensity * 0.9);
                data.tailParticles.material.opacity = opacity;
                
                // 更新粒子大小（优化：降低更新频率）
                const sizeAttribute = data.tailParticles.geometry.attributes.size;
                if (sizeAttribute && Math.random() < 0.3) {  // 只30%的时间更新大小
                    for (let i = 0; i < sizeAttribute.count; i++) {
                        const t = i / sizeAttribute.count;
                        sizeAttribute.array[i] = ((1 - t) * 2 + 0.5) * (0.5 + tailIntensity * 0.5);
                    }
                    sizeAttribute.needsUpdate = true;
                }
            }
            
            // 如果彗星太远，可以移除（可选）
            if (distanceToSun > data.aphelion * 1.2 && this.comets.length > 1) {
                this.removeComet(cometGroup);
            }
        });
        
        // 随机生成新彗星
        if (this.comets.length < this.maxComets && Math.random() < 0.001) {
            this.createComet();
        }
    }

    removeComet(cometGroup) {
        this.scene.remove(cometGroup);
        const index = this.comets.indexOf(cometGroup);
        if (index > -1) {
            this.comets.splice(index, 1);
        }
    }

    getCometByName(name) {
        return this.comets.find(c => c.userData.core.userData.name === name);
    }
}

