// 可视化增强管理模块 - 负责引力场线、轨道预测、星座连线等可视化效果
class VisualizationManager {
    constructor(scene, planetManager) {
        this.scene = scene;
        this.planetManager = planetManager;
        
        // 可视化选项
        this.options = {
            showGravityField: false,
            showOrbitPrediction: false,
            showConstellations: false,
            usePlanetTextures: false
        };
        
        // 存储可视化对象
        this.gravityFieldLines = [];
        this.orbitPredictionLines = [];
        this.constellationLines = [];
        this.planetTextures = {};
        
        // 轨道预测参数
        this.predictionSteps = 100; // 预测步数
        this.predictionTime = 1000; // 预测时间（天）
    }

    // 创建引力场线（从太阳到每个行星）
    createGravityFieldLines() {
        if (!this.planetManager.sun) return;
        
        this.clearGravityFieldLines();
        
        const sunPosition = new THREE.Vector3(0, 0, 0);
        
        this.planetManager.planets.forEach((planetGroup) => {
            const planet = planetGroup.children[0];
            const planetData = planet.userData;
            
            // 创建引力场线（使用曲线表示引力强度）
            const points = [];
            const segments = 50;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const angle = planetData.angle + (planetData.speed * this.predictionTime * t);
                
                // 计算当前行星位置
                const planetX = Math.cos(angle) * planetData.distance;
                const planetZ = Math.sin(angle) * planetData.distance;
                const planetY = 0;
                
                // 计算引力场强度（距离越近，引力越强）
                const distance = Math.sqrt(
                    Math.pow(planetX - sunPosition.x, 2) +
                    Math.pow(planetY - sunPosition.y, 2) +
                    Math.pow(planetZ - sunPosition.z, 2)
                );
                
                // 引力场线从太阳指向行星，颜色表示强度
                const strength = 1 / (distance * 0.01 + 0.1); // 归一化强度
                const normalizedStrength = Math.min(strength, 1);
                
                // 使用插值创建曲线
                const curveX = sunPosition.x + (planetX - sunPosition.x) * t;
                const curveY = sunPosition.y + (planetY - sunPosition.y) * t;
                const curveZ = sunPosition.z + (planetZ - sunPosition.z) * t;
                
                points.push(new THREE.Vector3(curveX, curveY, curveZ));
            }
            
            // 创建渐变颜色的线
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3,
                linewidth: 1
            });
            
