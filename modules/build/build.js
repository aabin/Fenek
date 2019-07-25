


getBuildState = function(){

	if(typeof buildState !== "undefined"){
		return buildState;
	}

	const gridSize = 16;
	const avgGridSize = 128;

	const ssCounterGrid = gl.createBuffer();
	const ssOffsetsGrid = gl.createBuffer();
	const ssComputePartition = gl.createBuffer();
	const ssCellIDs = gl.createBuffer();
	const ssCellNumPoints = gl.createBuffer();
	const ssAvgGrid = gl.createBuffer();

	const ssAverageR = gl.createBuffer();
	const ssAverageG = gl.createBuffer();
	const ssAverageB = gl.createBuffer();
	const ssAverageA = gl.createBuffer();

	gl.namedBufferData(ssCounterGrid, 4 * gridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssOffsetsGrid, 4 * gridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssComputePartition, 8, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssCellIDs, 4 * gridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssCellNumPoints, 4 * gridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssAvgGrid, 4 * avgGridSize ** 3, 0, gl.DYNAMIC_DRAW);

	gl.namedBufferData(ssAverageR, 4 * avgGridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssAverageG, 4 * avgGridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssAverageB, 4 * avgGridSize ** 3, 0, gl.DYNAMIC_DRAW);
	gl.namedBufferData(ssAverageA, 4 * avgGridSize ** 3, 0, gl.DYNAMIC_DRAW);

	let csCount = null;
	{
		let path = `${rootDir}/modules/build/count.cs`;
		let shader = new Shader([{type: gl.COMPUTE_SHADER, path: path}]);
		shader.watch();
		csCount = shader;
	}

	let csComputePartitions = null;
	{
		let path = `${rootDir}/modules/build/compute_partitions.cs`;
		let shader = new Shader([{type: gl.COMPUTE_SHADER, path: path}]);
		shader.watch();
		csComputePartitions = shader;
	}

	let csPartition = null;
	{
		let path = `${rootDir}/modules/build/partition.cs`;
		let shader = new Shader([{type: gl.COMPUTE_SHADER, path: path}]);
		shader.watch();
		csPartition = shader;
	}

	let csAverage = null;
	{
		let path = `${rootDir}/modules/build/average.cs`;
		let shader = new Shader([{type: gl.COMPUTE_SHADER, path: path}]);
		shader.watch();
		csAverage = shader;
	}

	buildState = {
		gridSize: gridSize,
		avgGridSize: avgGridSize,
		ssCounterGrid: ssCounterGrid,
		ssOffsetsGrid: ssOffsetsGrid,
		ssComputePartition: ssComputePartition,
		ssCellIDs: ssCellIDs,
		ssCellNumPoints: ssCellNumPoints,
		ssAverageR: ssAverageR,
		ssAverageG: ssAverageG,
		ssAverageB: ssAverageB,
		ssAverageA: ssAverageA,
		ssAvgGrid: ssAvgGrid,
		csCount: csCount,
		csComputePartitions: csComputePartitions,
		csPartition: csPartition,
		csAverage: csAverage,
	};

	return buildState;
};




