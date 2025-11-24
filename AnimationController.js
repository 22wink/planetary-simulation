// 动画控制模块 - 负责动画循环和时间控制
class AnimationController {
    constructor() {
        this.timeScale = 1.0;
        this.isPaused = false;
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    update(sceneManager, planetManager, meteorManager, cometManager = null) {
        if (!this.isPaused) {
            const delta = this.timeScale;
            
            // 更新控制器
            if (sceneManager.controls) {
                sceneManager.controls.update();
            }
            
            // 更新行星
            planetManager.updatePlanets(delta);
            
            // 更新流星
            this.updateMeteors(meteorManager, delta);
        } else {
            // 暂停时，仍然需要更新控制器以保持相机控制可用
            if (sceneManager.controls) {
                sceneManager.controls.update();
            }
        }
    }

    updateMeteors(meteorManager, delta) {
        meteorManager.meteors.forEach((meteor) => {
            meteor.userData.life -= 0.02 * delta;
            if (meteor.userData.life <= 0) {
                meteorManager.removeMeteor(meteor);
            } else {
                const move = meteor.userData.direction.clone().multiplyScalar(meteor.userData.speed * delta);
                meteor.userData.position.add(move);
                meteor.position.copy(meteor.userData.position);
                meteor.material.opacity = meteor.userData.life;
            }
        });
    }
}

