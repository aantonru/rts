import * as III from 'three';
import { View3d } from './View3d';
import { skyenv } from './util/Sky3';
import { sup3 } from './util/Support3';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { cfg3 } from "./Config3";
import PhysicsWorld from "ammojs-typed";
import { ChemElem } from './util/chemElem';

interface INow {
    ready: boolean;
    camera: III.OrthographicCamera;
	scene: III.Scene;
	clock: III.Clock;
    envmap: III.Texture;
    frame: number;
    app: View3d;
}

interface iSummary {
    stableSets: Array<Set<ChemElem>>;
    stableList: Array<String>;
    countIndex: Array<Number>;
    display:boolean;
}

export class Now3 implements INow {
    ready: boolean;
    camera: III.OrthographicCamera;
	scene: III.Scene;
	clock: III.Clock;
    envmap: III.Texture;
    frame: number;
    app: View3d;
    controls: OrbitControls;
    matlib:any;
    world:any;
    bodies:Array<any>;
    tmptrans:any;
    periodic: Array<any>;
    summary: iSummary;
    constructor(){
        //this.camera = new III.PerspectiveCamera(45, 2, 3, 1000 );
        const frustumSize=500;
        const aspect=window.innerWidth/window.innerHeight;
        this.camera=new III.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
        this.camera.position.fromArray( cfg3.camera.position );
        this.camera.zoom=10;
        this.scene = new III.Scene();
        this.toScene( this.camera );
        this.clock = new III.Clock();
        this.ready = false;
        this.frame = 0;
        this.matlib = {};
        this.bodies = [];
        this.periodic = [];
        this.summary = { stableSets:[], stableList:[], countIndex:[], display:false};
    }
    setup( app:View3d ){
		this.envmap = skyenv(app.renderer, true);
	//	this.scene.environment = this.envmap;
//		this.scene.background = this.envmap;
        if (sup3.isValid(app.container.current)) this.controls = new OrbitControls( this.camera, app.container.current! );
        this.app = app;
		if (!this.ready) {
			app.configure(cfg3);
		}
    };
    toScene(content: any) {
		if (sup3.isValid3D(content)) {
			this.scene.add(content);
		} else if (sup3.isValid(content) && Array.isArray(content)) {
			content.forEach((item:III.Object3D) => {
				if (sup3.isValid3D(item)) {
					this.scene.add(item);
				} else console.warn(`invalid array item ignored`, item)
			});
		} else console.warn(`invalid content ignored`, content)
	}
}

export const now3 = new Now3();