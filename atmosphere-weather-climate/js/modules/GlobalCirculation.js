// 全球性大气环流可视化模块
class GlobalCirculation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentType = 'three-cell';
        this.isAnimating = false;
        this.animationFrame = 0;
        this.season = 'summer'; // summer, winter
        this.viewMode = '2d'; // '2d' or '3d'
        this.threeRenderer = null;
        this.pressureBelts = [];
        this.windField = null;
        
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
        const viewToggleBtn = document.getElementById('view-toggle-circulation');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                this.toggleView();
                viewToggleBtn.textContent = this.viewMode === '2d' ? '切换到3D视图' : '切换到2D视图';
            });
        }
        
        // 环流类型选择
        const circButtons = document.querySelectorAll('.circ-btn');
        circButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                circButtons.forEach(b => b.classList.remove('active'));
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
        
        // 季节选择
        const seasonSelector = document.getElementById('season-selector');
        if (seasonSelector) {
            seasonSelector.addEventListener('change', (e) => {
                this.season = e.target.value;
                if (this.viewMode === '2d') {
                    this.draw();
                } else {
                    this.draw3D();
                }
            });
        }
        
        // 动画按钮
        const animateBtn = document.getElementById('animate-circulation');
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
        const infoSection = document.getElementById('circulation-info');
        if (!infoSection) return;
        
        const info = {
            'three-cell': {
                title: '三圈环流',
                content: '<p>低纬环流、中纬环流、高纬环流，形成：</p><ul><li>赤道低气压带</li><li>副热带高气压带</li><li>副极地低气压带</li><li>极地高气压带</li></ul>'
            },
            'pressure-belts': {
                title: '气压带风带的季节移动',
                content: '<p>随太阳直射点移动：</p><ul><li>北半球夏季：气压带风带北移</li><li>北半球冬季：气压带风带南移</li><li>移动幅度约5-10个纬度</li></ul>'
            },
            'monsoon': {
                title: '季风环流',
                content: '<p><strong>东亚季风</strong>：</p><ul><li>夏季：东南风（来自海洋，湿润）</li><li>冬季：西北风（来自大陆，干燥）</li><li>成因：海陆热力性质差异</li></ul><p><strong>南亚季风</strong>：</p><ul><li>夏季：西南风</li><li>冬季：东北风</li><li>成因：气压带风带移动 + 海陆热力性质差异</li></ul>'
            }
        };
        
        const currentInfo = info[this.currentType] || info['three-cell'];
        infoSection.innerHTML = `<h3>${currentInfo.title}</h3>${currentInfo.content}`;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        switch (this.currentType) {
            case 'three-cell':
                this.drawThreeCellCirculation(ctx, width, height);
                break;
            case 'pressure-belts':
                this.drawPressureBelts(ctx, width, height);
                break;
            case 'monsoon':
                this.drawMonsoon(ctx, width, height);
                break;
        }
    }

    drawThreeCellCirculation(ctx, width, height) {
        // 绘制地球剖面（从赤道到极地）
        const equatorY = height * 0.5;
        const northPoleY = height * 0.1;
        const southPoleY = height * 0.9;
        
        // 绘制地面
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, equatorY);
        ctx.lineTo(width, equatorY);
        ctx.stroke();
        
        // 标注纬度
        const latitudes = [
            { name: '90°N 极地', y: northPoleY },
            { name: '60°N 副极地', y: northPoleY + (equatorY - northPoleY) * 0.4 },
            { name: '30°N 副热带', y: northPoleY + (equatorY - northPoleY) * 0.7 },
            { name: '0° 赤道', y: equatorY },
            { name: '30°S 副热带', y: equatorY + (southPoleY - equatorY) * 0.3 },
            { name: '60°S 副极地', y: equatorY + (southPoleY - equatorY) * 0.6 },
            { name: '90°S 极地', y: southPoleY }
        ];
        
        latitudes.forEach(lat => {
            ctx.strokeStyle = '#CCC';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(0, lat.y);
            ctx.lineTo(width, lat.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(lat.name, 10, lat.y + 3);
        });
        
        // 绘制三圈环流（北半球）
        const centerX = width * 0.5;
        
        // 低纬环流（0°-30°N）
        const lowLatTop = northPoleY + (equatorY - northPoleY) * 0.7;
        const lowLatBottom = equatorY;
        this.drawCell(ctx, centerX - width * 0.3, lowLatBottom, lowLatTop, '#FF6B6B', '低纬环流');
        
        // 中纬环流（30°N-60°N）
        const midLatTop = northPoleY + (equatorY - northPoleY) * 0.4;
        const midLatBottom = lowLatTop;
        this.drawCell(ctx, centerX - width * 0.15, midLatBottom, midLatTop, '#4A90E2', '中纬环流');
        
        // 高纬环流（60°N-90°N）
        const highLatTop = northPoleY;
        const highLatBottom = midLatTop;
        this.drawCell(ctx, centerX, highLatBottom, highLatTop, '#9C27B0', '高纬环流');
        
        // 绘制气压带
        this.drawPressureBelt(ctx, width * 0.3, equatorY, '#FF0000', '赤道低气压带', 'L');
        this.drawPressureBelt(ctx, width * 0.3, lowLatTop, '#0000FF', '副热带高气压带', 'H');
        this.drawPressureBelt(ctx, width * 0.3, midLatTop, '#FF0000', '副极地低气压带', 'L');
        this.drawPressureBelt(ctx, width * 0.3, northPoleY, '#0000FF', '极地高气压带', 'H');
        
        // 绘制风带
        this.drawWindBelt(ctx, width * 0.6, (lowLatTop + lowLatBottom) / 2, '#FFA500', '信风带', '←');
        this.drawWindBelt(ctx, width * 0.6, (midLatTop + midLatBottom) / 2, '#00FF00', '西风带', '→');
        this.drawWindBelt(ctx, width * 0.6, (highLatTop + highLatBottom) / 2, '#FF00FF', '极地东风带', '←');
    }

    drawCell(ctx, x, bottomY, topY, color, label) {
        // 绘制环流圈
        const centerY = (topY + bottomY) / 2;
        const radius = Math.abs(topY - bottomY) / 2;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // 上升气流
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x, centerY);
        ctx.stroke();
        
        // 下降气流
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x, topY);
        ctx.stroke();
        
        // 水平气流（顶部和底部）
        const horizontalLength = radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(x - horizontalLength, centerY);
        ctx.lineTo(x + horizontalLength, centerY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // 绘制箭头
        this.drawArrow(ctx, x, bottomY, x, centerY, color);
        this.drawArrow(ctx, x, centerY, x, topY, color);
        this.drawArrow(ctx, x - horizontalLength, centerY, x + horizontalLength, centerY, color);
        
        // 标签
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, centerY - radius - 10);
    }

    drawPressureBelt(ctx, x, y, color, label, symbol) {
        ctx.fillStyle = color;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, x, y);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(label, x, y + 15);
    }

    drawWindBelt(ctx, x, y, color, label, direction) {
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(direction, x, y);
        
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(label, x, y + 15);
    }

    drawPressureBelts(ctx, width, height) {
        const equatorY = height * 0.5;
        const offset = this.season === 'summer' ? -20 : (this.season === 'winter' ? 20 : 0);
        
        // 绘制移动前后的气压带
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`北半球${this.season === 'summer' ? '夏季' : this.season === 'winter' ? '冬季' : '春秋'}`, width * 0.5, 30);
        
        // 绘制气压带（原始位置）
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        this.drawPressureBeltLine(ctx, width, equatorY, '原始位置');
        
        // 绘制气压带（移动后位置）
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        this.drawPressureBeltLine(ctx, width, equatorY + offset, '移动后位置');
        
        // 标注移动方向
        if (offset !== 0) {
            ctx.fillStyle = '#FF0000';
            ctx.font = '12px Arial';
            ctx.fillText(offset < 0 ? '北移' : '南移', width * 0.5, equatorY + offset / 2);
        }
    }

    drawPressureBeltLine(ctx, width, equatorY, label) {
        const belts = [
            { y: equatorY - 200, name: '极地高气压带' },
            { y: equatorY - 120, name: '副极地低气压带' },
            { y: equatorY - 60, name: '副热带高气压带' },
            { y: equatorY, name: '赤道低气压带' },
            { y: equatorY + 60, name: '副热带高气压带' },
            { y: equatorY + 120, name: '副极地低气压带' },
            { y: equatorY + 200, name: '极地高气压带' }
        ];
        
        belts.forEach(belt => {
            ctx.beginPath();
            ctx.moveTo(0, belt.y);
            ctx.lineTo(width, belt.y);
            ctx.stroke();
            
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(belt.name, 10, belt.y + 3);
        });
    }

    drawMonsoon(ctx, width, height) {
        const isSummer = this.season === 'summer';
        const centerY = height * 0.5;
        const landX = width * 0.3;
        const seaX = width * 0.7;
        
        // 绘制大陆和海洋
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, centerY - 100, width * 0.4, 200);
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(width * 0.4, centerY - 100, width * 0.6, 200);
        
        // 标注
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('大陆', landX, centerY);
        ctx.fillText('海洋', seaX, centerY);
        ctx.fillText(isSummer ? '夏季' : '冬季', width * 0.5, 30);
        
        if (isSummer) {
            // 夏季：从海洋吹向大陆（东南风/西南风）
            this.drawMonsoonWind(ctx, seaX, centerY, landX, centerY, '#9C27B0', isSummer ? '东南风/西南风' : '西北风/东北风');
            
            // 标注
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('东亚：东南风', width * 0.5, centerY - 50);
            ctx.fillText('南亚：西南风', width * 0.5, centerY + 50);
        } else {
            // 冬季：从大陆吹向海洋（西北风/东北风）
            this.drawMonsoonWind(ctx, landX, centerY, seaX, centerY, '#9C27B0', isSummer ? '东南风/西南风' : '西北风/东北风');
            
            // 标注
            ctx.fillStyle = '#9C27B0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('东亚：西北风', width * 0.5, centerY - 50);
            ctx.fillText('南亚：东北风', width * 0.5, centerY + 50);
        }
    }

    drawMonsoonWind(ctx, x1, y1, x2, y2, color, label) {
        // 绘制多条风线
        for (let i = -2; i <= 2; i++) {
            const offsetY = i * 20;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(x1, y1 + offsetY);
            ctx.lineTo(x2, y2 + offsetY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 箭头
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowLength = 15;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 + offsetY;
            
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX + arrowLength * Math.cos(angle - Math.PI / 6), 
                       midY + arrowLength * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX + arrowLength * Math.cos(angle + Math.PI / 6), 
                       midY + arrowLength * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    }

    drawArrow(ctx, x1, y1, x2, y2, color) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + arrowLength * Math.cos(angle - Math.PI / 6), 
                   midY + arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + arrowLength * Math.cos(angle + Math.PI / 6), 
                   midY + arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    animate() {
        if (this.isAnimating) {
            this.animationFrame++;
            // 可以添加动画效果
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    toggleView() {
        const canvasContainer = this.canvas.parentElement;
        const container3D = document.getElementById('circulation-3d-container');
        
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
        const container3D = document.getElementById('circulation-3d-container');
        if (!container3D) return;
        
        this.threeRenderer = new Three3DRenderer('circulation-3d-container');
        
        // 创建地球
        this.threeRenderer.createEarth(2, true);
    }

    draw3D() {
        if (!this.threeRenderer) return;
        
        // 清除之前的气压带和风场
        this.pressureBelts.forEach(belt => {
            this.threeRenderer.scene.remove(belt);
        });
        this.pressureBelts = [];
        
        if (this.windField) {
            this.threeRenderer.scene.remove(this.windField);
            this.windField = null;
        }
        
        if (this.currentType === 'three-cell' || this.currentType === 'pressure-belts') {
            // 绘制气压带
            const belts = [
                { lat: 0, width: 10, color: 0xff0000, name: '赤道低气压带' },
                { lat: 30, width: 8, color: 0x0000ff, name: '副热带高气压带' },
                { lat: -30, width: 8, color: 0x0000ff, name: '副热带高气压带' },
                { lat: 60, width: 8, color: 0xff0000, name: '副极地低气压带' },
                { lat: -60, width: 8, color: 0xff0000, name: '副极地低气压带' },
                { lat: 90, width: 5, color: 0x0000ff, name: '极地高气压带' },
                { lat: -90, width: 5, color: 0x0000ff, name: '极地高气压带' }
            ];
            
            belts.forEach(belt => {
                const beltMesh = this.threeRenderer.createPressureBelt(2, belt.lat, belt.width, belt.color, belt.name);
                this.pressureBelts.push(beltMesh);
            });
            
            // 创建风场可视化
            const windData = [];
            for (let lat = -80; lat <= 80; lat += 10) {
                for (let lon = -180; lon <= 180; lon += 20) {
                    // 简化的风向计算（基于三圈环流模型）
                    let direction = 0;
                    let speed = 0.5;
                    
                    if (Math.abs(lat) < 30) {
                        // 低纬：信风带
                        direction = lat > 0 ? 225 : 135; // 东北信风/东南信风
                    } else if (Math.abs(lat) < 60) {
                        // 中纬：西风带
                        direction = lat > 0 ? 270 : 270;
                    } else {
                        // 高纬：极地东风
                        direction = lat > 0 ? 90 : 90;
                    }
                    
                    windData.push({ lat, lon, direction, speed });
                }
            }
            
            this.windField = this.threeRenderer.createWindField(2, windData);
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
