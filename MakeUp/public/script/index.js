var mStatus = 0;
var mMngStatus = 0;
var mEngStatus = 0;

var mInstImg;
document.addEventListener('keydown', keyEvent);

var modeChangeTime = 0;

//test make texture img
var makeTex = new Image();
var maskList = new Array( "data/make.png","data/make2.png");
var mMaskIndex = 0;
makeTex.src = maskList[mMaskIndex];

//init
function init(){
    mInstImg = document.getElementById("instruct");
}

//update
var preTime = Date.now();
function update(){
    var time = Date.now();
    var dTime = time - preTime;
    switch(mStatus){
        case DS_TURN_OFF:{
            //simple mirror
        }break;
        case DS_MORNING:{
            StartOfDay(dTime);
        }break;
        case DS_EVENING:{
            EndOfDay(dTime);
        }break;
    }
    preTime = time;
    requestAnimationFrame(update);
    
}

//key input
function keyEvent(event) {
    var keyCode = event.key;
    if (keyCode == KEY_MORNING) {
        //start morning mode
        startMorningMode();

    } else if (keyCode == KEY_EVENING) {
        //start evening mode
        startEveningMode();
    }
    else if (keyCode == KEY_OFF){
        //turn off
        turnOff();
    }
    else if(keyCode == KEY_CHANGE_STATE ){
        switch(mStatus){
            case DS_TURN_OFF:{
                //simple mirror
                
            }break;
            case DS_MORNING:{
                mMngStatus ++;
                //console.log(mMngStatus);
                
            }break;
            case DS_EVENING:{
                mEngStatus ++;
                //console.log(mEngStatus);

            }break;
        }
    }
}

//change mode
function startMorningMode(){
    if(mStatus == DS_TURN_OFF){
        modeChangeTime = 0;
        mStatus = DS_MORNING; mMngStatus = 0;
    }

}
function startEveningMode(){
    if(mStatus == DS_TURN_OFF){ 
        modeChangeTime = 0;
        mStatus = DS_EVENING; mEngStatus = 0;
    }
}
function turnOff(){
    document.getElementById("weather").style.visibility = "hidden";
        document.getElementById("schedule").style.visibility = "hidden";
        mInstImg.style.visibility = "hidden";
        mInstImg.src = "";
        mStatus = DS_TURN_OFF;
        mFcMode = FC_NONE;
}
function onChangeUseMirror(){
    //checkbox as mirror
    if(document.getElementById("asMirror").checked){
        document.getElementsByClassName('input_video')[0].style.visibility = "visible";
    }
    else{
        document.getElementsByClassName('input_video')[0].style.visibility = "hidden";
    }
    
}

//change Mask
function changeMask(){
    if(mStatus != DS_TURN_OFF && mFcMode == FC_MAKE){
        
        mMaskIndex ++;
        mMaskIndex %= maskList.length;
        console.log( maskList[mMaskIndex]);

        makeTex.src = maskList[mMaskIndex];

    }
}

//朝
function StartOfDay(dTime){
    modeChangeTime += dTime;
    if(mMngStatus != MNG_STATE_MAKEUP && modeChangeTime > (mMngStatus + 1) * 3000 ){
        mMngStatus ++;
    }

    switch(mMngStatus){
        case MNG_STATE_WAKEUP:{
            //「おはようございます」
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/goodmorning.png";

            document.getElementById("weather").style.visibility = "hidden";
            document.getElementById("schedule").style.visibility = "hidden";

            mFcMode = FC_NONE;

        }break;
        case MNG_STATE_SCAN:{
            //顔スキャン
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/scan.png";

            mFcMode = FC_SCAN;

        }break;
        case MNG_STATE_WEATHER:{
            //情報（天気）
            mInstImg.style.visibility = "hidden";
            mInstImg.src = "";
            document.getElementById("weather").style.visibility = "visible";

            mFcMode = FC_NONE;

        }break;
        case MNG_STATE_SCHEDULE:{
            //情報（スケジュール表示）
            document.getElementById("schedule").style.visibility = "visible";
        }break;
        case MNG_STATE_RECOMMEND:{
            //おすすめのメイクを使いますか？
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/recommend.png";

        }break;
        case MNG_STATE_MAKEUP:{
            //メイクのガイド
            mInstImg.style.visibility = "hidden";
            mInstImg.src = "";

            mFcMode = FC_MAKE;


        }break;
        case MNG_STATE_GOODBYE:{
            //行ってらっしゃい
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/haveaniceday.png";
            mFcMode = FC_NONE;

        }break;
    }
}

//夜
function EndOfDay(){
    modeChangeTime += dTime;
    if(modeChangeTime > (mEngStatus + 1) * 3000 ){
        mEngStatus ++;
    }
    switch(mEngStatus){
        case ENG_STATE_WELCOMEHOME:{
            //「おかえりなさい」
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/welcomehome.png";
            mFcMode = FC_NONE;

        }break;

        case ENG_STATE_SCAN:{
            //顔をスキャン
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/scan.png";
            mFcMode = FC_SCAN;
        }break;
        case ENG_STATE_RESULT:{
            //崩れ具合を表示
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/result.png";
            mFcMode = FC_NONE;

        }break;

        case ENG_STATE_GOODBYE:{
            //お疲れさまでした
            mInstImg.style.visibility = "visible";
            mInstImg.src = "data/goodnight.png";
        }break;
    }
    
}

window.onload = function() {
    face();
 
    init();
    update();

 
}


