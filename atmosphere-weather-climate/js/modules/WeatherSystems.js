// 天气系统可视化模块
class WeatherSystems {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentType = 'cold-front';
        this.isAnimating = false;
        this.animationFrame = 0;
        this.viewMode = '2d'; // '2d' or '3d'
        this.threeRenderer = null;
        this.weatherObjects = [];
        
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
        // 视图切换按钮
        const viewToggleBtn = document.getElementById('view-toggle-weather');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                this.toggleView();
                viewToggleBtn.textContent = this.viewMode === '2d' ? '切换到3D视图' : '切换到2D视图';
            });
        }
        
        // 天气系统类型选择
        const weatherButtons = document.querySelectorAll('.weather-btn');
        weatherButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                weatherButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentType = btn.dataset.type;
                this.updateInfo();
                if (this.viewMode === '2d') {
                    this.draw();
                } else {
                    this.draw3D();
                }
            });
        });
        
        // 动画按钮
        const animateBtn = document.getElementById('animate-weather');
        if (animateBtn) {
            animateBtn.addEventListener('click', () => {
                this.isAnimating = !this.isAnimating;
                animateBtn.textContent = this.isAnimating ? '暂停动画' : '播放动画';
                if (this.isAnimating) {
                    this.animate();
                }
            });
        }
        
        // 重置按钮
        const resetBtn = document.getElementById('reset-weather');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.animationFrame = 0;
                this.draw();
            });
        }
    }

    updateInfo() {
        const infoSection = document.getElementById('weather-info');
        if (!infoSection) return;
        
        const info = {
            'cold-front': {
                title: '冷锋',
                content: '<ul><li>冷气团主动向暖气团移动</li><li>过境时：降温、大风、雨雪</li><li>过境后：气压升高、气温降低</li></ul>'
            },
            'warm-front': {
                title: '暖锋',
                content: '<ul><li>暖气团主动向冷气团移动</li><li>过境时：连续性降水</li><li>过境后：气压降低、气温升高</li></ul>'
            },
            'stationary-front': {
                title: '准静止锋',
                content: '<ul><li>冷暖气团势力相当，锋面移动缓慢</li><li>典型例子：梅雨（江淮准静止锋）</li><li>贵阳冬雨（昆明准静止锋）</li><li>长时间连续性降水</li></ul>'
            },
            'cyclone': {
                title: '气旋（低压）',
                content: '<ul><li>低压中心</li><li>垂直方向上升气流</li><li>多阴雨天气</li><li>典型例子：台风</li><li>北半球逆时针旋转</li></ul>'
            },
            'anticyclone': {
                title: '反气旋（高压）',
                content: '<ul><li>高压中心</li><li>垂直方向下沉气流</li><li>多晴朗天气</li><li>典型例子：伏旱、冬季寒潮</li><li>北半球顺时针旋转</li></ul>'
            },
            'frontal-cyclone': {
                title: '锋面气旋',
                content: '<ul><li>气旋与锋面结合</li><li>北半球锋面气旋：东侧为暖锋，西侧为冷锋</li><li>多阴雨天气</li><li>常见于中纬度地区</li></ul>'
            }
        };
        
        const currentInfo = info[this.currentType] || info['cold-front'];
        infoSection.innerHTML = `<h3>${currentInfo.title}</h3>${currentInfo.content}`;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        switch (this.currentType) {
            case 'cold-front':
                this.drawColdFront(ctx, width, height);
                break;
            case 'warm-front':
                this.drawWarmFront(ctx, width, height);
                break;
            case 'stationary-front':
                this.drawStationaryFront(ctx, width, height);
                break;
            case 'cyclone':
                this.drawCyclone(ctx, width, height);
                break;
            case 'anticyclone':
                this.drawAnticyclone(ctx, width, height);
                break;
            case 'frontal-cyclone':
                this.drawFrontalCyclone(ctx, width, height);
                break;
        }
    }

    drawColdFront(ctx, width, height) {
        const centerY = height * 0.5;
        const frontX = width * 0.5 + this.animationFrame * 2;
        
        // 绘制冷气团和暖气团
        // 冷气团（蓝色，左侧）
        const coldGradient = ctx.createLinearGradient(0, 0, frontX, height);
        coldGradient.addColorStop(0, '#4A90E2');
        coldGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = coldGradient;
        ctx.fillRect(0, 0, frontX, height);
        
        // 暖气团（红色，右侧）
        const warmGradient = ctx.createLinearGradient(frontX, 0, width, height);
        warmGradient.addColorStop(0, '#FF6B6B');
        warmGradient.addColorStop(1, '#FFB6C1');
        ctx.fillStyle = warmGradient;
        ctx.fillRect(frontX, 0, width - frontX, height);
        
        // 绘制锋面线（带三角形，指向暖气团）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontX, 0);
        ctx.lineTo(frontX, height);
        ctx.stroke();
        
        // 绘制三角形（冷锋标志）
        const triangleSize = 20;
        for (let y = 50; y < height - 50; y += 40) {
            ctx.beginPath();
            ctx.moveTo(frontX, y);
            ctx.lineTo(frontX + triangleSize, y - triangleSize / 2);
            ctx.lineTo(frontX + triangleSize, y + triangleSize / 2);
            ctx.closePath();
            ctx.fillStyle = '#000';
            ctx.fill();
        }
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('冷气团', frontX / 2, centerY);
        ctx.fillText('暖气团', (frontX + width) / 2, centerY);
        ctx.fillText('冷锋', frontX + 30, 30);
        
        // 绘制云和降水
        if (frontX < width * 0.8) {
            this.drawClouds(ctx, frontX + 50, centerY - 50, '#666');
            this.drawRain(ctx, frontX + 50, centerY);
        }
    }

    drawWarmFront(ctx, width, height) {
        const centerY = height * 0.5;
        const frontX = width * 0.5 - this.animationFrame * 2;
        
        // 绘制冷气团和暖气团
        // 冷气团（蓝色，右侧）
        const coldGradient = ctx.createLinearGradient(frontX, 0, width, height);
        coldGradient.addColorStop(0, '#4A90E2');
        coldGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = coldGradient;
        ctx.fillRect(frontX, 0, width - frontX, height);
        
        // 暖气团（红色，左侧）
        const warmGradient = ctx.createLinearGradient(0, 0, frontX, height);
        warmGradient.addColorStop(0, '#FF6B6B');
        warmGradient.addColorStop(1, '#FFB6C1');
        ctx.fillStyle = warmGradient;
        ctx.fillRect(0, 0, frontX, height);
        
        // 绘制锋面线（带半圆，指向冷气团）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontX, 0);
        ctx.lineTo(frontX, height);
        ctx.stroke();
        
        // 绘制半圆（暖锋标志）
        const circleRadius = 15;
        for (let y = 50; y < height - 50; y += 40) {
            ctx.beginPath();
            ctx.arc(frontX, y, circleRadius, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
        }
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暖气团', frontX / 2, centerY);
        ctx.fillText('冷气团', (frontX + width) / 2, centerY);
        ctx.fillText('暖锋', frontX - 30, 30);
        
        // 绘制连续性降水
        if (frontX > width * 0.2) {
            this.drawContinuousRain(ctx, frontX - 50, centerY);
        }
    }

    drawStationaryFront(ctx, width, height) {
        const centerY = height * 0.5;
        const frontX = width * 0.5;
        
        // 绘制冷气团和暖气团
        const coldGradient = ctx.createLinearGradient(0, 0, frontX, height);
        coldGradient.addColorStop(0, '#4A90E2');
        coldGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = coldGradient;
        ctx.fillRect(0, 0, frontX, height);
        
        const warmGradient = ctx.createLinearGradient(frontX, 0, width, height);
        warmGradient.addColorStop(0, '#FF6B6B');
        warmGradient.addColorStop(1, '#FFB6C1');
        ctx.fillStyle = warmGradient;
        ctx.fillRect(frontX, 0, width - frontX, height);
        
        // 绘制准静止锋（三角形和半圆交替）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(frontX, 0);
        ctx.lineTo(frontX, height);
        ctx.stroke();
        
        const size = 15;
        for (let y = 50; y < height - 50; y += 40) {
            if (Math.floor(y / 40) % 2 === 0) {
                // 三角形
                ctx.beginPath();
                ctx.moveTo(frontX, y);
                ctx.lineTo(frontX + size, y - size / 2);
                ctx.lineTo(frontX + size, y + size / 2);
                ctx.closePath();
                ctx.fillStyle = '#000';
                ctx.fill();
            } else {
                // 半圆
                ctx.beginPath();
                ctx.arc(frontX, y, size, -Math.PI / 2, Math.PI / 2);
                ctx.stroke();
            }
        }
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('准静止锋（如：梅雨、贵阳冬雨）', frontX, 30);
        ctx.fillText('冷气团', frontX / 2, centerY);
        ctx.fillText('暖气团', (frontX + width) / 2, centerY);
        
        // 绘制长时间连续性降水
        this.drawContinuousRain(ctx, frontX - 100, centerY - 50);
        this.drawContinuousRain(ctx, frontX, centerY);
        this.drawContinuousRain(ctx, frontX + 100, centerY + 50);
    }

    drawCyclone(ctx, width, height) {
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const radius = 150;
        
        // 绘制等压线（闭合圆圈，数值向内递减）
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const r = radius - i * 30;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`100${5 - i}`, centerX, centerY - r - 10);
        }
        
        // 标注低压中心
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('L', centerX, centerY + 5);
        ctx.fillText('气旋（低压）', centerX, centerY + 30);
        
        // 绘制旋转气流（北半球逆时针）
        const numArrows = 8;
        for (let i = 0; i < numArrows; i++) {
            const angle = (i / numArrows) * Math.PI * 2 + this.animationFrame * 0.05;
            const arrowX = centerX + Math.cos(angle) * (radius - 40);
            const arrowY = centerY + Math.sin(angle) * (radius - 40);
            const tangentAngle = angle + Math.PI / 2; // 逆时针方向
            
            this.drawArrow(ctx, arrowX, arrowY, tangentAngle, '#9C27B0', 20);
        }
        
        // 绘制上升气流
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - 100);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FF6B6B';
        ctx.font = '12px Arial';
        ctx.fillText('上升气流', centerX + 20, centerY - 50);
        
        // 绘制云和降水
        this.drawClouds(ctx, centerX, centerY - 80, '#666');
        this.drawRain(ctx, centerX, centerY - 40);
    }

    drawAnticyclone(ctx, width, height) {
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const radius = 150;
        
        // 绘制等压线（闭合圆圈，数值向内递增）
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const r = radius - i * 30;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`101${5 + i}`, centerX, centerY - r - 10);
        }
        
        // 标注高压中心
        ctx.fillStyle = '#0000FF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('H', centerX, centerY + 5);
        ctx.fillText('反气旋（高压）', centerX, centerY + 30);
        
        // 绘制旋转气流（北半球顺时针）
        const numArrows = 8;
        for (let i = 0; i < numArrows; i++) {
            const angle = (i / numArrows) * Math.PI * 2 - this.animationFrame * 0.05;
            const arrowX = centerX + Math.cos(angle) * (radius - 40);
            const arrowY = centerY + Math.sin(angle) * (radius - 40);
            const tangentAngle = angle - Math.PI / 2; // 顺时针方向
            
            this.drawArrow(ctx, arrowX, arrowY, tangentAngle, '#4A90E2', 20);
        }
        
        // 绘制下沉气流
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 100);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#4A90E2';
        ctx.font = '12px Arial';
        ctx.fillText('下沉气流', centerX + 20, centerY + 50);
        
        // 绘制晴朗天气（太阳）
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 80, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFrontalCyclone(ctx, width, height) {
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const radius = 150;
        
        // 绘制气旋等压线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const r = radius - i * 40;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 标注低压中心
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('L', centerX, centerY + 5);
        
        // 绘制暖锋（东侧）
        const warmFrontAngle = -Math.PI / 4;
        const warmFrontX = centerX + Math.cos(warmFrontAngle) * radius;
        const warmFrontY = centerY + Math.sin(warmFrontAngle) * radius;
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(warmFrontX, warmFrontY);
        ctx.stroke();
        
        // 暖锋半圆
        const circleRadius = 12;
        for (let d = 30; d < radius - 20; d += 30) {
            const x = centerX + Math.cos(warmFrontAngle) * d;
            const y = centerY + Math.sin(warmFrontAngle) * d;
            ctx.beginPath();
            ctx.arc(x, y, circleRadius, warmFrontAngle - Math.PI / 2, warmFrontAngle + Math.PI / 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#FF6B6B';
        ctx.font = '12px Arial';
        ctx.fillText('暖锋', warmFrontX + 20, warmFrontY);
        
        // 绘制冷锋（西侧）
        const coldFrontAngle = Math.PI + Math.PI / 4;
        const coldFrontX = centerX + Math.cos(coldFrontAngle) * radius;
        const coldFrontY = centerY + Math.sin(coldFrontAngle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(coldFrontX, coldFrontY);
        ctx.stroke();
        
        // 冷锋三角形
        const triangleSize = 15;
        for (let d = 30; d < radius - 20; d += 30) {
            const x = centerX + Math.cos(coldFrontAngle) * d;
            const y = centerY + Math.sin(coldFrontAngle) * d;
            const perpAngle = coldFrontAngle + Math.PI / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(perpAngle) * triangleSize, y + Math.sin(perpAngle) * triangleSize);
            ctx.lineTo(x - Math.cos(perpAngle) * triangleSize, y - Math.sin(perpAngle) * triangleSize);
            ctx.closePath();
            ctx.fillStyle = '#000';
            ctx.fill();
        }
        
        ctx.fillStyle = '#4A90E2';
        ctx.fillText('冷锋', coldFrontX - 40, coldFrontY);
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('锋面气旋', centerX, 30);
        ctx.fillText('多阴雨天气', centerX, height - 30);
        
        // 绘制降水
        this.drawRain(ctx, warmFrontX, warmFrontY);
        this.drawRain(ctx, coldFrontX, coldFrontY);
    }

    drawClouds(ctx, x, y, color) {
        ctx.fillStyle = color || 'rgba(200, 200, 200, 0.8)';
        const size = 40;
        ctx.beginPath();
        ctx.arc(x - size * 0.5, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRain(ctx, x, y) {
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 2;
        for (let i = -20; i <= 20; i += 10) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i + 3, y + 15);
            ctx.stroke();
        }
    }

    drawContinuousRain(ctx, x, y) {
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 1;
        for (let i = -30; i <= 30; i += 5) {
            for (let j = 0; j < 50; j += 10) {
                ctx.beginPath();
                ctx.moveTo(x + i, y + j);
                ctx.lineTo(x + i + 2, y + j + 8);
                ctx.stroke();
            }
        }
    }

    drawArrow(ctx, x, y, angle, color, length) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 箭头
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - length * 0.3 * Math.cos(angle - Math.PI / 6), 
                   endY - length * 0.3 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - length * 0.3 * Math.cos(angle + Math.PI / 6), 
                   endY - length * 0.3 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    animate() {
        if (this.isAnimating) {
            this.animationFrame++;
            if (this.viewMode === '2d') {
                this.draw();
            } else if (this.threeRenderer) {
                this.draw3D();
            }
            requestAnimationFrame(() => this.animate());
        }
    }

    toggleView() {
        const canvasContainer = this.canvas.parentElement;
        const container3D = document.getElementById('weather-3d-container');
        
        if (this.viewMode === '2d') {
            // 切换到3D视图
            this.viewMode = '3d';
            this.canvas.style.display = 'none';
            container3D.style.display = 'block';
            
            if (!this.threeRenderer) {
                this.init3D();
            }
            this.draw3D();
        } else {
            // 切换到2D视图
            this.viewMode = '2d';
            this.canvas.style.display = 'block';
            container3D.style.display = 'none';
            this.draw();
        }
    }

    init3D() {
        const container3D = document.getElementById('weather-3d-container');
        if (!container3D) return;
        
        this.threeRenderer = new Three3DRenderer('weather-3d-container');
        
        // 创建地面平面
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B7355,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        this.threeRenderer.scene.add(ground);
    }

    draw3D() {
        if (!this.threeRenderer) return;
        
        // 清除之前的天气对象
        this.weatherObjects.forEach(obj => {
            this.threeRenderer.scene.remove(obj);
        });
        this.weatherObjects = [];
        
        if (this.currentType === 'cyclone' || this.currentType === 'anticyclone') {
            // 气旋/反气旋：创建3D螺旋结构
            const isCyclone = this.currentType === 'cyclone';
            const color = isCyclone ? 0xff0000 : 0x0000ff;
            
            // 创建螺旋粒子系统
            const particleCount = 100;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 4;
                const radius = 0.5 + (i / particleCount) * 2;
                const height = (i / particleCount) * 1.5;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = height;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
                
                colors[i * 3] = (color >> 16) / 255;
                colors[i * 3 + 1] = ((color >> 8) & 0xff) / 255;
                colors[i * 3 + 2] = (color & 0xff) / 255;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const material = new THREE.PointsMaterial({
                size: 0.1,
                vertexColors: true
            });
            
            const particles = new THREE.Points(geometry, material);
            particles.position.y = 0;
            this.threeRenderer.scene.add(particles);
            this.weatherObjects.push(particles);
        } else if (this.currentType === 'cold-front' || this.currentType === 'warm-front') {
            // 锋面：创建3D锋面结构
            const isCold = this.currentType === 'cold-front';
            const frontColor = isCold ? 0x0000ff : 0xff0000;
            
            // 创建锋面平面
            const frontGeometry = new THREE.PlaneGeometry(4, 2);
            const frontMaterial = new THREE.MeshPhongMaterial({
                color: frontColor,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const front = new THREE.Mesh(frontGeometry, frontMaterial);
            front.rotation.y = Math.PI / 4;
            front.position.y = 0.5;
            this.threeRenderer.scene.add(front);
            this.weatherObjects.push(front);
            
            // 添加箭头指示移动方向
            const arrowHelper = new THREE.ArrowHelper(
                new THREE.Vector3(isCold ? 1 : -1, 0, 0),
                new THREE.Vector3(isCold ? -2 : 2, 0.5, 0),
                1,
                frontColor,
                0.3,
                0.2
            );
            this.threeRenderer.scene.add(arrowHelper);
            this.weatherObjects.push(arrowHelper);
        }
    }

    onActivate() {
        this.updateInfo();
        if (this.viewMode === '2d') {
            this.draw();
        } else if (this.threeRenderer) {
            this.draw3D();
        } else {
            this.draw();
        }
    }
}
