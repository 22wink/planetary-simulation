// 探测器管理模块 - 负责创建和管理太空探测器
class MissionManager {
    constructor(scene, planetManager) {
        this.scene = scene;
        this.planetManager = planetManager;
        this.missions = [];
        this.trajectoryLines = [];
        this.missionLabels = [];
    }

    // 创建所有探测器
    createMissions() {
        Config.spaceMissions.forEach((missionData, index) => {
            this.createMission(missionData, index);
        });
    }

    // 创建单个探测器
    createMission(missionData, index) {
        // 创建探测器几何体（小立方体或球体）
        const geometry = new THREE.BoxGeometry(
            missionData.size,
            missionData.size,
            missionData.size * 2
        );
        const material = new THREE.MeshStandardMaterial({
            color: missionData.color,
            emissive: missionData.color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const probe = new THREE.Mesh(geometry, material);
        probe.castShadow = true;
        
        // 添加发光效果
        const glowGeometry = new THREE.SphereGeometry(missionData.size * 1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: missionData.color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        probe.add(glow);
        
        // 创建探测器组
        const missionGroup = new THREE.Group();
        missionGroup.add(probe);
        
        // 存储任务数据
        missionGroup.userData = {
            name: missionData.name,
            missionData: missionData,
            trajectory: { ...missionData.trajectory },
            angle: missionData.trajectory.angle || 0,
            glow: glow,
            index: index
        };
        
        // 设置初始位置
        this.updateMissionPosition(missionGroup);
        
        this.missions.push(missionGroup);
        this.scene.add(missionGroup);
        
        // 创建轨迹线
        this.createTrajectoryLine(missionGroup, missionData);
        
        // 创建标签
        this.createMissionLabel(missionGroup, missionData);
    }

    // 更新探测器位置
    updateMissionPosition(missionGroup) {
        const trajectory = missionGroup.userData.trajectory;
        const missionData = missionGroup.userData.missionData;
        
        if (trajectory.type === 'orbit') {
            // 轨道类型：围绕目标行星运行
            const targetPlanet = this.planetManager.getPlanetByName(trajectory.targets[0]);
            if (targetPlanet) {
                const planet = targetPlanet.children[0];
                const planetData = planet.userData;
                
                // 计算行星位置
                const planetX = planetData.distance * Math.cos(planetData.angle);
                const planetZ = planetData.distance * Math.sin(planetData.angle);
                
                // 探测器围绕行星的轨道
                trajectory.angle += trajectory.speed;
                const orbitRadius = trajectory.orbitRadius || 15;
                missionGroup.position.x = planetX + orbitRadius * Math.cos(trajectory.angle);
                missionGroup.position.z = planetZ + orbitRadius * Math.sin(trajectory.angle);
                missionGroup.position.y = 0;
            }
        } else if (trajectory.type === 'lander') {
            // 着陆器类型：在行星表面
            const targetPlanet = this.planetManager.getPlanetByName(trajectory.targets[0]);
            if (targetPlanet) {
                const planet = targetPlanet.children[0];
                const planetData = planet.userData;
                
                // 计算行星位置
                const planetX = planetData.distance * Math.cos(planetData.angle);
                const planetZ = planetData.distance * Math.sin(planetData.angle);
                
                // 探测器在行星表面
                const orbitRadius = trajectory.orbitRadius || 2;
                trajectory.angle += trajectory.speed * 0.1; // 缓慢移动
                missionGroup.position.x = planetX + orbitRadius * Math.cos(trajectory.angle);
                missionGroup.position.z = planetZ + orbitRadius * Math.sin(trajectory.angle);
                missionGroup.position.y = planetData.size + missionData.size;
            }
        } else {
            // 飞越类型：沿直线轨道移动
            trajectory.angle += trajectory.speed;
            const distance = trajectory.currentDistance || 400;
            missionGroup.position.x = distance * Math.cos(trajectory.angle);
            missionGroup.position.z = distance * Math.sin(trajectory.angle);
            missionGroup.position.y = 0;
        }
        
        // 更新发光效果
        if (missionGroup.userData.glow) {
            missionGroup.userData.glow.rotation.y += 0.02;
            const time = Date.now() * 0.001;
            missionGroup.userData.glow.material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
        }
        
        // 更新标签位置
        this.updateMissionLabel(missionGroup);
    }

    // 创建轨迹线
    createTrajectoryLine(missionGroup, missionData) {
        const points = [];
        const trajectory = missionGroup.userData.trajectory;
        
        // 根据轨迹类型生成点
        if (trajectory.type === 'orbit') {
            // 圆形轨道
            const segments = 64;
            const radius = trajectory.orbitRadius || 15;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    radius * Math.cos(angle),
                    0,
                    radius * Math.sin(angle)
                ));
            }
        } else if (trajectory.type === 'flyby') {
            // 直线轨迹
            const segments = 100;
            const startDistance = 100;
            const endDistance = trajectory.currentDistance || 600;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const distance = startDistance + (endDistance - startDistance) * t;
                const angle = trajectory.angle + (Math.PI * 2 * t);
                points.push(new THREE.Vector3(
                    distance * Math.cos(angle),
                    0,
                    distance * Math.sin(angle)
                ));
            }
        }
        
