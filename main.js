// 主入口文件 - 初始化并协调所有模块
(function() {
    // 初始化场景管理器
    const sceneManager = new SceneManager();
    const { scene, camera, renderer, controls } = sceneManager.init();

    // 初始化行星管理器
    const planetManager = new PlanetManager(scene);
    planetManager.createSun();
    planetManager.createPlanets();
    planetManager.createAsteroidBelt();
    planetManager.createOrbitLines();
    planetManager.createStarField();
    planetManager.createPlanetLabels();

    // 初始化流星管理器
    const meteorManager = new MeteorManager(scene);

    // 初始化彗星管理器
    const cometManager = new CometManager(scene);
    // 创建初始彗星
    for (let i = 0; i < 2; i++) {
        cometManager.createComet();
    }

    // 初始化动画控制器
    const animationController = new AnimationController();

    // 初始化相机控制器
    const cameraController = new CameraController(camera, controls);

    // 初始化事件管理器
    const eventManager = new EventManager(scene, planetManager);

    // 初始化可视化增强管理器
    const visualizationManager = new VisualizationManager(scene, planetManager);

    // 初始化UI控制器
    const uiController = new UIController(cameraController, planetManager, animationController, eventManager, visualizationManager);
    uiController.init(renderer, camera);
    
    // 初始化事件管理器（设置外部引用，需要在uiController之后）
    eventManager.init(meteorManager, uiController);

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        
        // 更新动画（包括流星和彗星）
        animationController.update(sceneManager, planetManager, meteorManager, cometManager);
        
        // 更新相机控制器（用于视角跟随）- 暂停时仍需要更新以保持相机平滑
        cameraController.update();
        
        // 只有在未暂停时才更新这些系统
        if (!animationController.isPaused) {
            // 随机生成新流星
            meteorManager.update(animationController.timeScale);
            
            // 更新彗星
            const sunPosition = planetManager.sun ? planetManager.sun.position : new THREE.Vector3(0, 0, 0);
            cometManager.updateComets(animationController.timeScale, sunPosition);
            
            // 更新事件管理器
            eventManager.update(cometManager);
        }
        
        // 更新可视化增强（始终更新，即使暂停）
        visualizationManager.update();
        
        // 渲染场景（始终渲染，即使暂停）
        sceneManager.render();
    }

    // 启动应用
    animate();
})();

