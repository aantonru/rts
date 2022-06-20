import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky';

/*

function defscene() {
	const envScene = new THREE.Scene();
	const geometry = new THREE.IcosahedronGeometry(1, 2);
	geometry.deleteAttribute('uv');
	const roomMaterial = new THREE.MeshStandardMaterial({ metalness: 0, side: 2 });
	const room = new THREE.Mesh(geometry, roomMaterial);
	room.scale.setScalar(100);
	envScene.add(room);
	const mainLight = new THREE.PointLight(0xff7777, 0.5, 0, 2);
	envScene.add(mainLight);

	const lightMaterial = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0xaa6666, emissiveIntensity: 2 });

	const light1 = new THREE.Mesh(geometry, lightMaterial);
	light1.material.color.setHex(0x770000);
	light1.position.set(0, 0, -1);
	light1.scale.set(9, 9, 9);
	envScene.add(light1);

	const light2 = new THREE.Mesh(geometry, lightMaterial.clone());
	light2.material.color.setHex(0x660000);
	light2.position.set(0, 0, 0);
	light2.scale.set(8, 6, 8);
	// envScene.add( light2 );

	const light3 = new THREE.Mesh(geometry, lightMaterial.clone());
	light3.material.color.setHex(0x550000);
	light3.position.set(0, -2, 0);
	light3.scale.set(7, 7, 7);
	// envScene.add( light3 );
	return envScene;
}

*/

function skyinit(
	turbidity = 2,
	rayleigh = 0,
	mieCoefficient = 0.005,
	mieDirectionalG = 0.7,
	inclination = 1,
	azimuth = 0.74,
): Sky {
	// eslint-disable-next-line no-restricted-globals
	const sky = new Sky();
	sky.geometry.scale(4500,4500,4500);
	sky.scale.setScalar(4500);
	const sun = new THREE.Vector3();


	const { uniforms } = sky.material;
	uniforms.turbidity.value = turbidity;
	uniforms.rayleigh.value = rayleigh;
	uniforms.mieCoefficient.value = mieCoefficient;
	uniforms.mieDirectionalG.value = mieDirectionalG;
	uniforms.up.value.set(0,1,0)


	const theta = Math.PI * (inclination - 0.5);
	const phi = 2 * Math.PI * (azimuth - 0.5);

	sun.x = Math.cos(phi);
	sun.y = Math.sin(phi) * Math.sin(theta);
	sun.z = Math.sin(phi) * Math.cos(theta);

	uniforms.sunPosition.value.copy(sun);
	sky.name = 'sky';
	return sky;
}

export function skyenv(renderer: WebGLRenderer, dark = false) {
	const v2 = new THREE.Vector2();
	renderer.getSize(v2);
	const envsize = 1024;
	renderer.setSize(envsize, envsize, false);
	const pmremGenerator = new THREE.PMREMGenerator(renderer);
	const env = new THREE.Scene();
	const sky = dark ? skyinit(1.7, 0.009) : skyinit(10, 3);
	env.add(sky);
	function getenvmap(): THREE.Texture {
		pmremGenerator.compileCubemapShader();
		const generatedCubeRenderTarget = pmremGenerator.fromScene(env, 0.01);
		return generatedCubeRenderTarget.texture;
	}
	renderer.setSize(v2.x, v2.y, false);
	//sky.name = 'sky';
	return getenvmap();
}