// 流星管理模块 - 负责流星的创建和管理
class MeteorManager {
    constructor(scene) {
        this.scene = scene;
        this.meteors = [];
        this.maxMeteors = 20;  // 限制最大流星数量以提升性能
    }

    createMeteor() {
        // 如果流星数量过多，不创建新的
        if (this.meteors.length >= this.maxMeteors) {
            return;
        }
        const startPos = new THREE.Vector3(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );
        const endPos = new THREE.Vector3(
            startPos.x * 0.1,
            startPos.y * 0.1,
            startPos.z * 0.1
        );
        
        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const length = 50;
        
        const geometry = new THREE.BufferGeometry().setFromPoints([
            startPos,
            new THREE.Vector3().addVectors(startPos, direction.multiplyScalar(length))
        ]);
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
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
        // 随机生成流星（降低生成频率以提升性能）
        if (this.meteors.length < this.maxMeteors && Math.random() < 0.005) {
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

