// 主控制器 - 管理模块切换和初始化
class MainController {
    constructor() {
        this.currentModule = 'atmosphere-layers';
        this.modules = {};
        this.init();
    }

    init() {
        // 初始化标签页切换
        this.initTabs();
        
        // 初始化各个模块
        this.initModules();
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const modules = document.querySelectorAll('.module');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const moduleId = btn.dataset.module;
                
                // 更新按钮状态
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新模块显示
                modules.forEach(m => m.classList.remove('active'));
                document.getElementById(moduleId).classList.add('active');
                
                // 更新当前模块
                this.currentModule = moduleId;
                
                // 触发模块激活事件
                if (this.modules[moduleId]) {
                    this.modules[moduleId].onActivate();
                }
            });
        });
    }

    initModules() {
        // 初始化大气垂直分层模块
        if (document.getElementById('layers-canvas')) {
            this.modules['atmosphere-layers'] = new AtmosphereLayers('layers-canvas');
        }

        // 初始化大气受热过程模块
        if (document.getElementById('heat-canvas')) {
            this.modules['heat-process'] = new HeatProcess('heat-canvas');
        }

        // 初始化大气运动模块
        if (document.getElementById('motion-canvas')) {
            this.modules['atmosphere-motion'] = new AtmosphereMotion('motion-canvas');
        }

        // 初始化全球性大气环流模块
        if (document.getElementById('circulation-canvas')) {
            this.modules['global-circulation'] = new GlobalCirculation('circulation-canvas');
        }

        // 初始化天气系统模块
        if (document.getElementById('weather-canvas')) {
            this.modules['weather-systems'] = new WeatherSystems('weather-canvas');
        }

        // 初始化气候类型模块
        if (document.getElementById('climate-canvas')) {
            this.modules['climate-types'] = new ClimateTypes('climate-canvas', 'climate-chart-canvas');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MainController();
});
