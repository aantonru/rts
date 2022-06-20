import * as III from 'three';
// eslint-disable-next-line import/no-cycle
import { now3 } from '../Now3';
import { tzepType, tzepPort } from '../util/Matter';

export function tzepGeo( type: tzepType, port: tzepPort, size:number ){
    let tubeSegs=6;
    let getGeo;

    switch (type) {
        case tzepType.cyl:
                tubeSegs = 24;
            break;
        case tzepType.five:
                tubeSegs = 5;
            break;
        case tzepType.gex:
            tubeSegs = 6;
            break;
        case tzepType.quad:
            tubeSegs = 4;
            break;
        default:
            tubeSegs=6;
            break;
    }

    const curveM = new III.SplineCurve( [
        new III.Vector2( 0, 1 ),
        new III.Vector2( 0.12, 0.85 ),
        new III.Vector2( 0.05, 0.72 ),
        new III.Vector2( 0.13, 0.65 ),
        new III.Vector2( 0.11, 0.6 ),
        new III.Vector2( 0.1, 0.5 ),
        new III.Vector2( 0.12, 0.2 ),
        new III.Vector2( 0.3, 0.0 ),
    ] );
    const curveF = new III.SplineCurve( [
        new III.Vector2( 0.07, 0.4 ),
        new III.Vector2( 0.13, 0.4 ),
        new III.Vector2( 0.17, 0.25 ),
        new III.Vector2( 0.1, 0.15 ),
        new III.Vector2( 0.15, 0.09 ),
        new III.Vector2( 0.3, 0.0 ),
    ] );
    switch (port) {
        case tzepPort.male:
            getGeo = () =>{
                const geometry = new III.LatheGeometry( curveM.getPoints(30), tubeSegs );
                geometry.rotateX(-Math.PI/2)
                return geometry
            };
            break;    
        default:
            getGeo = () =>{

                const geometry = new III.LatheGeometry( curveF.getPoints(20), tubeSegs );
                geometry.rotateX(-Math.PI/2)
                return geometry
            };
            break;
    }

    let geo = getGeo();
   // geo.rotateX( -Math.PI/2 );
    geo.scale(size, size, size);
    geo.name=`TZEP-${type}-${port}-${size.toFixed(3)}`;

    return geo
}

export function tzepMat(tztype:tzepType, port:tzepPort ){
    const flat = ( ) =>{
        return false;//(tztype!==tzepType.cyl)
    }
    let mat= new III.MeshStandardMaterial({ side:2, flatShading:flat(), color:0xffffff, emissive:0x000000, roughness:0.5, metalness:1, envMap:now3.envmap });
    //mat=new III.MeshStandardMaterial({ roughness:0, metalness:1, envMap:now3.envmap, emissive:0x555555, color: 0xffffff });
    return mat
}

export function getMat(n:number, max:number):III.MeshStandardMaterial{
	const mat=new III.MeshStandardMaterial({ roughness:0, metalness:0, envMap:now3.envmap, emissive:0x000000, color: 0xffffff });
//	let h = n/max;
//	mat.color.setHSL(h, (10-max)/10, 0.5);
	return mat
}
