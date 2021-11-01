let STATUS_CALLING = 0;
let STATUS_JUDGEING = 1;
let STATUS_GAME_END = 2;

var CAMERA_ELEMENT = "camera";
var mInstructElemet;
var mPositonElemet;


var mPosenet;
var isGameStart = false;
var mStatus = 0;

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
    console.log("[SETUP]:NET");
}

async function detectPose(){
    var image = document.getElementById(CAMERA_ELEMENT);
    const pose = await mPosenet.estimateMultiplePoses(image,{
        flipHorizontal: false,
        axDetections: 2,
        scoreThreshold: 0.6,
        nmsRadius: 20
    });
    return pose;
}

//----------------------------game---------------------------------------------------
var mCallStartTime;
var mJudgeStartTime;
var CALLING_TIME = 5000;
var JUDEGIN_TIME = 5000;
var dCallTime;
var CALL_SENTENCE = "だるまさんがころんだ";
var basePose;
var JUDGE_SAME_POSE_TRE = 0.1;

var LENGTH_FOR_GOAL = 200.0;
var SPEED = 0.5;
var currentPos;


async function judgeStop(){
    var pose = await detectPose();

    //compear pose
    var surviver = 0;
    for(var bp in basePose){
        var bKeyPts = basePose[p]["keypoints"];

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
                var dX = Math.abs(keyPts[key]["position"]["x"] - bKeyPts[key]["position"]["x"] );
                var dY = Math.abs(keyPts[key]["position"]["y"] - bKeyPts[key]["position"]["y"] );

                if(dX > JUDGE_SAME_POSE_TRE || dY > JUDGE_SAME_POSE_TRE){
                    compPoseRes = false;
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
        endGame();
    }

}

var preTime;
async function updateGame(){
    var cTime = Date.now();
    var dTime = cTime - preTime;
    if(!isGameStart) return;

    switch(mStatus){
        case STATUS_CALLING:{
            var dCallingTime = cTime - mCallStartTime;
            var cNum = Math.floor(dCallingTime / dCallTime);
            mInstructElemet.innerText  = CALL_SENTENCE.substr(0,cNum);

            currentPos -= SPEED * dTime / 1000;
            mPositonElemet.innerText = "残り " + currentPos + " m";

            if( dCallingTime >  CALLING_TIME){
                startJudging();
            }
        }break;
        case STATUS_JUDGEING:{
            var ret = judgeStop();

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
    mInstructElemet.innerText = " ";
}
function startJudging(params) {
    basePose = await detectPose();

    mJudgeStartTime = Date.now();
    mStatus = STATUS_JUDGEING;
    mInstructElemet.innerText = " ";

}
function killPlayer(params) {
    console.log("KILL PLAYER");
}
function endGame(params) {
    mStatus = STATUS_GAME_END;
    mInstructElemet.innerText = "GAME OVER";
}

//----------------------------onClick--------------------------------------------------
function onClickStart() {
    isGameStart = true;
    currentPos = LENGTH_FOR_GOAL;
    startCalling();
}


//----------------------------init-----------------------------------------------------
window.onload = function(){
    setupCamera();
    setupNet();
    isGameStart = false;
    preTime = Date.now();
    setInterval(updateGame,100);

    mInstructElemet = document.getElementById("inst");
    mPositonElemet = document.getElementById("currentPos");
}; 