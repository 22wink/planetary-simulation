// UI控制模块 - 负责用户界面和交互
class UIController {
    constructor(cameraController, planetManager, animationController, eventManager = null, visualizationManager = null) {
        this.cameraController = cameraController;
        this.planetManager = planetManager;
        this.animationController = animationController;
        this.eventManager = eventManager;
        this.visualizationManager = visualizationManager;
        this.selectedPlanet = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.simulationTime = 0; // 模拟时间（天）
        this.lastUpdateTime = Date.now();
    }

    init(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        
        // 创建控制面板
        this.createControlPanel();
        
        // 添加鼠标事件
        renderer.domElement.addEventListener('click', (e) => this.onPlanetClick(e), false);
        renderer.domElement.addEventListener('dblclick', (e) => this.onPlanetDoubleClick(e), false);
        renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        
        // 添加键盘快捷键
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        
        // 双击时间跟踪
        this.lastClickTime = 0;
        this.lastClickTarget = null;
    }

    createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'control-panel';
        
        // 创建所有行星按钮（包括太阳和所有8个行星）
        const allPlanets = ['太阳', ...Config.planetData.map(p => p.name)];
        const planetButtons = allPlanets.map(name => 
            `<button class="view-btn" data-planet="${name}">${name}</button>`
        ).join('');

        // 创建卫星按钮
        let moonButtons = '';
        if (Config.moonData) {
            Object.keys(Config.moonData).forEach(planetName => {
                Config.moonData[planetName].forEach(moon => {
                    moonButtons += `<button class="view-btn moon-btn" data-moon="${moon.name}">${moon.name}</button>`;
                });
            });
        }

        panel.innerHTML = `
            <div class="control-group">
                <h3>时间控制</h3>
                <button id="pause-btn">暂停</button>
                <button id="slow-btn">减速</button>
                <button id="normal-btn">正常</button>
                <button id="fast-btn">加速</button>
                <div class="time-scale">速度: <span id="time-scale-value">1.0x</span></div>
                <div class="time-jump-control">
                    <label>时间跳跃:</label>
                    <div class="time-slider-container">
                        <input type="range" id="time-jump-slider" min="0" max="365" value="0" step="1">
                        <div id="time-slider-marks" class="time-slider-marks"></div>
                    </div>
                    <span id="time-jump-value">0 天</span>
                    <button id="jump-time-btn">跳转</button>
                    <div class="preset-time-buttons">
                        <button class="preset-time-btn" data-days="0">年初</button>
                        <button class="preset-time-btn" data-days="79">春分</button>
                        <button class="preset-time-btn" data-days="172">夏至</button>
                        <button class="preset-time-btn" data-days="266">秋分</button>
                        <button class="preset-time-btn" data-days="355">冬至</button>
                    </div>
                </div>
            </div>
            <div class="control-group">
                <h3>聚焦视角 - 行星</h3>
                ${planetButtons}
            </div>
            ${moonButtons ? `
            <div class="control-group">
                <h3>聚焦视角 - 卫星</h3>
                ${moonButtons}
            </div>
            ` : ''}
            <div class="control-group">
                <button id="cancel-focus-btn">取消聚焦</button>
            </div>
            ${this.eventManager ? `
            <div class="control-group">
                <h3>事件历史</h3>
                <button id="show-events-btn">查看事件历史</button>
            </div>
            ` : ''}
            ${this.visualizationManager ? `
            <div class="control-group">
                <h3>可视化增强</h3>
                <label class="toggle-label">
                    <input type="checkbox" id="gravity-field-toggle">
                    <span>引力场线</span>
                </label>
                <label class="toggle-label">
                    <input type="checkbox" id="orbit-prediction-toggle">
                    <span>轨道预测路径</span>
                </label>
                <label class="toggle-label">
                    <input type="checkbox" id="constellations-toggle">
                    <span>星座连线</span>
                </label>
                <label class="toggle-label">
                    <input type="checkbox" id="planet-textures-toggle">
                    <span>行星纹理</span>
                </label>
            </div>
            ` : ''}
        `;
        document.body.appendChild(panel);
        
