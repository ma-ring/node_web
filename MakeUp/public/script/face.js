var mFcMode = FC_NONE;
const videoWidth = 1920;
const videoHeight = 1080;
const modelWidth = 512;
const modelHeight = 512;

function face(){
  const videoElement = document.getElementsByClassName('input_video')[0];
  const canvasElement = document.getElementsByClassName('output_canvas')[0];
  const canvasCtx = canvasElement.getContext('2d');

  //----------------------------mesh---------------------------------------------
  const texture_element = document.getElementById("texture");
  const texture_canvas = texture_element.getContext("2d");


  //renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: document.querySelector("#threejs_canvas")
  });
  renderer.setSize(videoWidth,videoHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor( 0xffffff, 0 );
  //scene
  const scene = new THREE.Scene();

  //camera
  const fov    = 45;
  const fovRad = (fov / 2) * (Math.PI / 180);
  const dist   = (videoHeight / 2) / Math.tan(fovRad);
  const camera = new THREE.PerspectiveCamera(
    fov,
    videoWidth / videoHeight,
    1,
    10000
  );
  camera.position.x = 0 ;
  camera.position.z = dist;

  //mesh
  ////vertices
  const geometry = new THREE.BufferGeometry();
  var vertices = new Float32Array(UV_COORDS.length * 3);
  for (let i = 0; i < UV_COORDS.length; i++) {
    vertices[i * 3 + 0] =  UV_COORDS[i][0];
    vertices[i * 3 + 1] =  UV_COORDS[i][1];
    vertices[i * 3 + 2] = 0;
  }  
  ////index
  var index =  new Uint32Array(TRIANGULATION.length );
  for (let i = 0; i < TRIANGULATION.length ; i++) {
    index[i] =  TRIANGULATION[i];
  }  
  ////uv
  var uv = new Float32Array(UV_COORDS.length * 2);
  for (let i = 0; i < UV_COORDS.length ; i++) {
    uv[i * 2 + 0] =  UV_COORDS[i][0];
    uv[i * 2 + 1] =  UV_COORDS[i][1];
  }  
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  ////texture
  var texture = new THREE.CanvasTexture(texture_canvas.canvas);
  texture.flipY = false;
  const material = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
  //create mesh and add
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

 


  function updateMesh(keypoints){

    var vertices = new Float32Array(keypoints.length * 3);
    for (let i = 0; i < keypoints.length; i++) {
      vertices[i * 3 + 0] = videoWidth  * 0.5 - videoWidth * keypoints[i]["x"];
      vertices[i * 3 + 1] = videoHeight * 0.5 - videoHeight * keypoints[i]["y"];
      vertices[i * 3 + 2] = 0;
    }  
    mesh.geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));
    mesh.geometry.attributes.position.needsUpdate  = true;
    
  }

  function drawRest(){

  }
  //---------------------------facemesh------------------------------------------
  var scanLineY = 0;
  var scanLineVec = 10;
  function onResults(results) {
    
    switch(mFcMode){
      case FC_NONE:{
        texture_canvas.clearRect(0,0,modelWidth,modelHeight);
        texture.needsUpdate = true;
        renderer.render(scene, camera);
        /*
        
        //canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        //canvasCtx.fillStyle = "rgb(0,255,0)";
        if (results.multiFaceLandmarks) { 
          results.multiFaceLandmarks.forEach(prediction => {
            const keypoints = prediction;
            updateMesh(keypoints);
            
            for (let i = 0; i < keypoints.length; i++) {
              canvasCtx.beginPath();
              canvasCtx.arc( keypoints[i]["x"] * 1920, keypoints[i]["y"] * 1080, 5, 0, 2 * Math.PI);
              canvasCtx.fill();
              
            }
          });
        }
        */
      }break;
      case FC_SCAN:{
        if (results.multiFaceLandmarks) { 
          results.multiFaceLandmarks.forEach(prediction => {
            updateMesh(prediction);
          });
        }

        scanLineY += scanLineVec;
        if(scanLineY < 0 || scanLineY  > modelHeight){
          scanLineVec *= -1;
        }

        texture_canvas.clearRect(0,0,modelWidth,modelHeight);
        texture_canvas.lineWidth = 10 ;
        texture_canvas.strokeStyle = "red" ;
        texture_canvas.beginPath();
        texture_canvas.moveTo(0, scanLineY);
        texture_canvas.lineTo(modelWidth,scanLineY);
        texture_canvas.stroke();
        texture.needsUpdate = true;

        renderer.render(scene, camera);
      }break;
      case FC_MAKE:{
        if (results.multiFaceLandmarks) { 
          results.multiFaceLandmarks.forEach(prediction => {
            updateMesh(prediction);
          });
        }
        //console.log(makeTex.src);

        texture_canvas.clearRect(0,0,modelWidth,modelHeight);
        texture_canvas.drawImage(makeTex,0,0,4096,4096,0,0,modelWidth,modelHeight);
        texture.needsUpdate = true;

        renderer.render(scene, camera);
      }break;
      default:{
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            if (results.multiFaceLandmarks) {
              for (const landmarks of results.multiFaceLandmarks) {
                drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,{color: '#C0C0C070', lineWidth: 1});
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
              }
            }
          canvasCtx.restore();
      }break;
    }
    
    
  }
      
  const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }});

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onResults);

  //---------------------------camra--------------------------------------------
  const ts_camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMesh.send({image: videoElement});
    },
    width: 1920,
    height: 1080
  });
  ts_camera.start();

}