        if (points.length > 0) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: missionData.color,
                transparent: true,
                opacity: 0.3,
                linewidth: 1
            });
            const line = new THREE.Line(geometry, material);
            line.userData.missionGroup = missionGroup;
            this.trajectoryLines.push(line);
            this.scene.add(line);
        }
    }

    // 创建探测器标签
    createMissionLabel(missionGroup, missionData) {
        // 创建HTML标签元素
        const label = document.createElement('div');
        label.className = 'mission-label';
        label.textContent = missionData.name;
        label.style.cssText = `
            position: absolute;
            color: rgb(${this.hexToRgb(missionData.color).r}, ${this.hexToRgb(missionData.color).g}, ${this.hexToRgb(missionData.color).b});
            font-size: 12px;
            font-weight: bold;
            pointer-events: none;
            white-space: nowrap;
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
            opacity: 0.8;
        `;
        document.body.appendChild(label);
        
        missionGroup.userData.label = label;
        this.missionLabels.push(label);
    }

    // 更新标签位置
    updateMissionLabel(missionGroup) {
        if (!missionGroup.userData.label) return;
        
        const label = missionGroup.userData.label;
        const vector = missionGroup.position.clone();
        
        // 将3D坐标转换为屏幕坐标
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        
        // 如果探测器在屏幕外，隐藏标签
        if (vector.z > 1 || x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
            label.style.display = 'none';
        } else {
            label.style.display = 'block';
        }
    }

    // 设置相机引用（用于标签位置计算）
    setCamera(camera) {
        this.camera = camera;
    }

    // 更新所有探测器
    updateMissions(delta) {
        this.missions.forEach(missionGroup => {
            this.updateMissionPosition(missionGroup);
        });
        
        // 更新轨迹线位置（对于轨道类型）
        this.trajectoryLines.forEach(line => {
            const missionGroup = line.userData.missionGroup;
            if (missionGroup && missionGroup.userData.trajectory.type === 'orbit') {
                const targetPlanet = this.planetManager.getPlanetByName(
                    missionGroup.userData.trajectory.targets[0]
                );
                if (targetPlanet) {
                    const planet = targetPlanet.children[0];
                    const planetData = planet.userData;
                    const planetX = planetData.distance * Math.cos(planetData.angle);
                    const planetZ = planetData.distance * Math.sin(planetData.angle);
                    line.position.set(planetX, 0, planetZ);
                }
            }
        });
    }

    // 获取探测器信息
    getMissionInfo(missionGroup) {
        const missionData = missionGroup.userData.missionData;
        return {
            name: missionData.name,
            launchDate: `${missionData.launchDate.year}年${missionData.launchDate.month}月${missionData.launchDate.day}日`,
            target: missionData.target,
            status: missionData.status === 'active' ? '运行中' : missionData.status === 'completed' ? '已完成' : '失联',
            description: missionData.description,
            color: missionData.color
        };
    }

    // 工具函数：将十六进制颜色转换为RGB
    hexToRgb(hex) {
        // 如果hex是数字，转换为十六进制字符串
        let hexStr = typeof hex === 'number' ? hex.toString(16).padStart(6, '0') : hex.toString();
        // 移除#号（如果有）
        hexStr = hexStr.replace('#', '');
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexStr);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 79, g: 195, b: 247 };
    }

    // 切换探测器显示
    toggleMissions(show) {
        this.missions.forEach(missionGroup => {
            missionGroup.visible = show;
        });
        this.trajectoryLines.forEach(line => {
            line.visible = show;
        });
        this.missionLabels.forEach(label => {
            label.style.display = show ? 'block' : 'none';
        });
    }
}

