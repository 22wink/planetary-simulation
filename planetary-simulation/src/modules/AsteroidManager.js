// 小行星管理模块 - 负责创建和管理近地小行星
class AsteroidManager {
    constructor(scene, planetManager) {
        this.scene = scene;
        this.planetManager = planetManager;
        this.asteroids = [];
        this.maxAsteroids = 5; // 最多同时存在5个小行星
        this.lastSpawnTime = Date.now();
    }

    // 创建小行星
    createAsteroid() {
        if (this.asteroids.length >= this.maxAsteroids) {
            return null;
        }

        const config = Config.events.asteroidApproach;
        const earthPlanet = this.planetManager.getPlanetByName('地球');
        if (!earthPlanet) return null;

        const earth = earthPlanet.children[0];
        const earthData = earth.userData;
        
        // 计算地球位置
        const earthX = earthData.distance * Math.cos(earthData.angle);
        const earthZ = earthData.distance * Math.sin(earthData.angle);
        const earthPos = new THREE.Vector3(earthX, 0, earthZ);

        // 随机生成小行星轨道参数
        const size = 0.3 + Math.random() * 0.5; // 小行星大小
        const distance = config.minDistance + Math.random() * (config.maxDistance - config.minDistance);
        const angle = Math.random() * Math.PI * 2; // 初始角度
        const speed = 0.003 + Math.random() * 0.002; // 轨道速度
        const inclination = (Math.random() - 0.5) * 0.3; // 轨道倾角

        // 创建小行星几何体（不规则形状）
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.castShadow = true;
        asteroid.receiveShadow = true;

        // 添加发光效果（根据危险等级）
        const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // 默认绿色（安全）
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        asteroid.add(glow);

        // 创建轨道线
        const orbitPoints = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const x = distance * Math.cos(t + angle);
            const z = distance * Math.sin(t + angle);
            const y = Math.sin(t) * inclination * distance;
            orbitPoints.push(new THREE.Vector3(x, y, z));
        }
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.3
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        this.scene.add(orbitLine);

        // 存储小行星数据
        asteroid.userData = {
            name: `小行星 ${this.asteroids.length + 1}`,
            size: size,
            distance: distance,
            angle: angle,
            speed: speed,
            inclination: inclination,
            glow: glow,
            orbitLine: orbitLine,
            spawnTime: Date.now(),
            closestDistance: Infinity
        };

        // 设置初始位置
        this.updateAsteroidPosition(asteroid, earthPos);

        this.asteroids.push(asteroid);
        this.scene.add(asteroid);

        return asteroid;
    }

    // 更新小行星位置
    updateAsteroidPosition(asteroid, earthPos) {
        const data = asteroid.userData;
        
        // 更新角度
        data.angle += data.speed;
        
        // 计算小行星位置（相对于太阳）
        const x = data.distance * Math.cos(data.angle);
        const z = data.distance * Math.sin(data.angle);
        const y = Math.sin(data.angle) * data.inclination * data.distance;
        
        asteroid.position.set(x, y, z);
        
        // 计算到地球的距离
        const asteroidPos = new THREE.Vector3(x, y, z);
        const distanceToEarth = asteroidPos.distanceTo(earthPos);
        data.currentDistance = distanceToEarth;
        
        // 更新最近距离
        if (distanceToEarth < data.closestDistance) {
            data.closestDistance = distanceToEarth;
        }
        
        // 根据距离更新危险等级和颜色
        this.updateDangerLevel(asteroid, distanceToEarth);
        
        // 更新发光效果
        if (data.glow) {
            data.glow.rotation.x += 0.02;
            data.glow.rotation.y += 0.02;
            const time = Date.now() * 0.001;
            data.glow.material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
        }
    }

    // 更新危险等级
    updateDangerLevel(asteroid, distance) {
        const config = Config.events.asteroidApproach;
        const data = asteroid.userData;
        
        let color, level;
        if (distance < config.dangerDistance) {
            color = 0xff0000; // 红色 - 危险
            level = 'danger';
        } else if (distance < config.warningDistance) {
            color = 0xffff00; // 黄色 - 警告
            level = 'warning';
        } else if (distance < config.safeDistance) {
            color = 0x00ff00; // 绿色 - 安全
            level = 'safe';
        } else {
            color = 0x888888; // 灰色 - 很远
            level = 'far';
        }
        
        data.dangerLevel = level;
        if (data.glow) {
            data.glow.material.color.setHex(color);
        }
    }

    // 更新所有小行星
    updateAsteroids(delta) {
        const earthPlanet = this.planetManager.getPlanetByName('地球');
        if (!earthPlanet) return;

        const earth = earthPlanet.children[0];
        const earthData = earth.userData;
        const earthX = earthData.distance * Math.cos(earthData.angle);
        const earthZ = earthData.distance * Math.sin(earthData.angle);
        const earthPos = new THREE.Vector3(earthX, 0, earthZ);

        // 更新现有小行星
        this.asteroids.forEach(asteroid => {
            this.updateAsteroidPosition(asteroid, earthPos);
        });

        // 检查是否需要生成新小行星
        const config = Config.events.asteroidApproach;
        if (config && config.enabled) {
            const now = Date.now();
            if (now - this.lastSpawnTime > config.spawnInterval && this.asteroids.length < this.maxAsteroids) {
                this.createAsteroid();
                this.lastSpawnTime = now;
            }
        }

        // 移除距离太远的小行星
        this.asteroids = this.asteroids.filter(asteroid => {
            const data = asteroid.userData;
            // 如果小行星已经远离并且超过了最近距离点
            if (data.currentDistance > config.maxDistance * 1.5 && data.closestDistance < Infinity) {
                this.removeAsteroid(asteroid);
                return false;
            }
            return true;
        });
    }

    // 移除小行星
    removeAsteroid(asteroid) {
        if (asteroid.userData.orbitLine) {
            this.scene.remove(asteroid.userData.orbitLine);
        }
        this.scene.remove(asteroid);
        const index = this.asteroids.indexOf(asteroid);
        if (index > -1) {
            this.asteroids.splice(index, 1);
        }
    }

    // 获取小行星信息
    getAsteroidInfo(asteroid) {
        const data = asteroid.userData;
        const config = Config.events.asteroidApproach;
        
        let levelText, levelColor;
        switch (data.dangerLevel) {
            case 'danger':
                levelText = '危险';
                levelColor = '#ff0000';
                break;
            case 'warning':
                levelText = '警告';
                levelColor = '#ffff00';
                break;
            case 'safe':
                levelText = '安全';
                levelColor = '#00ff00';
                break;
            default:
                levelText = '遥远';
                levelColor = '#888888';
        }
        
        return {
            name: data.name,
            distance: data.currentDistance.toFixed(2),
            closestDistance: data.closestDistance.toFixed(2),
            dangerLevel: levelText,
            dangerColor: levelColor,
            size: data.size.toFixed(2)
        };
    }
}

