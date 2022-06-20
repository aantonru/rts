import * as III from 'three';
import { now3 } from '../Now3';
import { tzepGeo, tzepMat, getMat } from '../template/tzeps';
import { M3 } from './Math3';
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'meshline';
import Ammo from "ammojs-typed";
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';



const maxOxi=8;


enum itype {
    gravity,
    electro,
    magnet
}

export enum tzepType {
    quad,
    five,
    gex,
    cyl
};

export enum tzepPort {
    male,
    female
}

export class Tzep extends III.Group {
    tztype: tzepType;
    port: tzepPort;
    isFree: boolean;
    size: number;
    constructor(type:tzepType, port:tzepPort, size=0.77){
        super();
        this.tztype = type || tzepType.cyl;
        this.port = port;
        this.size = size || 1;
        this.isFree = true;

       // console.log(`port=${this.port}`)

        this.defaultTemplate();
    }
    defaultTemplate(){
        const geo = tzepGeo( this.tztype, this.port, this.size );
        const mat = tzepMat( this.tztype, this.port );
        const mesh = new III.Mesh( geo, mat);
        this.add( mesh );
    }
}

let cold=new III.Color(0x445566);
let warm=new III.Color(0xff0000);
let hot=new III.Color(0xff9900);
let black=new III.Color(0x000000);
let white=new III.Color(0xffffff);
let pos=new III.Color(0xff2200);
let neg=new III.Color(0x0022ff);

//const allowOxies=[-2,1,6,3,-3]

