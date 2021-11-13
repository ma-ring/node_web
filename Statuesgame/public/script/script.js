let STATUS_CALLING = 0;
let STATUS_JUDGEING = 1;
let STATUS_GAME_OVER = 2;
let STATUS_GAME_CLEAR = 3;

let VIDEO_SIZE = 270;

var CAMERA_ELEMENT = "camera";
var mInstructElemet;
var mPositonElemet;


var mPosenet;
var isGameStart = false;
var mStatus = 0;
var mPose;
var ctx ;

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
                        width:VIDEO_SIZE,
                        height:VIDEO_SIZE,
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
        maxDetections :1,
        scoreThreshold: 0.6
    });

}


//----------------------------game---------------------------------------------------
var mCallStartTime;
var mJudgeStartTime;
var CALLING_TIME = 5000;
var JUDEGIN_TIME = 5000;
var dCallTime;
var CALL_SENTENCE = "だるまさんがころんだ";
var basePose;
var JUDGE_SAME_POSE_TRE = 10;

var LENGTH_FOR_GOAL = 200.0;
var SPEED = 10;
var currentPos;

var ENABLE_GO = false;
async function judgeStop(thre ){
    var pose = mPose;

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

                //一か所でも動いていたらfalse
                if(dX > thre || dY > thre){
                    //move
                    compPoseRes = false;
                    //console.log(dX +" " +dY);
                    break;
                }
            }
            
            if(!compPoseRes){
                //動いたプレイヤーはkill
                //killPlayer();
            }
        }

        if(compRes && compPoseRes){
            surviver++; //動いてない人の数
        }
    }
    return surviver;
}

var preTime;
async function updateGame(){
    drawCanvas();

    var cTime = Date.now();
    var dTime = cTime - preTime;

    if(isGameStart) {
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
                var stopPeople = await judgeStop(50);//動いてない人の数
                //console.log("JUDGE" + stopPeople);
    
                //TODO:移動を可視化
                if(stopPeople == 0) {
                    ENABLE_GO = true;
                    currentPos -= SPEED * dTime / 1000;
                }else{
                    ENABLE_GO = false;
                }
                
                //残り距離を表示
                mPositonElemet.innerText = "残り " + Math.round(currentPos) + " m";
                
                if( Math.round(currentPos) <= 0){
                    //GAME CLEAER
                    gameClear()
                }
                
                //コーリングが終わったら判定に移動
                if( dCallingTime >  CALLING_TIME){
                    startJudging();
                }
                basePose = mPose;
            }break;
            case STATUS_JUDGEING:{
                //動いているかどうかを判定
                var ret = await judgeStop(JUDGE_SAME_POSE_TRE);
    
                if(ret == 0){
                    //生き残りがいなかったら
                    //GAME OVER
                    gameOver();
                }
                //判定時間が終わったらまたコーリング
                else if(cTime - mJudgeStartTime >  JUDEGIN_TIME){
                    startCalling();
                }
            }break;
            
        }
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
    //console.log(basePose);
    mJudgeStartTime = Date.now();
}
function gameOver(){
    mStatus = STATUS_GAME_OVER;
    button.disabled = false;
    //isGameStart = false;
    mInstructElemet.innerText = "GAME OVER";
    document.getElementById("girlImage").src = "data/girl_red_eye.png";
    document.getElementById("gameover").style.visibility = "visible";

}
function gameClear(){
    mStatus = STATUS_GAME_CLEAR;
    button.disabled = false;
    //isGameStart = false;
    mInstructElemet.innerText = "GAME CLEAR";
    document.getElementById("gameclear").style.visibility = "visible";

}

//---------------------------debug draw-----------------------------------------
function drawCanvas(){
    ctx.clearRect(0,0,VIDEO_SIZE,VIDEO_SIZE);

    //draw Video
    ctx.drawImage(document.getElementById("camera"), 0, 0, VIDEO_SIZE, VIDEO_SIZE);

    //draw pose
    drawKeyPoint("rgb(255,0,0)",basePose);
    drawKeyPoint("rgb(0,0,0)",mPose);
}

function drawKeyPoint(color, poses ){
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 ;

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

        //body
        ctx.beginPath();
        moveTo(ctx, keypoints[5]);
        lineTo(ctx, keypoints[6]);
        lineTo(ctx, keypoints[12]);
        lineTo(ctx, keypoints[11]);
        ctx.stroke();

        //rightHand
        ctx.beginPath();
        moveTo(ctx, keypoints[6]);
        lineTo(ctx, keypoints[8]);
        lineTo(ctx, keypoints[10]);
        ctx.stroke();

        //leftHand
        ctx.beginPath();
        moveTo(ctx, keypoints[5]);
        lineTo(ctx, keypoints[7]);
        lineTo(ctx, keypoints[9]);
        ctx.stroke();
        
        //rightFoot
        ctx.beginPath();
        moveTo(ctx, keypoints[12]);
        lineTo(ctx, keypoints[14]);
        lineTo(ctx, keypoints[16]);
        ctx.stroke()

        //leftFoot
        ctx.beginPath();
        moveTo(ctx, keypoints[11]);
        lineTo(ctx, keypoints[13]);
        lineTo(ctx, keypoints[15]);
        ctx.stroke();

    }



    
    



}
function moveTo(canvas, keypt){
    if(keypt["score"] > 0.5){
        canvas.moveTo(keypt["position"]["x"],keypt["position"]["y"]);
    }
}
function lineTo(canvas, keypt){
    if(keypt["score"] > 0.5){
        canvas.lineTo(keypt["position"]["x"],keypt["position"]["y"]);
    }
}

//----------------------------init-----------------------------------------------------
function initApp(){
    setInterval(updateGame,100);
    setInterval(detectPose,100);

    mInstructElemet = document.getElementById("inst");
    mPositonElemet = document.getElementById("currentPos");

    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    currentPos = LENGTH_FOR_GOAL;
    isGameStart = false;
    button.disabled = false;
    preTime = Date.now();
}

