import * as THREE from 'three';
import * as dat from 'dat.gui';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';


import stars from './public/star.jpg'
import nebula from './public/nebula.jpg'

const clayUrl = new URL('./assets/clay.glb', import.meta.url);


const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 10, 20);
orbit.update();

/* Helpers */
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

/* Cube */
const boxGeometry = new THREE.BoxGeometry();
const boxMaterial = new THREE.MeshBasicMaterial({color: 0x00FF00});
const box = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(box);

/* Plane */
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;
scene.add(plane);


/* Sphere */
const sphereGeometry = new THREE.SphereGeometry(4, 50, 50);
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x0000FF,
    wireframe: false
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(-10, 10, 0);
sphere.castShadow = true;
scene.add(sphere);

/* Light */
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

/* Directional Light 
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
scene.add(directionalLight)
directionalLight.shadow.camera.bottom = -12;
directionalLight.castShadow = true;
directionalLight.position.set(-30, 50, 0);

const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(dLightHelper);

const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(dLightShadowHelper);
*/

/* Spot Light */
const spotLight = new THREE.SpotLight(0xFFFFFF, 50000);
scene.add(spotLight);
spotLight.castShadow = true;
spotLight.angle = 0.2;
spotLight.position.set(-100, 100, 0);

const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper);

/* Fog */
//scene.fog = new THREE.Fog(0xFFFFFF, 0, 200);
scene.fog = new THREE.FogExp2(0xFFFFFF, 0.01);

/* Load image */

const textureLoader = new THREE.TextureLoader();
//scene.background = textureLoader.load(stars);
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
    nebula,
    nebula,
    stars,
    stars,
    stars,
    stars
]);

/* Box 2 */
const box2Geometry = new THREE.BoxGeometry(4, 4, 4);
const box2Material = new THREE.MeshBasicMaterial({
    //color: 0x00FF00,
    //map: textureLoader.load(nebula)
});
const box2MultiMaterial = [
    new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
    new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
    new THREE.MeshBasicMaterial({map: textureLoader.load(nebula)}),
    new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
    new THREE.MeshBasicMaterial({map: textureLoader.load(nebula)}),
    new THREE.MeshBasicMaterial({map: textureLoader.load(stars)}),
]
const box2 = new THREE.Mesh(box2Geometry, box2MultiMaterial);
scene.add(box2);
box2.position.set(0, 15, 10);
//box2.material.map = textureLoader.load(nebula);


/* GUI */
const gui = new dat.GUI();
const options = {
    sphereColor: '#ffea00',
    wireframe: false,
    speed: 0.01,
    angle: 0.2,
    penumbra: 0,
    intensity: 20000
}

gui.addColor(options, 'sphereColor').onChange(e => {
    sphere.material.color.set(e);
})

gui.add(options, 'wireframe').onChange( e => {
    sphere.material.wireframe = e;
})

gui.add(options, 'speed', 0, 0.1);
gui.add(options, 'angle', 0, 1);
gui.add(options, 'penumbra', 0, 1);
gui.add(options, 'intensity', 0, 50000);


/* Mouse RayCaster */
const mousePosition = new THREE.Vector2();

window.addEventListener('mousemove', e=> {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;
})

const rayCaster = new THREE.Raycaster();


let step = 0;

/* Load object with GLTFLoader */

let mixer;

const assetLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( './node_modules/three/examples/jsm/libs/draco/' );
assetLoader.setDRACOLoader( dracoLoader );
assetLoader.load(
    clayUrl.href,
    gltf => {
        const model = gltf.scene;
        model.position.set(-12, 0, 10);
        //model.scale.set(0.01, 0.01, 0.01);
        scene.add( model );
        
        mixer = new THREE.AnimationMixer(model);
        const clips = gltf.animations;
        const clip = THREE.AnimationClip.findByName(clips, 'idle');
        const action = mixer.clipAction(clip);
        action.play();
    },
    xhr => {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    err => {
        console.error(err);
    }
);

const sphereId = sphere.id;
box2.name = 'theBox';

const clock = new THREE.Clock();

function animate(time) {
    if (mixer !== undefined) {
        mixer.update(clock.getDelta());
    }
	box.rotation.x = time / 1000;
    box.rotation.y = time / 1000;

    step += options.speed;
    sphere.position.y = 10 * Math.abs(Math.sin(step));

    spotLight.angle = options.angle;
    spotLight.penumbra = options.penumbra;
    spotLight.intensity = options.intensity;
    sLightHelper.update();

    rayCaster.setFromCamera(mousePosition, camera);
    const intersects = rayCaster.intersectObjects(scene.children);
    //console.log(intersects);

    intersects.forEach( e => {
        if (e.object.id === sphereId){
            e.object.material.color.set(0xFF0000);
        }
        if (e.object.name === 'theBox') {
            e.object.rotation.x = time / 1000;
            e.object.rotation.y = time / 1000;
        }
    })

	renderer.render( scene, camera );
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', e => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})