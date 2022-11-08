import * as III from 'three';
// eslint-disable-next-line import/no-cycle
import { now3 } from '../Now3';
import { Olecula, Tzep } from "../util/Matter";
//import { phy3 } from "../util/Phy3";
import Ammo from "ammojs-typed";
import { M3 } from "../util/Math3";
import data from "./periodic.json";
import { cfg3 } from "../Config3";
import { ChemElem } from '../util/chemElem';


Ammo(Ammo).then(()=>{
	let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
    	dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
    	overlappingPairCache = new Ammo.btDbvtBroadphase(),
    	solver = new Ammo.btSequentialImpulseConstraintSolver();
  	now3.world = new Ammo.btDiscreteDynamicsWorld(
    	dispatcher,
    	overlappingPairCache,
    	solver,
    	collisionConfiguration
  	);
  	now3.world.setGravity(new Ammo.btVector3(0, 0, 0));
	now3.tmptrans=new Ammo.btTransform();
});

readPeriodic(data);

function readPeriodic( data:any){
    if (data && Array.isArray(data) && data.length) {
        data.forEach(it=>{
            let ss=it.ionRadius;
            let c0=ss.indexOf("(");
            let c1=ss.indexOf(")");
            const sval=(ss.substring(c0+1, c1)).replace('*','');
            const sign=(sval.charAt(0)==="+")?1:((sval.charAt(0)==="-")?-1:0);
            const oxi=Number(sval);
			console.log(`${sval} == ${oxi}`)
            it.charge=oxi;
            it.chargeSign=sign;
        });

        now3.periodic=data;
    }
};

const rndv3=(x=1)=>{
	const x0=-x;
	const x1=x;
	let r=new Ammo.btVector3( M3.rand(x0,x1), M3.rand(x0,x1), M3.rand(x0,x1));
	return r;
}

function addBall( ball:ChemElem ){
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(ball.position.x, ball.position.y, ball.position.z));
	transform.setRotation(new Ammo.btQuaternion(ball.quaternion.x, ball.quaternion.y, ball.quaternion.z, ball.quaternion.w));
	let motionState = new Ammo.btDefaultMotionState(transform);

	let colShape = new Ammo.btSphereShape(ball.radius);
	colShape.setMargin(0.1);


	let localInertia = new Ammo.btVector3( 0, 0, 0);
	colShape.calculateLocalInertia(ball.mass, localInertia);

	let rbInfo = new Ammo.btRigidBodyConstructionInfo(
		ball.mass,
		motionState,
		colShape,
		localInertia
	);

	let body = new Ammo.btRigidBody(rbInfo);
	body.setRollingFriction(0.5);
	body.setFriction(0.5);
	body.setDamping(0.001, 0.001);
	now3.world.addRigidBody(body);
	ball.userData.body = body;
	now3.bodies.push(ball);
	let v=new III.Vector3();
	v.copy(ball.position);
	v.multiplyScalar(-0.1);


	body.applyCentralImpulse( rndv3(ball.mass*5.5) );
	body.applyTorqueImpulse( rndv3(0.015) );
	body.setUserPointer( now3.bodies.length-1 );

}


export function stepWorld(delta:number){
	now3.world.stepSimulation( delta, 1);
	const max=now3.bodies.length;
	let v=new III.Vector3();
	for (let i=0; i<max; i++){
		let it=now3.bodies[i];
		it.step(delta);
		let body=it.userData.body;
		let ms=body.getMotionState();
		if (ms) {
			ms.getWorldTransform(now3.tmptrans);
			let p=now3.tmptrans.getOrigin();
			let q=now3.tmptrans.getRotation();
			it.position.set(p.x(), p.y(), p.z());
			it.quaternion.set(q.x(), q.y(), q.z(), q.w());
			
			v.copy(it.position);
			v.multiplyScalar(-it.mass*1.5/(12+Math.random()*35));
			if ((it.position.length()>20) && (Math.random()*10<2)) it.deltaTermal(-1)
			if (Math.abs(it.position.length())>10) body.applyCentralImpulse(new Ammo.btVector3(v.x, v.y, v.z))
		}
	}
	//after step

	stepCollision();
}

