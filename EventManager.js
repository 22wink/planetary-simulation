// 事件管理模块 - 负责检测和管理特殊天文事件
class EventManager {
    constructor(scene, planetManager) {
        this.scene = scene;
        this.planetManager = planetManager;
        this.events = [];
        this.activeEvents = [];
        this.eventHistory = [];
        this.notificationQueue = [];
    }

    // 检测行星对齐（多颗行星接近一条线）
    checkPlanetAlignment() {
        // 检查配置是否启用
        if (!Config.events || !Config.events.alignment || !Config.events.alignment.enabled) {
            return;
        }

        const planets = this.planetManager.planets;
        if (planets.length < 3) return;

        const positions = planets.map(p => {
            const planet = p.children[0];
            return this.planetManager.getPlanetWorldPosition(planet.userData.name);
        }).filter(p => p !== null);

        if (positions.length < 3) return;

        // 检查是否有3颗或更多行星接近一条线
        for (let i = 0; i < positions.length - 2; i++) {
            for (let j = i + 1; j < positions.length - 1; j++) {
                for (let k = j + 1; k < positions.length; k++) {
                    const p1 = positions[i];
                    const p2 = positions[j];
                    const p3 = positions[k];

                    // 计算三点是否接近一条线
                    const v1 = new THREE.Vector3().subVectors(p2, p1).normalize();
                    const v2 = new THREE.Vector3().subVectors(p3, p1).normalize();
                    const cross = new THREE.Vector3().crossVectors(v1, v2);
                    const distance = cross.length(); // 如果接近0，说明三点接近一条线

                    const threshold = Config.events?.alignment?.threshold || 50;
                    if (distance < threshold) {
                        const planetNames = [
                            planets[i].children[0].userData.name,
                            planets[j].children[0].userData.name,
                            planets[k].children[0].userData.name
                        ];
                        this.triggerEvent('alignment', {
                            planets: planetNames,
                            positions: [p1, p2, p3]
                        });
                    }
                }
            }
        }
    }

