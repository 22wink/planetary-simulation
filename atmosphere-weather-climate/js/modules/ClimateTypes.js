// 气候类型可视化模块
class ClimateTypes {
    constructor(canvasId, chartCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.chartCanvas = document.getElementById(chartCanvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartCtx = this.chartCanvas.getContext('2d');
        this.currentClimate = null;
        
        this.climateData = {
            'tropical-rainforest': {
                name: '热带雨林气候',
                distribution: '赤道附近（0°-10°）',
                cause: '赤道低气压带控制，全年高温多雨',
                features: '全年高温多雨，年降水量>2000mm，气温年较差小',
                temp: [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
                precipitation: [250, 220, 280, 300, 280, 200, 180, 200, 220, 250, 280, 300],
                color: '#4CAF50'
            },
            'tropical-savanna': {
                name: '热带草原气候',
                distribution: '10°-20°纬度',
                cause: '赤道低气压带和信风带交替控制',
                features: '全年高温，分干湿两季，年降水量750-1000mm',
                temp: [28, 28, 27, 26, 24, 22, 22, 24, 26, 27, 28, 28],
                precipitation: [200, 180, 150, 50, 10, 5, 5, 10, 20, 50, 100, 180],
                color: '#FFC107'
            },
            'tropical-desert': {
                name: '热带沙漠气候',
                distribution: '20°-30°纬度（回归线附近）',
                cause: '副热带高气压带或信风带控制',
                features: '全年高温少雨，年降水量<250mm，昼夜温差大',
                temp: [32, 33, 35, 38, 40, 42, 42, 41, 39, 36, 33, 31],
                precipitation: [5, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3, 5],
                color: '#FF9800'
            },
            'tropical-monsoon': {
                name: '热带季风气候',
                distribution: '10°-25°纬度（南亚、东南亚）',
                cause: '气压带风带移动 + 海陆热力性质差异',
                features: '全年高温，分旱雨两季，年降水量1500-2000mm',
                temp: [26, 28, 32, 34, 33, 30, 29, 29, 29, 28, 26, 25],
                precipitation: [10, 15, 20, 50, 150, 300, 350, 300, 200, 100, 30, 10],
                color: '#9C27B0'
            },
            'subtropical-monsoon': {
                name: '亚热带季风气候',
                distribution: '25°-35°纬度（东亚）',
                cause: '海陆热力性质差异',
                features: '夏季高温多雨，冬季温和少雨，年降水量1000-1500mm',
                temp: [8, 9, 13, 18, 23, 27, 30, 29, 25, 19, 14, 10],
                precipitation: [50, 70, 100, 120, 150, 200, 180, 160, 100, 60, 50, 40],
                color: '#2196F3'
            },
            'mediterranean': {
                name: '地中海气候',
                distribution: '30°-40°纬度大陆西岸',
                cause: '副热带高气压带和西风带交替控制',
                features: '夏季炎热干燥，冬季温和多雨',
                temp: [12, 13, 15, 18, 22, 26, 28, 28, 25, 20, 16, 13],
                precipitation: [80, 70, 60, 40, 20, 10, 5, 8, 30, 70, 90, 100],
                color: '#E91E63'
            },
            'temperate-monsoon': {
                name: '温带季风气候',
                distribution: '35°-50°纬度（东亚）',
                cause: '海陆热力性质差异',
                features: '夏季高温多雨，冬季寒冷干燥，年降水量500-800mm',
                temp: [-5, -2, 4, 12, 19, 24, 26, 25, 19, 11, 3, -3],
                precipitation: [5, 8, 15, 30, 50, 100, 180, 150, 60, 30, 15, 8],
                color: '#3F51B5'
            },
            'temperate-oceanic': {
                name: '温带海洋性气候',
                distribution: '40°-60°纬度大陆西岸',
                cause: '全年受西风带控制',
                features: '全年温和湿润，年降水量700-1000mm，气温年较差小',
                temp: [5, 5, 7, 9, 12, 15, 17, 17, 15, 12, 8, 6],
                precipitation: [80, 60, 70, 60, 70, 60, 70, 80, 90, 100, 90, 90],
                color: '#00BCD4'
            },
            'temperate-continental': {
                name: '温带大陆性气候',
                distribution: '40°-60°纬度大陆内部',
                cause: '深居内陆，受海洋影响小',
                features: '冬冷夏热，年降水量<400mm，气温年较差大',
                temp: [-15, -12, -3, 8, 16, 22, 25, 23, 16, 7, -3, -12],
                precipitation: [10, 8, 15, 20, 30, 40, 50, 40, 30, 20, 15, 12],
                color: '#795548'
            }
        };
        
        this.setupCanvas();
        this.setupControls();
        this.draw();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const updateSize = () => {
            this.canvas.width = container.clientWidth - 40;
            this.canvas.height = Math.min(400, container.clientHeight - 40);
            this.draw();
        };
        
        const chartContainer = this.chartCanvas.parentElement;
        const updateChartSize = () => {
            this.chartCanvas.width = chartContainer.clientWidth - 40;
            this.chartCanvas.height = 300;
            if (this.currentClimate) {
                this.drawChart();
            }
        };
        
        updateSize();
        updateChartSize();
        window.addEventListener('resize', () => {
            updateSize();
            updateChartSize();
        });
    }

    setupControls() {
        const selector = document.getElementById('climate-type-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.currentClimate = e.target.value;
                if (this.currentClimate) {
                    this.updateInfo();
                    this.draw();
                    this.drawChart();
                }
            });
        }
    }

