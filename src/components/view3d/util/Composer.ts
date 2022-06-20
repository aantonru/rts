import * as III from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
//import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

export function createComposer( w:number, h:number, renderer:III.WebGLRenderer, scene:III.Scene, camera:III.OrthographicCamera ):EffectComposer{
    const composer = new EffectComposer( renderer );
    const pass0 = new RenderPass( scene, camera );
    const bloomPass = new UnrealBloomPass( new III.Vector2( w, h ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = 0.9;
    bloomPass.strength = 1.0;
    bloomPass.radius = 0.4;

    const bokehPass = new BokehPass( scene, camera, {
					focus: 30.0,
					aperture: 0.000075,
					maxblur: 0.0075,
					width: w,
					height: h
	} );

    bokehPass.renderToScreen=false;
    bloomPass.renderToScreen=false;

/*
    const ssaoPass = new SSAOPass( scene, camera, w, h );
	ssaoPass.kernelRadius = 3;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
*/
    composer.addPass( pass0 );
    composer.addPass( bloomPass );
    composer.addPass( bokehPass );
//    composer.addPass( ssaoPass );

    return composer;
};