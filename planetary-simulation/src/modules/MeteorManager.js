// 流星管理模块 - 负责流星的创建和管理
class MeteorManager {
    constructor(scene) {
        this.scene = scene;
        this.meteors = [];
        this.maxMeteors = 20;  // 限制最大流星数量以提升性能
        this.meteorShowerMode = false;  // 流星雨模式
        this.meteorShowerData = null;  // 当前流星雨数据
        this.meteorShowerIntensity = 1;  // 流星雨强度倍数
    }

    // 设置流星雨模式
    setMeteorShowerMode(enabled, showerData = null) {
        this.meteorShowerMode = enabled;
        this.meteorShowerData = showerData;
        if (enabled && Config.events?.meteorShower) {
            this.meteorShowerIntensity = Config.events.meteorShower.intensity || 3;
            this.maxMeteors = Math.floor(20 * this.meteorShowerIntensity);  // 增加最大流星数
        } else {
            this.meteorShowerIntensity = 1;
            this.maxMeteors = 20;
        }
    }

    createMeteor() {
        // 如果流星数量过多，不创建新的
        if (this.meteors.length >= this.maxMeteors) {
            return;
        }

        let startPos, direction, color;

        if (this.meteorShowerMode && this.meteorShowerData) {
            // 流星雨模式：从辐射点方向生成
            const radiant = this.meteorShowerData.radiant;
            const basePos = new THREE.Vector3(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
            
            // 从辐射点方向生成流星
            const radiantDir = new THREE.Vector3(radiant.x, radiant.y, radiant.z).normalize();
            const spread = (Math.random() - 0.5) * 0.3;  // 小范围扩散
            direction = new THREE.Vector3(
                radiantDir.x + spread,
                radiantDir.y + spread,
                radiantDir.z + spread
            ).normalize();
            
            startPos = basePos.clone();
            color = this.meteorShowerData.color || 0x00ffff;
        } else {
            // 正常模式：随机方向
            startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
            const endPos = new THREE.Vector3(
                startPos.x * 0.1,
                startPos.y * 0.1,
                startPos.z * 0.1
            );
            direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
            color = 0x00ffff;
        }
        
        const length = 50;
        
        const geometry = new THREE.BufferGeometry().setFromPoints([
            startPos,
            new THREE.Vector3().addVectors(startPos, direction.multiplyScalar(length))
        ]);
        
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const meteor = new THREE.Line(geometry, material);
        meteor.userData = {
            isMeteor: true,
            position: startPos.clone(),
            direction: direction.clone(),
            speed: 5 + Math.random() * 5,
            life: 1.0
        };
        
        this.scene.add(meteor);
        this.meteors.push(meteor);
    }

    update(delta) {
        // 根据模式调整生成频率
        let spawnRate = 0.005;  // 正常模式
        if (this.meteorShowerMode) {
            spawnRate = 0.05 * this.meteorShowerIntensity;  // 流星雨模式：更高的生成频率
        }

        // 随机生成流星
        if (this.meteors.length < this.maxMeteors && Math.random() < spawnRate) {
            this.createMeteor();
        }
    }

    removeMeteor(meteor) {
        this.scene.remove(meteor);
        const index = this.meteors.indexOf(meteor);
        if (index > -1) {
            this.meteors.splice(index, 1);
        }
    }
}

