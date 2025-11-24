// 大气垂直分层可视化模块
class AtmosphereLayers {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isAnimating = false;
        this.animationFrame = 0;
        this.viewMode = '2d'; // '2d' or '3d'
        this.threeRenderer = null;
        this.layerMeshes = [];
        
        this.setupCanvas();
        this.setupControls();
        this.draw();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const updateSize = () => {
            this.canvas.width = container.clientWidth - 40;
            this.canvas.height = Math.min(600, container.clientHeight - 40);
            this.draw();
        };
        
        updateSize();
        window.addEventListener('resize', updateSize);
    }

    setupControls() {
        const viewToggleBtn = document.getElementById('view-toggle-layers');
        const animateBtn = document.getElementById('animate-layers');
        const resetBtn = document.getElementById('reset-layers');
        
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                this.toggleView();
                viewToggleBtn.textContent = this.viewMode === '2d' ? '切换到3D视图' : '切换到2D视图';
            });
        }
        
        if (animateBtn) {
            animateBtn.addEventListener('click', () => {
                this.isAnimating = !this.isAnimating;
                animateBtn.textContent = this.isAnimating ? '暂停动画' : '播放动画';
                if (this.isAnimating) {
                    this.animate();
                }
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.animationFrame = 0;
                if (this.viewMode === '2d') {
                    this.draw();
                }
            });
        }
    }

    toggleView() {
        const canvasContainer = this.canvas.parentElement;
        const container3D = document.getElementById('layers-3d-container');
        
        if (this.viewMode === '2d') {
            // 切换到3D视图
            this.viewMode = '3d';
            this.canvas.style.display = 'none';
            container3D.style.display = 'block';
            
            if (!this.threeRenderer) {
                this.init3D();
            }
        } else {
            // 切换到2D视图
            this.viewMode = '2d';
            this.canvas.style.display = 'block';
            container3D.style.display = 'none';
        }
    }

    init3D() {
        const container3D = document.getElementById('layers-3d-container');
        if (!container3D) return;
        
        this.threeRenderer = new Three3DRenderer('layers-3d-container');
        
        // 创建地球
        const earth = this.threeRenderer.createEarth(2, true);
        
        // 创建大气层
        this.layerMeshes = this.threeRenderer.createAtmosphereLayers(2);
        
        // 添加标签（使用CSS 3D或精灵）
        this.add3DLabels();
    }

    add3DLabels() {
        // 为3D视图添加文字标签
        const labels = [
            { name: '对流层', y: 2.1, color: 0xe3f2fd },
            { name: '平流层', y: 2.2, color: 0xbbdefb },
            { name: '高层大气', y: 2.3, color: 0x90caf9 }
        ];
        
        labels.forEach((label, index) => {
            // 创建文字精灵（简化版，使用几何体代替）
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label.name, 128, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(0, label.y, 0);
            sprite.scale.set(0.5, 0.2, 1);
            this.threeRenderer.scene.add(sprite);
        });
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB'); // 天空蓝
        gradient.addColorStop(0.3, '#E0F6FF');
        gradient.addColorStop(0.6, '#FFE4B5'); // 地面
        gradient.addColorStop(1, '#8B7355');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 绘制地面
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, height * 0.9, width, height * 0.1);
        
        // 绘制大气层
        const layers = [
            { name: '对流层', height: 0.12, color: '#E3F2FD', temp: '递减', y: 0.9 },
            { name: '平流层', height: 0.38, color: '#BBDEFB', temp: '递增', y: 0.78 },
            { name: '高层大气', height: 0.5, color: '#90CAF9', temp: '电离层', y: 0.4 }
        ];
        
        let currentY = height * 0.9;
        
        layers.forEach((layer, index) => {
            const layerHeight = height * layer.height;
            const layerY = currentY - layerHeight;
            
            // 绘制层
            ctx.fillStyle = layer.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(width * 0.1, layerY, width * 0.8, layerHeight);
            ctx.globalAlpha = 1.0;
            
            // 绘制边界线
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(width * 0.1, layerY);
            ctx.lineTo(width * 0.9, layerY);
            ctx.stroke();
            
            // 绘制标签
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            const labelY = layerY + layerHeight / 2;
            ctx.fillText(layer.name, width * 0.15, labelY);
            
            // 绘制高度标注
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            const heightText = index === 0 ? '0-12km' : index === 1 ? '12-50km' : '50km以上';
            ctx.fillText(heightText, width * 0.15, labelY + 20);
            
            // 绘制温度变化箭头
            if (index === 0) {
                // 对流层：温度递减
                this.drawTempArrow(ctx, width * 0.7, layerY + 20, width * 0.7, layerY + layerHeight - 20, '↓', '递减');
            } else if (index === 1) {
                // 平流层：温度递增
                this.drawTempArrow(ctx, width * 0.7, layerY + layerHeight - 20, width * 0.7, layerY + 20, '↑', '递增');
            }
            
            currentY = layerY;
        });
        
        // 绘制特征标注
        this.drawFeatures(ctx, width, height);
        
        // 绘制动画效果（如果正在播放）
        if (this.isAnimating) {
            this.drawAnimation(ctx, width, height);
        }
    }

    drawTempArrow(ctx, x1, y1, x2, y2, arrow, text) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // 绘制箭头
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(arrow, x2, y2);
        
        // 绘制文字
        ctx.font = '12px Arial';
        ctx.fillText(text, x2 + 30, (y1 + y2) / 2);
    }

    drawFeatures(ctx, width, height) {
        // 在对流层绘制云和天气现象
        const cloudY = height * 0.85;
        this.drawCloud(ctx, width * 0.3, cloudY, 40);
        this.drawCloud(ctx, width * 0.5, cloudY - 20, 35);
        this.drawCloud(ctx, width * 0.7, cloudY, 30);
        
        // 在平流层绘制飞机
        const planeY = height * 0.6;
        this.drawPlane(ctx, width * 0.4, planeY);
        this.drawPlane(ctx, width * 0.7, planeY - 30);
        
        // 在高层大气绘制电离层和极光
        const ionY = height * 0.3;
        this.drawIonLayer(ctx, width * 0.5, ionY);
    }

    drawCloud(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPlane(ctx, x, y) {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30, y - 5);
        ctx.lineTo(x + 25, y);
        ctx.lineTo(x + 30, y + 5);
        ctx.closePath();
        ctx.fill();
        
        // 机翼
        ctx.beginPath();
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + 15, y - 8);
        ctx.lineTo(x + 20, y);
        ctx.closePath();
        ctx.fill();
    }

    drawIonLayer(ctx, x, y) {
        // 绘制电离层波浪效果
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 100; i++) {
            const px = x - 50 + i;
            const py = y + Math.sin(i * 0.2 + this.animationFrame * 0.1) * 10;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // 标注
        ctx.fillStyle = '#9C27B0';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('电离层（反射无线电波）', x, y - 20);
    }

    drawAnimation(ctx, width, height) {
        // 在对流层绘制对流运动
        const time = this.animationFrame * 0.05;
        const centerX = width * 0.5;
        const baseY = height * 0.85;
        
        // 上升气流
        for (let i = 0; i < 3; i++) {
            const x = centerX - 100 + i * 100;
            const offsetY = Math.sin(time + i) * 20;
            this.drawAirFlow(ctx, x, baseY, x, baseY - 100 + offsetY, '#4CAF50');
        }
        
        // 下降气流
        for (let i = 0; i < 2; i++) {
            const x = centerX - 50 + i * 100;
            const offsetY = Math.sin(time + i + Math.PI) * 15;
            this.drawAirFlow(ctx, x, baseY - 150, x, baseY - 50 + offsetY, '#FF9800');
        }
    }

    drawAirFlow(ctx, x1, y1, x2, y2, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 箭头
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    animate() {
        if (this.isAnimating) {
            this.animationFrame++;
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    onActivate() {
        this.draw();
    }
}