    updateInfo() {
        const infoSection = document.getElementById('climate-info');
        if (!infoSection || !this.currentClimate) return;
        
        const data = this.climateData[this.currentClimate];
        if (!data) return;
        
        infoSection.innerHTML = `
            <h3>${data.name}</h3>
            <p><strong>分布：</strong>${data.distribution}</p>
            <p><strong>成因：</strong>${data.cause}</p>
            <p><strong>特征：</strong>${data.features}</p>
            <h4>气候类型判读方法：</h4>
            <ul>
                <li><strong>以温定带</strong>：根据最冷月均温判断温度带
                    <ul>
                        <li>最冷月>15°C：热带</li>
                        <li>最冷月0-15°C：亚热带</li>
                        <li>最冷月<0°C：温带</li>
                    </ul>
                </li>
                <li><strong>以水定型</strong>：根据降水特征判断气候类型
                    <ul>
                        <li>全年多雨：热带雨林、温带海洋性</li>
                        <li>夏季多雨：季风气候</li>
                        <li>冬季多雨：地中海气候</li>
                        <li>全年少雨：沙漠气候、温带大陆性</li>
                    </ul>
                </li>
            </ul>
        `;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        if (!this.currentClimate) {
            // 绘制世界地图轮廓（简化版）
            ctx.fillStyle = '#E0F2F1';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('请从下拉菜单中选择气候类型', width / 2, height / 2);
            return;
        }
        
        const data = this.climateData[this.currentClimate];
        if (!data) return;
        
        // 绘制世界地图轮廓（简化版，标注气候分布区域）
        ctx.fillStyle = '#E0F2F1';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制纬度线
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        const latitudes = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        latitudes.forEach(lat => {
            ctx.beginPath();
            ctx.moveTo(0, height * lat);
            ctx.lineTo(width, height * lat);
            ctx.stroke();
        });
        ctx.setLineDash([]);
        
        // 标注纬度
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('90°N', 10, height * 0.1);
        ctx.fillText('60°N', 10, height * 0.2);
        ctx.fillText('30°N', 10, height * 0.3);
        ctx.fillText('0°', 10, height * 0.5);
        ctx.fillText('30°S', 10, height * 0.7);
        ctx.fillText('60°S', 10, height * 0.8);
        ctx.fillText('90°S', 10, height * 0.9);
        
        // 根据气候类型绘制分布区域
        this.drawClimateDistribution(ctx, width, height, this.currentClimate, data.color);
        
        // 标注
        ctx.fillStyle = data.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data.name + '分布区域', width / 2, 30);
    }

    drawClimateDistribution(ctx, width, height, climateType, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        
        // 根据气候类型绘制大致分布区域
        switch (climateType) {
            case 'tropical-rainforest':
                // 赤道附近
                ctx.fillRect(width * 0.2, height * 0.48, width * 0.6, height * 0.04);
                break;
            case 'tropical-savanna':
                // 10°-20°纬度
                ctx.fillRect(width * 0.2, height * 0.42, width * 0.6, height * 0.08);
                break;
            case 'tropical-desert':
                // 20°-30°纬度
                ctx.fillRect(width * 0.2, height * 0.32, width * 0.6, height * 0.10);
                break;
            case 'tropical-monsoon':
                // 10°-25°纬度（南亚、东南亚）
                ctx.fillRect(width * 0.5, height * 0.40, width * 0.3, height * 0.15);
                break;
            case 'subtropical-monsoon':
                // 25°-35°纬度（东亚）
                ctx.fillRect(width * 0.6, height * 0.30, width * 0.2, height * 0.10);
                break;
            case 'mediterranean':
                // 30°-40°纬度大陆西岸
                ctx.fillRect(width * 0.1, height * 0.28, width * 0.15, height * 0.12);
                break;
            case 'temperate-monsoon':
                // 35°-50°纬度（东亚）
                ctx.fillRect(width * 0.6, height * 0.20, width * 0.2, height * 0.15);
                break;
            case 'temperate-oceanic':
                // 40°-60°纬度大陆西岸
                ctx.fillRect(width * 0.1, height * 0.15, width * 0.15, height * 0.20);
                break;
            case 'temperate-continental':
                // 40°-60°纬度大陆内部
                ctx.fillRect(width * 0.3, height * 0.15, width * 0.4, height * 0.20);
                break;
        }
        
        ctx.globalAlpha = 1.0;
    }

    drawChart() {
        if (!this.currentClimate) return;
        
        const data = this.climateData[this.currentClimate];
        if (!data) return;
        
        const ctx = this.chartCtx;
        const width = this.chartCanvas.width;
        const height = this.chartCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 绘制坐标轴
        const margin = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // 背景
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);
        
        // 坐标轴
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // 月份标签
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const monthWidth = chartWidth / 12;
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        months.forEach((month, i) => {
            ctx.fillText(month, margin.left + i * monthWidth + monthWidth / 2, margin.top + chartHeight + 20);
        });
        
        // 温度范围
        const maxTemp = Math.max(...data.temp) + 5;
        const minTemp = Math.min(...data.temp) - 5;
        const tempRange = maxTemp - minTemp;
        
        // 降水量范围
        const maxPrecip = Math.max(...data.precipitation) * 1.2;
        
        // 绘制温度折线（左侧Y轴）
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.temp.forEach((temp, i) => {
            const x = margin.left + i * monthWidth + monthWidth / 2;
            const y = margin.top + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 绘制温度点
        ctx.fillStyle = data.color;
        data.temp.forEach((temp, i) => {
            const x = margin.left + i * monthWidth + monthWidth / 2;
            const y = margin.top + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 温度值
            ctx.fillStyle = '#333';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${temp}°C`, x, y - 8);
            ctx.fillStyle = data.color;
        });
        
        // 绘制降水量柱状图（右侧Y轴）
        const barWidth = monthWidth * 0.6;
        ctx.fillStyle = '#4A90E2';
        data.precipitation.forEach((precip, i) => {
            const x = margin.left + i * monthWidth + (monthWidth - barWidth) / 2;
            const barHeight = (precip / maxPrecip) * chartHeight * 0.8;
            const y = margin.top + chartHeight - barHeight;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 降水量值
            ctx.fillStyle = '#333';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${precip}mm`, x + barWidth / 2, y - 3);
            ctx.fillStyle = '#4A90E2';
        });
        
        // Y轴标签
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('温度(°C)', margin.left - 10, margin.top + chartHeight / 2);
        ctx.fillText('降水量(mm)', margin.left + chartWidth + 10, margin.top + chartHeight / 2);
        
        // 图例
        ctx.fillStyle = data.color;
        ctx.fillRect(margin.left + chartWidth - 100, margin.top + 10, 15, 3);
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('温度', margin.left + chartWidth - 80, margin.top + 13);
        
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(margin.left + chartWidth - 100, margin.top + 25, 15, 3);
        ctx.fillStyle = '#333';
        ctx.fillText('降水量', margin.left + chartWidth - 80, margin.top + 28);
    }

    onActivate() {
        if (this.currentClimate) {
            this.draw();
            this.drawChart();
        }
    }
}
