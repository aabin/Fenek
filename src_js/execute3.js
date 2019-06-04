

// {
// 	loadLASTest("C:/dev/pointclouds/eclepens.las");
// }

// RENDER_DEFAULT_ENABLED = false;

if(true){
	//let handle = test("C:/dev/pointclouds/heidentor.las");
	//let las = loadLASTest("C:/dev/pointclouds/heidentor.las");
	//let las = loadLASTest("C:/dev/pointclouds/eclepens.las");

	//let las = loadLASProgressive("D:/dev/pointclouds/archpro/heidentor.las");
	//let las = loadLASProgressive("D:/dev/pointclouds/eclepens.las");
	//let las = loadLASProgressive("D:/dev/pointclouds/Riegl/Retz_Airborne_Terrestrial_Combined_1cm.las");
	let las = loadLASProgressive("D:/dev/pointclouds/tu_photogrammetry/wienCity_v3.las");
	//let las = loadLASProgressive("D:/dev/pointclouds/weiss/pos6_LDHI_module.las");
	//let las = loadLASProgressive("D:/dev/pointclouds/pix4d/eclepens.las");
	//let las = loadLASProgressive("D:/dev/pointclouds/weiss/pos7_Subsea_equipment.las");
	//let las = loadLASProgressive("C:/dev/pointclouds/planquadrat/wiener_neustadt_waldschule/HAUS_1.las");
	//let las = loadLASProgressive("C:/dev/pointclouds/wienCity.las");

	let handle = las.handle;

	let pc = new PointCloudProgressive("testcloud", "blabla");

	let glbuffer = new GLBuffer();

	let attributes = [
		new GLBufferAttribute("position", 0, 3, gl.FLOAT, gl.FALSE, 12, 0),
		new GLBufferAttribute("color_orig", 1, 4, gl.UNSIGNED_BYTE, gl.TRUE, 4, 12),
	];

	glbuffer.attributes = attributes;

	bytesPerPoint = attributes.reduce( (p, c) => p + c.bytes, 0);

	gl.bindVertexArray(glbuffer.vao);
	glbuffer.vbo = handle;
	gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer.vbo);

	for(let attribute of attributes){

		let {location, count, type, normalize, offset} = attribute;

		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, count, type, normalize, bytesPerPoint, offset);
	}

	gl.bindVertexArray(0);

	glbuffer.count =  las.numPoints;

	let s = 0.3;
	pc.transform.elements.set([
	//pc.world.elements.set([
		s, 0, 0, 0, 
		0, 0, s, 0, 
		0, s, 0, 0, 
		0, 0, 1, 1, 
	]);

	pc.components.push(glbuffer);

	scene.root.add(pc);

	listeners.update.push(() => {
		glbuffer.count = las.numPoints;
	});

}

// Retz
// view.set(
// 	[164.42231627935024, -5.900582339455357, 161.40410448358546],
// 	[150.21777325461176, -13.570647286902897, 152.53596373947232],
// );

// Wien v3
view.set(
	[-123.64041104361256, 257.16964132726406, 325.6114489431626],
	[-29.427251694584953, 15.271786917458371, 36.05849198942843],
);

// // Wien v4
// view.set(
// 	[35.26739672057562, 3.336713034786203, 0.43405646977710255],
// 	[35.21500759471063, -1.0245859003858673, 6.0378602078675],
// );