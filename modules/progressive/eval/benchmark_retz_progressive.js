
if(!$("testcloud")){
	
	//let las = loadBINProgressive("D:/dev/pointclouds/riegl/retz.bin");
	let las = loadLASProgressive("D:/dev/pointclouds/riegl/Retz_Airborne_Terrestrial_Combined_1cm.las");

	let pc = new PointCloudProgressive("testcloud", "blabla");

	let handles = las.handles;

	let attributes = [
		new GLBufferAttribute("position", 0, 3, gl.FLOAT, gl.FALSE, 12, 0),
		new GLBufferAttribute("value", 1, 4, gl.INT, gl.FALSE, 4, 12, {targetType: "int"}),
	];
	let bytesPerPoint = attributes.reduce( (p, c) => p + c.bytes, 0);

	let maxPointsPerBuffer = 134 * 1000 * 1000;
	let numPointsLeft = las.numPoints;
	let glBuffers = handles.map( (handle) => {

		let numPointsInBuffer = numPointsLeft > maxPointsPerBuffer ? maxPointsPerBuffer : numPointsLeft;
		numPointsLeft -= maxPointsPerBuffer;

		let glbuffer = new GLBuffer();

		glbuffer.attributes = attributes;

		gl.bindVertexArray(glbuffer.vao);
		glbuffer.vbo = handle;
		gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer.vbo);

		for(let attribute of attributes){

			let {location, count, type, normalize, offset} = attribute;

			gl.enableVertexAttribArray(location);

			if(attribute.targetType === "int"){
				gl.vertexAttribIPointer(location, count, type, bytesPerPoint, offset);
			}else{
				gl.vertexAttribPointer(location, count, type, normalize, bytesPerPoint, offset);
			}
		}

		gl.bindVertexArray(0);

		glbuffer.count =  numPointsInBuffer;

		return glbuffer;
	});

	pc.glBuffers = glBuffers;

	let s = 1.0;
	pc.transform.elements.set([
		s, 0, 0, 0, 
		0, 0, -s, 0, 
		0, s, 0, 0, 
		0, 0, 0, 1, 
	]);



	scene.root.add(pc);

	listeners.update.push(() => {
		pc.numPoints = las.numPoints;
	});

}

view.set(
	[629.908, 82.148, -799.211], 
	[569.602, 41.695, -857.466]
);

window.x = 0;
window.y = 0;
window.width = 1920;
window.height = 1080;

MSAA_SAMPLES = 1;
EDL_ENABLED = false;

renderDebug = renderPointCloudProgressive;
//renderDebug = renderPointCloudBasic;