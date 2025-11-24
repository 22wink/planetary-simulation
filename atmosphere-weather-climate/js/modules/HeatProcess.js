// 大气受热过程可视化模块
class HeatProcess {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isAnimating = false;
        this.isCloudy = false;
        this.animationFrame = 0;
        this.timeOfDay = 12; // 12点（正午）
        
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
        const cloudyCheckbox = document.getElementById('cloudy-mode');
        const animateBtn = document.getElementById('animate-heat');
        
        if (cloudyCheckbox) {
            cloudyCheckbox.addEventListener('change', (e) => {
                this.isCloudy = e.target.checked;
                this.draw();
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
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 绘制天空背景
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
        if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
            skyGradient.addColorStop(0, this.isCloudy ? '#B0BEC5' : '#87CEEB');
            skyGradient.addColorStop(1, this.isCloudy ? '#CFD8DC' : '#E0F6FF');
        } else {
            skyGradient.addColorStop(0, '#1A237E');
            skyGradient.addColorStop(1, '#283593');
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.7);
        
        // 绘制太阳
        if (this.timeOfDay >= 6 && this.timeOfDay <= 18) {
            const sunX = width * 0.5;
            const sunY = height * 0.2;
            const sunSize = 40;
            
            // 太阳光晕
            const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize * 2);
            sunGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            sunGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
            sunGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 太阳
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制太阳辐射（短波）
            this.drawSolarRadiation(ctx, sunX, sunY, width, height);
        }
        
        // 绘制云层（如果阴天）
        if (this.isCloudy) {
            this.drawClouds(ctx, width, height);
        }
        
        // 绘制地面
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
        
        // 绘制地面辐射（长波）
        this.drawGroundRadiation(ctx, width, height);
        
        // 绘制大气逆辐射
        this.drawAtmosphericRadiation(ctx, width, height);
        
        // 绘制标注
        this.drawLabels(ctx, width, height);
    }

    drawSolarRadiation(ctx, sunX, sunY, width, height) {
        // 太阳辐射线
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        
        const groundY = height * 0.7;
        const numRays = 8;
        
        for (let i = 0; i < numRays; i++) {
            const angle = -Math.PI / 2 + (i - numRays / 2) * 0.3;
            const rayLength = (groundY - sunY) / Math.cos(angle);
            const endX = sunX + Math.sin(angle) * rayLength;
            const endY = sunY + Math.cos(angle) * rayLength;
            
            ctx.beginPath();
            ctx.moveTo(sunX, sunY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // 标注：太阳辐射（短波）
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('太阳辐射（短波）', sunX, sunY - 60);
        
        // 绘制大气削弱作用
        if (this.isCloudy) {
            const cloudY = height * 0.3;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, cloudY - 20, width, 40);
            
            ctx.fillStyle = '#FF0000';
            ctx.font = '12px Arial';
            ctx.fillText('大气削弱作用（吸收、反射、散射）', width * 0.5, cloudY);
        }
    }

    drawClouds(ctx, width, height) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // 多层云
        for (let i = 0; i < 5; i++) {
            const x = (width / 6) * (i + 1);
            const y = height * 0.3 + Math.sin(i) * 10;
            const size = 50 + Math.sin(i) * 10;
            
            ctx.beginPath();
            ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
            ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
            ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawGroundRadiation(ctx, width, height) {
        const groundY = height * 0.7;
        const numRays = 6;
        
        // 地面辐射（长波，向上）
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < numRays; i++) {
            const x = (width / (numRays + 1)) * (i + 1);
            const angle = -Math.PI / 2 + (i - numRays / 2) * 0.2;
            const rayLength = 150;
            const endX = x + Math.sin(angle) * rayLength;
            const endY = groundY + Math.cos(angle) * rayLength;
            
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // 标注
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('地面辐射（长波）', width * 0.5, groundY - 80);
    }

    drawAtmosphericRadiation(ctx, width, height) {
        const groundY = height * 0.7;
        const atmosphereY = height * 0.4;
        const numRays = 6;
        
        // 大气逆辐射（长波，向下）
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        for (let i = 0; i < numRays; i++) {
            const x = (width / (numRays + 1)) * (i + 1);
            const angle = Math.PI / 2 + (i - numRays / 2) * 0.2;
            const rayLength = 100;
            const startX = x + Math.sin(angle) * rayLength;
            const startY = atmosphereY + Math.cos(angle) * rayLength;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, groundY);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // 标注
        ctx.fillStyle = '#4A90E2';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('大气逆辐射（保温作用）', width * 0.5, atmosphereY + 50);
        
        // 如果是阴天，加强标注
        if (this.isCloudy) {
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('阴天保温效果强，昼夜温差小', width * 0.5, groundY + 30);
        }
    }

    drawLabels(ctx, width, height) {
        // 绘制说明文字
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        const labels = [
            '关键点：大气主要直接热源是地面辐射，而非太阳辐射',
            '应用：解释昼夜温差、温室效应、霜冻预警等'
        ];
        
        labels.forEach((label, i) => {
            ctx.fillText(label, 20, height - 40 + i * 20);
        });
    }

    animate() {
        if (this.isAnimating) {
            this.animationFrame++;
            // 模拟一天的时间变化
            this.timeOfDay = 6 + (this.animationFrame % 1440) / 60; // 1440帧 = 24小时
            if (this.timeOfDay > 24) this.timeOfDay -= 24;
            
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    onActivate() {
        this.draw();
    }
}
