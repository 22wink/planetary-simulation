// 行星管理模块 - 负责创建和管理所有行星
class PlanetManager {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.sun = null;
        this.sunCorona = null;
        this.orbitLines = [];
        this.asteroidBelt = [];
        this.planetLabels = [];
        this.accumulatedTime = 0; // 累积时间（用于暂停时保持动画同步）
    }

    createSun() {
        const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
        // MeshBasicMaterial不支持emissive属性，只使用color即可
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        
        // 添加太阳光
        const sunLight = new THREE.PointLight(0xffffff, 2, 2000);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.sun.add(sunLight);
        
        // 创建太阳日冕效果
        const coronaGeometry = new THREE.SphereGeometry(25, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.sunCorona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.sun.add(this.sunCorona);
        
        // 创建太阳耀斑效果（多个小光点）
        this.sunFlares = [];
        for (let i = 0; i < 5; i++) {
            const flareGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 8, 8);
            const flareMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            });
            const flare = new THREE.Mesh(flareGeometry, flareMaterial);
            
            // 随机位置在太阳表面
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI;
            const radius = 20 + Math.random() * 2;
            flare.position.set(
                radius * Math.sin(angle2) * Math.cos(angle1),
                radius * Math.sin(angle2) * Math.sin(angle1),
                radius * Math.cos(angle2)
            );
            
            flare.userData = {
                baseOpacity: 0,
                maxOpacity: 0.8 + Math.random() * 0.2,
                flashDuration: 200 + Math.random() * 300, // 闪烁持续时间（时间单位）
                nextFlashTime: Math.random() * 5000, // 下次闪烁时间（累积时间）
                flashInterval: 3000 + Math.random() * 7000, // 闪烁间隔
                flashStartTime: 0 // 当前闪烁开始时间
            };
            
            this.sun.add(flare);
            this.sunFlares.push(flare);
        }
        
        // 创建日冕物质抛射（CME）粒子系统
        this.createCMESystem();
        
        this.scene.add(this.sun);
        return this.sun;
    }

    createPlanets() {
        Config.planetData.forEach((data, index) => {
            // 创建行星几何体
            const geometry = new THREE.SphereGeometry(data.size, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const planet = new THREE.Mesh(geometry, material);
            planet.castShadow = true;
            planet.receiveShadow = true;
            
            // 为地球、金星、木星、土星添加大气层效果
            if (data.name === '地球' || data.name === '金星' || data.name === '木星' || data.name === '土星') {
                this.createAtmosphere(planet, data);
            }
            
            // 创建行星组（用于轨道运动）
            const planetGroup = new THREE.Group();
            planetGroup.add(planet);
            
            // 设置初始位置
            planet.position.x = data.distance;
            
            // 存储行星数据
            planet.userData = {
                name: data.name,
                size: data.size,
                distance: data.distance,
                speed: data.speed,
                rotationSpeed: data.rotationSpeed,
                angle: Math.random() * Math.PI * 2 // 随机初始角度
            };
            
            this.planets.push(planetGroup);
            this.scene.add(planetGroup);
            
            // 为地球添加月亮
            if (data.name === '地球' && Config.moonData['地球']) {
                Config.moonData['地球'].forEach(moonData => {
                    this.createMoon(planet, moonData);
                });
            }
            
            // 为木星添加主要卫星
            if (data.name === '木星' && Config.moonData['木星']) {
                Config.moonData['木星'].forEach(moonData => {
                    this.createMoon(planet, moonData);
                });
            }
            
            // 为土星添加光环
            if (data.name === '土星') {
                this.createRings(planet);
            }
        });

        return this.planets;
    }

    createMoon(planet, moonData) {
        const moonGeometry = new THREE.SphereGeometry(moonData.size, 16, 16);
        const moonMaterial = new THREE.MeshStandardMaterial({
            color: moonData.color || 0xaaaaaa,
            roughness: 0.9
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(moonData.distance, 0, 0);
        moon.castShadow = true;
        moon.receiveShadow = true;
        planet.add(moon);
        
        moon.userData = {
            isMoon: true,
            name: moonData.name,
            parentPlanet: planet.userData.name,
            rotationSpeed: moonData.rotationSpeed || 0.01,
            orbitSpeed: moonData.speed,
            angle: Math.random() * Math.PI * 2, // 随机初始角度
            distance: moonData.distance
        };
        
        // 创建卫星标签
        this.createMoonLabel(moon, moonData.name);
    }

    createMoonLabel(moon, name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 48;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#cccccc';
        context.font = '18px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(15, 3.6, 1);
        sprite.position.set(0, moon.userData.distance + 2, 0);
        sprite.userData = { isLabel: true, moonName: name };
        
        moon.add(sprite);
    }

    createRings(saturn) {
        const ringGeometry = new THREE.RingGeometry(12, 20, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        saturn.add(rings);
    }

    createOrbitLines() {
        Config.planetData.forEach((data) => {
            const points = [];
            const segments = 100;
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * data.distance;
                const z = Math.sin(angle) * data.distance;
                points.push(new THREE.Vector3(x, 0, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3
            });
            
            const orbitLine = new THREE.Line(geometry, material);
            this.scene.add(orbitLine);
            this.orbitLines.push(orbitLine);
        });
    }

    createAsteroidBelt() {
        const { innerRadius, outerRadius, count } = Config.asteroidBelt;
        
        for (let i = 0; i < count; i++) {
            // 轨道参数（真实小行星带特征）
            // 半长轴：在内外半径之间，但使用更真实的分布
            const semiMajorAxis = innerRadius + Math.random() * (outerRadius - innerRadius);
            
            // 偏心率：小行星带偏心率较小，通常在0-0.3之间
            const eccentricity = Math.random() * 0.25;
            
            // 轨道倾角：小行星带倾角通常在0-20度之间
            const inclination = (Math.random() - 0.5) * 0.35; // 约-10到10度
            
            // 升交点经度（轨道平面旋转）
            const longitudeOfAscendingNode = Math.random() * Math.PI * 2;
            
            // 近点角（perihelion argument）
            const argumentOfPeriapsis = Math.random() * Math.PI * 2;
            
            // 初始真近点角（在轨道上的位置）
            const trueAnomaly = Math.random() * Math.PI * 2;
            
            // 轨道速度（根据开普勒第三定律，距离越远速度越慢）
            const baseSpeed = 0.0015; // 基础速度
            const speed = baseSpeed * Math.sqrt(innerRadius / semiMajorAxis) * (0.8 + Math.random() * 0.4);
            
            // 小行星大小（更真实的分布）
            const size = 0.08 + Math.random() * 0.25;
            
            // 创建不规则的小行星几何体（使用八面体或随机形状）
            let geometry;
            const shapeType = Math.random();
            if (shapeType < 0.4) {
                // 40%使用八面体
                geometry = new THREE.OctahedronGeometry(size, 0);
            } else if (shapeType < 0.7) {
                // 30%使用十二面体
                geometry = new THREE.DodecahedronGeometry(size, 0);
            } else {
                // 30%使用不规则盒子（性能更好）
                const w = size * (0.7 + Math.random() * 0.6);
                const h = size * (0.7 + Math.random() * 0.6);
                const d = size * (0.7 + Math.random() * 0.6);
                geometry = new THREE.BoxGeometry(w, h, d);
            }
            
            // 改进材质（更真实的颜色和质感）
            const colorVariation = 0.3 + Math.random() * 0.4; // 0.3-0.7的灰度变化
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(colorVariation, colorVariation * 0.9, colorVariation * 0.8),
                roughness: 0.85 + Math.random() * 0.15,
                metalness: 0.05 + Math.random() * 0.1
            });
            
            const asteroid = new THREE.Mesh(geometry, material);
            asteroid.castShadow = true;
            asteroid.receiveShadow = true;
            
            // 初始旋转
            asteroid.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // 计算初始位置（使用椭圆轨道方程）
            const r = semiMajorAxis * (1 - eccentricity * eccentricity) / 
                     (1 + eccentricity * Math.cos(trueAnomaly));
            
            // 应用轨道倾角和升交点经度
            const cosInclination = Math.cos(inclination);
            const sinInclination = Math.sin(inclination);
            const cosNode = Math.cos(longitudeOfAscendingNode);
            const sinNode = Math.sin(longitudeOfAscendingNode);
            const cosAnomaly = Math.cos(trueAnomaly + argumentOfPeriapsis);
            const sinAnomaly = Math.sin(trueAnomaly + argumentOfPeriapsis);
            
            // 轨道平面内的位置
            const xOrbital = r * cosAnomaly;
            const yOrbital = r * sinAnomaly;
            
            // 转换到3D空间（应用倾角和升交点）
            const x = xOrbital * cosNode - yOrbital * sinNode * cosInclination;
            const y = yOrbital * sinInclination;
            const z = xOrbital * sinNode + yOrbital * cosNode * cosInclination;
            
            asteroid.position.set(x, y, z);
            
            // 存储轨道参数
            asteroid.userData = {
                isAsteroid: true,
                semiMajorAxis: semiMajorAxis,
                eccentricity: eccentricity,
                inclination: inclination,
                longitudeOfAscendingNode: longitudeOfAscendingNode,
                argumentOfPeriapsis: argumentOfPeriapsis,
                trueAnomaly: trueAnomaly,
                speed: speed,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.03,
                    y: (Math.random() - 0.5) * 0.03,
                    z: (Math.random() - 0.5) * 0.03
                }
            };
            
            this.asteroidBelt.push(asteroid);
            this.scene.add(asteroid);
        }
    }

    createStarField() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5
        });
        
        const starsVertices = [];
        for (let i = 0; i < Config.starField.count; i++) {
            const x = (Math.random() - 0.5) * Config.starField.range;
            const y = (Math.random() - 0.5) * Config.starField.range;
            const z = (Math.random() - 0.5) * Config.starField.range;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    createPlanetLabels() {
        this.planets.forEach((planetGroup) => {
            const planet = planetGroup.children[0];
            const data = planet.userData;
            
            // 创建标签精灵
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ffffff';
            context.font = '24px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(data.name, canvas.width / 2, canvas.height / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(20, 5, 1);
            sprite.position.set(0, data.size + 5, 0);
            sprite.userData = { isLabel: true, planetName: data.name };
            
            planet.add(sprite);
            this.planetLabels.push(sprite);
        });
    }

    createCMESystem() {
        // 创建CME粒子系统
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        
        // 初始化所有粒子为隐藏状态
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;
            
            colors[i3] = 1.0; // 红色
            colors[i3 + 1] = 0.8;
            colors[i3 + 2] = 0.2;
            
            velocities[i3] = 0;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = 0;
            
            lifetimes[i] = 0; // 0表示未激活
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.cmeParticles = new THREE.Points(geometry, material);
        this.cmeParticles.userData = {
            velocities: velocities,
            lifetimes: lifetimes,
            nextCMETime: 10000 + Math.random() * 20000 // 10-30时间单位后第一次CME（累积时间）
        };
        
        this.scene.add(this.cmeParticles);
    }

    createAtmosphere(planet, data) {
        // 创建大气层光晕效果
        const atmosphereSize = data.size * 1.1;
        const atmosphereGeometry = new THREE.SphereGeometry(atmosphereSize, 32, 32);
        
        let atmosphereColor, atmosphereOpacity;
        if (data.name === '地球') {
            atmosphereColor = 0x4a90e2; // 蓝色大气层
            atmosphereOpacity = 0.15;
        } else if (data.name === '金星') {
            atmosphereColor = 0xffaa44; // 黄色/橙色大气层
            atmosphereOpacity = 0.25;
        } else if (data.name === '木星') {
            atmosphereColor = 0xd8a569; // 木星大气层（橙棕色）
            atmosphereOpacity = 0.2;
        } else if (data.name === '土星') {
            atmosphereColor = 0xf4c88a; // 土星大气层（淡黄色）
            atmosphereOpacity = 0.18;
        }
        
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: atmosphereColor,
            transparent: true,
            opacity: atmosphereOpacity,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);
        atmosphere.userData.isAtmosphere = true;
        
        // 为地球添加极光效果
        if (data.name === '地球') {
            this.createAurora(planet, data);
        }
    }
    
    // 创建极光效果
    createAurora(planet, data) {
        const auroraGroup = new THREE.Group();
        const planetSize = data.size;
        
        // 创建多个极光带（在南北两极）
        const auroraCount = 8; // 每个极4条
        const colors = [
            0x00ff88, // 绿色
            0x00ffff, // 青色
            0x0088ff, // 蓝色
            0xff00ff  // 紫色
        ];
        
        // 北极极光
        for (let i = 0; i < auroraCount / 2; i++) {
            const aurora = this.createAuroraBand(planetSize, colors[i % colors.length], true);
            aurora.position.y = planetSize * 0.8; // 靠近北极
            aurora.rotation.z = (i / (auroraCount / 2)) * Math.PI * 2;
            auroraGroup.add(aurora);
        }
        
        // 南极极光
        for (let i = 0; i < auroraCount / 2; i++) {
            const aurora = this.createAuroraBand(planetSize, colors[i % colors.length], false);
            aurora.position.y = -planetSize * 0.8; // 靠近南极
            aurora.rotation.z = (i / (auroraCount / 2)) * Math.PI * 2;
            auroraGroup.add(aurora);
        }
        
        auroraGroup.userData.isAurora = true;
        planet.add(auroraGroup);
        planet.userData.auroraGroup = auroraGroup;
    }
    
    // 创建单个极光带
    createAuroraBand(planetSize, color, isNorth) {
        const auroraGroup = new THREE.Group();
        
        // 创建多个发光的平面来模拟极光带
        const bandCount = 5;
        const bandWidth = planetSize * 0.3;
        const bandHeight = planetSize * 0.4;
        
        for (let i = 0; i < bandCount; i++) {
            const geometry = new THREE.PlaneGeometry(bandWidth, bandHeight);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3 - (i * 0.05),
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const band = new THREE.Mesh(geometry, material);
            band.position.x = (i - bandCount / 2) * (bandWidth / bandCount);
            band.rotation.x = isNorth ? -Math.PI / 2 : Math.PI / 2;
            band.userData.offset = i;
            band.userData.isNorth = isNorth;
            auroraGroup.add(band);
        }
        
        return auroraGroup;
    }

    updatePlanets(delta) {
        // 更新累积时间
        this.accumulatedTime += delta * 1000; // 转换为时间单位（类似毫秒）
        
        // 太阳自转和日冕动画
        if (this.sun) {
            this.sun.rotation.y += 0.005 * delta;
            if (this.sunCorona) {
                this.sunCorona.rotation.y += 0.002 * delta;
                // 使用累积时间而不是实时时间
                this.sunCorona.material.opacity = 0.3 + Math.sin(this.accumulatedTime * 0.001) * 0.1;
            }
            
            // 更新太阳耀斑效果
            if (this.sunFlares) {
                this.sunFlares.forEach(flare => {
                    const data = flare.userData;
                    
                    // 检查是否需要开始新的闪烁
                    if (this.accumulatedTime >= data.nextFlashTime && data.baseOpacity === 0) {
                        data.baseOpacity = data.maxOpacity;
                        data.flashStartTime = this.accumulatedTime;
                    }
                    
                    // 如果正在闪烁，更新透明度
                    if (data.baseOpacity > 0) {
                        const elapsed = this.accumulatedTime - data.flashStartTime;
                        if (elapsed < data.flashDuration) {
                            // 闪烁效果：快速出现然后消失
                            const progress = elapsed / data.flashDuration;
                            flare.material.opacity = data.baseOpacity * (1 - progress);
                        } else {
                            // 闪烁结束，重置
                            data.baseOpacity = 0;
                            flare.material.opacity = 0;
                            data.nextFlashTime = this.accumulatedTime + data.flashInterval;
                        }
                    }
                });
            }
            
            // 更新CME粒子系统
            this.updateCME(delta);
        }
        
        // 更新行星
        this.planets.forEach((planetGroup) => {
            const planet = planetGroup.children[0];
            const data = planet.userData;
            
            // 公转
            data.angle += data.speed * delta;
            planetGroup.rotation.y = data.angle;
            
            // 自转
            planet.rotation.y += data.rotationSpeed * delta;
            
            // 更新极光效果（仅地球）
            if (data.name === '地球' && planet.userData.auroraGroup) {
                this.updateAurora(planet.userData.auroraGroup, delta);
            }
            
            // 更新所有卫星（月亮）
            for (let i = 0; i < planet.children.length; i++) {
                const child = planet.children[i];
                if (child.userData && child.userData.isMoon) {
                    child.userData.angle += child.userData.orbitSpeed * delta;
                    const distance = child.userData.distance;
                    child.position.x = distance * Math.cos(child.userData.angle);
                    child.position.z = distance * Math.sin(child.userData.angle);
                    // 卫星自转
                    child.rotation.y += child.userData.rotationSpeed * delta;
                }
            }
        });
        
        // 更新小行星带（使用真实椭圆轨道）
        this.asteroidBelt.forEach((asteroid, index) => {
            const data = asteroid.userData;
            
            // 更新真近点角
            data.trueAnomaly += data.speed * delta;
            
            // 使用开普勒轨道方程计算当前位置
            const r = data.semiMajorAxis * (1 - data.eccentricity * data.eccentricity) / 
                     (1 + data.eccentricity * Math.cos(data.trueAnomaly));
            
            // 应用轨道倾角和升交点经度
            const cosInclination = Math.cos(data.inclination);
            const sinInclination = Math.sin(data.inclination);
            const cosNode = Math.cos(data.longitudeOfAscendingNode);
            const sinNode = Math.sin(data.longitudeOfAscendingNode);
            const cosAnomaly = Math.cos(data.trueAnomaly + data.argumentOfPeriapsis);
            const sinAnomaly = Math.sin(data.trueAnomaly + data.argumentOfPeriapsis);
            
            // 轨道平面内的位置
            const xOrbital = r * cosAnomaly;
            const yOrbital = r * sinAnomaly;
            
            // 转换到3D空间（应用倾角和升交点）
            asteroid.position.x = xOrbital * cosNode - yOrbital * sinNode * cosInclination;
            asteroid.position.y = yOrbital * sinInclination;
            asteroid.position.z = xOrbital * sinNode + yOrbital * cosNode * cosInclination;
            
            // 自转（优化：每帧只更新一部分小行星的旋转）
            if (index % 3 === 0) {
                asteroid.rotation.x += data.rotationSpeed.x * delta;
                asteroid.rotation.y += data.rotationSpeed.y * delta;
                asteroid.rotation.z += data.rotationSpeed.z * delta;
            }
        });
    }

    // 更新极光动画
    updateAurora(auroraGroup, delta) {
        const time = Date.now() * 0.001;
        
        auroraGroup.children.forEach((bandGroup, index) => {
            bandGroup.children.forEach((band, bandIndex) => {
                // 动态改变透明度和位置
                const wave = Math.sin(time * 0.5 + bandIndex * 0.3 + index * 0.5) * 0.5 + 0.5;
                band.material.opacity = (0.2 + wave * 0.3) * (1 - bandIndex * 0.1);
                
                // 轻微摆动
                band.rotation.z = Math.sin(time * 0.3 + bandIndex * 0.2) * 0.1;
                band.position.y = Math.sin(time * 0.4 + bandIndex * 0.3) * 0.1;
            });
        });
    }

    getPlanetByName(name) {
        return this.planets.find(p => p.children[0].userData.name === name);
    }

    getPlanetWorldPosition(planetName) {
        const planetGroup = this.getPlanetByName(planetName);
        if (planetGroup) {
            const planet = planetGroup.children[0];
            // 从planet对象获取世界位置，因为planet是实际有位置的对象
            const worldPosition = new THREE.Vector3();
            planet.getWorldPosition(worldPosition);
            return worldPosition;
        }
        return null;
    }

    // 获取月球的世界位置
    getMoonWorldPosition(planetName, moonName) {
        const planetGroup = this.getPlanetByName(planetName);
        if (!planetGroup) return null;
        
        const planet = planetGroup.children[0];
        // 查找月球
        for (let i = 0; i < planet.children.length; i++) {
            const child = planet.children[i];
            if (child.userData && child.userData.isMoon && child.userData.name === moonName) {
                const worldPosition = new THREE.Vector3();
                child.getWorldPosition(worldPosition);
                return worldPosition;
            }
        }
        return null;
    }

    // 获取地球的月球对象
    getEarthMoon() {
        const earthGroup = this.getPlanetByName('地球');
        if (!earthGroup) return null;
        
        const earth = earthGroup.children[0];
        for (let i = 0; i < earth.children.length; i++) {
            const child = earth.children[i];
            if (child.userData && child.userData.isMoon && child.userData.name === '月球') {
                return child;
            }
        }
        return null;
    }

    updateCME(delta) {
        if (!this.cmeParticles) return;
        
        const cmeData = this.cmeParticles.userData;
        const positions = this.cmeParticles.geometry.attributes.position.array;
        const velocities = cmeData.velocities;
        const lifetimes = cmeData.lifetimes;
        
        // 检查是否需要发射新的CME（使用累积时间）
        if (this.accumulatedTime >= cmeData.nextCMETime) {
            // 发射新的CME（激活一些粒子）
            const cmeCount = 50 + Math.random() * 50; // 50-100个粒子
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI;
            
            for (let i = 0; i < this.cmeParticles.geometry.attributes.position.count; i++) {
                if (lifetimes[i] <= 0 && Math.random() < cmeCount / this.cmeParticles.geometry.attributes.position.count) {
                    // 激活这个粒子
                    const radius = 22; // 从太阳表面开始
                    const i3 = i * 3;
                    
                    positions[i3] = radius * Math.sin(angle2) * Math.cos(angle1) + (Math.random() - 0.5) * 2;
                    positions[i3 + 1] = radius * Math.sin(angle2) * Math.sin(angle1) + (Math.random() - 0.5) * 2;
                    positions[i3 + 2] = radius * Math.cos(angle2) + (Math.random() - 0.5) * 2;
                    
                    // 设置速度（向外辐射）
                    const speed = 0.5 + Math.random() * 0.5;
                    velocities[i3] = (positions[i3] / radius) * speed;
                    velocities[i3 + 1] = (positions[i3 + 1] / radius) * speed;
                    velocities[i3 + 2] = (positions[i3 + 2] / radius) * speed;
                    
                    lifetimes[i] = 1.0; // 初始生命周期
                }
            }
            
            cmeData.nextCMETime = this.accumulatedTime + 15000 + Math.random() * 25000; // 15-40时间单位后下一次
        }
        
        // 更新所有激活的粒子
        for (let i = 0; i < lifetimes.length; i++) {
            if (lifetimes[i] > 0) {
                const i3 = i * 3;
                
                // 更新位置
                positions[i3] += velocities[i3] * delta * 10;
                positions[i3 + 1] += velocities[i3 + 1] * delta * 10;
                positions[i3 + 2] += velocities[i3 + 2] * delta * 10;
                
                // 更新生命周期
                lifetimes[i] -= 0.01 * delta;
                
                // 如果生命周期结束，重置粒子
                if (lifetimes[i] <= 0) {
                    positions[i3] = 0;
                    positions[i3 + 1] = 0;
                    positions[i3 + 2] = 0;
                }
            }
        }
        
        // 更新颜色（根据生命周期）
        const colors = this.cmeParticles.geometry.attributes.color.array;
        for (let i = 0; i < lifetimes.length; i++) {
            if (lifetimes[i] > 0) {
                const i3 = i * 3;
                const life = lifetimes[i];
                // 从红色渐变到橙色再到透明
                colors[i3] = 1.0; // R
                colors[i3 + 1] = 0.3 + life * 0.5; // G
                colors[i3 + 2] = 0.1 + life * 0.1; // B
            }
        }
        
        this.cmeParticles.geometry.attributes.position.needsUpdate = true;
        this.cmeParticles.geometry.attributes.color.needsUpdate = true;
    }
}