buildTest = function(pointcloud){
	log("=== BUILD TEST ===");

	const tStart = now();
	GLTimerQueries.mark("build-start");

	const state = getBuildState();
	const buffers = pointcloud.glBuffers;
	const buffer = buffers[0]; // TODO
	const {boundingBox} = pointcloud;

	const {ssCounterGrid, ssOffsetsGrid, ssComputePartition, ssCellIDs, ssCellNumPoints, ssAvgGrid} = state;
	const {csCount, csComputePartitions, csPartition} = state;
	const {gridSize, avgGridSize} = state;

	gl.clearNamedBufferData(ssCounterGrid, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);
	gl.clearNamedBufferData(ssOffsetsGrid, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);
	gl.clearNamedBufferData(ssComputePartition, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);

	const ssPartition = gl.createBuffer();
	gl.namedBufferData(ssPartition, buffer.count * 20, 0, gl.DYNAMIC_DRAW);

	if(true){ // COUNT
		GLTimerQueries.mark("build-count-start");
		gl.useProgram(csCount.program);

		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, ssCounterGrid);

		let pointsLeft = pointcloud.numPoints;
		let batchSize = 134 * 1000 * 1000;

		{
			gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffer.vbo);

			const {min, max} = boundingBox;
			const size = max.sub(min);
			const largestDimension = Math.max(...size.toArray());
			max.x = min.x + largestDimension;
			max.y = min.y + largestDimension;
			max.z = min.z + largestDimension;

			log(min);
			log(max);

			log(`uMin: ${csCount.uniforms.uMin}`);
			log(`uMax: ${csCount.uniforms.uMax}`);

			gl.uniform3f(csCount.uniforms.uMin, min.x, min.y, min.z);
			gl.uniform3f(csCount.uniforms.uMax, max.x, max.y, max.z);
			gl.uniform1f(csCount.uniforms.uGridSize, gridSize);

			let numPoints = Math.max(Math.min(pointsLeft, batchSize), 0);
			let groups = parseInt(numPoints / 128);
			//groups = 300;
			//groups = 1;
			gl.dispatchCompute(groups, 1, 1);

			pointsLeft = pointsLeft - batchSize;
		}

		GLTimerQueries.mark("build-count-end");
		GLTimerQueries.measure("build.count", "build-count-start", "build-count-end");
		
	}

	{ // COMPUTE PARTITIONING
		GLTimerQueries.mark("build-compute-partitions-start");
		gl.useProgram(csComputePartitions.program);

		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, ssComputePartition);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, ssCounterGrid);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, ssOffsetsGrid);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, ssCellIDs);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, ssCellNumPoints);

		const groups = gridSize ** 2;
		gl.dispatchCompute(groups, 1, 1);

		GLTimerQueries.mark("build-compute-partitions-end");
		GLTimerQueries.measure("build.compute-partitions", "build-compute-partitions-start", "build-compute-partitions-end");
	}
	
	{ // PARTITION
		GLTimerQueries.mark("build-partition-start");
		gl.useProgram(csPartition.program);

		const ssOffsetsGridCopy = gl.createBuffer();
		gl.namedBufferData(ssOffsetsGridCopy, 4 * gridSize ** 3, 0, gl.DYNAMIC_DRAW);
		gl.copyNamedBufferSubData(ssOffsetsGrid, ssOffsetsGridCopy, 0, 0, 4 * gridSize ** 3);

		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, ssCounterGrid);
		//gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, ssOffsetsGrid);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, ssOffsetsGridCopy);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, ssPartition);

		{
			gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffer.vbo);

			const {min, max} = boundingBox;
			const size = max.sub(min);
			const largestDimension = Math.max(...size.toArray());
			max.x = min.x + largestDimension;
			max.y = min.y + largestDimension;
			max.z = min.z + largestDimension;

			gl.uniform3f(csPartition.uniforms.uMin, min.x, min.y, min.z);
			gl.uniform3f(csPartition.uniforms.uMax, max.x, max.y, max.z);
			gl.uniform1f(csCount.uniforms.uGridSize, gridSize);

			let numPoints = buffer.count;
			let groups = parseInt(numPoints / 128);

			log(`numPoints: ${numPoints}`);
			//groups = 300;
			//groups = 1;
			gl.dispatchCompute(groups, 1, 1);
		}

		gl.memoryBarrier(gl.ALL_BARRIER_BITS);
		gl.deleteBuffers(1, new Uint32Array([ssOffsetsGridCopy]));

		GLTimerQueries.mark("build-partition-end");
		GLTimerQueries.measure("build.partition", "build-partition-start", "build-partition-end");
	}


	let cellCount = 0;
	let cellIDs = null;
	let cellNumPoints = null;
	
	{
		let resultBuffer = new ArrayBuffer(8);
		gl.getNamedBufferSubData(ssComputePartition, 0, resultBuffer.byteLength, resultBuffer);

		cellCount = new DataView(resultBuffer).getUint32(4, true);
	}

	{
		const numBytes = Math.min(4 * cellCount, 4 * gridSize ** 3);
		const resultBuffer = new ArrayBuffer(numBytes);
		gl.getNamedBufferSubData(ssCellIDs, 0, resultBuffer.byteLength, resultBuffer);
		const i32 = new Int32Array(resultBuffer);

		cellIDs = i32;
	}

	{
		const numBytes = Math.min(4 * cellCount, 4 * gridSize ** 3);
		const resultBuffer = new ArrayBuffer(numBytes);
		gl.getNamedBufferSubData(ssCellNumPoints, 0, resultBuffer.byteLength, resultBuffer);
		const i32 = new Int32Array(resultBuffer);

		cellNumPoints = i32;
	}

	log(`cellCount: ${cellCount}`);
	//log("ids: " + cellIDs);
	//log("cellNumPoints: " + cellNumPoints);

	{ // AVERAGE

		GLTimerQueries.mark("build-avg-start");
		
		gl.memoryBarrier(gl.ALL_BARRIER_BITS);

		const {ssAverageR, ssAverageG, ssAverageB, ssAverageA} = state;
		const {csAverage} = state;

		gl.useProgram(csAverage.program);

		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, ssPartition);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, ssOffsetsGrid);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, ssAverageR);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, ssAverageG);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 5, ssAverageB);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 6, ssAverageA);

		const {min, max} = boundingBox;
		const size = max.sub(min);
		const largestDimension = Math.max(...size.toArray());
		max.x = min.x + largestDimension;
		max.y = min.y + largestDimension;
		max.z = min.z + largestDimension;

		gl.uniform3f(csCount.uniforms.uMin, min.x, min.y, min.z);
		gl.uniform3f(csCount.uniforms.uMax, max.x, max.y, max.z);
		gl.uniform1f(csCount.uniforms.uGridSize, gridSize);
		gl.uniform1f(csCount.uniforms.uAvgGridSize, avgGridSize);

		let offset = 0;
		for(let i = 0; i < cellCount; i++){

			let cellID = cellIDs[i];
			let numPoints = cellNumPoints[i];

			gl.uniform1i(csAverage.uniforms.uBatchSize, numPoints);
			gl.uniform1i(csAverage.uniforms.uOffset, offset);

			gl.clearNamedBufferData(ssAvgGrid, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);
			gl.clearNamedBufferData(ssAverageR, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);
			gl.clearNamedBufferData(ssAverageG, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);
			gl.clearNamedBufferData(ssAverageB, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);
			gl.clearNamedBufferData(ssAverageA, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, 0);

			let groups = parseInt(numPoints / 128);
			//log(`cell: ${cellID}, #points: ${numPoints}, groups: ${groups}`);
			gl.dispatchCompute(groups, 1, 1);

			offset += numPoints;

		}

		GLTimerQueries.mark("build-avg-end");
		GLTimerQueries.measure("build.avg", "build-avg-start", "build-avg-end");

	}
		
	

	if(false){ // AVERAGE
		gl.memoryBarrier(gl.ALL_BARRIER_BITS);

		const {ssAverageR, ssAverageG, ssAverageB, ssAverageA} = state;
		const {csAverage} = state;

		gl.useProgram(csAverage.program);

		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, ssPartition);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, ssAverageR);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, ssAverageG);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 5, ssAverageB);
		gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 6, ssAverageA);

		const {min, max} = boundingBox;
		const size = max.sub(min);
		const largestDimension = Math.max(...size.toArray());
		max.x = min.x + largestDimension;
		max.y = min.y + largestDimension;
		max.z = min.z + largestDimension;

		gl.uniform3f(csPartition.uniforms.uMin, min.x, min.y, min.z);
		gl.uniform3f(csPartition.uniforms.uMax, max.x, max.y, max.z);
		gl.uniform1f(csCount.uniforms.uGridSize, gridSize);


	}

	gl.useProgram(0);

	gl.copyNamedBufferSubData(ssPartition, buffer.vbo, 0, 0, buffer.count * 16);
	

	gl.deleteBuffers(1, new Uint32Array([ssPartition]));

	GLTimerQueries.mark("build-end");
	GLTimerQueries.measure("build", "build-start", "build-end");

	const tEnd = now();
	const duration = (tEnd - tStart).toFixed(3);
	log(`duration: ${duration}s`);
	log("===========");

	if(false){ // DEBUG
		gl.memoryBarrier(gl.ALL_BARRIER_BITS);

		let resultBuffer = new ArrayBuffer(4 * gridSize ** 3);
		gl.getNamedBufferSubData(ssOffsetsGrid, 0, resultBuffer.byteLength, resultBuffer);
		let view = new DataView(resultBuffer);
		let i32 = new Int32Array(resultBuffer);

		// {
		// 	let sum = 0;
		// 	for(let i = 0; i < 10 * 1000 * 1000; i = i + Math.random()){
		// 		sum += i;
		// 	}
		// 	log(sum);
		// }

		// taken from https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
		const numberWithCommas = (x) => {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		{
			let resultBuffer = new ArrayBuffer(4 * gridSize ** 3);
			gl.getNamedBufferSubData(ssCounterGrid, 0, resultBuffer.byteLength, resultBuffer);
			let view = new DataView(resultBuffer);
			let i32 = new Int32Array(resultBuffer);

			const values = Array.from(i32).slice(0, 100);
			log("counts: ");
			log(values.join(", "));

			const filledBins = Array.from(i32).filter( v => v !== 0);
			//filledBins.sort();
			const sum = filledBins.reduce( (a, i) => a + i, 0);
			const largestBin = filledBins.reduce( (a, i) => Math.max(a, i), 0);
			const smallestBin = filledBins.reduce( (a, i) => Math.min(a, i), Infinity);
			const medianBin = filledBins.sort()[parseInt(filledBins.length * 0.5)];

			log(filledBins.slice(0, 100).join(", "));

			log(`num bins: ${filledBins.length}`);
			log(`sum: ${sum}`);
			log(`largestBin: ${largestBin}`);
			log(`smallestBin: ${smallestBin}`);
			log(`medianBin: ${medianBin}`);


			//for(let i = 0; i < 16; i++){
			//	let value = i32[i];

			//	log(`${i}: ${value}`);
			//}
		}

		{
			let resultBuffer = new ArrayBuffer(4 * gridSize ** 3);
			gl.getNamedBufferSubData(ssOffsetsGrid, 0, resultBuffer.byteLength, resultBuffer);
			let view = new DataView(resultBuffer);
			let i32 = new Int32Array(resultBuffer);

			const values = Array.from(i32).slice(0, 100);
			log("offsets: ");
			log(values.join(", "));
		}
	
	}



	
}


"build"