function stepCollision(){
	let dispatcher = now3.world.getDispatcher();
	let numManifolds = dispatcher.getNumManifolds();

	for ( let i = 0; i < numManifolds; i ++ ) {
		let contactManifold = dispatcher.getManifoldByIndexInternal( i );
		let numContacts = contactManifold.getNumContacts();
		let A=contactManifold.getBody0();
		let indexa=A.getUserPointer().a;
		let B=contactManifold.getBody1();
		let indexb=B.getUserPointer().a;

		let ba=now3.bodies[indexa];
		let bb=now3.bodies[indexb];
		
		for ( let j = 0; j < numContacts; j++ ) {
			let contactPoint = contactManifold.getContactPoint( j );
			ba.deltaTermal(contactPoint.getAppliedImpulse()*9/ba.mass);
			bb.deltaTermal(contactPoint.getAppliedImpulse()*9/bb.mass);
			// if (ba.testLink(bb) && bb.testLink(ba)) joinAB(ba, bb, contactPoint.get_m_localPointA(), contactPoint.get_m_localPointB());
		}
	}
};

export function joinAB(A:ChemElem, B:ChemElem, pA:Ammo.btVector3, pB:Ammo.btVector3){
	let msA=A.userData.body.getMotionState();
	let msB=B.userData.body.getMotionState();
	let ta=new Ammo.btTransform();
	let tb=new Ammo.btTransform();

	if (msA && msB) {
			msA.getWorldTransform(ta);
			msB.getWorldTransform(tb);
			ta.setOrigin( pA );
			tb.setOrigin( pB );
			let join=new Ammo.btGeneric6DofSpringConstraint(A.userData.body, B.userData.body, ta, tb, true);
			A.addLink(B);
			const llim=3.1;
			join.setLinearLowerLimit(new Ammo.btVector3(-llim,-llim,-llim));
			join.setLinearUpperLimit(new Ammo.btVector3(llim,llim,llim));
			const alim=llim;
			join.setAngularLowerLimit(new Ammo.btVector3(-alim, -alim, -alim));
			join.setAngularUpperLimit(new Ammo.btVector3( alim, alim, alim));
			join.setStiffness(0.1, 0.1);
			join.enableSpring(0, true);
			now3.world.addConstraint(join, true);
	}
}

export function hdr(params:any) {
	const pmremGenerator = new III.PMREMGenerator(now3.app.renderer);
    pmremGenerator.compileEquirectangularShader();
	const rt = pmremGenerator.fromEquirectangular( params.map1);
	now3.envmap = rt.texture;
	now3.scene.background = now3.envmap;
	now3.scene.environment = now3.envmap;
}

export function balls(params:any) {
	const max = 65;

	for (let i=0; i<max; i++){
		let b=new ChemElem({});
		const k=35;
		b.position.set( M3.rand(-k,k), M3.rand(-k,k), M3.rand(-k,k) );
		b.rotation.set( M3.rand(-M3.PI, M3.PI), M3.rand(-M3.PI, M3.PI), M3.rand(-M3.PI, M3.PI));
		b.castShadow = true;
		now3.toScene(b);
		addBall(b)
	}
}

export function environment() {
//	now3.toScene(phy3)
	const helper = new III.PolarGridHelper(50, 16, 8, 64, 0xffffff, 0xaaffff );
	(helper.material as III.Material).transparent = true;
	(helper.material as III.Material).opacity = 0.3;


	const geo = new III.CircleBufferGeometry(60, 64);
	geo.rotateX(-Math.PI / 2);
	const mesh = new III.Mesh(
		geo,
		new III.MeshStandardMaterial({ color: 0x555555, emissive: 0x110000, roughness: 0.8, transparent:true, opacity:0.5, side:2 }),
	);
	mesh.receiveShadow = true;
	mesh.translateY(-0.001);
	helper.name = 'grid';

//	now3.toScene(mesh);
	now3.toScene(helper);

	now3.app.play();
}

export function lights(_params: any) {
	const lightsGroup = new III.Group();
	const amb = new III.AmbientLight(0xffffff, _params.ambient);
	amb.name = 'ambientLIGHT';

	const d3 = new III.SpotLight(0xffffff, 1.2, 1000, Math.PI/9, 0.5);
	d3.name = 'directLIGHT';
	d3.position.set(50, 90, 30);
	d3.castShadow = true;
	d3.shadow.mapSize.width = 1024;
	d3.shadow.mapSize.height = 1024;
	d3.shadow.radius = 2.3;
/*	d3.shadow.camera.left = -5;
	d3.shadow.camera.right = 5;
	d3.shadow.camera.bottom = -5;
	d3.shadow.camera.top = 5;
*/
	d3.shadow.camera.near = 1;
	d3.shadow.camera.far = 300;
	d3.shadow.camera.fov = 30;

	lightsGroup.name = 'lights';

	lightsGroup.add(amb);
	lightsGroup.add(d3);

	now3.toScene(lightsGroup);
}
