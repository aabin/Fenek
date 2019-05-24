
GLTimerQueries.enabled = false;

//vr.start();
vr.stop();
// allows you to adjust the mirror depending on your VR room setup
if($("desktop_mirror")){
	let mirror = $("desktop_mirror");

	mirror.position.set(0., 1.15, -0.6);
	mirror.scale.set(0.9, 0.9, 0.9)
	mirror.rotation = new Matrix4().makeRotationY(0.0);
	mirror.updateMatrixWorld();
}

DEBUG_USER_FILTER_CAM = false;

reportState(false);

CLOD_RANGE = [0.4, 1.2];
CLOD_BATCH_SIZE = 50 * 1000 * 1000;

MSAA_SAMPLES = 2; // MSAA 1 only works if EDL is disable
EDL_ENABLED = true; // Eye-Dome-Lighting. Only currently available form of illumination
RENDER_DEFAULT_ENABLED = false;
desktopMirrorEnabled = false;

//test();

// {
// 	// if(!tbuffer){
// 	// 	let tbuffer = gl.createBuffer();
// 	// }
// 	let buffer = gl.createBuffer();

// 	{
// 		let size = 500 * 1024 * 1024;
// 		let data = 0;
// 		let usage = gl.DYNAMIC_DRAW;
		
// 		gl.namedBufferData(buffer, size, data, usage);
// 	}

// 	{
// 		let data = new Float32Array(1000);
// 		for(let i = 0; i < data.length; i++){
// 			data[i] = Math.random();
// 		}
// 		let size = data.length * 4;
// 		let offset = 123456;

// 		gl.namedBufferSubData(buffer, offset, size, data);
// 	}
// }

// {

// 	let buffer = gl.createBuffer();

// 	let size = 500 * 1024 * 1024;
// 	let data = 0;
// 	let flags = gl.DYNAMIC_DRAW;


// 	gl.namedBufferStorage(buffer, size, data, flags);

// 	// returns an arraybuffer to modify
// 	let arraybuffer = gl.mapNamedBufferRange(buffer, 16 * 1000, 4000, 0);
// 	//gl.mapNamedBufferRange(buffer, 16 * 1000, 4000, gl.MAP_UNSYNCHRONIZED_BIT);

// 	let arrayf32 = new Float32Array(arraybuffer);
// 	for(let i = 0; i < arrayf32.length; i++){
// 		arrayf32[i] = i / 10;
// 	}

// 	gl.unmapNamedBuffer(buffer);

// }


// { // set window position
// 	let monitors = window.monitors;

// 	if(monitors.length === 1){
// 		let monitor = monitors[0];

// 		window.width = monitor.width * 0.8;
// 		window.height = monitor.height * 0.8;
// 		window.x = monitor.width * 0.1;
// 		window.y = monitor.height * 0.1;
// 	}else{
// 		// maximize on second monitor, if available

// 		let monitor = monitors[1];

// 		window.width = monitor.width;
// 		window.height = monitor.height - 1;
// 		window.x = monitors[0].width;
// 		window.y = 1; // show 1 px of border to give users the chance to drag the window.
// 	}

// 	window.width = 1000;
// 	window.height = 1000;
// }

// view.set(
// 	[-0.31491945793674025, 1.6615639615462632, 0.6044648744114552],
// 	[1.4967644080225093, 1.1270621413270114, -0.38736737679558275]
// );

// hedientor
// view.set(
// 	[-4.79752876425493, 3.352368470609269, 2.9828365829747496],
// 	[-0.7549856423151464, 1.8424463357972278, 2.077575445694987],
// );

// eclepens
// view.set(
// 	[261.8844817698492, 50.08728596807133, 106.34470384056777],
// 	[150.8748713083005, -25.123600729799435, 130.80656826984648],
// );

// Retz
// view.set(
// 	[168.75699124717676, -1.6132784586156124, 163.2274624947167],
// 	[150.2177732546118, -13.570647286902883, 152.53596373947244]
// );

// view.set(
// 	[-19.14057544237545, 141.11317776069592, 230.15172050227355],
// 	[174.98411726476496, -19.53047189938175, 146.1286169015795]
// );

view.set(
	[26.139380940136164, 73.9515755168709, 15.391525302188732],
	[115.14533825035778, 13.209925228874496, 48.21754998439698]
);

// log(view.position);
// log(view.getPivot());













