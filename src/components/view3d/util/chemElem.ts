import * as III from 'three';
import { M3 } from '../util/Math3';
import { now3 } from '../Now3';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Ammo from "ammojs-typed";

const maxIonCharge = 9;
let cold=new III.Color(0x445566);
let warm=new III.Color(0xff0000);
let hot=new III.Color(0xff9900);
let black=new III.Color(0x000000);
let white=new III.Color(0xffffff);
let pos=new III.Color(0xff2200);
let neg=new III.Color(0x0022ff);

export interface chemData {
    atomicNumber: number;
    symbol:  string;
    atomicMass:  string;
    atomicMassNumber: number;
    electronicConfiguration:  string;
    electronegativity: number;
    atomicRadius: number;
    ionRadius:  string;
    ionRadiusNumber: number;
    vanDerWaalsRadius: number;
    ionizationEnergy: number;
    electronAffinity: number;
    oxidationStates:  string;
    standardState:  string;
    bondingType:  string;
    meltingPoint: number;
    boilingPoint: number;
    density: number;
    groupBlock:  string;
    yearDiscovered: number;
    block:  string;
    cpkHexColor:  string;
    period: number;
    group: number;
    chemIndex: number;
    charge:number;
}

export class ionType implements chemData {
    atomicNumber: number;
    symbol:  string;
    atomicMass:  string;
    atomicMassNumber: number;
    electronicConfiguration:  string;
    electronegativity: number;
    atomicRadius: number;
    ionRadius:  string;
    ionRadiusNumber: number;
    vanDerWaalsRadius: number;
    ionizationEnergy: number;
    electronAffinity: number;
    oxidationStates:  string;
    standardState:  string;
    bondingType:  string;
    meltingPoint: number;
    boilingPoint: number;
    density: number;
    groupBlock:  string;
    yearDiscovered: number;
    block:  string;
    cpkHexColor:  string;
    period: number;
    group: number;
    chemIndex: number;
    charge:number;
    constructor( id=0 ){
        id=Math.max(id-1,0);
        let pd=now3.periodic;
        let def = { ...pd[id] };
        this.chemIndex=id;
        this.charge = def.charge;

        type tkey = keyof typeof this;

        Object.entries( def ).forEach((ent:Array<any>)=>{
            const key=ent[0] as tkey;
            let val=ent[1];

            if (key==="atomicMass") {
                if (Array.isArray(val)) val=val[0];
                if (typeof val === "string") {
                    this.atomicMass=val;
                    const c0=0;
                    const c1=val.indexOf("(")>0?val.indexOf("("):val.length;
                    this.atomicMassNumber=parseFloat( val.substring(c0,c1) );
                }
            } else if (key==="ionRadius") {
                this.ionRadius=val;
                if ( val!==val || (typeof val!=="number")) this.ionRadiusNumber=1;
                else this.ionRadiusNumber=val;
            }  
            else this[key]=val;
        })

    }

}

class chemLink extends III.Mesh {
    A:ChemElem;
    B:ChemElem;
    constructor( A:ChemElem, B:ChemElem){
        const curve = new III.SplineCurve( [
            new III.Vector2( 0, 1 ),
            new III.Vector2( 0.12, 0.85 ),
            new III.Vector2( 0.05, 0.72 ),
            new III.Vector2( 0.13, 0.65 ),
            new III.Vector2( 0.11, 0.6 ),
            new III.Vector2( 0.1, 0.5 ),
            new III.Vector2( 0.12, 0.2 ),
            new III.Vector2( 0.3, 0.0 ),
        ] );
        const geo = new III.LatheGeometry( curve.getPoints(20), 12 );
        geo.rotateX(-Math.PI/2);
        let mat=new III.MeshStandardMaterial({color:0xffffff, envMap:now3.envmap, roughness:0.4, metalness:0.1})
        super(geo, mat);
        
    }
}

export class ChemElem extends III.Group {
    ion:chemData;
    mass: number;
    radius: number;
    thermal: number;
    _thermal:number;
    pure:boolean;
    open:boolean;
    scaleRadius:number;

