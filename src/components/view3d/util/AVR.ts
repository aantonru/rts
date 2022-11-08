import { now3 } from '../Now3.js';

class VRButton {
	static createButton( renderer: any, options: any ) {
		if ( options ) {
			console.error( 'AVRButton: The "options" parameter has been removed. Please set the reference space type via renderer.xr.setReferenceSpaceType() instead.' );
		}
		const button = document.createElement( 'button' );
		function showEnterVR( /*device*/ ) {
			let currentSession: any = null;
			async function onSessionStarted( session: any ) {
				session.addEventListener( 'end', onSessionEnded );
				await renderer.xr.setSession( session );
				button.textContent = 'EXIT VR';
				currentSession = session;
			}
			function onSessionEnded( /*event*/ ) {
				currentSession.removeEventListener( 'end', onSessionEnded );
				button.textContent = 'ENTER VR';
				currentSession = null;
			}
			//
			button.style.display = '';
			button.style.cursor = 'pointer';
			button.style.width = '100px';
			button.textContent = 'VR';
			button.onmouseenter = function () {
			};
			button.onmouseleave = function () {
			};
			button.onclick = function () {
				if ( currentSession === null ) {
					// WebXR's requestReferenceSpace only works if the corresponding feature
					// was requested at session creation time. For simplicity, just ask for
					// the interesting ones as optional features, but be aware that the
					// requestReferenceSpace call will fail if it turns out to be unavailable.
					// ('local' is always available for immersive sessions and doesn't need to
					// be requested separately.)
					const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor', 'hand-tracking' ] };
					if (navigator && navigator.xr) navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );
				} else {
					currentSession.end();
				}
			};
		}
		function disableButton() {
			button.style.display = '';
			button.style.cursor = 'auto';
			button.style.width = '140px';
            button.style.border = '3px solid #000';
            button.style.color = '#000 !important';

			button.onmouseenter = null;
			button.onmouseleave = null;
			button.onclick = null;
		}
		function showWebXRNotFound() {
			disableButton();
			button.textContent = 'XR IS NOT SUPPORTED';
		}
		function stylizeElement( element: any ) {
			element.style.padding = '8px 6px';
			element.style.border = '3px solid #000';
			element.style.borderRadius = '8px';
			element.style.color = '#000';
			element.style.font = 'normal 19px sans-serif';
			element.style.textAlign = 'center';
			element.style.outline = 'none';
			element.style.zIndex = '999';
		}
		if ( 'xr' in navigator ) {
			button.id = 'AVRButton';
			button.style.display = 'none';
			stylizeElement( button );
			if (navigator && navigator.xr) navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( supported ) {
				supported ? showEnterVR() : showWebXRNotFound();
			} );
			return button;
		} else {
			const message = document.createElement( 'a' );
			if ( window.isSecureContext === false ) {
				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS \n please go to https:// version of this page'; // TODO Improve message
			} else {
				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';
			}
			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';
			stylizeElement( message );
			return message;
		}
	}
}
export { VRButton };