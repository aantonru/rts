import * as THREE from 'three';

export const sup3 = {
	imageFileExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.exr', '.hdr'],
	modelFileExtensions: ['.svg', '.svg3d', '.glb', '.gltf', '.dae', '.obj', '.obj+', '.fbx', '.bvh'],
	materialsArrayKeys: ['standardMaterials', 'matcapMaterials', 'basicMaterials'],
	frameMaterialKeys: ['baseMaterial', 'decorMaterial'],
	frameStyleKeys: ['frameStyle'],
	isValid: (value: any) => value !== undefined && value !== null,
	// eslint-disable-next-line no-self-compare
	isValNum: (value: any) => sup3.isValid(value) && value === value && typeof value === 'number',
	isValid3D: (value: any) => sup3.isValid(value) && value.isObject3D,
	isMapFilename: (value: any) =>
		sup3.isValid(value) &&
		(typeof value === 'string' || value instanceof String) &&
		sup3.imageFileExtensions.some((ext) => value.indexOf(ext) !== -1),
	isModelFilename: (value: any) =>
		sup3.isValid(value) &&
		(typeof value === 'string' || value instanceof String) &&
		sup3.modelFileExtensions.some((ext) => value.indexOf(ext) !== -1),
	isObject: (value: any) => sup3.isValid(value) && typeof value === 'object' && Object.entries(value).length > 0,
	isContainer: (value: any) =>
		sup3.isValid(value) && sup3.isObject(value) && Object.values(value).some((val) => sup3.isObject(val)),
	isLoadedSym: (value: any, files: any) =>
		sup3.isValid(files) && sup3.isValid(value) && typeof value === 'symbol' && sup3.isValid(files[value]),
	isStandardMaterialData: (value: any, _key: any, _parent?: any, parentKey?: string) =>
		sup3.isValid(value) && sup3.isValid(parentKey) && parentKey === 'standard',
	isMatcapMaterialData: (value: any, key: any, _parent?: any, parentKey?: string) =>
		sup3.isValid(value) && sup3.isValid(key) && sup3.isValid(parentKey) && parentKey === 'matcap',
	isBasicMaterialData: (value: any, _key: any, _parent?: any, parentKey?: string) =>
		sup3.isValid(value) && sup3.isValid(parentKey) && parentKey === 'basic',
	isMaterialWithRepeat: (value: any, key: any, _parent?: any, parentKey?: string) =>
		(sup3.isBasicMaterialData(value, key, parentKey) ||
			sup3.isStandardMaterialData(value, key, parentKey) ||
			sup3.isMatcapMaterialData(value, key, parentKey)) &&
		sup3.isValid(value.repeat),
	isTemplateMethod: (value: any, key: any, _parent: any, _parentKey: string, templates: any) =>
		sup3.isValid(templates) && sup3.isValid(value) && sup3.isValid(key) && sup3.isValid(templates[key]),
	isFun: (functionToCheck: any) => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]',
	isString: (val: any) => sup3.isValid(val) && typeof val === 'string' && val.length > 0,
	zy2yz: (v: any) => new THREE.Vector3(v.x, -v.z, v.y),
	del: (mesh: THREE.Mesh) => {
		mesh.visible = false;
		mesh.name = 'DELETED';
		mesh.geometry.dispose();
	},
};
