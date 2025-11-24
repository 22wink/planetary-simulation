// 事件管理模块 - 负责检测和管理特殊天文事件
class EventManager {
    constructor(scene, planetManager) {
        this.scene = scene;
        this.planetManager = planetManager;
        this.events = [];
        this.activeEvents = [];
        this.eventHistory = [];
        this.notificationQueue = [];
        this.meteorManager = null;  // 将在init中设置
        this.uiController = null;  // 将在init中设置
        this.activeMeteorShower = null;  // 当前活跃的流星雨
    }

    // 初始化方法（设置外部引用）
    init(meteorManager, uiController) {
        this.meteorManager = meteorManager;
        this.uiController = uiController;
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

    // 检测日食（月球遮挡太阳）
    checkSolarEclipse() {
        // 检查配置是否启用
        if (!Config.events || !Config.events.solarEclipse || !Config.events.solarEclipse.enabled) {
            return;
        }

        const sunPos = this.planetManager.sun ? this.planetManager.sun.position : new THREE.Vector3(0, 0, 0);
        const earthPos = this.planetManager.getPlanetWorldPosition('地球');
        const moonPos = this.planetManager.getMoonWorldPosition('地球', '月球');

        if (!earthPos || !moonPos) return;

        // 计算太阳-月球-地球的角度对齐
        const sunToMoon = new THREE.Vector3().subVectors(moonPos, sunPos).normalize();
        const moonToEarth = new THREE.Vector3().subVectors(earthPos, moonPos).normalize();
        
        // 计算两个向量的夹角（点积）
        const alignment = sunToMoon.dot(moonToEarth);
        // alignment接近1表示三点接近一条线，月球在太阳和地球之间

        const threshold = Config.events?.solarEclipse?.alignmentThreshold || 0.15;
        const alignmentAngle = Math.acos(Math.max(-1, Math.min(1, alignment)));

        // 检查是否对齐（角度小于阈值）
        if (alignmentAngle < threshold && alignment > 0.85) {
            // 检查月球是否在太阳和地球之间（距离判断）
            const sunToEarthDist = earthPos.distanceTo(sunPos);
            const sunToMoonDist = moonPos.distanceTo(sunPos);
            const moonToEarthDist = moonPos.distanceTo(earthPos);

            // 月球应该在太阳和地球之间
            if (sunToMoonDist < sunToEarthDist && moonToEarthDist < sunToEarthDist) {
                const eventKey = 'solar_eclipse';
                const existingEvent = this.activeEvents.find(e => e.key === eventKey);

                if (!existingEvent) {
                    // 计算日食类型（基于月球大小和距离）
                    const moonSize = 0.27; // 月球相对大小
                    const moonDistance = moonToEarthDist;
                    const sunSize = 20; // 太阳大小
                    const sunDistance = sunToEarthDist;
                    
                    // 计算视直径
                    const moonAngularSize = (moonSize / moonDistance) * 180 / Math.PI;
                    const sunAngularSize = (sunSize / sunDistance) * 180 / Math.PI;
                    
                    let eclipseType = '日偏食';
                    if (moonAngularSize > sunAngularSize * 0.95) {
                        eclipseType = '日全食';
                    } else if (moonAngularSize < sunAngularSize) {
                        eclipseType = '日环食';
                    }

                    this.triggerEvent('solar_eclipse', {
                        type: eclipseType,
                        moonPosition: moonPos.clone(),
                        earthPosition: earthPos.clone(),
                        sunPosition: sunPos.clone(),
                        alignment: alignment,
                        moonAngularSize: moonAngularSize,
                        sunAngularSize: sunAngularSize
                    }, eventKey);
                }
            }
        }
    }

    // 检测月食（地球遮挡太阳光照射月球）
    checkLunarEclipse() {
        // 检查配置是否启用
        if (!Config.events || !Config.events.lunarEclipse || !Config.events.lunarEclipse.enabled) {
            return;
        }

        const sunPos = this.planetManager.sun ? this.planetManager.sun.position : new THREE.Vector3(0, 0, 0);
        const earthPos = this.planetManager.getPlanetWorldPosition('地球');
        const moonPos = this.planetManager.getMoonWorldPosition('地球', '月球');

        if (!earthPos || !moonPos) return;

        // 计算太阳-地球-月球的角度对齐
        const sunToEarth = new THREE.Vector3().subVectors(earthPos, sunPos).normalize();
        const earthToMoon = new THREE.Vector3().subVectors(moonPos, earthPos).normalize();
        
        // 计算两个向量的夹角
        const alignment = sunToEarth.dot(earthToMoon);
        // alignment接近-1表示三点接近一条线，地球在太阳和月球之间

        const threshold = Config.events?.lunarEclipse?.alignmentThreshold || 0.15;
        const alignmentAngle = Math.acos(Math.max(-1, Math.min(1, alignment)));

        // 检查是否对齐（角度小于阈值，且alignment接近-1）
        if (alignmentAngle < threshold && alignment < -0.85) {
            // 检查地球是否在太阳和月球之间
            const sunToEarthDist = earthPos.distanceTo(sunPos);
            const sunToMoonDist = moonPos.distanceTo(sunPos);
            const earthToMoonDist = moonPos.distanceTo(earthPos);

            // 地球应该在太阳和月球之间
            if (sunToEarthDist < sunToMoonDist && earthToMoonDist < sunToMoonDist) {
                const eventKey = 'lunar_eclipse';
                const existingEvent = this.activeEvents.find(e => e.key === eventKey);

                if (!existingEvent) {
                    // 计算月食类型（基于地球阴影大小）
                    const earthSize = 1.0; // 地球相对大小
                    const moonSize = 0.27;
                    
                    let eclipseType = '月偏食';
                    // 简化判断：如果月球完全进入地球阴影区域，则为月全食
                    const shadowRadius = earthSize * 1.5; // 地球阴影半径（简化）
                    if (earthToMoonDist < shadowRadius) {
                        eclipseType = '月全食';
                    }

                    this.triggerEvent('lunar_eclipse', {
                        type: eclipseType,
                        moonPosition: moonPos.clone(),
                        earthPosition: earthPos.clone(),
                        sunPosition: sunPos.clone(),
                        alignment: alignment
                    }, eventKey);
                }
            }
        }
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

        // 自动移除事件（日食和月食持续时间更长）
        const duration = (event.type === 'solar_eclipse' || event.type === 'lunar_eclipse') ? 10000 : 5000;
        setTimeout(() => {
            this.removeEvent(event.key);
        }, duration);
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
        } else if (event.type === 'solar_eclipse') {
            // 日食视觉效果
            const showHighlight = Config.events?.solarEclipse?.showHighlight !== false;
            if (showHighlight) {
                // 创建阴影效果（在地球上）
                const shadowIntensity = Config.events?.solarEclipse?.shadowIntensity || 0.7;
                const earthGroup = this.planetManager.getPlanetByName('地球');
                if (earthGroup) {
                    const earth = earthGroup.children[0];
                    // 创建阴影平面
                    const shadowGeometry = new THREE.CircleGeometry(earth.userData.size * 2, 32);
                    const shadowMaterial = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: true,
                        opacity: shadowIntensity,
                        side: THREE.DoubleSide
                    });
                    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
                    shadow.position.copy(event.data.earthPosition);
                    shadow.lookAt(event.data.moonPosition);
                    shadow.userData.isEventHighlight = true;
                    shadow.userData.eventKey = event.key;
                    this.scene.add(shadow);
                    event.shadow = shadow;

                    // 降低太阳亮度
                    if (this.planetManager.sun) {
                        const originalColor = this.planetManager.sun.material.color.getHex();
                        event.originalSunColor = originalColor;
                        const dimmedColor = new THREE.Color(originalColor).multiplyScalar(0.3);
                        this.planetManager.sun.material.color.copy(dimmedColor);
                    }
                }
            }
        } else if (event.type === 'lunar_eclipse') {
            // 月食视觉效果
            const showHighlight = Config.events?.lunarEclipse?.showHighlight !== false;
            if (showHighlight) {
                const darkenIntensity = Config.events?.lunarEclipse?.darkenIntensity || 0.6;
                const moon = this.planetManager.getEarthMoon();
                if (moon) {
                    // 保存原始颜色
                    const originalColor = moon.material.color.getHex();
                    event.originalMoonColor = originalColor;
                    // 变暗月球
                    const darkenedColor = new THREE.Color(originalColor).multiplyScalar(1 - darkenIntensity);
                    moon.material.color.copy(darkenedColor);
                    event.moon = moon;
                }
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
            if (event.shadow) {
                this.scene.remove(event.shadow);
            }
            
            // 恢复太阳亮度（日食）
            if (event.type === 'solar_eclipse' && event.originalSunColor !== undefined && this.planetManager.sun) {
                this.planetManager.sun.material.color.setHex(event.originalSunColor);
            }
            
            // 恢复月球颜色（月食）
            if (event.type === 'lunar_eclipse' && event.originalMoonColor !== undefined && event.moon) {
                event.moon.material.color.setHex(event.originalMoonColor);
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
            case 'solar_eclipse':
                title = '日食发生！';
                message = `正在发生${event.data.type}，月球遮挡了太阳`;
                break;
            case 'lunar_eclipse':
                title = '月食发生！';
                message = `正在发生${event.data.type}，地球的阴影遮挡了月球`;
                break;
            case 'meteor_shower':
                title = '流星雨高峰期！';
                message = `${event.data.name}正在发生：${event.data.description}`;
                break;
        }

        this.notificationQueue.push({ title, message, timestamp: Date.now() });
        
        // 检查配置是否显示通知
        let eventConfigKey = event.type;
        if (event.type === 'comet_approach') {
            eventConfigKey = 'cometApproach';
        } else if (event.type === 'solar_eclipse') {
            eventConfigKey = 'solarEclipse';
        } else if (event.type === 'lunar_eclipse') {
            eventConfigKey = 'lunarEclipse';
        } else if (event.type === 'meteor_shower') {
            eventConfigKey = 'meteorShower';
        }
        
        const eventConfig = Config.events?.[eventConfigKey];
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
        // 清理过期事件（日食和月食持续时间更长）
        this.activeEvents = this.activeEvents.filter(event => {
            const age = Date.now() - event.timestamp;
            const maxAge = (event.type === 'solar_eclipse' || event.type === 'lunar_eclipse') ? 10000 : 5000;
            return age < maxAge;
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

        // 检测日食
        const solarEclipseFreq = Config.events?.solarEclipse?.checkFrequency || 0.2;
        if (Math.random() < solarEclipseFreq) {
            this.checkSolarEclipse();
        }

        // 检测月食
        const lunarEclipseFreq = Config.events?.lunarEclipse?.checkFrequency || 0.2;
        if (Math.random() < lunarEclipseFreq) {
            this.checkLunarEclipse();
        }

        // 检测流星雨
        const meteorShowerFreq = Config.events?.meteorShower?.checkFrequency || 0.01;
        if (Math.random() < meteorShowerFreq) {
            this.checkMeteorShower();
        }
    }

    // 检测流星雨（基于模拟时间）
    checkMeteorShower() {
        // 检查配置是否启用
        if (!Config.events || !Config.events.meteorShower || !Config.events.meteorShower.enabled) {
            return;
        }

        // 如果没有uiController，无法获取模拟时间
        if (!this.uiController) {
            return;
        }

        // 获取当前模拟时间（天数）
        const simulationDays = this.uiController.simulationTime || 0;
        
        // 将模拟天数转换为日期（假设从1月1日开始）
        // 简化处理：将天数转换为月份和日期
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let remainingDays = Math.floor(simulationDays) % 365; // 一年内的天数
        let month = 1;
        let day = 1;
        
        for (let i = 0; i < 12; i++) {
            if (remainingDays < daysInMonth[i]) {
                month = i + 1;
                day = remainingDays + 1;
                break;
            }
            remainingDays -= daysInMonth[i];
        }

        // 检查是否在某个流星雨的时间范围内
        for (const shower of Config.meteorShowerData) {
            const peakMonth = shower.peakDate.month;
            const peakDay = shower.peakDate.day;
            const duration = shower.duration || 7;
            
            // 计算流星雨的开始和结束日期
            const startDay = peakDay - Math.floor(duration / 2);
            const endDay = peakDay + Math.floor(duration / 2);
            
            // 检查当前日期是否在流星雨期间
            let isInShower = false;
            
            // 计算当前日期在一年中的天数
            let currentDayOfYear = 0;
            for (let i = 0; i < month - 1; i++) {
                currentDayOfYear += daysInMonth[i];
            }
            currentDayOfYear += day;
            
            // 计算流星雨峰值日期在一年中的天数
            let peakDayOfYear = 0;
            for (let i = 0; i < peakMonth - 1; i++) {
                peakDayOfYear += daysInMonth[i];
            }
            peakDayOfYear += peakDay;
            
            // 计算流星雨开始和结束日期
            const startDayOfYear = peakDayOfYear - Math.floor(duration / 2);
            const endDayOfYear = peakDayOfYear + Math.floor(duration / 2);
            
            // 处理跨年情况
            if (startDayOfYear < 0) {
                // 流星雨从上一年的末尾开始
                const actualStart = 365 + startDayOfYear;
                isInShower = currentDayOfYear >= actualStart || currentDayOfYear <= endDayOfYear;
            } else if (endDayOfYear > 365) {
                // 流星雨延续到下一年的开始
                const actualEnd = endDayOfYear - 365;
                isInShower = currentDayOfYear >= startDayOfYear || currentDayOfYear <= actualEnd;
            } else {
                // 正常情况
                isInShower = currentDayOfYear >= startDayOfYear && currentDayOfYear <= endDayOfYear;
            }
            
            // 如果检测到流星雨且当前没有活跃的流星雨
            if (isInShower && this.activeMeteorShower?.name !== shower.name) {
                // 激活流星雨模式
                if (this.meteorManager) {
                    this.meteorManager.setMeteorShowerMode(true, shower);
                }
                
                // 触发流星雨事件
                const eventKey = `meteor_shower_${shower.name}`;
                const existingEvent = this.activeEvents.find(e => e.key === eventKey);
                
                if (!existingEvent) {
                    this.activeMeteorShower = shower;
                    this.triggerEvent('meteor_shower', {
                        name: shower.name,
                        description: shower.description,
                        radiant: shower.radiant,
                        color: shower.color
                    }, eventKey);
                    
                    // 流星雨持续时间（从配置中获取）
                    const duration = Config.events?.meteorShower?.duration || 30000;
                    setTimeout(() => {
                        // 停止流星雨模式
                        if (this.meteorManager) {
                            this.meteorManager.setMeteorShowerMode(false);
                        }
                        this.activeMeteorShower = null;
                        this.removeEvent(eventKey);
                    }, duration);
                }
                break; // 只激活一个流星雨
            } else if (!isInShower && this.activeMeteorShower?.name === shower.name) {
                // 如果不在流星雨期间，停止流星雨模式
                if (this.meteorManager) {
                    this.meteorManager.setMeteorShowerMode(false);
                }
                this.activeMeteorShower = null;
            }
        }
    }

    // 获取事件历史
    getEventHistory() {
        return this.eventHistory.slice(-10); // 返回最近10个事件
    }
}

