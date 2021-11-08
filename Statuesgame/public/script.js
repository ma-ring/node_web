let STATUS_CALLING = 0;
let STATUS_JUDGEING = 1;
let STATUS_GAME_END = 2;

var CAMERA_ELEMENT = "camera";
var mInstructElemet;
var mPositonElemet;


var mPosenet;
var isGameStart = false;
var mStatus = 0;
var mPose;

//start camera
async function setupCamera(){

    await navigator.mediaDevices
        .enumerateDevices()
        .then(device =>{
            return device.filter(function(device){
                return device.kind == "videoinput";
            });
        })
        .then(cameras =>{
            navigator.mediaDevices
                .getUserMedia({
                    video:true,
                    video:{
                        deviceId: cameras.deviceId
                    },
                    audio:false
                })
                .then(media =>{
                    document.getElementById(CAMERA_ELEMENT).srcObject = media;
                    console.log("[SETUP]:CAMERA");
                });
        });
}

//start posene
async function setupNet(){
    mPosenet = await posenet.load();
}

async function detectPose(){
    var image = document.getElementById(CAMERA_ELEMENT);
    mPose = await mPosenet.estimateMultiplePoses(image,{
        flipHorizontal: false,
        axDetections: 2,
        scoreThreshold: 0.6,
        nmsRadius: 20
    });

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,270,270);
    drawKeyPoint("rgb(0,0,0)",mPose);
}


//----------------------------game---------------------------------------------------
var mCallStartTime;
var mJudgeStartTime;
var CALLING_TIME = 5000;
var JUDEGIN_TIME = 5000;
var dCallTime;
var CALL_SENTENCE = "だるまさんがころんだ";
var basePose;
var JUDGE_SAME_POSE_TRE = 50;

var LENGTH_FOR_GOAL = 200.0;
var SPEED = 0.5;
var currentPos;

async function judgeStop(){
    var pose = mPose;

    //draw
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,270,270);
    drawKeyPoint("rgb(255,0,0)",basePose);
    drawKeyPoint("rgb(0,255,0)",pose);

    //compear pose
    var surviver = 0;
    for(var bp in basePose){
        var bKeyPts = basePose[bp]["keypoints"];

        var keyPts;
        var compRes = false;
        for(var p in pose){
            keyPts = pose[p]["keypoints"];
            var dX = Math.abs(keyPts[0]["position"]["x"] - bKeyPts[0]["position"]["x"]);
            var dY = Math.abs(keyPts[0]["position"]["y"] - bKeyPts[0]["position"]["y"]);
            
            if(dX < JUDGE_SAME_POSE_TRE && dY < JUDGE_SAME_POSE_TRE ){
                compRes = true;
                break;
            }

        }

        var compPoseRes = true;
        if(compRes){
            for(var key in bKeyPts){
                if(bKeyPts[key]["score"] < 0.5) continue;
                var dX = Math.abs(keyPts[key]["position"]["x"] - bKeyPts[key]["position"]["x"] );
                var dY = Math.abs(keyPts[key]["position"]["y"] - bKeyPts[key]["position"]["y"] );

                if(dX > JUDGE_SAME_POSE_TRE || dY > JUDGE_SAME_POSE_TRE){
                    compPoseRes = false;
                    console.log(dX +" " +dY);
                    break;
                }
            }
           
            if(!compPoseRes){
                //動いたプレイヤーはkill
                killPlayer();
            }
        }

        if(compRes && compPoseRes){
            surviver++;
        }
    }

    if(surviver == 0){
        //生き残りがいなかったら
        //endGame();
    }

}

var preTime;
async function updateGame(){
    var cTime = Date.now();
    var dTime = cTime - preTime;
    if(!isGameStart) return;

    switch(mStatus){
        case STATUS_CALLING:{
            //"だるまさんがころんだ"コーリング
            var dCallingTime = cTime - mCallStartTime;

            //"だるまさんがころんだ"の文字を表示
            var cNum = Math.floor(dCallingTime / dCallTime);
            if(cNum > 0){
                mInstructElemet.innerText  = CALL_SENTENCE.substr(0,cNum);
            }

            //移動判定
            //TODO:プレーヤーが動いているか判定⇒動いていたら前進

            //TODO:移動を可視化

            //残り距離を表示
            currentPos -= SPEED * dTime / 1000;
            mPositonElemet.innerText = "残り " + Math.round(currentPos) + " m";
            
            //コーリングが終わったら判定に移動
            if( dCallingTime >  CALLING_TIME){
                startJudging();
            }
        }break;
        case STATUS_JUDGEING:{
            //動いているかどうかを判定
            
            var ret = judgeStop();

            //判定時間が終わったらまたコーリング
            if(cTime - mJudgeStartTime >  JUDEGIN_TIME){
                startCalling();
            }
        }break;
        case STATUS_GAME_END:{
            isGameStart = false;
        }break;
    }

    preTime = cTime;
}


function startCalling(params) {
    mCallStartTime = Date.now();
    mStatus = STATUS_CALLING;
    dCallTime = CALLING_TIME / (CALL_SENTENCE.length + 1);
    mInstructElemet.innerText = "　";
    document.getElementById("girlImage").src = "data/girl_close_eye.png";
}

async function startJudging(params) {
    mStatus = STATUS_JUDGEING;
    document.getElementById("girlImage").src = "data/girl_open_eye.png";
    basePose = mPose;
    console.log(basePose);
    mJudgeStartTime = Date.now();
}
function killPlayer(params) {
    console.log("KILL PLAYER");
}
function endGame(params) {
    mStatus = STATUS_GAME_END;
    mInstructElemet.innerText = "GAME OVER";
}

//---------------------------debug draw-----------------------------------------
function drawKeyPoint(color, poses ){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = color;

    for (var p in poses) {
        var keypoints = poses[p]["keypoints"];
        for(var key in keypoints){
            var point = keypoints[key];
        
            if(point["score"] < 0.5) continue;
            var x = point["position"]["x"];
            var y = point["position"]["y"];

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            //ctx.closePath();

            ctx.fill();
        }
        
    }
}

//----------------------------onClick--------------------------------------------------
function onClickStart() {
    isGameStart = true;
    currentPos = LENGTH_FOR_GOAL;
    startCalling();
}


//----------------------------init-----------------------------------------------------
function initApp(){
    setInterval(updateGame,100);
    setInterval(detectPose,100);

    mInstructElemet = document.getElementById("inst");
    mPositonElemet = document.getElementById("currentPos");

    isGameStart = false;
    preTime = Date.now();
}

window.onload = function(){
    setupCamera();
    setupNet();
    
    setTimeout(initApp,1000);
    
}; 

