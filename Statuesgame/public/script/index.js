

var WIDTH = 300;
var HEIGHT = 350;

var SG_FIELD_LEN = 10000;
var SG_CAMERA_POS = 500;
var SG_PLAYER_HEIGHT = 100;

function init(){
    console.log("INIT WebGL");
    //レンダラーの作成
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#myCanvas")
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x191970,1)

    //シーンを作成
    const scene = new THREE.Scene();

    //カメラを作成
    const camera = new THREE.PerspectiveCamera(
        45,
        WIDTH/HEIGHT,
        1,
        10000
    );
    camera.position.set(0,200,SG_CAMERA_POS);

    //オブジェクトの追加
    const loader = new THREE.TextureLoader();

    //player
    const playerGeometry = new THREE.PlaneGeometry(SG_PLAYER_HEIGHT * 2,SG_PLAYER_HEIGHT * 2);
    const playerMaterial = new THREE.MeshBasicMaterial({
        map:loader.load("data/player.png"),
        transparent:true,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = SG_PLAYER_HEIGHT;
    var mapNormal = loader.load("data/player.png");
    var maplose = loader.load( "data/player_lose.png" );
    var mapWin = loader.load( "data/player_win.png" );
    scene.add(player);

    //道
    const loadGeometry = new THREE.BoxGeometry(800,10,SG_FIELD_LEN+100);
    const loadMaterial = new THREE.MeshBasicMaterial({
        color: 0xd2b48c
    });
    const load = new THREE.Mesh(loadGeometry, loadMaterial);
    load.position.z = -SG_FIELD_LEN * 0.5;
    scene.add(load);

    //木
    const treeGeometry = new THREE.PlaneGeometry(800,800);
    const treeMaterial = new THREE.MeshBasicMaterial({
        map:loader.load("data/tree.png"),
        transparent:true,
    });
    const tree = new THREE.Mesh(treeGeometry, treeMaterial);
    tree.position.y = 400;
    tree.position.z = -SG_FIELD_LEN;
    scene.add(tree);


    //ライトの追加
    const light = new THREE.DirectionalLight(0xffffff);
    light.intensity = 2;
    light.position.set(1,1,1);
    scene.add(light);

    //update & draw
    var preTime = Date.now();
    tick();

    function tick(){
        var cTime = Date.now();
        var dTime = cTime - preTime;

        //update
        if(isGameStart) {
            switch(mStatus){
                case STATUS_CALLING:{
                    player.material.map = mapNormal;
                    player.material.map.needsUpdate = true;
                    if(ENABLE_GO){
                        player.position.y = SG_PLAYER_HEIGHT + 5 + 5 *  Math.sin(cTime * 0.01);
                        player.position.z = - (LENGTH_FOR_GOAL - currentPos) *  SG_FIELD_LEN / LENGTH_FOR_GOAL; 
                        camera.position.z = player.position.z + SG_CAMERA_POS;
                    }
                    
                }break;
                case STATUS_JUDGEING:{
                }break;
                case STATUS_GAME_OVER:{
                    player.material.map = maplose;
                    player.material.map.needsUpdate = true;

                    //isGameStart = false;
                }break;
                case STATUS_GAME_CLEAR:{
                    player.material.map = mapwin;
                    player.material.map.needsUpdate = true;
                }break;
            }
            
        }

        //レンダリング
        renderer.render(scene,camera);

        preTime = cTime;

        requestAnimationFrame(tick);
    }
}

//----------------------------onClick--------------------------------------------------
var button;
function onClickStart() {
    currentPos = LENGTH_FOR_GOAL;
    isGameStart = true;
    button.disabled  = true;
    document.getElementById("gameclear").style.visibility = "hidden";
    document.getElementById("gameover").style.visibility = "hidden";

    //init();
    startCalling();
}

window.onload = function(){
    button = document.getElementById("startButton");
    button.disabled  = true;
    setupCamera();
    setupNet();
    init();    

    setTimeout(initApp,1000);
}; 

