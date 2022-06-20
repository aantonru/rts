import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { sup3 } from './Support3';
import { template } from '../template';
import { cfg3 } from '../Config3';

const maxTraverseDepth = 3;

function traverse3(
	value: any,
	checkFn: any,
	updateFn: any,
	key: any = null,
	_parent: any = null,
	_parentKey: any = null,
	depth: number = 0,
) {
	if (!sup3.isValid(value) || depth > maxTraverseDepth) return;
	try {
		Object.entries(value).forEach((entry) => {
			if (checkFn(entry[1], entry[0], value, key)) {
				updateFn(entry[1], entry[0], value, key);
				return;
			}
			if (sup3.isValid(entry[1])) {
				traverse3(entry[1], checkFn, updateFn, entry[0], value, key, depth + 1);
			}
		});
	} catch (e) {
		window.console.error(e);
	}
}

class Import3 {
	loadingManager: THREE.LoadingManager;

	_files: { [key: string | symbol]: any } = {};

	_fileFlag: { [key: string | symbol]: any } = {};

	_handlers: { [key: string]: any } = {};

	_loading: any[] = [];

	processing = false;

	output: any[] = [];

	path: string;

	outputCount = 0;

	template: any = template;

	maploader: {
		[key: string]: THREE.TextureLoader | EXRLoader | RGBELoader;
	} = {};

	modelloader: {
		[key: string]: GLTFLoader | ColladaLoader | FBXLoader | OBJLoader | BVHLoader | SVGLoader;
	} = {};

	constructor(loadingManager: THREE.LoadingManager) {
		loadingManager.onLoad = () => { this.onLoadingComplete() };
		this.loadingManager = loadingManager;

	}

	setMapsPath(path: string) {
		this.maploader.png = new THREE.TextureLoader(this.loadingManager).setPath(path);
		this.maploader.exr = new EXRLoader(this.loadingManager).setPath(path).setDataType(THREE.UnsignedByteType);
		this.maploader.hdr = new RGBELoader(this.loadingManager).setPath(path).setDataType(THREE.UnsignedByteType);
		return this;
	}

	setModelsPath(path: string) {
		this.modelloader = {};
		this.modelloader.glb = new GLTFLoader(this.loadingManager).setPath(path);
		this.modelloader.gltf = new GLTFLoader(this.loadingManager).setPath(path);
		this.modelloader.dae = new ColladaLoader(this.loadingManager).setPath(path);
		this.modelloader.fbx = new FBXLoader(this.loadingManager).setPath(path);
		this.modelloader.obj = new OBJLoader(this.loadingManager).setPath(path);
		this.modelloader['obj+'] = new OBJLoader(this.loadingManager).setPath(path);
		this.modelloader.bvh = new BVHLoader(this.loadingManager).setPath(path);
		this.modelloader.svg = new SVGLoader(this.loadingManager).setPath(path);
		this.modelloader.svg3d = new SVGLoader(this.loadingManager).setPath(path);
		return this;
	}

	onDone(callback: any) {
		if (!callback || typeof callback !== 'function')
			throw new Error('Empty or not executable callback given Import3.onDone');
		this._handlers.onDone = callback;
		return this;
	}

	import(config: any) {
		this.processing = true;
		try {
			this._loadFiles(config);
			this._loading.push(config);
		} catch (e) {
			window.console.warn('error.Import.loading', e);
		}
		return this;
	}

	onLoadingComplete() {
		for (let i = 0; i < this._loading.length; i++) {
			const config = this._loading[i];
			this._setFiles(config);
			this._makeMaterials(config);
			this._makeInstance(config);
			this._finish(config);
			this.output.push(config);
			this.processing = false;
		}
	}

	_loadFiles(config: any) {
		traverse3(
			config,
			(value: any) => sup3.isMapFilename(value) || sup3.isModelFilename(value),
			(value: any, key: any, parent: any) => {
				if (sup3.isModelFilename(value)) parent[key] = this._loadModel(value);
				else parent[key] = this._loadMap(value);
			},
		);
	}

	_setFiles(config: any) {
		traverse3(
			config,
			(value: any) => sup3.isLoadedSym(value, this._files),
			(value: any, key: any, parent: any) => {
				parent[key] = this._files[value];
			},
		);
	}

	_makeMaterials(config: any) {
		traverse3(
			config,
			(value: any, key: string | symbol, parent: any, parentKey: string) =>
				sup3.isStandardMaterialData(value, key, parent, parentKey) ||
				sup3.isMatcapMaterialData(value, key, parent, parentKey) ||
				sup3.isBasicMaterialData(value, key, parent, parentKey),
			(value: any, key: string | symbol, parent: any, parentKey: string) => {
				let x = 1;
				let y = 1;
				let material: any = null;
				if (value.repeat !== undefined && value.repeat !== null) {
					if (typeof value.repeat === 'number') {
						x = value.repeat;
						y = value.repeat;
					} else if (typeof value.repeat === 'object') {
						x = value.repeat.x;
						y = value.repeat.y;
					}
					delete value.repeat;
				}
				if (parentKey === 'standard') material = new THREE.MeshStandardMaterial(value);
				else if (parentKey === 'basic') material = new THREE.MeshBasicMaterial(value);
				else material = new THREE.MeshMatcapMaterial(value);
				const maps = ['map', 'alphaMap', 'roughnessMap', 'metalnessMap', 'normalMap'];
				for (const localkey of maps) {
					if (
						material[localkey] !== undefined &&
						material[localkey] !== null &&
						material[localkey].isTexture &&
						localkey !== 'highp'
					) {
						material[localkey].repeat.set(x, y);
						material[localkey].needsUpdate = true;
					}
				}
				material.needsUpdate = true;
				parent[key] = material;
				material.name = key;
			},
		);
	}

