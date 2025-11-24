// 相机控制模块 - 负责相机聚焦和动画
class CameraController {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.isAnimating = false;
        this.animationId = null;
        this.focusedPlanet = null; // 当前聚焦的行星名称
        this.planetManager = null; // 行星管理器引用
    }

    // 缓动函数
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // 检查Vector3是否有效（不是NaN或Infinity）
    isVector3Valid(vector) {
        if (!vector) return false;
        return isFinite(vector.x) && isFinite(vector.y) && isFinite(vector.z) &&
               !isNaN(vector.x) && !isNaN(vector.y) && !isNaN(vector.z);
    }

    // 计算行星聚焦位置（配置驱动）
    calculatePlanetFocusPosition(planetName, planetManager) {
        const focusConfig = Config.focus;
        
        // 太阳特殊处理
        if (planetName === '太阳') {
            return {
                position: new THREE.Vector3(
                    focusConfig.sun.position.x,
                    focusConfig.sun.position.y,
                    focusConfig.sun.position.z
                ),
                lookAt: new THREE.Vector3(
                    focusConfig.sun.lookAt.x,
                    focusConfig.sun.lookAt.y,
                    focusConfig.sun.lookAt.z
                )
            };
        }
        
        // 获取行星
        const planetGroup = planetManager.getPlanetByName(planetName);
        if (!planetGroup) {
            return null;
        }

        const planet = planetGroup.children[0];
        const worldPosition = planetManager.getPlanetWorldPosition(planetName);
        if (!worldPosition || !this.isVector3Valid(worldPosition)) {
            return null;
        }
        
        // 使用配置中的offset倍数计算相机位置
        const planetSize = planet.userData.size;
        const offset = new THREE.Vector3(
            focusConfig.planet.offset.x * planetSize,
            focusConfig.planet.offset.y * planetSize,
            focusConfig.planet.offset.z * planetSize
        );
        
        const targetPosition = worldPosition.clone().add(offset);
        const targetLookAt = worldPosition.clone();
        
        // 验证计算结果
        if (!this.isVector3Valid(targetPosition) || !this.isVector3Valid(targetLookAt)) {
            console.error('Invalid focus position calculated for planet:', planetName);
            return null;
        }
        
        return { position: targetPosition, lookAt: targetLookAt };
    }

    // 聚焦到卫星
    focusOnMoon(moonName, planetManager) {
        if (this.isAnimating) {
            return;
        }

        this.planetManager = planetManager;

        // 查找卫星
        let targetMoon = null;
        let parentPlanetName = null;

        for (const planetGroup of planetManager.planets) {
            const planet = planetGroup.children[0];
            for (let i = 0; i < planet.children.length; i++) {
                const child = planet.children[i];
                if (child.userData && child.userData.isMoon && child.userData.name === moonName) {
                    targetMoon = child;
                    parentPlanetName = planet.userData.name;
                    break;
                }
            }
            if (targetMoon) break;
        }

        if (!targetMoon) {
            console.error('Moon not found:', moonName);
            return;
        }

        // 获取卫星世界位置
        const moonWorldPosition = new THREE.Vector3();
        targetMoon.getWorldPosition(moonWorldPosition);

        if (!this.isVector3Valid(moonWorldPosition)) {
            return;
        }

        const moonSize = targetMoon.userData.distance * 0.1; // 估算大小
        const focusConfig = Config.focus;
        const offset = new THREE.Vector3(
            focusConfig.planet.offset.x * moonSize,
            focusConfig.planet.offset.y * moonSize,
            focusConfig.planet.offset.z * moonSize
        );

        const targetPosition = moonWorldPosition.clone().add(offset);
        const targetLookAt = moonWorldPosition.clone();

        this.isAnimating = true;
        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls ? this.controls.target.clone() : new THREE.Vector3();
        const duration = focusConfig.duration;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeInOutCubic(progress);

            // 实时更新卫星位置
            targetMoon.getWorldPosition(moonWorldPosition);
            if (this.isVector3Valid(moonWorldPosition)) {
                const offset = new THREE.Vector3(
                    focusConfig.planet.offset.x * moonSize,
                    focusConfig.planet.offset.y * moonSize,
                    focusConfig.planet.offset.z * moonSize
                );
                targetPosition.copy(moonWorldPosition).add(offset);
                targetLookAt.copy(moonWorldPosition);
            }

            if (targetPosition && this.isVector3Valid(targetPosition)) {
                this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
            }

            if (targetLookAt && this.isVector3Valid(targetLookAt)) {
                if (this.controls) {
                    this.controls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
                    this.controls.update();
                } else {
                    this.camera.lookAt(new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, easedProgress));
                }
            }

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.animationId = null;
                this.focusedPlanet = moonName; // 使用focusedPlanet存储卫星名
                if (this.controls) {
                    this.controls.update();
                }
            }
        };

        animate();
    }

    // 聚焦到行星（带动画）
    focusOnPlanet(planetName, planetManager) {
        if (this.isAnimating) {
            return; // 如果正在动画中，忽略新的聚焦请求
        }

        // 保存行星管理器引用
        this.planetManager = planetManager;

        // 获取聚焦配置（用于动画循环中）
        const focusConfig = Config.focus;

        // 计算目标位置（配置驱动）
        const focusData = this.calculatePlanetFocusPosition(planetName, planetManager);
        if (!focusData) {
            console.error('Failed to calculate focus position for:', planetName);
            return;
        }

        this.isAnimating = true;
        let targetPosition = focusData.position;
        let targetLookAt = focusData.lookAt;

        // 记录起始状态
        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls ? this.controls.target.clone() : new THREE.Vector3();

        const duration = focusConfig.duration;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeInOutCubic(progress);

            // 对于非太阳的行星，需要实时更新目标位置（因为行星在运动）
            if (planetName !== '太阳') {
                const planetGroup = planetManager.getPlanetByName(planetName);
                if (planetGroup) {
                    const planet = planetGroup.children[0];
                    const currentWorldPosition = planetManager.getPlanetWorldPosition(planetName);
                    if (this.isVector3Valid(currentWorldPosition)) {
                        const planetSize = planet.userData.size;
                        // 使用配置中的offset倍数（配置驱动）
                        const offset = new THREE.Vector3(
                            focusConfig.planet.offset.x * planetSize,
                            focusConfig.planet.offset.y * planetSize,
                            focusConfig.planet.offset.z * planetSize
                        );
                        // 确保offset有效
                        if (this.isVector3Valid(offset)) {
                            targetPosition = currentWorldPosition.clone().add(offset);
                            targetLookAt = currentWorldPosition.clone();
                        }
                    }
                }
            }

            // 验证目标位置是否有效
            if (targetPosition && this.isVector3Valid(targetPosition)) {
                // 插值相机位置
                this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
                
                // 验证插值后的位置是否有效
                if (!this.isVector3Valid(this.camera.position)) {
                    // 如果位置无效，使用目标位置
                    this.camera.position.copy(targetPosition);
                }
            }

            // 插值观察目标
            if (targetLookAt && this.isVector3Valid(targetLookAt)) {
                if (this.controls) {
                    this.controls.target.lerpVectors(startLookAt, targetLookAt, easedProgress);
                    this.controls.update();
                } else {
                    this.camera.lookAt(
                        new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, easedProgress)
                    );
                }
            }

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.animationId = null;
                // 动画结束后，设置聚焦的行星（用于后续跟随）
                this.focusedPlanet = planetName;
                // 确保controls正确更新
                if (this.controls) {
                    this.controls.update();
                }
            }
        };

        animate();
    }

    // 取消当前动画
    cancelAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isAnimating = false;
    }

    // 更新相机位置（用于跟随行星）
    update() {
        // 如果聚焦了非太阳的行星，持续更新相机位置以跟随行星
        if (this.focusedPlanet && this.focusedPlanet !== '太阳' && this.planetManager && !this.isAnimating) {
            const planetGroup = this.planetManager.getPlanetByName(this.focusedPlanet);
            if (planetGroup) {
                const planet = planetGroup.children[0];
                const worldPosition = this.planetManager.getPlanetWorldPosition(this.focusedPlanet);
                
                if (worldPosition && this.isVector3Valid(worldPosition)) {
                    const focusConfig = Config.focus;
                    const planetSize = planet.userData.size;
                    
                    // 计算相机位置
                    const offset = new THREE.Vector3(
                        focusConfig.planet.offset.x * planetSize,
                        focusConfig.planet.offset.y * planetSize,
                        focusConfig.planet.offset.z * planetSize
                    );
                    
                    if (this.isVector3Valid(offset)) {
                        const targetPosition = worldPosition.clone().add(offset);
                        const targetLookAt = worldPosition.clone();
                        
                        // 平滑更新相机位置（使用lerp实现平滑跟随）
                        if (this.isVector3Valid(targetPosition)) {
                            this.camera.position.lerp(targetPosition, 0.1);
                        }
                        
                        // 更新观察目标
                        if (this.isVector3Valid(targetLookAt)) {
                            if (this.controls) {
                                this.controls.target.lerp(targetLookAt, 0.1);
                                this.controls.update();
                            } else {
                                this.camera.lookAt(targetLookAt);
                            }
                        }
                    }
                }
            }
        }
    }

    // 取消聚焦
    cancelFocus() {
        this.focusedPlanet = null;
        this.cancelAnimation();
    }
}