        // 绑定事件
        this.bindControlEvents();
        
        // 创建事件历史面板（隐藏）
        if (this.eventManager) {
            this.createEventHistoryPanel();
        }
    }

    bindControlEvents() {
        // 暂停/继续按钮
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.animationController.togglePause();
            document.getElementById('pause-btn').textContent = 
                this.animationController.isPaused ? '继续' : '暂停';
        });
        
        // 速度控制按钮
        document.getElementById('slow-btn').addEventListener('click', () => {
            this.animationController.setTimeScale(0.5);
            this.updateTimeScaleDisplay();
        });
        
        document.getElementById('normal-btn').addEventListener('click', () => {
            this.animationController.setTimeScale(1.0);
            this.updateTimeScaleDisplay();
        });
        
        document.getElementById('fast-btn').addEventListener('click', () => {
            this.animationController.setTimeScale(2.0);
            this.updateTimeScaleDisplay();
        });
        
        // 聚焦按钮（行星）
        document.querySelectorAll('.view-btn[data-planet]').forEach(btn => {
            btn.addEventListener('click', () => {
                const planetName = btn.getAttribute('data-planet');
                this.cameraController.focusOnPlanet(planetName, this.planetManager);
            });
        });
        
        // 聚焦按钮（卫星）
        document.querySelectorAll('.moon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const moonName = btn.getAttribute('data-moon');
                this.cameraController.focusOnMoon(moonName, this.planetManager);
            });
        });
        
        // 取消聚焦按钮
        document.getElementById('cancel-focus-btn').addEventListener('click', () => {
            this.cameraController.cancelFocus();
        });
        
        // 显示事件历史按钮
        if (this.eventManager) {
            const showEventsBtn = document.getElementById('show-events-btn');
            if (showEventsBtn) {
                showEventsBtn.addEventListener('click', () => {
                    this.toggleEventHistory();
                });
            }
        }
        
        // 时间跳跃滑块
        const timeJumpSlider = document.getElementById('time-jump-slider');
        const timeJumpValue = document.getElementById('time-jump-value');
        const jumpTimeBtn = document.getElementById('jump-time-btn');
        
        if (timeJumpSlider) {
            timeJumpSlider.addEventListener('input', (e) => {
                timeJumpValue.textContent = e.target.value + ' 天';
            });
        }
        
        if (jumpTimeBtn) {
            jumpTimeBtn.addEventListener('click', () => {
                const days = parseFloat(timeJumpSlider.value);
                this.jumpToTime(days);
            });
        }
        
        // 预设时间点按钮
        document.querySelectorAll('.preset-time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.getAttribute('data-days'));
                if (timeJumpSlider) {
                    timeJumpSlider.value = days;
                    timeJumpValue.textContent = days + ' 天';
                    this.jumpToTime(days);
                }
            });
        });
        
        // 初始化时间轴事件标记
        this.updateTimeSliderMarks();
        
        // 可视化增强控制
        if (this.visualizationManager) {
            const gravityFieldToggle = document.getElementById('gravity-field-toggle');
            const orbitPredictionToggle = document.getElementById('orbit-prediction-toggle');
            const constellationsToggle = document.getElementById('constellations-toggle');
            const planetTexturesToggle = document.getElementById('planet-textures-toggle');
            
            if (gravityFieldToggle) {
                gravityFieldToggle.addEventListener('change', (e) => {
                    this.visualizationManager.toggleGravityField(e.target.checked);
                });
            }
            
            if (orbitPredictionToggle) {
                orbitPredictionToggle.addEventListener('change', (e) => {
                    this.visualizationManager.toggleOrbitPrediction(e.target.checked);
                });
            }
            
            if (constellationsToggle) {
                constellationsToggle.addEventListener('change', (e) => {
                    this.visualizationManager.toggleConstellations(e.target.checked);
                });
            }
            
            if (planetTexturesToggle) {
                planetTexturesToggle.addEventListener('change', (e) => {
                    this.visualizationManager.togglePlanetTextures(e.target.checked);
                });
            }
        }
    }

    updateTimeScaleDisplay() {
        const value = this.animationController.timeScale;
        document.getElementById('time-scale-value').textContent = value.toFixed(1) + 'x';
    }

    onPlanetClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const planets = this.planetManager.planets.map(p => p.children[0]);
        const intersects = this.raycaster.intersectObjects(planets, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            let planet = object;
            
            // 找到行星对象（排除标签等子对象）
            while (planet.parent && !planet.userData.name) {
                planet = planet.parent;
            }
            
            if (planet.userData && planet.userData.name) {
                this.showPlanetInfo(planet.userData);
                this.selectedPlanet = planet;
                // 点击行星时也聚焦
                this.cameraController.focusOnPlanet(planet.userData.name, this.planetManager);
            }
        } else {
            this.hidePlanetInfo();
            this.selectedPlanet = null;
        }
    }

    onPlanetDoubleClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const planets = this.planetManager.planets.map(p => p.children[0]);
        const intersects = this.raycaster.intersectObjects(planets, true);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            let planet = object;
            
            // 找到行星对象
            while (planet.parent && !planet.userData.name) {
                planet = planet.parent;
            }
            
            if (planet.userData && planet.userData.name) {
                // 双击快速聚焦
                this.cameraController.focusOnPlanet(planet.userData.name, this.planetManager);
                this.showPlanetInfo(planet.userData);
                this.selectedPlanet = planet;
            }
        }
    }

    onKeyDown(event) {
        // 避免在输入框中触发快捷键
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(event.key.toLowerCase()) {
            case ' ': // 空格键 - 暂停/继续
                event.preventDefault();
                this.animationController.togglePause();
                const pauseBtn = document.getElementById('pause-btn');
                if (pauseBtn) {
                    pauseBtn.textContent = this.animationController.isPaused ? '继续' : '暂停';
                }
                break;
            case '1': // 数字1 - 减速
                this.animationController.setTimeScale(0.5);
                this.updateTimeScaleDisplay();
                break;
            case '2': // 数字2 - 正常速度
                this.animationController.setTimeScale(1.0);
                this.updateTimeScaleDisplay();
                break;
            case '3': // 数字3 - 加速
                this.animationController.setTimeScale(2.0);
                this.updateTimeScaleDisplay();
                break;
            case 'escape': // ESC - 取消聚焦
            case 'esc':
                this.cameraController.cancelFocus();
                this.hidePlanetInfo();
                this.selectedPlanet = null;
                break;
            case 'h': // H - 显示/隐藏事件历史
                if (this.eventManager) {
                    this.toggleEventHistory();
                }
                break;
            // 行星快捷键 (q=太阳, w=水星, e=金星, r=地球, t=火星, y=木星, u=土星, i=天王星, o=海王星)
            case 'q':
                this.cameraController.focusOnPlanet('太阳', this.planetManager);
                break;
            case 'w':
                this.focusPlanetByIndex(0); // 水星
                break;
            case 'e':
                this.focusPlanetByIndex(1); // 金星
                break;
            case 'r':
                this.focusPlanetByIndex(2); // 地球
                break;
            case 't':
                this.focusPlanetByIndex(3); // 火星
                break;
            case 'y':
                this.focusPlanetByIndex(4); // 木星
                break;
            case 'u':
                this.focusPlanetByIndex(5); // 土星
                break;
            case 'i':
                this.focusPlanetByIndex(6); // 天王星
                break;
            case 'o':
                this.focusPlanetByIndex(7); // 海王星
                break;
        }
    }

    focusPlanetByIndex(index) {
        if (index >= 0 && index < Config.planetData.length) {
            const planetName = Config.planetData[index].name;
            this.cameraController.focusOnPlanet(planetName, this.planetManager);
            const planet = this.planetManager.getPlanetByName(planetName);
            if (planet) {
                this.showPlanetInfo(planet.children[0].userData);
                this.selectedPlanet = planet.children[0];
            }
        }
    }

    jumpToTime(days) {
        // 计算需要跳转的角度
        const anglePerDay = 2 * Math.PI / 365; // 假设一年365天
        const targetAngle = days * anglePerDay;
        
        // 更新所有行星的角度
        this.planetManager.planets.forEach((planetGroup) => {
            const planet = planetGroup.children[0];
            const data = planet.userData;
            data.angle = targetAngle * (data.speed / Config.planetData[0].speed); // 根据速度比例调整
            planetGroup.rotation.y = data.angle;
        });
        
        // 更新模拟时间
        this.simulationTime = days;
        
        // 更新小行星带
        this.planetManager.asteroidBelt.forEach((asteroid) => {
            asteroid.userData.angle = targetAngle * (asteroid.userData.orbitSpeed / Config.planetData[0].speed);
            const radius = asteroid.userData.radius;
            asteroid.position.x = Math.cos(asteroid.userData.angle) * radius;
            asteroid.position.z = Math.sin(asteroid.userData.angle) * radius;
        });
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const planets = this.planetManager.planets.map(p => p.children[0]);
        const intersects = this.raycaster.intersectObjects(planets, true);
        
        if (intersects.length > 0) {
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    showPlanetInfo(planetData) {
        const infoPanel = document.getElementById('planet-info');
        if (infoPanel) {
            const info = Config.planetInfo[planetData.name] || '';
            
            // 计算到最近行星的距离
            const nearestPlanet = this.getNearestPlanet(planetData.name);
            const distanceToNearest = nearestPlanet ? nearestPlanet.distance : null;
            
            // 计算相对速度（相对于太阳）
            const relativeSpeed = this.calculateRelativeSpeed(planetData);
            
            // 计算行星相位（仅对内行星）
            const phase = this.calculatePlanetPhase(planetData.name);
            
            // 更新模拟时间
            this.updateSimulationTime();
            
            infoPanel.innerHTML = `
                <h2>${planetData.name}</h2>
                <div class="info-section">
                    <h3>基本信息</h3>
                    <p><strong>轨道距离:</strong> ${planetData.distance.toFixed(1)} 单位</p>
                    <p><strong>公转速度:</strong> ${(planetData.speed * 100).toFixed(3)}</p>
                    <p><strong>自转速度:</strong> ${(planetData.rotationSpeed * 100).toFixed(3)}</p>
                    ${relativeSpeed !== null ? `<p><strong>相对速度:</strong> ${relativeSpeed.toFixed(2)} 单位/帧</p>` : ''}
                </div>
                ${distanceToNearest ? `
                <div class="info-section">
                    <h3>距离信息</h3>
                    <p><strong>最近行星:</strong> ${nearestPlanet.name}</p>
                    <p><strong>距离:</strong> ${distanceToNearest.toFixed(1)} 单位</p>
                </div>
                ` : ''}
                ${phase !== null ? `
                <div class="info-section">
                    <h3>相位</h3>
                    <p><strong>当前相位:</strong> ${phase.name}</p>
                    <p><strong>相位角度:</strong> ${phase.angle.toFixed(1)}°</p>
                </div>
                ` : ''}
                <div class="info-section">
                    <h3>模拟时间</h3>
                    <p><strong>模拟天数:</strong> ${this.simulationTime.toFixed(1)} 天</p>
                    <p><strong>时间缩放:</strong> ${this.animationController.timeScale.toFixed(1)}x</p>
                    <p><strong>状态:</strong> ${this.animationController.isPaused ? '暂停' : '运行中'}</p>
                </div>
                ${info ? `<div class="info-section"><p>${info}</p></div>` : ''}
            `;
            infoPanel.style.display = 'block';
            
            // 定期更新信息（每秒更新一次）
            if (this.infoUpdateInterval) {
                clearInterval(this.infoUpdateInterval);
            }
            this.infoUpdateInterval = setInterval(() => {
                if (this.selectedPlanet) {
                    this.showPlanetInfo(this.selectedPlanet.userData);
                }
            }, 1000);
        }
    }

    getNearestPlanet(planetName) {
        const currentPos = this.planetManager.getPlanetWorldPosition(planetName);
        if (!currentPos) return null;

        let nearest = null;
        let minDistance = Infinity;

        Config.planetData.forEach(data => {
            if (data.name === planetName) return;
            const otherPos = this.planetManager.getPlanetWorldPosition(data.name);
            if (otherPos) {
                const distance = currentPos.distanceTo(otherPos);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = { name: data.name, distance: distance };
                }
            }
        });

        return nearest;
    }

    calculateRelativeSpeed(planetData) {
        // 简化的相对速度计算（基于轨道速度）
        return planetData.speed * planetData.distance;
    }

    calculatePlanetPhase(planetName) {
        // 只计算内行星（水星、金星）的相位
        if (planetName !== '水星' && planetName !== '金星') {
            return null;
        }

        const planetPos = this.planetManager.getPlanetWorldPosition(planetName);
        const sunPos = this.planetManager.sun ? this.planetManager.sun.position : new THREE.Vector3(0, 0, 0);
        
        if (!planetPos) return null;

        // 计算行星相对于太阳的角度
        const direction = new THREE.Vector3().subVectors(planetPos, sunPos).normalize();
        const angle = Math.atan2(direction.z, direction.x) * (180 / Math.PI);
        const normalizedAngle = ((angle + 180) % 360);

        // 根据角度确定相位
        let phaseName = '';
        if (normalizedAngle < 45 || normalizedAngle > 315) {
            phaseName = '上合（在太阳后方）';
        } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
            phaseName = '东大距';
        } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
            phaseName = '下合（在太阳前方）';
        } else {
            phaseName = '西大距';
        }

        return {
            name: phaseName,
            angle: normalizedAngle
        };
    }

    updateSimulationTime() {
        const now = Date.now();
        const delta = (now - this.lastUpdateTime) / 1000; // 转换为秒
        if (!this.animationController.isPaused) {
            this.simulationTime += delta * this.animationController.timeScale * 0.1; // 缩放因子
        }
        this.lastUpdateTime = now;
    }

    hidePlanetInfo() {
        const infoPanel = document.getElementById('planet-info');
        if (infoPanel) {
            infoPanel.style.display = 'none';
        }
        if (this.infoUpdateInterval) {
            clearInterval(this.infoUpdateInterval);
            this.infoUpdateInterval = null;
        }
    }

    createEventHistoryPanel() {
        const panel = document.createElement('div');
        panel.id = 'event-history-panel';
        panel.className = 'event-history-panel';
        panel.innerHTML = `
            <div class="event-history-header">
                <h3>事件历史</h3>
                <button id="close-events-btn">×</button>
            </div>
            <div class="event-history-content" id="event-history-content">
                <p class="no-events">暂无事件记录</p>
            </div>
        `;
        document.body.appendChild(panel);
        
        // 关闭按钮
        document.getElementById('close-events-btn').addEventListener('click', () => {
            this.toggleEventHistory();
        });
    }

    toggleEventHistory() {
        const panel = document.getElementById('event-history-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            this.updateEventHistory();
        } else {
            panel.style.display = 'none';
        }
    }

    updateEventHistory() {
        if (!this.eventManager) return;
        
        const content = document.getElementById('event-history-content');
        if (!content) return;
        
        const history = this.eventManager.getEventHistory();
        
        if (history.length === 0) {
            content.innerHTML = '<p class="no-events">暂无事件记录</p>';
            // 清空时间轴标记
            this.updateTimeSliderMarks();
            return;
        }
        
        // 按时间倒序排列
        const sortedHistory = history.slice().reverse();
        
        content.innerHTML = sortedHistory.map(event => {
            const date = new Date(event.timestamp);
            const timeStr = date.toLocaleTimeString('zh-CN');
            
            let eventTypeName = '';
            let eventDescription = '';
            
            switch (event.type) {
                case 'alignment':
                    eventTypeName = '行星对齐';
                    eventDescription = event.data.planets ? event.data.planets.join('、') + ' 接近一条直线' : '多颗行星对齐';
                    break;
                case 'conjunction':
                    eventTypeName = '行星会合';
                    eventDescription = `${event.data.planet1} 和 ${event.data.planet2} 非常接近`;
                    break;
                case 'comet_approach':
                    eventTypeName = '彗星接近';
                    eventDescription = `${event.data.cometName} 正在接近太阳`;
                    break;
                default:
                    eventTypeName = '未知事件';
                    eventDescription = '未知事件类型';
            }
            
            return `
                <div class="event-item">
                    <div class="event-header">
                        <span class="event-type">${eventTypeName}</span>
                        <span class="event-time">${timeStr}</span>
                    </div>
                    <div class="event-description">${eventDescription}</div>
                </div>
            `;
        }).join('');
        
        // 更新时间轴标记
        this.updateTimeSliderMarks();
    }

    // 更新时间轴上的事件标记
    updateTimeSliderMarks() {
        if (!this.eventManager) return;
        
        const marksContainer = document.getElementById('time-slider-marks');
        if (!marksContainer) return;
        
        const history = this.eventManager.getEventHistory();
        if (history.length === 0) {
            marksContainer.innerHTML = '';
            return;
        }
        
        // 获取滑块范围
        const timeJumpSlider = document.getElementById('time-jump-slider');
        if (!timeJumpSlider) return;
        
        const maxDays = parseFloat(timeJumpSlider.max) || 365;
        
        // 清空现有标记
        marksContainer.innerHTML = '';
        
        // 为每个事件创建标记
        // 由于事件历史中没有记录模拟时间，我们使用时间戳来估算位置
        // 这里简化处理：将事件按时间戳排序，均匀分布在时间轴上
        const sortedHistory = history.slice().sort((a, b) => a.timestamp - b.timestamp);
        const totalEvents = sortedHistory.length;
        
        sortedHistory.forEach((event, index) => {
            // 将事件均匀分布在时间轴上（简化方案）
            // 或者可以根据事件类型使用不同颜色
            const position = ((index + 1) / (totalEvents + 1)) * 100;
            
            let eventColor = '#00ff00'; // 默认绿色
            let eventTitle = '';
            
            switch (event.type) {
                case 'alignment':
                    eventColor = '#ffff00'; // 黄色
                    eventTitle = '行星对齐';
                    break;
                case 'conjunction':
                    eventColor = '#00ffff'; // 青色
                    eventTitle = '行星会合';
                    break;
                case 'comet_approach':
                    eventColor = '#ff00ff'; // 紫色
                    eventTitle = '彗星接近';
                    break;
                default:
                    eventTitle = '事件';
            }
            
            const mark = document.createElement('div');
            mark.className = 'time-slider-mark';
            mark.style.left = `${position}%`;
            mark.style.backgroundColor = eventColor;
            mark.title = eventTitle;
            
            // 点击标记可以跳转到该位置
            mark.addEventListener('click', () => {
                const days = (position / 100) * maxDays;
                if (timeJumpSlider) {
                    timeJumpSlider.value = days;
                    const timeJumpValue = document.getElementById('time-jump-value');
                    if (timeJumpValue) {
                        timeJumpValue.textContent = days.toFixed(0) + ' 天';
                    }
                    this.jumpToTime(days);
                }
            });
            
            marksContainer.appendChild(mark);
        });
    }
}