	_makeInstance(config: any) {
		traverse3(
			config,
			(value: any, key: string | symbol, _parent: any, parentKey: string) =>
				sup3.isValid(value) &&
				value.makeFirst &&
				(!sup3.isValid(parentKey) || parentKey.indexOf('Material') < 0) &&
				sup3.isValid(this.template) &&
				sup3.isValid(this.template[key]),
			(value: any, key: string, parent: any) => {
				const out = this.template[key](value);
				if (sup3.isValid3D(out) || (Array.isArray(out) && !out.some((it) => it === undefined))) {
					if (out.isObject3D && out.name === '') out.name = key;
					parent[key].mesh = out;
					if (cfg3.DEBUG) window.console.log(`template ${key}`);
				}
			},
		);

		traverse3(
			config,
			(value: any, key: string, _parent: any, parentKey: string) =>
				sup3.isValid(value) &&
				parentKey !== 'icons' &&
				parentKey !== 'text' &&
				!value.makeLast &&
				!value.makeFirst &&
				(!sup3.isValid(parentKey) || parentKey.indexOf('Material') < 0) &&
				sup3.isValid(this.template) &&
				sup3.isValid(this.template[key]),
			(value: any, key: string, parent: any) => {
				const out = this.template[key](value);
				if (sup3.isValid3D(out) || (Array.isArray(out) && !out.some((it) => it === undefined))) {
					if (out.isObject3D && out.name === '') out.name = key;
					parent[key].mesh = out;
					if (cfg3.DEBUG) window.console.log(`%template.${key}.done`, 'color:#ff00ff');
				}
			},
		);

		traverse3(
			config,
			(value: any, key: string, _parent: any, parentKey: string) =>
				sup3.isValid(value) &&
				value.makeLast &&
				!value.makeFirst &&
				(!sup3.isValid(parentKey) || parentKey.indexOf('Material') < 0) &&
				sup3.isValid(this.template) &&
				sup3.isValid(this.template[key]),
			(value: any, key: string, parent: any) => {
				const out = this.template[key](value);
				if (sup3.isValid3D(out) || (Array.isArray(out) && !out.some((it) => it === undefined))) {
					if (out.isObject3D && out.name === '') out.name = key;
					parent[key].mesh = out;
					if (cfg3.DEBUG) window.console.log(`%template.${key}.done`, 'color:#ff00ff');
				}
			},
		);
	}

	_finish(output: any) {
		this.outputCount++;
		if (this._handlers.onDone) {
			this._handlers.onDone(output);
		}
	}

	_loadMap(name: string) {
		const extension = () => {
			let ext = name.split('.').pop()!.toLowerCase();
			if (sup3.imageFileExtensions.indexOf(`.${ext}`) >= 0) {
				if (ext !== 'exr' && ext !== 'hdr') ext = 'png';
				return ext;
			}
			return false;
		};
		const path = this.path + name;
		const sym = Symbol.for(path);
		if (!this._fileFlag[sym]) {
			this._fileFlag[sym] = true;
			let loader = this.maploader[extension() as string];
			if (!sup3.isValid(loader)) loader = this.maploader.png;
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const map = loader.load(name, () => {});
			map.wrapS = THREE.RepeatWrapping;
			map.wrapT = THREE.RepeatWrapping;

			map.needsUpdate = true;
			this._files[sym] = map;
		}
		return sym;
	}

	_loadModel(name: string) {
		const extension = () => {
			let ext = name.split('.').pop()!.toLowerCase();
			if (sup3.modelFileExtensions.indexOf(`.${ext}`) >= 0) {
				if (ext === 'gltf') ext = 'glb';
				return ext;
			}
			return '';
		};
		const ext0: string = extension();
		const path = ext0 !== '' ? this.modelloader[ext0].path + name : ext0;
		const sym = Symbol.for(`${path}`);
		if (!this._fileFlag[sym]) {
			this._fileFlag[sym] = true;

			if (
				ext0 !== 'obj+' &&
				typeof ext0 === 'string' &&
				Object.prototype.hasOwnProperty.call(this.modelloader, ext0)
			) {
				this.modelloader[ext0].load(name, (model: any) => {
					model.filename = name;
					this._files[sym] = model;
				});
			} else {
				const mtl = new MTLLoader();
				mtl.setPath(path.replace(name, '')).load(name.replace('.obj+', '.mtl'), (materials) => {
					materials.preload();
					this.modelloader[ext0]
						.setPath(path.replace(name, ''))
						.load(name.replace('.obj+', '.obj'), (model: any) => {
							model.filename = name;
							this._files[sym] = model;
						});
				});
			}
		}
		return sym;
	}
} // class Import3

export { traverse3, Import3 };
