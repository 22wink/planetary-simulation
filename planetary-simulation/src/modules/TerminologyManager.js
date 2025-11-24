// 天文术语管理模块 - 负责术语解释和提示
class TerminologyManager {
    constructor() {
        this.terms = {
            '近日点': {
                definition: '行星轨道上距离太阳最近的点。地球的近日点约在1月3日，距离太阳约1.47亿公里。',
                example: '地球在近日点时，接收到的太阳辐射比远日点多约7%。'
            },
            '远日点': {
                definition: '行星轨道上距离太阳最远的点。地球的远日点约在7月4日，距离太阳约1.52亿公里。',
                example: '地球在远日点时，虽然距离太阳更远，但北半球却是夏季，这是因为地轴倾斜的影响。'
            },
            '黄道': {
                definition: '太阳在天空中运行的视路径，是地球公转轨道平面在天球上的投影。',
                example: '黄道与天赤道的交角约为23.5度，这导致了四季的变化。'
            },
            '赤道': {
                definition: '行星表面与自转轴垂直的最大圆周线，将行星分为南北两个半球。',
                example: '地球赤道周长约40,075公里，是地球上最长的纬线。'
            },
            '自转': {
                definition: '天体绕自身轴心旋转的运动。地球自转一周约24小时，产生了昼夜交替。',
                example: '地球自转方向是自西向东，这导致太阳从东方升起。'
            },
            '公转': {
                definition: '天体围绕另一个天体（如行星围绕太阳）的轨道运动。',
                example: '地球公转一周约365.25天，形成了四季的变化。'
            },
            '逆行': {
                definition: '从地球视角看，外行星在天空中向后移动的现象。这是由于地球轨道速度更快，当地球超过外行星时产生的视觉效应。',
                example: '火星逆行周期约每26个月发生一次，持续约2-3个月。'
            },
            '会合': {
                definition: '两颗行星在天空中看起来非常接近的现象，也称为"合相"。',
                example: '金星和木星的会合是天空中非常美丽的天文现象。'
            },
            '大合相': {
                definition: '三颗或更多行星在天空中接近对齐的罕见天文现象。',
                example: '2020年12月，木星和土星发生了近400年来最接近的大合相。'
            },
            '凌日': {
                definition: '内行星（水星或金星）从太阳前方经过，在太阳表面形成小黑点的现象。',
                example: '水星凌日每3-13年发生一次，金星凌日每100多年才发生两次。'
            },
            '日食': {
                definition: '月球运行到太阳和地球之间，遮挡太阳光线的现象。',
                example: '日全食时，可以看到太阳的日冕，这是平时无法看到的。'
            },
            '月食': {
                definition: '地球运行到太阳和月球之间，地球的阴影遮挡月球的现象。',
                example: '月全食时，月球会呈现红色，这是因为地球大气层散射了蓝光，只让红光通过。'
            },
            '轨道周期': {
                definition: '行星完成一次公转所需的时间，也称为"恒星年"。',
                example: '水星的轨道周期约88地球日，而海王星的轨道周期约165地球年。'
            },
            '自转周期': {
                definition: '行星绕自身轴心旋转一周所需的时间。',
                example: '金星的自转周期约243地球日，比它的公转周期（225天）还长。'
            },
            '近日距': {
                definition: '行星轨道上距离太阳最近的距离。',
                example: '水星的近日距约4600万公里，是太阳系中最小的。'
            },
            '远日距': {
                definition: '行星轨道上距离太阳最远的距离。',
                example: '海王星的远日距约45亿公里，是太阳系中最大的。'
            },
            '轨道倾角': {
                definition: '行星轨道平面与黄道平面的夹角。',
                example: '水星的轨道倾角约7度，是太阳系行星中最大的。'
            },
            '偏心率': {
                definition: '描述轨道椭圆程度的参数，0表示圆形，接近1表示非常扁的椭圆。',
                example: '水星的轨道偏心率约0.21，是太阳系行星中最大的，因此它的轨道最扁。'
            },
            '角速度': {
                definition: '物体绕某点旋转时，单位时间内转过的角度。',
                example: '地球的自转角速度约为每小时15度，这导致了时区的划分。'
            },
            '视直径': {
                definition: '天体在天空中看起来的直径大小，用角度表示。',
                example: '月球的视直径约0.5度，与太阳的视直径相近，因此可以发生日全食。'
            },
            '黄道面': {
                definition: '地球公转轨道所在的平面，是太阳系中大多数天体的轨道参考平面。',
                example: '太阳系的行星轨道大多接近黄道面，只有少数小行星和彗星有较大的轨道倾角。'
            }
        };
        
        this.tooltip = null;
        this.initTooltip();
    }

    initTooltip() {
        // 创建tooltip元素
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'terminology-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }

    // 为元素添加术语提示
    addTerminology(element, term) {
        if (!this.terms[term]) {
            console.warn(`术语 "${term}" 未定义`);
            return;
        }

        element.setAttribute('data-term', term);
        element.style.cursor = 'help';
        element.style.textDecoration = 'underline';
        element.style.textDecorationStyle = 'dotted';

        // 添加鼠标事件
        element.addEventListener('mouseenter', (e) => this.showTooltip(e, term));
        element.addEventListener('mouseleave', () => this.hideTooltip());
        element.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
    }

    // 显示tooltip
    showTooltip(event, term) {
        const termData = this.terms[term];
        if (!termData) return;

        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <strong>${term}</strong>
            </div>
            <div class="tooltip-content">
                <p>${termData.definition}</p>
                ${termData.example ? `<p class="tooltip-example"><em>${termData.example}</em></p>` : ''}
            </div>
        `;
        this.tooltip.style.display = 'block';
        this.updateTooltipPosition(event);
    }

    // 隐藏tooltip
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    // 更新tooltip位置
    updateTooltipPosition(event) {
        const offset = 10;
        const x = event.clientX + offset;
        const y = event.clientY + offset;

        // 确保tooltip不会超出屏幕
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let finalX = x;
        let finalY = y;

        if (x + tooltipRect.width > windowWidth) {
            finalX = event.clientX - tooltipRect.width - offset;
        }
        if (y + tooltipRect.height > windowHeight) {
            finalY = event.clientY - tooltipRect.height - offset;
        }

        this.tooltip.style.left = finalX + 'px';
        this.tooltip.style.top = finalY + 'px';
    }

    // 批量添加术语提示（通过选择器）
    addTerminologyToSelector(selector, term) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => this.addTerminology(el, term));
    }
}

