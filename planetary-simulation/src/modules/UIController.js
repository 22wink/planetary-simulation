// UI控制模块 - 负责用户界面和交互
class UIController {
    constructor(cameraController, planetManager, animationController, eventManager = null, visualizationManager = null, missionManager = null) {
        this.cameraController = cameraController;
        this.planetManager = planetManager;
        this.animationController = animationController;
        this.eventManager = eventManager;
        this.visualizationManager = visualizationManager;
        this.missionManager = missionManager;
        this.selectedPlanet = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.simulationTime = 0; // 模拟时间（天）
        this.lastUpdateTime = Date.now();
        
        // 图表数据存储
        this.chartData = {
            distances: {}, // { planetName: [{time, value}, ...] }
            velocities: {}, // { planetName: [{time, value}, ...] }
            maxDataPoints: 100 // 保留最近100个数据点
        };
        this.chartUpdateInterval = null;
        
        // 统计数据
        this.statistics = {
            startTime: Date.now(), // 开始运行时间
            totalEvents: 0, // 总事件数
            cometCount: 0, // 观察到的彗星数量
            planetRevolutions: {} // 每个行星的公转圈数 { planetName: count }
        };
    }

    init(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        
        // 初始化术语管理器
        this.terminologyManager = new TerminologyManager();
        
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
                <button id="show-timeline-btn">历史事件时间线</button>
            </div>
            ` : ''}
            <div class="control-group">
                <h3>数据可视化</h3>
                <button id="show-charts-btn">实时数据图表</button>
                <button id="show-stats-btn">统计面板</button>
            </div>
            <div class="control-group">
                <h3>工具</h3>
                <button id="screenshot-btn">📷 截图</button>
            </div>
            ${this.missionManager ? `
            <div class="control-group">
                <h3>太空探测器</h3>
                <label class="toggle-label">
                    <input type="checkbox" id="missions-toggle" checked>
                    <span>显示探测器</span>
                </label>
                <button id="show-missions-btn">探测器信息</button>
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
        
        // 创建独立的隐藏/显示按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggle-panel-btn';
        toggleBtn.textContent = '−';
        toggleBtn.title = '隐藏控制面板';
        toggleBtn.classList.add('in-panel'); // 初始状态在面板内
        panel.appendChild(toggleBtn); // 将按钮添加到面板内
        toggleBtn.addEventListener('click', () => {
            this.toggleControlPanel();
        });
        
        // 绑定事件
        this.bindControlEvents();
        
        // 创建事件历史面板（隐藏）
        if (this.eventManager) {
            this.createEventHistoryPanel();
            this.createHistoricalTimelinePanel();
        }
        
        // 创建数据图表面板
        this.createDataChartsPanel();
        
        // 创建统计面板
        this.createStatisticsPanel();
    }
    
