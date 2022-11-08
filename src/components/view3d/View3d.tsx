import React, { RefObject } from 'react';
import { ViewState } from './ViewSlice';
import styles from './View3d.module.css';
import * as III from 'three';
import { now3 } from './Now3';
import { sup3 } from './util/Support3';
import { Import3 } from './util/Import3';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { createComposer } from './util/Composer';
import { stepWorld } from "./template/common";
import { VRButton } from "./util/AVR";
export class View3d extends React.Component<any, ViewState> {
    container: RefObject<HTMLDivElement>;
    canvas: RefObject<HTMLCanvasElement>;
    renderer: III.WebGLRenderer;
    composer: EffectComposer;
    live: Array<III.Object3D>;
    showSummary:boolean;
//    labels:RefObject<HTMLDivElement>;
//    css2d:CSS2DRenderer;
    constructor(props:any){
        super(props);
        this.container = React.createRef();
//        this.labels = React.createRef()!;
        this.canvas = React.createRef()!;
        this.state={
            width:0,
            height:0,
            paused:false,
            ready:false,
        }
    }

    componentDidMount(){
        // @ts-ignore: Object is possibly 'null'.
        const renderer = new III.WebGLRenderer({ canvas:this.canvas.current, antialias: true, alpha: false });
		renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
		renderer.shadowMap.enabled = true;
		renderer.setClearColor(new III.Color(0), 0);
		renderer.toneMapping = III.ACESFilmicToneMapping;
		this.renderer = renderer;
        now3.setup(this);

        document.body.appendChild( VRButton.createButton( this.renderer, {} ) );	
        window.addEventListener('resize', this.updateSize);
        this.updateSize();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateSize);
    }

    updateSize = () =>{
        this.setState( () => {
            // @ts-ignore: Object is possibly 'null'.
            const w = (sup3.isValid(this.container.current))?this.container.current.clientWidth:0;
            // @ts-ignore: Object is possibly 'null'.
            const h = (sup3.isValid(this.container.current))?this.container.current.clientHeight:0;
            this.renderer.setSize(w,h);
			now3.camera.updateProjectionMatrix();
            return {
                width: w,
                height: h 
            }
      });
    }

    configure( cfg: any ){
        console.log('cfg')
        const manager = new III.LoadingManager();
        const imp = new Import3(manager).setModelsPath('').setMapsPath('./maps/');
        imp.import( cfg );
/*        let ball=new III.Mesh( new III.SphereGeometry(1), new III.MeshStandardMaterial({ roughness:0.4, metalness:1, envMap:now3.envmap, color: 0xffffff }));
        ball.translateY(1);
        ball.castShadow = true;
        now3.toScene( ball );
*/
    }

    play(){
        console.log('play');
        console.log(now3)

        const loop1 = () =>{
            let d=now3.clock.getDelta();
            this.animate(d);
            this.renderer.render( now3.scene, now3.camera );
        }
/*
        const loop1 = () =>{
            let d=now3.clock.getDelta();
            this.animate(d);
            this.composer.render();
        }
*/
        this.composer = createComposer(this.state.width, this.state.height, this.renderer, now3.scene, now3.camera )
        this.renderer.setAnimationLoop(loop1);
    }

    animate(d:number){
        stepWorld(d);
        now3.controls.update();
    }
    passSummary(){
        return 
    }
    handleKey=(e:any)=>{
         console.log(e.keyCode)
    }
    render(){
        return (
            <div id="view3d" className={ styles.view3dcontainer } ref={ this.container } onKeyDown={ this.handleKey }>
                <canvas ref={ this.canvas }></canvas>
            </div>
        )
    }
}

export const LeftBar=()=>{
    return (<div className='leftBar'>
            { now3.summary.stableList.map((val)=>{ return (
                <li>{ val }</li>
            )})}
            </div>)
}