    mainMaterial: III.MeshStandardMaterial;
    links:Array<ChemElem>;
    lines:Array<III.Mesh>;
    constructor( params:any ){
        super();
        this.scaleRadius=0.9;
//        joint.get_m_setting().set_m_tau( o.strength );
        let ok=[3,5,8];
        this.ion=new ionType(ok[Math.floor(M3.rand(0,400))%3]);
        this.links=[];
        this.lines=[];
        let knotFlag=false;
        if (typeof this.ion.atomicRadius!=="number") {
            this.ion.atomicRadius=1;
            //knotFlag=true;
        }

        this.radius = M3.mapLinear( this.ion.atomicRadius, 0, 300, 0, 2);
        this.mass = params.mass || this.ion.atomicMassNumber;
        this.thermal = params.thermal || 0;
        this.pure=true;
        this.open=true;

        const geo = knotFlag?new III.TorusKnotGeometry(this.radius*this.scaleRadius,0.3*this.radius*this.scaleRadius,225,12): new III.IcosahedronGeometry( (this.radius || 1)*this.scaleRadius, 4 );
       // geo.scale(0.9,0.9,0.9);
        let met=this.ion.bondingType==="metallic"?0.7:0;
        let roug=0.15;
        const mat = new III.MeshStandardMaterial({ roughness: roug, side:1, metalness: met, flatShading:false, envMap:now3.envmap, color: `#${this.ion.cpkHexColor}` });
        //mat.color.lerpColors(white, (this.ion.charge>0)?pos:neg, Math.abs(this.ion.charge)/maxIonCharge);
//        mat.color.set(  );
//        mat.color.setStyle( `#${this.ion.cpkHexColor}` );
        if (this.ion.standardState==="gas") mat.setValues({transparent:true, opacity:0.8});
        this.mainMaterial = mat;
        let mesh = new III.Mesh( geo, mat);

        mesh.name="quark0";
        this.add( mesh );
        this._thermal=this.thermal;

        this.makeSymSprite();
       // console.log(this);
    }
    makeSymSprite(){
        let canvas=document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        let ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.textAlign = "center";
            ctx.font="500 128px Tahoma";
            ctx.strokeStyle=`#777`;
            ctx.fillStyle=`#${this.ion.cpkHexColor}`;
            let sc = this.mainMaterial.color.toArray().reduce((sum, val)=>{ return (sum+val)}, 0);
            let invert=new III.Color();
            invert.copy(this.mainMaterial.color);
            invert.offsetHSL(0.5 , 0.5, 0.5)
            ctx.fillStyle= (sc>2)?"#000000":"#ffffff";
            if (this.mainMaterial.metalness>0) ctx.fillStyle="#ffffff";
            else ctx.fillStyle="#000000";
            
            ctx.lineWidth=4;
            ctx.strokeText( this.ion.symbol, 128, 168)
            ctx.fillText( this.ion.symbol, 128, 168);
        };
        let texture = new III.CanvasTexture(canvas);
        let mat = new III.SpriteMaterial({map:texture, transparent:true, color:0xffffff});
        //let mat= new III.ShaderMaterial({ uniforms:uni, vertexShader:vertex, fragmentShader: fragment});

//        mat.depthTest=false;
        let sprite = new III.Sprite(mat);
        sprite.name="symbol";
        sprite.scale.multiplyScalar(this.radius*1.5);
        this.add(sprite);
/*
        sprite.onBeforeRender = (renderer, scene, camera)=>{
            let v=new III.Vector3();
            sprite.getWorldPosition(v);
            const d0=v.distanceTo(camera.position);
            if (d0<3) sprite.material.opacity=1;
            else if (d0>30) sprite.material.opacity=0;
            else sprite.material.opacity=M3.map(d0,3,30,1,0)
        }
*/

    }
    make2d(){
        const sym = document.createElement( 'div' );
        sym.className = 'symbol';
        sym.textContent = this.ion.symbol;
        sym.style.fontSize = '36px';
        sym.style.color = "#aaffff";
        sym.style.fontFamily = 'Tahoma';
        let o2=new CSS2DObject(sym);
        this.add(o2);
    }
    step( delta:number ){
        if (this._thermal!==this.thermal && Math.abs(this._thermal-this.thermal)>delta) {
            this._thermal=this._thermal+(this.thermal-this._thermal)*delta;
            if (Math.abs(this._thermal-this.thermal)<=delta) this._thermal=this.thermal;
           // this.updateThermal();
        }
        this.updateLines();  
    }
    getDeepLinks(links=new Set<ChemElem>()):Set<ChemElem>{
        this.links.filter(li=>{ return (!links.has(li))}).forEach(li=>{
            links.add(li);
            li.getDeepLinks(links);            
        })
        return links;
    }
    testLink( it:ChemElem ):boolean{
        return (!this.links.some(li=>{ return (li.uuid===it.uuid)}) && this.open && it.open && (this.ion.charge*it.ion.charge<0))
    }
    updateThermal(){
        this.thermal=Math.max(0, this.thermal);
        this.thermal=Math.min(this.thermal,200);
        this._thermal=Math.max(0, this._thermal);
        this._thermal=Math.min(this._thermal,200);    
        return this
    }
    getCore(){
        let it=this.children.find(c=>{ return (c.name==="quark0")})
        return it
    }
    deltaTermal( dt:number ){
        this.thermal+=dt;
    }
    addLink( it:ChemElem, isResponse=false ){
        let ionCharge=this.ion.charge+it.ion.charge;
        this.links.push(it);
        let body=this.userData.body;
        if (!isResponse) it.addLink(this, true);
    
        this.ion.charge=(ionCharge*this.ion.charge<0)?0:ionCharge;
        const wasOpen=this.open;
        if (this.ion.charge===0) this.open=false;
        this.pure=false;

        if (wasOpen && !this.open && this.testStable()) this.onStableConnect();

        if (!isResponse) {
//            this.mainMaterial.color.set(`#${this.ion.cpkHexColor}`);
           // this.getDeepLinks().forEach(dl=>{ dl.useMaterial( this.mainMaterial )});

            const v0=new III.Vector3(0,0,0);
            const v1=new III.Vector3();
            v1.subVectors(it.position, this.position);
            const sf0=this.radius*this.scaleRadius/v1.length();
            const sf1=it.radius*this.scaleRadius/v1.length();
            v0.addScaledVector(v1, sf0);
            v1.multiplyScalar(1-sf1);
            v0.copy( this.position );
            v1.copy( it.position );
            
            const positions=[...v0.toArray(), ...v1.toArray()];
            const colors=[...this.mainMaterial.color.toArray(), ...it.mainMaterial.color.toArray()];
            const geometry = new LineGeometry();
				geometry.setPositions( positions );
				geometry.setColors( colors );
            let c1=new III.Color();
            c1.lerpColors(this.mainMaterial.color, it.mainMaterial.color, 0.5)
			const matLine = new LineMaterial( {
					color: c1.getHex(),
					linewidth: 2, // in world units with size attenuation, pixels otherwise
					vertexColors: true,
					dashed: false,
					alphaToCoverage: false,
				} );

				let line = new Line2( geometry, matLine );
				line.computeLineDistances();
				line.scale.set( 1, 1, 1 );
                matLine.resolution.set( now3.app.state.width, now3.app.state.height);
                let q0=new III.Quaternion();
                q0.copy(this.quaternion);
                q0.invert();
                line.quaternion.copy(q0)
				now3.toScene( line );
                this.lines.push(line);
           // if (Array.from(this.getDeepLinks().values()).every((li)=>{ return (!li.open)})) this.mainMaterial.wireframe=true; 
        }
    }
    onStableConnect(){
        const setEqual=(set0:Set<ChemElem>, set1:Set<ChemElem>)=>{
            return ((set0.size === set1.size) && Array.from(set0).every(val=>{ return (set1.has(val))})) //set0.some(it0=>{ return (!it.has())}))
        }
        let st0=this.getDeepLinks();
        if (now3.summary.stableSets.every(st1=>{ return (!setEqual(st0, st1))})) {
            let str=`${Array.from(this.getDeepLinks()).map(ch=>{ return `${ch.ion.symbol}`}).join(" - ")}`;
            console.log(str);
            now3.summary.stableList.push( str );
            now3.summary.stableSets.push(this.getDeepLinks());
        }

    }
    updateLines(){
        if (this.lines.length==this.links.length && this.links.length) {
            const max=this.lines.length;
            const p0=new III.Vector3();
            const p1=new III.Vector3();
            p0.copy(this.position);
            for (let i=0; i<max; i++){
                p1.copy(this.links[i].position);
                let g0=this.lines[i].geometry as LineGeometry;
                g0.setPositions([...p0.toArray(), ...p1.toArray()]);

                let line1=this.lines[i] as Line2;
                line1.computeLineDistances();
            }
        }
    }
    useMaterial( mat:III.MeshStandardMaterial){
        let quarks=this.children as Array<III.Mesh>;
        let q0=quarks.find((c)=>{ return (c && c.name==="quark0")});
        if (q0) q0.material=mat;

        if (this.lines.length) this.lines.forEach((li)=>{
            let line=li as Line2;
            let mat1=li.material as LineMaterial;
            mat1.color.set(mat.color);
            line.computeLineDistances();
        })
        this.mainMaterial=mat;
    }
    testStable(){
        return (Array.from(this.getDeepLinks()).every(li=>{ return (!li.open)})) 
    }
}