export class Olecula extends III.Group {
    mass: number;
    radius: number;
    thermal: number;
    _thermal:number;
    oxi:number;
    pure:boolean;
    open:boolean;
    tzeps: Array<Tzep>;
    mainMaterial: III.MeshStandardMaterial;
    links:Array<Olecula>;
    lines:Array<III.Mesh>;
    constructor( params:any ){
        super();
        this.links=[];
        this.lines=[];
        this.oxi=Math.floor(M3.rand(-maxOxi, maxOxi));
        if (this.oxi===0) this.oxi=M3.rand(-1,1)>0?1:-1;
        this.radius = params.radius || (0.5+Math.abs(this.oxi/6));
        this.mass = params.mass || Math.pow(this.radius, 3)*M3.PI*4/3;
        this.thermal = params.thermal || 0;
        this.pure=true;
        this.open=true;

        const geo = new III.IcosahedronGeometry( this.radius*0.7 || 0.7, 4 );
       // geo.scale(0.9,0.9,0.9);
        const mat = new III.MeshStandardMaterial({ roughness:(1-Math.abs(this.oxi)/maxOxi)*0.1, metalness:this.oxi<=0?0:this.oxi/maxOxi, side:0, flatShading:false, envMap:now3.envmap, color:0xffffff });
        mat.color.lerpColors(white, (this.oxi>0)?pos:neg, Math.abs(this.oxi)/maxOxi);
        this.mainMaterial = mat;
        let mesh = new III.Mesh( geo, mat);

        mesh.name="quark0";
        this.tzeps = [];
        this.add( mesh );
        this._thermal=this.thermal;
//        this.updateThermal();
        return this
    }
    step( delta:number ){
        if (this._thermal!==this.thermal && Math.abs(this._thermal-this.thermal)>delta) {
            this._thermal=this._thermal+(this.thermal-this._thermal)*delta;
            if (Math.abs(this._thermal-this.thermal)<=delta) this._thermal=this.thermal;
            //this.updateThermal();
        }
        //this.updateLines();  
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
    addLink( it:Olecula, isResponse=false ){
        let oxi=this.oxi+it.oxi;
        this.links.push(it);
        if (!isResponse) it.addLink(this, true);
    
        this.oxi=(oxi*this.oxi<0)?0:oxi;
        if (this.oxi===0) this.open=false;
        this.pure=false;

        if (!isResponse) {
            const rgb=this.computeColor()
            this.mainMaterial.color.setRGB(rgb[0], rgb[1], rgb[2]);
            this.getDeepLinks().forEach(dl=>{ dl.useMaterial( this.mainMaterial )});

            const v0=new III.Vector3(0,0,0);
            const v1=new III.Vector3();
            v1.subVectors(it.position, this.position);
            
            const positions=[...v0.toArray(), ...v1.toArray()];
            const geometry = new LineGeometry();
				geometry.setPositions( positions );
			//	geometry.setColors( colors );

			const matLine = new LineMaterial( {

					color: this.mainMaterial.color.getHex(),
					linewidth: 9, // in world units with size attenuation, pixels otherwise
					vertexColors: false,

					//resolution:  // to be set by renderer, eventually
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
				this.add( line );
                this.lines.push(line)

           // if (Array.from(this.getDeepLinks().values()).every((li)=>{ return (!li.open)})) this.mainMaterial.wireframe=true; 
        }
    }
    getDeepLinks(links=new Set<Olecula>()):Set<Olecula>{
        this.links.filter(li=>{ return (!links.has(li))}).forEach(li=>{
            links.add(li);
            li.getDeepLinks(links);            
        })
        return links;
    }
    testLink( it:Olecula ):boolean{
        return (!this.links.some(li=>{ return (li.uuid===it.uuid)}) && this.open && it.open && (this.oxi*it.oxi<0))
    }
    updateThermal(){
        this.thermal=Math.max(0, this.thermal);
        this.thermal=Math.min(this.thermal,200);
        this._thermal=Math.max(0, this._thermal);
        this._thermal=Math.min(this._thermal,200);
      //  if (this._thermal<=100) this.mainMaterial.color.lerpColors(cold, warm, this._thermal/100);
      //  else this.mainMaterial.color.lerpColors(warm, hot, (this._thermal-100)/100);

      //  this.mainMaterial.emissive.lerpColors( black, hot, this._thermal/200);
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
    getCore(){
        let it=this.children.find(c=>{ return (c.name==="quark0")})
        return it
    }
    deltaTermal( dt:number ){
        this.thermal+=dt;
    }
    pushTzep( tzep:Tzep, phi:number, theta:number ){
        this.add( tzep );
        const sph = new III.Spherical( this.radius, phi, theta );
        tzep.position.setFromSpherical( sph );

        let v=new III.Vector3();
        this.getWorldPosition(v);
        tzep.lookAt( v );
        this.tzeps.push(tzep);
    }
    computeColor(target=new III.Color()):Array<number>{
       let list=Array.from(this.getDeepLinks().values())
        let mss=list.map((q)=>{ return (q.mass)});
        let total=mss.reduce((sum, m0)=>{ return (sum+m0)},0);
        let oss=list.map(q=>{ return (q.open?q.mass:0)});
        let toss=oss.reduce((sum,ss)=>{
            return (sum+ss);
        });
        let r=((total*4000)%255)/255;
        r=Math.max(r,0);
        r=Math.min(1,r);
        let g=((toss*4000)%255)/255;
        g=Math.max(g,0);
        g=Math.min(1,g);
        target.setRGB(r,g, Math.abs(g-r));
        return target.toArray();

    }
};

export class Body extends III.Mesh {
    velocity: III.Vector3;
    mass: number;
    force: III.Vector3;
    friction: number;
    ivals: Array<number>;
    radius: number;
    thermal: number;
    constructor( params:any ){
        const geo = new III.SphereGeometry( params.radius || 1, 24, 18 );
        geo.scale(0.9,0.9,0.5);
        
        const mat =new III.MeshStandardMaterial({ roughness:0, metalness:1, envMap:now3.envmap, emissive:0x555555, color: 0xffffff });
        super( geo, mat );
        this.radius = params.radius || 1;
        this.mass = params.mass || Math.pow(this.radius, 2)*M3.PI;
        this.friction = params.friction || 0.5;
        this.thermal = params.thermal || 0;
        this.force = new III.Vector3();
        this.ivals = params.ivals || [this.mass, 0, 0];
        this.velocity = new III.Vector3();

        this.geometry.rotateX(M3.rand(-1,1));
        this.geometry.rotateY(M3.rand(-1,1));
        this.geometry.rotateZ(M3.rand(-1,1));

        return this
    }
    
    compute(delta:number, all:Array<Body>){
        let vs=all.map((it)=>{ return it.position });
        this.sumForce(itype.gravity, vs);
        this.step( delta );
    }
    animate(delta:number){
        let v = new III.Vector3();
        v.copy( this.velocity.normalize() );
        this.translateOnAxis( v, III.MathUtils.clamp(this.velocity.length()*delta, 0, 0.1) );
        const k=0.023;
        this.geometry.rotateX(this.velocity.x*k);
        this.geometry.rotateY(this.velocity.y*k);
        this.geometry.rotateZ(this.velocity.z*k);
    }

    sumForce( ftype:itype, fvs:Array<III.Vector3>){
        let out=new III.Vector3();
        const D=1.3;
        let hits=fvs.filter(it=>{ return (!it.equals(this.position) && this.position.distanceTo(it)<this.radius*D)})
        
        if (hits && hits.length ) {
            hits.forEach(it=>{
                let dv=new III.Vector3();
                dv.copy(this.position);
                this.velocity.set(0,0,0);
                const v2=this.radius*D-this.position.distanceTo(it)
                dv.sub( it );
                dv.negate();
                out.addScaledVector( dv.negate(), Math.pow(v2,5) );
            })
        } else {
            for (let i=0; i<fvs.length; i++){
                let dv2=new III.Vector3();
                dv2.copy(this.position);
                dv2.sub( fvs[i] );
                out.addScaledVector( dv2.negate(), 1 );
            }
        }

        this.force.copy(out);
    }
    step( delta:number ){
        this.velocity.multiplyScalar(1-this.friction*delta);
        this.velocity.clampLength(0,50);
        if (this.force.length()>0) this.velocity.addScaledVector( this.force, this.mass*delta );
        this.force.set(0,0,0);
    }
    
}