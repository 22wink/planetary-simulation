// 大气运动可视化模块
class AtmosphereMotion {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentType = 'thermal';
        this.isAnimating = false;
        this.animationFrame = 0;
        this.time = 12; // 12点（正午）
        
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
        // 运动类型选择
        const motionButtons = document.querySelectorAll('.motion-btn');
        motionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                motionButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentType = btn.dataset.type;
                this.updateInfo();
                this.draw();
            });
        });
        
        // 时间滑块
        const timeSlider = document.getElementById('time-slider');
        const timeDisplay = document.getElementById('time-display');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                this.time = parseFloat(e.target.value);
                if (timeDisplay) {
                    const hours = Math.floor(this.time);
                    const minutes = Math.floor((this.time - hours) * 60);
                    timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
                this.draw();
            });
        }
        
        // 动画按钮
        const animateBtn = document.getElementById('animate-motion');
        if (animateBtn) {
            animateBtn.addEventListener('click', () => {
                this.isAnimating = !this.isAnimating;
                animateBtn.textContent = this.isAnimating ? '暂停动画' : '播放动画';
                if (this.isAnimating) {
                    this.animate();
                }
            });
        }
    }

    updateInfo() {
        const infoSection = document.getElementById('motion-info');
        if (!infoSection) return;
        
        const info = {
            'thermal': {
                title: '热力环流',
                content: '<p>最基本的大气运动形式。受热地区空气上升，受冷地区空气下沉，形成环流。</p><ul><li><strong>海陆风</strong>：白天吹海风，夜晚吹陆风</li><li><strong>山谷风</strong>：白天吹谷风，夜晚吹山风</li><li><strong>城市风</strong>：城市热岛效应形成的环流</li></ul>'
            },
            'sea-land': {
                title: '海陆风',
                content: '<p>由于海陆热力性质差异形成的环流。</p><ul><li><strong>海风</strong>：白天，陆地升温快，形成低压，海洋升温慢，形成高压，风从海洋吹向陆地</li><li><strong>陆风</strong>：夜晚，陆地降温快，形成高压，海洋降温慢，形成低压，风从陆地吹向海洋</li></ul>'
            },
            'valley': {
                title: '山谷风',
                content: '<p>由于山坡与谷地热力差异形成的环流。</p><ul><li><strong>谷风</strong>：白天，山坡升温快，空气上升，谷地空气补充，形成从谷地吹向山坡的风</li><li><strong>山风</strong>：夜晚，山坡降温快，空气下沉，形成从山坡吹向谷地的风</li></ul>'
            },
            'wind-force': {
                title: '风的受力分析',
                content: '<p>风的形成受多种力的作用：</p><ul><li><strong>水平气压梯度力</strong>：风的直接动力，垂直于等压线，由高压指向低压</li><li><strong>地转偏向力</strong>：使风向发生偏转（北半球右偏，南半球左偏）</li><li><strong>摩擦力</strong>：近地面风受摩擦力影响，风向斜穿等压线；高空风仅受前两者，风向平行等压线</li></ul>'
            }
        };
        
        const currentInfo = info[this.currentType] || info['thermal'];
        infoSection.innerHTML = `<h3>${currentInfo.title}</h3>${currentInfo.content}`;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        switch (this.currentType) {
            case 'thermal':
                this.drawThermalCirculation(ctx, width, height);
                break;
            case 'sea-land':
                this.drawSeaLandBreeze(ctx, width, height);
                break;
            case 'valley':
                this.drawValleyWind(ctx, width, height);
                break;
            case 'wind-force':
                this.drawWindForces(ctx, width, height);
                break;
        }
    }

    drawThermalCirculation(ctx, width, height) {
        // 绘制热力环流
        const centerX = width * 0.5;
        const groundY = height * 0.8;
        const hotX = width * 0.3;
        const coldX = width * 0.7;
        
        // 绘制地面
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, groundY, width, height - groundY);
        
        // 标注热区和冷区
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('受热区', hotX, groundY + 30);
        
        ctx.fillStyle = '#4A90E2';
        ctx.fillText('受冷区', coldX, groundY + 30);
        
        // 绘制上升气流（受热区）
        const upFlowY = groundY - 150;
        this.drawAirFlow(ctx, hotX, groundY, hotX, upFlowY, '#FF6B6B', true);
        
        // 绘制下沉气流（受冷区）
        this.drawAirFlow(ctx, coldX, upFlowY, coldX, groundY, '#4A90E2', false);
        
        // 绘制高空水平气流
        const highY = upFlowY - 20;
        this.drawHorizontalFlow(ctx, hotX, highY, coldX, highY, '#FFA500');
        
        // 绘制低空水平气流
        const lowY = groundY + 10;
        this.drawHorizontalFlow(ctx, coldX, lowY, hotX, lowY, '#9C27B0');
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('上升气流', hotX - 30, upFlowY - 10);
        ctx.fillText('下沉气流', coldX + 30, upFlowY - 10);
        ctx.fillText('高空水平气流', centerX, highY - 20);
        ctx.fillText('低空水平气流', centerX, lowY + 20);
    }

    drawSeaLandBreeze(ctx, width, height) {
        const isDay = this.time >= 6 && this.time <= 18;
        const seaX = width * 0.25;
        const landX = width * 0.75;
        const groundY = height * 0.8;
        
        // 绘制海洋和陆地
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(0, groundY, width * 0.5, height - groundY);
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(width * 0.5, groundY, width * 0.5, height - groundY);
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('海洋', seaX, groundY + 30);
        ctx.fillText('陆地', landX, groundY + 30);
        ctx.fillText(isDay ? '白天' : '夜晚', width * 0.5, 30);
        
        if (isDay) {
            // 白天：海风（从海洋吹向陆地）
            // 陆地升温快，空气上升
            this.drawAirFlow(ctx, landX, groundY, landX, groundY - 150, '#FF6B6B', true);
            // 海洋升温慢，空气下沉
            this.drawAirFlow(ctx, seaX, groundY - 150, seaX, groundY, '#4A90E2', false);
            // 高空：从陆地流向海洋
            this.drawHorizontalFlow(ctx, landX, groundY - 170, seaX, groundY - 170, '#FFA500');
            // 低空：从海洋流向陆地（海风）
            this.drawHorizontalFlow(ctx, seaX, groundY + 10, landX, groundY + 10, '#9C27B0');
            
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('海风', width * 0.5, groundY + 40);
        } else {
            // 夜晚：陆风（从陆地吹向海洋）
            // 陆地降温快，空气下沉
            this.drawAirFlow(ctx, landX, groundY - 150, landX, groundY, '#4A90E2', false);
            // 海洋降温慢，空气上升
            this.drawAirFlow(ctx, seaX, groundY, seaX, groundY - 150, '#FF6B6B', true);
            // 高空：从海洋流向陆地
            this.drawHorizontalFlow(ctx, seaX, groundY - 170, landX, groundY - 170, '#FFA500');
            // 低空：从陆地流向海洋（陆风）
            this.drawHorizontalFlow(ctx, landX, groundY + 10, seaX, groundY + 10, '#9C27B0');
            
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('陆风', width * 0.5, groundY + 40);
        }
    }

    drawValleyWind(ctx, width, height) {
        const isDay = this.time >= 6 && this.time <= 18;
        const valleyX = width * 0.5;
        const leftMountainX = width * 0.2;
        const rightMountainX = width * 0.8;
        const groundY = height * 0.8;
        const mountainTopY = groundY - 200;
        
        // 绘制山谷
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(leftMountainX, mountainTopY);
        ctx.lineTo(valleyX, groundY - 50);
        ctx.lineTo(rightMountainX, mountainTopY);
        ctx.lineTo(width, groundY);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isDay ? '白天' : '夜晚', width * 0.5, 30);
        ctx.fillText('山坡', leftMountainX, mountainTopY - 20);
        ctx.fillText('山坡', rightMountainX, mountainTopY - 20);
        ctx.fillText('谷地', valleyX, groundY + 30);
        
        if (isDay) {
            // 白天：谷风（从谷地吹向山坡）
            this.drawAirFlow(ctx, leftMountainX, mountainTopY, leftMountainX, mountainTopY - 100, '#FF6B6B', true);
            this.drawAirFlow(ctx, rightMountainX, mountainTopY, rightMountainX, mountainTopY - 100, '#FF6B6B', true);
            this.drawHorizontalFlow(ctx, valleyX, groundY - 30, leftMountainX, mountainTopY - 50, '#9C27B0');
            this.drawHorizontalFlow(ctx, valleyX, groundY - 30, rightMountainX, mountainTopY - 50, '#9C27B0');
            
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('谷风', width * 0.5, groundY - 60);
        } else {
            // 夜晚：山风（从山坡吹向谷地）
            this.drawAirFlow(ctx, leftMountainX, mountainTopY - 100, leftMountainX, mountainTopY, '#4A90E2', false);
            this.drawAirFlow(ctx, rightMountainX, mountainTopY - 100, rightMountainX, mountainTopY, '#4A90E2', false);
            this.drawHorizontalFlow(ctx, leftMountainX, mountainTopY - 50, valleyX, groundY - 30, '#9C27B0');
            this.drawHorizontalFlow(ctx, rightMountainX, mountainTopY - 50, valleyX, groundY - 30, '#9C27B0');
            
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('山风', width * 0.5, groundY - 60);
        }
    }

    drawWindForces(ctx, width, height) {
        // 绘制等压线
        const centerY = height * 0.5;
        const highPressureX = width * 0.3;
        const lowPressureX = width * 0.7;
        
        // 绘制高压和低压中心
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // 高压等压线（闭合圆圈，数值大）
        for (let i = 0; i < 3; i++) {
            const radius = 40 + i * 20;
            ctx.beginPath();
            ctx.arc(highPressureX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`101${5 + i}`, highPressureX, centerY - radius - 10);
        }
        
        // 低压等压线（闭合圆圈，数值小）
        for (let i = 0; i < 3; i++) {
            const radius = 40 + i * 20;
            ctx.beginPath();
            ctx.arc(lowPressureX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillText(`100${5 - i}`, lowPressureX, centerY - radius - 10);
        }
        
        // 标注
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('高压', highPressureX, centerY + 5);
        ctx.fillText('低压', lowPressureX, centerY + 5);
        
        // 绘制近地面风（受三个力）
        const windStartX = width * 0.45;
        const windStartY = centerY + 80;
        const windEndX = width * 0.55;
        const windEndY = centerY + 40;
        
        // 水平气压梯度力（垂直于等压线）
        this.drawForce(ctx, windStartX, windStartY, lowPressureX, centerY, '#FF0000', '水平气压梯度力');
        
        // 地转偏向力（垂直于风向，北半球右偏）
        const windAngle = Math.atan2(windEndY - windStartY, windEndX - windStartX);
        const coriolisX = windStartX + Math.cos(windAngle + Math.PI / 2) * 30;
        const coriolisY = windStartY + Math.sin(windAngle + Math.PI / 2) * 30;
        this.drawForce(ctx, windStartX, windStartY, coriolisX, coriolisY, '#00FF00', '地转偏向力');
        
        // 摩擦力（与风向相反）
        const frictionX = windStartX - Math.cos(windAngle) * 20;
        const frictionY = windStartY - Math.sin(windAngle) * 20;
        this.drawForce(ctx, windStartX, windStartY, frictionX, frictionY, '#0000FF', '摩擦力');
        
        // 实际风向（斜穿等压线）
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(windStartX, windStartY);
        ctx.lineTo(windEndX, windEndY);
        ctx.stroke();
        
        ctx.fillStyle = '#FF00FF';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('近地面风向（斜穿等压线）', windEndX + 10, windEndY);
        
        // 绘制高空风（仅受两个力，平行等压线）
        const highWindStartX = width * 0.45;
        const highWindStartY = centerY - 80;
        const highWindEndX = width * 0.55;
        const highWindEndY = centerY - 80;
        
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(highWindStartX, highWindStartY);
        ctx.lineTo(highWindEndX, highWindEndY);
        ctx.stroke();
        
        ctx.fillStyle = '#FF00FF';
        ctx.fillText('高空风向（平行等压线）', highWindEndX + 10, highWindEndY);
    }

    drawAirFlow(ctx, x1, y1, x2, y2, color, isUp) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 绘制箭头
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 15;
        const arrowX = x2;
        const arrowY = y2;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowLength * Math.cos(angle - Math.PI / 6), 
                   arrowY - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowLength * Math.cos(angle + Math.PI / 6), 
                   arrowY - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    drawHorizontalFlow(ctx, x1, y1, x2, y2, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 绘制箭头
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 15;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + arrowLength * Math.cos(angle - Math.PI / 6), 
                   midY + arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + arrowLength * Math.cos(angle + Math.PI / 6), 
                   midY + arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    drawForce(ctx, x1, y1, x2, y2, color, label) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // 箭头
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), 
                   y2 - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), 
                   y2 - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        
        // 标签
        ctx.fillStyle = color;
        ctx.font = '10px Arial';
        ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 5);
    }

    animate() {
        if (this.isAnimating) {
            this.animationFrame++;
            // 模拟时间变化
            this.time = 6 + (this.animationFrame % 1440) / 60;
            if (this.time > 24) this.time -= 24;
            
            // 更新时间滑块
            const timeSlider = document.getElementById('time-slider');
            if (timeSlider) {
                timeSlider.value = this.time;
            }
            const timeDisplay = document.getElementById('time-display');
            if (timeDisplay) {
                const hours = Math.floor(this.time);
                const minutes = Math.floor((this.time - hours) * 60);
                timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    onActivate() {
        this.updateInfo();
        this.draw();
    }
}