    // 检测行星会合（两颗行星接近）
    checkPlanetConjunction() {
        // 检查配置是否启用
        if (!Config.events || !Config.events.conjunction || !Config.events.conjunction.enabled) {
            return;
        }

        const planets = this.planetManager.planets;
        const minDistance = Config.events?.conjunction?.minDistance || 80;

        for (let i = 0; i < planets.length - 1; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const planet1 = planets[i].children[0];
                const planet2 = planets[j].children[0];
                const pos1 = this.planetManager.getPlanetWorldPosition(planet1.userData.name);
                const pos2 = this.planetManager.getPlanetWorldPosition(planet2.userData.name);

                if (!pos1 || !pos2) continue;

                const distance = pos1.distanceTo(pos2);

                if (distance < minDistance) {
                    // 检查是否已经触发过这个会合事件
                    const eventKey = `conjunction_${planet1.userData.name}_${planet2.userData.name}`;
                    const existingEvent = this.activeEvents.find(e => e.key === eventKey);

                    if (!existingEvent) {
                        this.triggerEvent('conjunction', {
                            planet1: planet1.userData.name,
                            planet2: planet2.userData.name,
                            position1: pos1,
                            position2: pos2,
                            distance: distance
                        }, eventKey);
                    }
                }
            }
        }
    }

    // 检测彗星接近太阳
    checkCometApproach(cometManager) {
        // 检查配置是否启用
        if (!Config.events || !Config.events.cometApproach || !Config.events.cometApproach.enabled) {
            return;
        }

        if (!cometManager || !cometManager.comets) return;

        cometManager.comets.forEach(cometGroup => {
            const core = cometGroup.userData.core;
            if (!core || !core.userData) return;

            const cometPos = cometGroup.position;
            const distanceToSun = cometPos.length();
            const perihelion = core.userData.perihelion;

            // 如果彗星接近近日点
            if (distanceToSun < perihelion * 1.2 && distanceToSun > perihelion * 0.8) {
                const eventKey = `comet_${core.userData.name}`;
                const existingEvent = this.activeEvents.find(e => e.key === eventKey);

                if (!existingEvent) {
                    this.triggerEvent('comet_approach', {
                        cometName: core.userData.name,
                        distance: distanceToSun,
                        position: cometPos.clone()
                    }, eventKey);
                }
            }
        });
    }

    // 触发事件
    triggerEvent(type, data, key = null) {
        const event = {
            type: type,
            data: data,
            timestamp: Date.now(),
            key: key || `${type}_${Date.now()}`,
            highlighted: false
        };

        this.activeEvents.push(event);
        this.eventHistory.push({
            ...event,
            duration: 0
        });

        // 创建视觉高亮效果
        this.createEventHighlight(event);

        // 添加通知
        this.addNotification(event);

        // 自动移除事件（5秒后）
        setTimeout(() => {
            this.removeEvent(event.key);
        }, 5000);
    }

    // 创建事件视觉高亮
    createEventHighlight(event) {
        if (event.highlighted) return;
        event.highlighted = true;

        if (event.type === 'conjunction') {
            // 检查配置是否显示高亮
            const showHighlight = Config.events?.conjunction?.showHighlight !== false;
            if (showHighlight) {
                // 在两颗行星之间创建连线
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    event.data.position1,
                    event.data.position2
                ]);
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.6,
                    linewidth: 2
                });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                line.userData.isEventHighlight = true;
                line.userData.eventKey = event.key;
                this.scene.add(line);
                event.highlightLine = line;
            }
        } else if (event.type === 'alignment') {
            // 检查配置是否显示高亮
            const showHighlight = Config.events?.alignment?.showHighlight === true;
            if (showHighlight) {
                // 为对齐的行星创建高亮圈
                event.data.positions.forEach((pos, index) => {
                    const geometry = new THREE.RingGeometry(5, 8, 32);
                    const material = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        transparent: true,
                        opacity: 0.5,
                        side: THREE.DoubleSide
                    });
                    const ring = new THREE.Mesh(geometry, material);
                    ring.position.copy(pos);
                    ring.lookAt(0, 0, 0);
                    ring.userData.isEventHighlight = true;
                    ring.userData.eventKey = event.key;
                    this.scene.add(ring);
                    if (!event.highlightRings) event.highlightRings = [];
                    event.highlightRings.push(ring);
                });
            }
        }
    }

    // 移除事件
    removeEvent(key) {
        const index = this.activeEvents.findIndex(e => e.key === key);
        if (index > -1) {
            const event = this.activeEvents[index];
            
            // 移除视觉高亮
            if (event.highlightLine) {
                this.scene.remove(event.highlightLine);
            }
            if (event.highlightRings) {
                event.highlightRings.forEach(ring => {
                    this.scene.remove(ring);
                });
            }

            this.activeEvents.splice(index, 1);
        }
    }

    // 添加通知
    addNotification(event) {
        let message = '';
        let title = '';

        switch (event.type) {
            case 'alignment':
                title = '行星对齐！';
                message = `${event.data.planets.join('、')} 接近一条直线`;
                break;
            case 'conjunction':
                title = '行星会合！';
                message = `${event.data.planet1} 和 ${event.data.planet2} 非常接近`;
                break;
            case 'comet_approach':
                title = '彗星接近！';
                message = `${event.data.cometName} 正在接近太阳`;
                break;
        }

        this.notificationQueue.push({ title, message, timestamp: Date.now() });
        
        // 检查配置是否显示通知
        const eventConfig = Config.events?.[event.type === 'comet_approach' ? 'cometApproach' : event.type];
        if (eventConfig && eventConfig.showNotification !== false) {
            this.showNotification(title, message);
        }
    }

    // 显示通知
    showNotification(title, message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'event-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 3秒后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 更新事件（每帧调用）
    update(cometManager) {
        // 清理过期事件
        this.activeEvents = this.activeEvents.filter(event => {
            const age = Date.now() - event.timestamp;
            return age < 5000; // 5秒后自动移除
        });

        // 检测事件（使用配置中的检测频率）
        const conjunctionFreq = Config.events?.conjunction?.checkFrequency || 0.1;
        if (Math.random() < conjunctionFreq) {
            this.checkPlanetConjunction();
        }

        const alignmentFreq = Config.events?.alignment?.checkFrequency || 0.1;
        if (Math.random() < alignmentFreq) {
            this.checkPlanetAlignment();
        }

        const cometFreq = Config.events?.cometApproach?.checkFrequency || 0.05;
        if (cometManager && Math.random() < cometFreq) {
            this.checkCometApproach(cometManager);
        }
    }

    // 获取事件历史
    getEventHistory() {
        return this.eventHistory.slice(-10); // 返回最近10个事件
    }
}