    toggleControlPanel() {
        const panel = document.getElementById('control-panel');
        const toggleBtn = document.getElementById('toggle-panel-btn');
        if (!panel || !toggleBtn) return;
        
        const isHidden = panel.classList.contains('hidden');
        if (isHidden) {
            panel.classList.remove('hidden');
            toggleBtn.textContent = '−';
            toggleBtn.title = '隐藏控制面板';
            toggleBtn.classList.add('in-panel');
            // 将按钮移回面板内
            panel.appendChild(toggleBtn);
        } else {
            panel.classList.add('hidden');
            toggleBtn.textContent = '+';
            toggleBtn.title = '显示控制面板';
            toggleBtn.classList.remove('in-panel');
            // 将按钮移到body，使其在面板隐藏时仍然可见
            document.body.appendChild(toggleBtn);
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
            
            // 显示历史事件时间线按钮
            const showTimelineBtn = document.getElementById('show-timeline-btn');
            if (showTimelineBtn) {
                showTimelineBtn.addEventListener('click', () => {
                    this.toggleHistoricalTimeline();
                });
            }
        }
        
        // 显示数据图表按钮
        const showChartsBtn = document.getElementById('show-charts-btn');
        if (showChartsBtn) {
            showChartsBtn.addEventListener('click', () => {
                this.toggleDataCharts();
            });
        }
        
        // 显示统计面板按钮
        const showStatsBtn = document.getElementById('show-stats-btn');
        if (showStatsBtn) {
            showStatsBtn.addEventListener('click', () => {
                this.toggleStatisticsPanel();
            });
        }
        
        // 截图按钮
        const screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                this.takeScreenshot();
            });
        }
        
        // 探测器相关按钮
        if (this.missionManager) {
            // 显示/隐藏探测器
            const missionsToggle = document.getElementById('missions-toggle');
            if (missionsToggle) {
                missionsToggle.addEventListener('change', (e) => {
                    this.missionManager.toggleMissions(e.target.checked);
                });
            }
            
            // 显示探测器信息
            const showMissionsBtn = document.getElementById('show-missions-btn');
            if (showMissionsBtn) {
                showMissionsBtn.addEventListener('click', () => {
                    this.toggleMissionsPanel();
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
            case 'c': // C - 显示/隐藏控制面板
                this.toggleControlPanel();
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
        
        // 更新小行星带（使用新的轨道参数）
        this.planetManager.asteroidBelt.forEach((asteroid) => {
            const data = asteroid.userData;
            if (data.semiMajorAxis) {
                // 新轨道系统：更新真近点角
                const speedRatio = data.speed / Config.planetData[0].speed;
                data.trueAnomaly = targetAngle * speedRatio;
                
                // 使用开普勒轨道方程计算位置
                const r = data.semiMajorAxis * (1 - data.eccentricity * data.eccentricity) / 
                         (1 + data.eccentricity * Math.cos(data.trueAnomaly));
                
                // 应用轨道倾角和升交点经度
                const cosInclination = Math.cos(data.inclination);
                const sinInclination = Math.sin(data.inclination);
                const cosNode = Math.cos(data.longitudeOfAscendingNode);
                const sinNode = Math.sin(data.longitudeOfAscendingNode);
                const cosAnomaly = Math.cos(data.trueAnomaly + data.argumentOfPeriapsis);
                const sinAnomaly = Math.sin(data.trueAnomaly + data.argumentOfPeriapsis);
                
                const xOrbital = r * cosAnomaly;
                const yOrbital = r * sinAnomaly;
                
                asteroid.position.x = xOrbital * cosNode - yOrbital * sinNode * cosInclination;
                asteroid.position.y = yOrbital * sinInclination;
                asteroid.position.z = xOrbital * sinNode + yOrbital * cosNode * cosInclination;
            } else {
                // 兼容旧系统（如果还有旧数据）
                data.angle = targetAngle * (data.orbitSpeed / Config.planetData[0].speed);
                const radius = data.radius;
                asteroid.position.x = Math.cos(data.angle) * radius;
                asteroid.position.z = Math.sin(data.angle) * radius;
            }
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
            const detailedData = Config.planetDetailedData?.[planetData.name];
            
            // 计算到最近行星的距离
            const nearestPlanet = this.getNearestPlanet(planetData.name);
            const distanceToNearest = nearestPlanet ? nearestPlanet.distance : null;
            
            // 计算相对速度（相对于太阳）
            const relativeSpeed = this.calculateRelativeSpeed(planetData);
            
            // 计算行星相位（仅对内行星）
            const phase = this.calculatePlanetPhase(planetData.name);
            
            // 更新模拟时间
            this.updateSimulationTime();
            
            // 构建详细信息HTML
            let detailedInfoHTML = '';
            if (detailedData) {
                detailedInfoHTML = `
                    <div class="info-section detailed-data">
                        <h3>科学数据</h3>
                        <p><strong>质量:</strong> ${detailedData.mass}</p>
                        <p><strong>体积:</strong> ${detailedData.volume}</p>
                        <p><strong>密度:</strong> ${detailedData.density}</p>
                        <p><strong>表面温度:</strong> ${detailedData.surfaceTemp}</p>
                        <p><strong>大气成分:</strong> ${detailedData.atmosphere}</p>
                    <p><strong><span data-term="轨道周期">公转周期</span>:</strong> ${detailedData.orbitalPeriod}</p>
                    <p><strong><span data-term="自转周期">自转周期</span>:</strong> ${detailedData.rotationPeriod}</p>
                        <p><strong>卫星数量:</strong> ${detailedData.moons}</p>
                    </div>
                    ${detailedData.facts && detailedData.facts.length > 0 ? `
                    <div class="info-section facts">
                        <h3>有趣事实</h3>
                        <ul>
                            ${detailedData.facts.map(fact => `<li>${fact}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${detailedData.missions && detailedData.missions.length > 0 ? `
                    <div class="info-section missions">
                        <h3>探索任务</h3>
                        <div class="missions-list">
                            ${detailedData.missions.map(mission => `
                                <div class="mission-item">
                                    <strong>${mission.name}</strong> (${mission.year})
                                    <p class="mission-desc">${mission.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                `;
            }
            
            infoPanel.innerHTML = `
                <h2>${planetData.name}</h2>
                <div class="info-section">
                    <h3>基本信息</h3>
                    <p><strong>轨道距离:</strong> ${planetData.distance.toFixed(1)} 单位</p>
                    <p><strong><span data-term="公转">公转</span>速度:</strong> ${(planetData.speed * 100).toFixed(3)}</p>
                    <p><strong><span data-term="自转">自转</span>速度:</strong> ${(planetData.rotationSpeed * 100).toFixed(3)}</p>
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
                ${detailedInfoHTML}
                <div class="info-section">
                    <h3>模拟时间</h3>
                    <p><strong>模拟天数:</strong> ${this.simulationTime.toFixed(1)} 天</p>
                    <p><strong>时间缩放:</strong> ${this.animationController.timeScale.toFixed(1)}x</p>
                    <p><strong>状态:</strong> ${this.animationController.isPaused ? '暂停' : '运行中'}</p>
                </div>
                ${info ? `<div class="info-section"><p>${info}</p></div>` : ''}
            `;
            infoPanel.style.display = 'block';
            
            // 添加术语提示
            if (this.terminologyManager) {
                const termElements = infoPanel.querySelectorAll('[data-term]');
                termElements.forEach(el => {
                    const term = el.getAttribute('data-term');
                    this.terminologyManager.addTerminology(el, term);
                });
            }
            
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

    // 创建历史事件时间线面板
    createHistoricalTimelinePanel() {
        const panel = document.createElement('div');
        panel.id = 'historical-timeline-panel';
        panel.className = 'historical-timeline-panel';
        panel.innerHTML = `
            <div class="timeline-header">
                <h3>历史事件时间线</h3>
                <button id="close-timeline-btn">×</button>
            </div>
            <div class="timeline-content" id="timeline-content">
                <p class="no-events">加载中...</p>
            </div>
        `;
        document.body.appendChild(panel);
        
        // 关闭按钮
        document.getElementById('close-timeline-btn').addEventListener('click', () => {
            this.toggleHistoricalTimeline();
        });
    }

    toggleHistoricalTimeline() {
        const panel = document.getElementById('historical-timeline-panel');
        if (!panel) return;
        
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            this.updateHistoricalTimeline();
        } else {
            panel.style.display = 'none';
        }
    }

    updateHistoricalTimeline() {
        const content = document.getElementById('timeline-content');
        if (!content) return;
        
        if (!Config.historicalEvents || Config.historicalEvents.length === 0) {
            content.innerHTML = '<p class="no-events">暂无历史事件</p>';
            return;
        }
        
        // 按日期排序
        const sortedEvents = Config.historicalEvents.slice().sort((a, b) => {
            const dateA = new Date(a.date.year, a.date.month - 1, a.date.day);
            const dateB = new Date(b.date.year, b.date.month - 1, b.date.day);
            return dateA - dateB;
        });
        
        content.innerHTML = sortedEvents.map(event => {
            const dateStr = `${event.date.year}年${event.date.month}月${event.date.day}日`;
            const typeNames = {
                'comet': '彗星',
                'mission': '太空任务',
                'conjunction': '合相'
            };
            const typeName = typeNames[event.type] || '其他';
            
            return `
                <div class="timeline-event" data-year="${event.date.year}" data-month="${event.date.month}" data-day="${event.date.day}">
                    <div class="timeline-event-header">
                        <span class="timeline-event-type" style="color: ${event.color}">${typeName}</span>
                        <span class="timeline-event-date">${dateStr}</span>
                    </div>
                    <div class="timeline-event-name" style="color: ${event.color}">${event.name}</div>
                    <div class="timeline-event-description">${event.description}</div>
                    <button class="timeline-jump-btn" data-year="${event.date.year}" data-month="${event.date.month}" data-day="${event.date.day}">
                        跳转到此时间
                    </button>
                </div>
            `;
        }).join('');
        
        // 绑定跳转按钮
        content.querySelectorAll('.timeline-jump-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const year = parseInt(btn.getAttribute('data-year'));
                const month = parseInt(btn.getAttribute('data-month'));
                const day = parseInt(btn.getAttribute('data-day'));
                this.jumpToHistoricalDate(year, month, day);
            });
        });
    }

    // 跳转到历史日期（简化实现：将日期转换为一年内的天数）
    jumpToHistoricalDate(year, month, day) {
        // 计算该日期在一年中的天数（简化：假设是当前年份）
        const date = new Date(year, month - 1, day);
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
        
        // 更新滑块
        const timeJumpSlider = document.getElementById('time-jump-slider');
        const timeJumpValue = document.getElementById('time-jump-value');
        
        if (timeJumpSlider && timeJumpValue) {
            // 限制在0-365范围内
            const clampedDays = Math.max(0, Math.min(365, days));
            timeJumpSlider.value = clampedDays;
            timeJumpValue.textContent = clampedDays + ' 天';
            this.jumpToTime(clampedDays);
        }
        
        // 显示通知（使用EventManager的通知系统）
        if (this.eventManager) {
            const event = Config.historicalEvents.find(e => 
                e.date.year === year && e.date.month === month && e.date.day === day
            );
            if (event) {
                // 创建一个临时通知元素
                const notification = document.createElement('div');
                notification.className = 'event-notification show';
                notification.innerHTML = `
                    <div class="notification-content">
                        <h4>已跳转到历史事件</h4>
                        <p><strong>${event.name}</strong><br>${event.description}</p>
                    </div>
                `;
                document.body.appendChild(notification);
                
                // 3秒后移除
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }
        }
    }
    
    // 创建数据图表面板
    createDataChartsPanel() {
        const panel = document.createElement('div');
        panel.id = 'data-charts-panel';
        panel.className = 'data-charts-panel';
        panel.innerHTML = `
            <div class="charts-header">
                <h3>实时数据图表</h3>
                <button id="close-charts-btn">×</button>
            </div>
            <div class="charts-tabs">
                <button class="chart-tab active" data-chart="distance">距离图表</button>
                <button class="chart-tab" data-chart="velocity">速度图表</button>
                <button class="chart-tab" data-chart="period">轨道周期对比</button>
            </div>
            <div class="charts-content">
                <div class="chart-container">
                    <canvas id="distance-chart" width="600" height="300"></canvas>
                </div>
                <div class="chart-container" style="display: none;">
                    <canvas id="velocity-chart" width="600" height="300"></canvas>
                </div>
                <div class="chart-container" style="display: none;">
                    <canvas id="period-chart" width="600" height="300"></canvas>
                </div>
                <div class="chart-legend" id="chart-legend"></div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // 绑定关闭按钮
        const closeBtn = document.getElementById('close-charts-btn');
        closeBtn.addEventListener('click', () => {
            this.toggleDataCharts();
        });
        
        // 绑定标签切换
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const chartType = tab.getAttribute('data-chart');
                const chartIndex = chartType === 'distance' ? 0 : (chartType === 'velocity' ? 1 : 2);
                document.querySelectorAll('.chart-container').forEach((container, index) => {
                    container.style.display = (index === chartIndex) ? 'block' : 'none';
                });
                
                this.updateCharts();
            });
        });
    }
    
    // 切换数据图表显示
    toggleDataCharts() {
        const panel = document.getElementById('data-charts-panel');
        if (panel) {
            const isCurrentlyVisible = panel.style.display !== 'none' && panel.style.display !== '';
            panel.style.display = isCurrentlyVisible ? 'none' : 'block';
            
            if (!isCurrentlyVisible) {
                // 显示面板，开始更新图表
                this.startChartUpdates();
                this.updateCharts();
            } else {
                // 隐藏面板，停止更新图表
                this.stopChartUpdates();
            }
        }
    }
    
    // 开始图表数据更新
    startChartUpdates() {
        if (this.chartUpdateInterval) return;
        
        // 每0.5秒更新一次数据
        this.chartUpdateInterval = setInterval(() => {
            this.collectChartData();
            this.updateCharts();
        }, 500);
        
        // 立即收集一次数据
        this.collectChartData();
    }
    
    // 停止图表数据更新
    stopChartUpdates() {
        if (this.chartUpdateInterval) {
            clearInterval(this.chartUpdateInterval);
            this.chartUpdateInterval = null;
        }
    }
    
    // 收集图表数据
    collectChartData() {
        if (!this.planetManager || !this.planetManager.planets) return;
        
        const currentTime = this.simulationTime;
        
        this.planetManager.planets.forEach(planetGroup => {
            // planetGroup 是 THREE.Group，实际的行星 Mesh 是 children[0]
            const planet = planetGroup.children[0];
            if (!planet || !planet.userData) return;
            
            const planetName = planet.userData.name;
            if (!planetName) return;
            
            // 计算到太阳的距离
            if (this.planetManager.sun) {
                const planetWorldPos = this.planetManager.getPlanetWorldPosition(planetName);
                if (planetWorldPos) {
                    const sunWorldPos = new THREE.Vector3();
                    this.planetManager.sun.getWorldPosition(sunWorldPos);
                    const distance = planetWorldPos.distanceTo(sunWorldPos);
                    
                    // 使用场景单位（如果 Config.scale 不存在，直接使用距离值）
                    // 地球距离约为100单位，对应1 AU，所以 scale 约为 100
                    const scale = Config.scale || 100;
                    const distanceAU = distance / scale;
                    
                    if (!this.chartData.distances[planetName]) {
                        this.chartData.distances[planetName] = [];
                    }
                    this.chartData.distances[planetName].push({
                        time: currentTime,
                        value: distanceAU
                    });
                    
                    // 限制数据点数量
                    if (this.chartData.distances[planetName].length > this.chartData.maxDataPoints) {
                        this.chartData.distances[planetName].shift();
                    }
                }
            }
            
            // 计算轨道速度
            // 速度 = 角速度 * 半径
            // 从 userData 获取轨道参数
            const orbitSpeed = planet.userData.speed || 0; // 角速度（弧度/时间单位）
            const orbitDistance = planet.userData.distance || 0; // 轨道半径（场景单位）
            
            // 计算线速度：v = ω * r
            // orbitSpeed 是每单位时间（timeScale）的角速度（弧度）
            // 线速度 = 角速度 * 半径（场景单位/时间单位）
            const linearSpeed = orbitSpeed * orbitDistance;
            
            // 转换为 km/s
            // 简化处理：假设 100 场景单位 = 1 AU = 1.496×10^8 km
            // 地球：distance=100, speed=0.01，linearSpeed = 1.0 场景单位/时间单位
            // 地球实际轨道速度约 30 km/s
            // 所以转换因子约为：30 km/s / 1.0 = 30
            // 但需要考虑时间单位，这里简化处理
            const scale = Config.scale || 100;
            const kmPerAU = 1.496e8; // 1 AU = 1.496×10^8 km
            // 假设 timeScale=1 对应每秒，则速度 = (linearSpeed / scale) * kmPerAU / 1000
            // 但实际 timeScale 可能不是每秒，所以需要调整
            // 简化：使用一个经验转换因子
            const conversionFactor = 0.3; // 经验值，使地球速度约为 30 km/s
            const speedKmS = linearSpeed * conversionFactor;
            
            if (!this.chartData.velocities[planetName]) {
                this.chartData.velocities[planetName] = [];
            }
            this.chartData.velocities[planetName].push({
                time: currentTime,
                value: speedKmS
            });
            
            // 限制数据点数量
            if (this.chartData.velocities[planetName].length > this.chartData.maxDataPoints) {
                this.chartData.velocities[planetName].shift();
            }
        });
    }
    
    // 更新图表显示
    updateCharts() {
        const activeTab = document.querySelector('.chart-tab.active');
        if (!activeTab) return;
        
        const chartType = activeTab.getAttribute('data-chart');
        
        if (chartType === 'distance') {
            this.drawDistanceChart();
        } else if (chartType === 'velocity') {
            this.drawVelocityChart();
        } else if (chartType === 'period') {
            this.drawPeriodChart();
        }
    }
    
    // 绘制距离图表
    drawDistanceChart() {
        const canvas = document.getElementById('distance-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置样式
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制网格
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const y = (height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 计算数据范围
        let maxDistance = 0;
        let minDistance = Infinity;
        const allData = Object.values(this.chartData.distances);
        
        allData.forEach(dataArray => {
            dataArray.forEach(point => {
                maxDistance = Math.max(maxDistance, point.value);
                minDistance = Math.min(minDistance, point.value);
            });
        });
        
        if (maxDistance === 0) {
            ctx.fillStyle = '#4fc3f7';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', width / 2, height / 2);
            return;
        }
        
        const range = maxDistance - minDistance || 1;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // 绘制坐标轴
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制标签
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('时间 (天)', width / 2, height - 10);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('距离 (AU)', 0, 0);
        ctx.restore();
        
        // 绘制数据线
        const colors = ['#4fc3f7', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#845ef7', '#339af0', '#20c997'];
        let colorIndex = 0;
        
        Object.keys(this.chartData.distances).forEach(planetName => {
            const data = this.chartData.distances[planetName];
            if (data.length === 0) return;
            
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            data.forEach((point, index) => {
                const x = padding + (index / (this.chartData.maxDataPoints - 1)) * chartWidth;
                const y = height - padding - ((point.value - minDistance) / range) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
        
        // 更新图例
        this.updateChartLegend('distance');
    }
    
    // 绘制速度图表
    drawVelocityChart() {
        const canvas = document.getElementById('velocity-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置样式
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制网格
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const y = (height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 计算数据范围
        let maxVelocity = 0;
        let minVelocity = Infinity;
        const allData = Object.values(this.chartData.velocities);
        
        allData.forEach(dataArray => {
            dataArray.forEach(point => {
                maxVelocity = Math.max(maxVelocity, point.value);
                minVelocity = Math.min(minVelocity, point.value);
            });
        });
        
        if (maxVelocity === 0) {
            ctx.fillStyle = '#4fc3f7';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', width / 2, height / 2);
            return;
        }
        
        const range = maxVelocity - minVelocity || 1;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // 绘制坐标轴
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制标签
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('时间 (天)', width / 2, height - 10);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('速度 (km/s)', 0, 0);
        ctx.restore();
        
        // 绘制数据线
        const colors = ['#4fc3f7', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#845ef7', '#339af0', '#20c997'];
        let colorIndex = 0;
        
        Object.keys(this.chartData.velocities).forEach(planetName => {
            const data = this.chartData.velocities[planetName];
            if (data.length === 0) return;
            
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            data.forEach((point, index) => {
                const x = padding + (index / (this.chartData.maxDataPoints - 1)) * chartWidth;
                const y = height - padding - ((point.value - minVelocity) / range) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
        
        // 更新图例
        this.updateChartLegend('velocity');
    }
    
    // 更新图例
    updateChartLegend(chartType) {
        const legend = document.getElementById('chart-legend');
        if (!legend) return;
        
        const data = chartType === 'distance' ? this.chartData.distances : this.chartData.velocities;
        const colors = ['#4fc3f7', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#845ef7', '#339af0', '#20c997'];
        
        let html = '<div class="legend-title">图例:</div>';
        let colorIndex = 0;
        
        Object.keys(data).forEach(planetName => {
            if (data[planetName].length > 0) {
                const color = colors[colorIndex % colors.length];
                const lastPoint = data[planetName][data[planetName].length - 1];
                const value = chartType === 'distance' 
                    ? lastPoint.value.toFixed(2) + ' AU'
                    : lastPoint.value.toFixed(2) + ' km/s';
                
                html += `
                    <div class="legend-item">
                        <span class="legend-color" style="background: ${color}"></span>
                        <span class="legend-label">${planetName}: ${value}</span>
                    </div>
                `;
                colorIndex++;
            }
        });
        
        legend.innerHTML = html;
    }
    
    // 绘制轨道周期对比图表
    drawPeriodChart() {
        const canvas = document.getElementById('period-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置样式
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制网格
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const y = (height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 获取所有行星的轨道周期数据
        const planetPeriods = [];
        Config.planetData.forEach(planet => {
            const detailedData = Config.planetDetailedData[planet.name];
            if (detailedData && detailedData.orbitalPeriod) {
                // 解析周期字符串，转换为天数
                let days = 0;
                const periodStr = detailedData.orbitalPeriod;
                if (periodStr.includes('地球日')) {
                    days = parseFloat(periodStr);
                } else if (periodStr.includes('地球年')) {
                    days = parseFloat(periodStr) * 365.25;
                }
                
                if (days > 0) {
                    planetPeriods.push({
                        name: planet.name,
                        days: days,
                        years: days / 365.25
                    });
                }
            }
        });
        
        if (planetPeriods.length === 0) {
            ctx.fillStyle = '#4fc3f7';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', width / 2, height / 2);
            return;
        }
        
        // 按周期排序
        planetPeriods.sort((a, b) => a.days - b.days);
        
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const barWidth = chartWidth / planetPeriods.length * 0.8;
        const barSpacing = chartWidth / planetPeriods.length * 0.2;
        const maxPeriod = Math.max(...planetPeriods.map(p => p.days));
        
        // 绘制坐标轴
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制标签
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('行星', width / 2, height - 10);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('轨道周期 (地球日)', 0, 0);
        ctx.restore();
        
        // 绘制Y轴刻度
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = (maxPeriod / 5) * i;
            const y = height - padding - (i / 5) * chartHeight;
            ctx.fillText(value.toFixed(0), padding - 5, y + 4);
        }
        
        // 绘制柱状图
        const colors = ['#4fc3f7', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#845ef7', '#339af0', '#20c997'];
        
        planetPeriods.forEach((planet, index) => {
            const barHeight = (planet.days / maxPeriod) * chartHeight;
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const y = height - padding - barHeight;
            
            const color = colors[index % colors.length];
            
            // 绘制柱子
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 绘制边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);
            
            // 绘制数值标签
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const labelY = y - 5;
            if (labelY > padding) {
                ctx.fillText(planet.days.toFixed(0) + '天', x + barWidth / 2, labelY);
            } else {
                // 如果标签在柱子内部，显示在柱子顶部
                ctx.fillStyle = '#000';
                ctx.fillText(planet.days.toFixed(0) + '天', x + barWidth / 2, y + 12);
            }
            
            // 绘制行星名称
            ctx.fillStyle = '#4fc3f7';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(planet.name, x + barWidth / 2, height - padding + 20);
        });
        
        // 更新图例
        this.updatePeriodChartLegend(planetPeriods);
    }
    
    // 更新轨道周期图例
    updatePeriodChartLegend(planetPeriods) {
        const legend = document.getElementById('chart-legend');
        if (!legend) return;
        
        const colors = ['#4fc3f7', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#845ef7', '#339af0', '#20c997'];
        
        let html = '<div class="legend-title">轨道周期:</div>';
        
        planetPeriods.forEach((planet, index) => {
            const color = colors[index % colors.length];
            const periodText = planet.years < 1 
                ? `${planet.days.toFixed(0)} 地球日`
                : `${planet.years.toFixed(2)} 地球年 (${planet.days.toFixed(0)} 天)`;
            
            html += `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${color}"></span>
                    <span class="legend-label">${planet.name}: ${periodText}</span>
                </div>
            `;
        });
        
        legend.innerHTML = html;
    }
    
    // 创建统计面板
    createStatisticsPanel() {
        const panel = document.createElement('div');
        panel.id = 'statistics-panel';
        panel.className = 'statistics-panel';
        panel.innerHTML = `
            <div class="stats-header">
                <h3>系统统计</h3>
                <button id="close-stats-btn">×</button>
            </div>
            <div class="stats-content">
                <div class="stat-item">
                    <span class="stat-label">总运行时间:</span>
                    <span class="stat-value" id="stat-runtime">0 秒</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">已触发事件数:</span>
                    <span class="stat-value" id="stat-events">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">观察到的彗星数:</span>
                    <span class="stat-value" id="stat-comets">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">模拟时间:</span>
                    <span class="stat-value" id="stat-simtime">0 天</span>
                </div>
                <div class="stat-section">
                    <h4>行星公转圈数</h4>
                    <div id="stat-revolutions" class="revolutions-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        // 绑定关闭按钮
        const closeBtn = document.getElementById('close-stats-btn');
        closeBtn.addEventListener('click', () => {
            this.toggleStatisticsPanel();
        });
        
        // 初始化统计数据
        this.initStatistics();
    }
    
    // 初始化统计数据
    initStatistics() {
        // 初始化行星公转圈数
        Config.planetData.forEach(planet => {
            this.statistics.planetRevolutions[planet.name] = 0;
        });
        
        // 监听事件管理器的事件
        if (this.eventManager) {
            // 监听事件触发
            const originalTriggerEvent = this.eventManager.triggerEvent.bind(this.eventManager);
            this.eventManager.triggerEvent = (type, data, key) => {
                originalTriggerEvent(type, data, key);
                this.statistics.totalEvents++;
                this.updateStatistics();
            };
        }
    }
    
    // 切换统计面板显示
    toggleStatisticsPanel() {
        const panel = document.getElementById('statistics-panel');
        if (panel) {
            const isCurrentlyVisible = panel.style.display !== 'none' && panel.style.display !== '';
            panel.style.display = isCurrentlyVisible ? 'none' : 'block';
            
            if (!isCurrentlyVisible) {
                // 显示面板，开始更新统计
                this.updateStatistics();
                this.statisticsUpdateInterval = setInterval(() => {
                    this.updateStatistics();
                }, 1000); // 每秒更新一次
            } else {
                // 隐藏面板，停止更新
                if (this.statisticsUpdateInterval) {
                    clearInterval(this.statisticsUpdateInterval);
                    this.statisticsUpdateInterval = null;
                }
            }
        }
    }
    
    // 更新统计数据
    updateStatistics() {
        const panel = document.getElementById('statistics-panel');
        if (!panel || panel.style.display === 'none') return;
        
        // 更新运行时间
        const runtimeEl = document.getElementById('stat-runtime');
        if (runtimeEl) {
            const runtime = Math.floor((Date.now() - this.statistics.startTime) / 1000);
            const hours = Math.floor(runtime / 3600);
            const minutes = Math.floor((runtime % 3600) / 60);
            const seconds = runtime % 60;
            if (hours > 0) {
                runtimeEl.textContent = `${hours}小时 ${minutes}分钟 ${seconds}秒`;
            } else if (minutes > 0) {
                runtimeEl.textContent = `${minutes}分钟 ${seconds}秒`;
            } else {
                runtimeEl.textContent = `${seconds} 秒`;
            }
        }
        
        // 更新事件数
        const eventsEl = document.getElementById('stat-events');
        if (eventsEl) {
            eventsEl.textContent = this.statistics.totalEvents.toString();
        }
        
        // 更新彗星数（从EventManager获取）
        const cometsEl = document.getElementById('stat-comets');
        if (cometsEl && this.eventManager) {
            // 尝试从EventManager获取彗星数量
            const cometCount = this.eventManager.eventHistory ? 
                this.eventManager.eventHistory.filter(e => e.type === 'comet_approach').length : 0;
            this.statistics.cometCount = cometCount;
            cometsEl.textContent = this.statistics.cometCount.toString();
        }
        
        // 更新模拟时间
        const simtimeEl = document.getElementById('stat-simtime');
        if (simtimeEl) {
            const days = Math.floor(this.simulationTime);
            const years = (days / 365.25).toFixed(2);
            simtimeEl.textContent = `${days} 天 (${years} 年)`;
        }
        
        // 更新行星公转圈数
        this.updatePlanetRevolutions();
    }
    
    // 更新行星公转圈数
    updatePlanetRevolutions() {
        const revolutionsEl = document.getElementById('stat-revolutions');
        if (!revolutionsEl || !this.planetManager) return;
        
        let html = '';
        
        Config.planetData.forEach(planet => {
            const planetGroup = this.planetManager.planets.find(p => {
                const planetMesh = p.children[0];
                return planetMesh && planetMesh.userData && planetMesh.userData.name === planet.name;
            });
            
            if (planetGroup) {
                const planetMesh = planetGroup.children[0];
                if (planetMesh && planetMesh.userData) {
                    const angle = planetMesh.userData.angle || 0;
                    // 计算公转圈数：angle / (2 * PI)
                    const revolutions = Math.floor(angle / (Math.PI * 2));
                    
                    // 更新统计数据
                    if (revolutions > this.statistics.planetRevolutions[planet.name]) {
                        this.statistics.planetRevolutions[planet.name] = revolutions;
                    }
                    
                    const currentRevolutions = this.statistics.planetRevolutions[planet.name];
                    const detailedData = Config.planetDetailedData[planet.name];
                    const orbitalPeriod = detailedData ? detailedData.orbitalPeriod : '';
                    
                    html += `
                        <div class="revolution-item">
                            <span class="revolution-planet">${planet.name}:</span>
                            <span class="revolution-count">${currentRevolutions} 圈</span>
                            <span class="revolution-period">(${orbitalPeriod})</span>
                        </div>
                    `;
                }
            }
        });
        
        revolutionsEl.innerHTML = html || '<div class="no-data">暂无数据</div>';
    }

    // 截图功能
    takeScreenshot() {
        if (!this.renderer) {
            console.error('Renderer not available');
            return;
        }

        try {
            // 使用renderer的domElement来截图
            const dataURL = this.renderer.domElement.toDataURL('image/png');
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `solar-system-${Date.now()}.png`;
            link.href = dataURL;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 显示成功提示
            this.showScreenshotNotification();
        } catch (error) {
            console.error('Screenshot failed:', error);
            alert('截图失败，请重试');
        }
    }

    // 显示截图成功通知
    showScreenshotNotification() {
        const notification = document.createElement('div');
        notification.className = 'screenshot-notification';
        notification.textContent = '✓ 截图已保存';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 200, 0, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // 切换探测器信息面板
    toggleMissionsPanel() {
        let panel = document.getElementById('missions-panel');
        
        if (!panel) {
            // 创建面板
            panel = document.createElement('div');
            panel.id = 'missions-panel';
            panel.className = 'info-panel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                max-height: 80vh;
                background: rgba(20, 20, 30, 0.95);
                border: 2px solid #4fc3f7;
                border-radius: 12px;
                padding: 20px;
                z-index: 1000;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.id = 'close-missions-btn';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
            `;
            closeBtn.addEventListener('click', () => {
                this.toggleMissionsPanel();
            });
            panel.appendChild(closeBtn);
            
            const title = document.createElement('h2');
            title.textContent = '太空探测器信息';
            title.style.cssText = 'color: #4fc3f7; margin-top: 0; margin-bottom: 20px;';
            panel.appendChild(title);
            
            const missionsContainer = document.createElement('div');
            missionsContainer.id = 'missions-container';
            panel.appendChild(missionsContainer);
            
            document.body.appendChild(panel);
        }
        
        const isVisible = panel.style.display !== 'none' && panel.style.display !== '';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && this.missionManager) {
            this.updateMissionsPanel();
        }
    }
    
    // 更新探测器信息面板
    updateMissionsPanel() {
        const container = document.getElementById('missions-container');
        if (!container || !this.missionManager) return;
        
        container.innerHTML = '';
        
        this.missionManager.missions.forEach(missionGroup => {
            const missionInfo = this.missionManager.getMissionInfo(missionGroup);
            const missionData = missionGroup.userData.missionData;
            
            const missionCard = document.createElement('div');
            missionCard.style.cssText = `
                background: rgba(40, 40, 60, 0.8);
                border: 1px solid rgba(79, 195, 247, 0.3);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            `;
            
            const name = document.createElement('h3');
            name.textContent = missionInfo.name;
            name.style.cssText = `color: rgb(${this.missionManager.hexToRgb(missionData.color).r}, ${this.missionManager.hexToRgb(missionData.color).g}, ${this.missionManager.hexToRgb(missionData.color).b}); margin-top: 0;`;
            missionCard.appendChild(name);
            
            const info = document.createElement('div');
            info.style.cssText = 'color: #ccc; line-height: 1.8;';
            info.innerHTML = `
                <p><strong>发射日期:</strong> ${missionInfo.launchDate}</p>
                <p><strong>目标:</strong> ${missionInfo.target}</p>
                <p><strong>状态:</strong> <span style="color: ${missionInfo.status === '运行中' ? '#4fc3f7' : missionInfo.status === '已完成' ? '#51cf66' : '#ff6b6b'}">${missionInfo.status}</span></p>
                <p><strong>任务类型:</strong> ${missionData.trajectory.type === 'orbit' ? '轨道器' : missionData.trajectory.type === 'lander' ? '着陆器' : '飞越探测器'}</p>
                <p><strong>描述:</strong> ${missionInfo.description}</p>
            `;
            missionCard.appendChild(info);
            
            container.appendChild(missionCard);
        });
    }
}