            const line = new THREE.Line(geometry, material);
            line.userData = { isGravityField: true, planetName: planetData.name };
            this.scene.add(line);
            this.gravityFieldLines.push(line);
        });
    }

    // 清除引力场线
    clearGravityFieldLines() {
        this.gravityFieldLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.gravityFieldLines = [];
    }

    // 更新引力场线（跟随行星运动）
    updateGravityFieldLines() {
        if (!this.options.showGravityField || !this.planetManager.sun) return;
        
        const sunPosition = new THREE.Vector3(0, 0, 0);
        
        this.gravityFieldLines.forEach((line, index) => {
            if (index >= this.planetManager.planets.length) return;
            
            const planetGroup = this.planetManager.planets[index];
            const planet = planetGroup.children[0];
            const planetData = planet.userData;
            
            const points = [];
            const segments = 50;
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const angle = planetData.angle;
                
                const planetX = Math.cos(angle) * planetData.distance;
                const planetZ = Math.sin(angle) * planetData.distance;
                const planetY = 0;
                
                const curveX = sunPosition.x + (planetX - sunPosition.x) * t;
                const curveY = sunPosition.y + (planetY - sunPosition.y) * t;
                const curveZ = sunPosition.z + (planetZ - sunPosition.z) * t;
                
                points.push(new THREE.Vector3(curveX, curveY, curveZ));
            }
            
            line.geometry.setFromPoints(points);
            line.geometry.attributes.position.needsUpdate = true;
        });
    }

    // 创建轨道预测路径（显示未来轨道）
    createOrbitPrediction() {
        this.clearOrbitPrediction();
        
        this.planetManager.planets.forEach((planetGroup) => {
            const planet = planetGroup.children[0];
            const planetData = planet.userData;
            
            const points = [];
            const steps = this.predictionSteps;
            
            // 计算未来轨道位置
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const futureAngle = planetData.angle + (planetData.speed * this.predictionTime * t);
                
                const x = Math.cos(futureAngle) * planetData.distance;
                const z = Math.sin(futureAngle) * planetData.distance;
                const y = 0;
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            // 使用LineBasicMaterial替代LineDashedMaterial（更兼容）
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5
            });
            
            const line = new THREE.Line(geometry, material);
            line.userData = { isOrbitPrediction: true, planetName: planetData.name };
            this.scene.add(line);
            this.orbitPredictionLines.push(line);
        });
    }

    // 清除轨道预测路径
    clearOrbitPrediction() {
        this.orbitPredictionLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.orbitPredictionLines = [];
    }

    // 更新轨道预测路径
    updateOrbitPrediction() {
        if (!this.options.showOrbitPrediction) return;
        
        this.orbitPredictionLines.forEach((line, index) => {
            if (index >= this.planetManager.planets.length) return;
            
            const planetGroup = this.planetManager.planets[index];
            const planet = planetGroup.children[0];
            const planetData = planet.userData;
            
            const points = [];
            const steps = this.predictionSteps;
            
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const futureAngle = planetData.angle + (planetData.speed * this.predictionTime * t);
                
                const x = Math.cos(futureAngle) * planetData.distance;
                const z = Math.sin(futureAngle) * planetData.distance;
                const y = 0;
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            line.geometry.setFromPoints(points);
            line.geometry.attributes.position.needsUpdate = true;
        });
    }

    // 创建星座连线（在背景星空上）
    createConstellations() {
        this.clearConstellations();
        
        // 定义一些主要星座的连线（使用相对坐标）
        const constellations = [
            {
                name: '大熊座',
                stars: [
                    { x: -800, y: 600, z: -400 },
                    { x: -750, y: 550, z: -400 },
                    { x: -700, y: 600, z: -400 },
                    { x: -650, y: 550, z: -400 },
                    { x: -600, y: 600, z: -400 },
                    { x: -550, y: 500, z: -400 },
                    { x: -500, y: 450, z: -400 }
                ],
                connections: [
                    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]
                ]
            },
            {
                name: '猎户座',
                stars: [
                    { x: 200, y: 400, z: -500 },
                    { x: 250, y: 350, z: -500 },
                    { x: 300, y: 400, z: -500 },
                    { x: 250, y: 450, z: -500 },
                    { x: 250, y: 300, z: -500 },
                    { x: 200, y: 250, z: -500 },
                    { x: 300, y: 250, z: -500 }
                ],
                connections: [
                    [0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6]
                ]
            },
            {
                name: '天鹅座',
                stars: [
                    { x: -400, y: -300, z: 600 },
                    { x: -350, y: -250, z: 600 },
                    { x: -300, y: -200, z: 600 },
                    { x: -250, y: -250, z: 600 },
                    { x: -200, y: -300, z: 600 }
                ],
                connections: [
                    [0, 1], [1, 2], [2, 3], [3, 4]
                ]
            }
        ];
        
        constellations.forEach(constellation => {
            constellation.connections.forEach(connection => {
                const start = constellation.stars[connection[0]];
                const end = constellation.stars[connection[1]];
                
                const points = [
                    new THREE.Vector3(start.x, start.y, start.z),
                    new THREE.Vector3(end.x, end.y, end.z)
                ];
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x88ccff,
                    transparent: true,
                    opacity: 0.3,
                    linewidth: 1
                });
                
                const line = new THREE.Line(geometry, material);
                line.userData = { isConstellation: true, constellationName: constellation.name };
                this.scene.add(line);
                this.constellationLines.push(line);
            });
        });
    }

    // 清除星座连线
    clearConstellations() {
        this.constellationLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.constellationLines = [];
    }

    // 为行星加载纹理（使用程序生成的纹理作为占位符）
    loadPlanetTextures() {
        if (this.options.usePlanetTextures) {
            // 由于无法直接加载外部纹理文件，我们使用Canvas创建程序生成的纹理
            Config.planetData.forEach(planetData => {
                this.createPlanetTexture(planetData);
            });
        }
    }

    // 创建程序生成的行星纹理
    createPlanetTexture(planetData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // 根据行星名称创建不同的纹理模式
        if (planetData.name === '地球') {
            // 地球纹理：蓝色海洋 + 绿色大陆
            const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
            gradient.addColorStop(0, '#4a90e2');
            gradient.addColorStop(0.3, '#5ba3f5');
            gradient.addColorStop(0.6, '#4a90e2');
            gradient.addColorStop(1, '#2e5c8a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
            
            // 添加大陆纹理
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(${50 + Math.random() * 50}, ${100 + Math.random() * 50}, ${50 + Math.random() * 30}, 0.6)`;
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 512,
                    Math.random() * 512,
                    30 + Math.random() * 50,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else if (planetData.name === '火星') {
            // 火星纹理：红色 + 橙色
            const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
            gradient.addColorStop(0, '#c1440e');
            gradient.addColorStop(0.5, '#d4551f');
            gradient.addColorStop(1, '#a0330a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
            
            // 添加表面细节
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(${180 + Math.random() * 30}, ${60 + Math.random() * 20}, ${10 + Math.random() * 10}, 0.4)`;
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 512,
                    Math.random() * 512,
                    20 + Math.random() * 40,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else if (planetData.name === '木星') {
            // 木星纹理：条纹状
            const baseColor = '#d8ca9d';
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);
            
            // 添加水平条纹
            for (let i = 0; i < 10; i++) {
                const y = (i / 10) * 512;
                ctx.fillStyle = i % 2 === 0 ? '#c4b589' : '#e8d9a5';
                ctx.fillRect(0, y, 512, 512 / 10);
            }
            
            // 添加大红斑
            ctx.fillStyle = '#b8860b';
            ctx.beginPath();
            ctx.ellipse(150, 256, 80, 40, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (planetData.name === '土星') {
            // 土星纹理：淡黄色条纹
            const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
            gradient.addColorStop(0, '#fad5a5');
            gradient.addColorStop(0.5, '#f4c88a');
            gradient.addColorStop(1, '#e8b870');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
            
            // 添加水平条纹
            for (let i = 0; i < 8; i++) {
                const y = (i / 8) * 512;
                ctx.fillStyle = i % 2 === 0 ? '#f0d09a' : '#ffe4b5';
                ctx.fillRect(0, y, 512, 512 / 8);
            }
        } else {
            // 其他行星：使用基础颜色 + 噪声
            const baseColor = '#' + planetData.color.toString(16).padStart(6, '0');
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 512, 512);
            
            // 添加噪声纹理
            for (let i = 0; i < 50; i++) {
                const alpha = 0.1 + Math.random() * 0.2;
                ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${alpha})`;
                ctx.fillRect(
                    Math.random() * 512,
                    Math.random() * 512,
                    5 + Math.random() * 15,
                    5 + Math.random() * 15
                );
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        this.planetTextures[planetData.name] = texture;
        
        // 应用到对应的行星
        const planetGroup = this.planetManager.getPlanetByName(planetData.name);
        if (planetGroup) {
            const planet = planetGroup.children[0];
            if (planet.material) {
                planet.material.map = texture;
                planet.material.needsUpdate = true;
            }
        }
    }

    // 切换可视化选项
    toggleGravityField(show) {
        this.options.showGravityField = show;
        if (show) {
            this.createGravityFieldLines();
        } else {
            this.clearGravityFieldLines();
        }
    }

    toggleOrbitPrediction(show) {
        this.options.showOrbitPrediction = show;
        if (show) {
            this.createOrbitPrediction();
        } else {
            this.clearOrbitPrediction();
        }
    }

    toggleConstellations(show) {
        this.options.showConstellations = show;
        if (show) {
            this.createConstellations();
        } else {
            this.clearConstellations();
        }
    }

    togglePlanetTextures(use) {
        this.options.usePlanetTextures = use;
        if (use) {
            this.loadPlanetTextures();
        } else {
            // 恢复原始材质
            Config.planetData.forEach(planetData => {
                const planetGroup = this.planetManager.getPlanetByName(planetData.name);
                if (planetGroup) {
                    const planet = planetGroup.children[0];
                    if (planet.material) {
                        planet.material.map = null;
                        planet.material.needsUpdate = true;
                    }
                }
            });
        }
    }

    // 更新可视化效果（在动画循环中调用）
    update() {
        if (this.options.showGravityField) {
            this.updateGravityFieldLines();
        }
        if (this.options.showOrbitPrediction) {
            this.updateOrbitPrediction();
        }
    }

    // 清理所有可视化效果
    dispose() {
        this.clearGravityFieldLines();
        this.clearOrbitPrediction();
        this.clearConstellations();
        
        // 清理纹理
        Object.values(this.planetTextures).forEach(texture => {
            texture.dispose();
        });
        this.planetTextures = {};
    }
}

