import * as THREE from 'three';
import * as dat from 'dat.gui';
import Bullet from './Bullet.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

import briks from '/briks.jpg';

const clayUrl = new URL('./assets/clay.glb', import.meta.url);
const bulletUrlMtl = new URL('./assets/foamBulletB.mtl', import.meta.url);
const bulletUrlObj = new URL('./assets/foamBulletB.obj', import.meta.url);
const sand = new URL('./assets/sand_bags.glb', import.meta.url);


/* AUX */
let guns = [];
let gunsUrl = ['AK.gltf', 'Revolver_Small.gltf', 'RocketLauncher.gltf', 'SMG.gltf', 'Pistol.gltf', 'ShortCannon.gltf', 'Sniper_2.gltf', 'Shotgun.gltf', 'Sniper.gltf']
let spheres = [];
let countHits = 0;
let controls;
const objects = [];
let raycaster;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();
let directionVector = new THREE.Vector3()

const mtlLoader = new MTLLoader()
const objLoader = new OBJLoader()

let bulletMtl = await mtlLoader.loadAsync('assets/foamBulletB.mtl')
bulletMtl.preload();
let bullets = [];



const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const fov = 60;
const aspect = 1920 / 1080;
const near = 0.1;
const far = 1000.0;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 0, 0);

let blaster = await createBlaster();

scene.add(blaster);
blaster.position.z = 3;
blaster.position.y = 2;
blaster.add(camera);

controls = new PointerLockControls(camera, document.body);

const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', function () {
	controls.lock();
});

controls.addEventListener('lock', function () {
	instructions.style.display = 'none';
	blocker.style.display = 'none';
});

controls.addEventListener('unlock', function () {
	blocker.style.display = 'block';
	instructions.style.display = '';
});

scene.add(controls.getObject());

const onKeyDown = function (event) {

	switch (event.code) {
		case 'ArrowUp':
		case 'KeyW':
			moveForward = true;
			break;

		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = true;
			break;

		case 'ArrowDown':
		case 'KeyS':
			moveBackward = true;
			break;

		case 'ArrowRight':
		case 'KeyD':
			moveRight = true;
			break;

		case 'Space':
			if (canJump === true) velocity.y += 150;
			canJump = false;
			break;
		case 'KeyJ':
			createBullet();
			break;


	}

};

const onKeyUp = function (event) {

	switch (event.code) {

		case 'ArrowUp':
		case 'KeyW':
			moveForward = false;
			break;

		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = false;
			break;

		case 'ArrowDown':
		case 'KeyS':
			moveBackward = false;
			break;

		case 'ArrowRight':
		case 'KeyD':
			moveRight = false;
			break;

	}

};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('click', createBullet);

raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

/* Helpers */
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(30);
scene.add(gridHelper);

// Carregar texturas
let textureLoader = new THREE.TextureLoader();
const colorTexture = textureLoader.load('Gravel024_2K-PNG_Color.png');
const normalTexture = textureLoader.load('Gravel024_2K-PNG_NormalGL.png');
const roughnessTexture = textureLoader.load('Gravel024_2K-PNG_Roughness.png');
const displacementTexture = textureLoader.load('Gravel024_2K-PNG_Displacement.png');

// Material para o chão
const planeMaterial4 = new THREE.MeshStandardMaterial({
	map: colorTexture,
	normalMap: normalTexture,
	roughnessMap: roughnessTexture,
	displacementMap: displacementTexture,
	displacementScale: 0.05, // Ajuste conforme necessário
	side: THREE.DoubleSide
});

const planeGeometry4 = new THREE.PlaneGeometry(30, 30);
const plane2 = new THREE.Mesh(planeGeometry4, planeMaterial4);
plane2.rotation.x = -Math.PI * 0.5;
plane2.receiveShadow = true;
plane2.position.set(0, 0, 30);
scene.add(plane2);

/* Plane */
const planeGeometry = new THREE.PlaneGeometry(30, 30);
const plane = new THREE.Mesh(planeGeometry, planeMaterial4);
plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;
scene.add(plane);

/* Plane3 */
const planeGeometry3 = new THREE.PlaneGeometry(30, 30);
const plane3 = new THREE.Mesh(planeGeometry, planeMaterial4);
plane3.rotation.x = -0.5 * Math.PI;
plane3.receiveShadow = true;
plane3.position.set(30, 0, 0);
scene.add(plane3);


// Supondo que 'bricks.jpg' está localizado no mesmo diretório do seu código
textureLoader = new THREE.TextureLoader();
const bricksTexture = textureLoader.load(briks);
bricksTexture.wrapS = THREE.RepeatWrapping; // Repetição na direção S (horizontal)
bricksTexture.wrapT = THREE.RepeatWrapping; // Repetição na direção T (vertical)
bricksTexture.repeat.set(10, 2); // Número de repetições na horizontal e vertical


// Criar um material usando MeshStandardMaterial
const newMaterial = new THREE.MeshStandardMaterial({
	map: bricksTexture,
	// Definir uma cor para modificar a saturação
	color: new THREE.Color(1, 1, 1) // Cor branca (sem alteração)
});

bricksTexture.repeat.set(1, 2); // Número de repetições na horizontal e vertical
// Criar um material usando MeshStandardMaterial
const newMaterial2 = new THREE.MeshStandardMaterial({
	map: bricksTexture,
	// Definir uma cor para modificar a saturação
	color: new THREE.Color(1, 1, 1) // Cor branca (sem alteração)
});

// Adicionar saturação (aumentando a intensidade de cor vermelha)
newMaterial.color = newMaterial.color.setHSL(1, 1, 0.75); // 0.75 para diminuir a saturação
newMaterial2.color = newMaterial.color.setHSL(1, 1, 0.75); // 0.75 para diminuir a saturação

/* Parede esquerda */
const box3Geometry = new THREE.BoxGeometry(0.5, 5, 30);
const box3 = new THREE.Mesh(box3Geometry, newMaterial);
scene.add(box3);
box3.castShadow = true;
box3.position.set(14.75, 2.5, 30);

/* Parede direita2 */
const box3Geometry2 = new THREE.BoxGeometry(0.5, 5, 4.1);
const box32 = new THREE.Mesh(box3Geometry2, newMaterial2);
scene.add(box32);
box32.castShadow = true;
box32.position.set(-14.75, 2.5, 12.95);

/* Parede direita3 */
const box3Geometry3 = new THREE.BoxGeometry(0.5, 5, 10);
const box33 = new THREE.Mesh(box3Geometry3, newMaterial2);
scene.add(box33);
box33.castShadow = true;
box33.position.set(-14.75, 2.5, -10);

/* Parede direita */
const box4Geometry = new THREE.BoxGeometry(0.5, 5, 30);
const box4Material = new THREE.MeshBasicMaterial({
	color: 0x00FF00
});
const box4 = new THREE.Mesh(box4Geometry, newMaterial);
scene.add(box4);
box4.castShadow = true;
box4.position.set(-14.75, 2.5, 30);

/* Parede esquerda */
const boxGeometry = new THREE.BoxGeometry(0.5, 5, 10);
const box = new THREE.Mesh(boxGeometry, newMaterial2);
scene.add(box);
box.castShadow = true;
box.position.set(19.5, 2.5, 15);
box.rotation.set(0, Math.PI * 0.5, 0);

/* Parede de trás */
const box5Geometry = new THREE.BoxGeometry(30, 5, 0.5); // Largura maior para cobrir toda a largura da caixa
const box5Material = new THREE.MeshBasicMaterial({
	color: 0x00FF00
});
const box5 = new THREE.Mesh(box5Geometry, newMaterial);
scene.add(box5);

// Posicionamento e rotação para colocar a parede de trás
box5.position.set(0, 2.5, 47); // Ajuste conforme necessário para alinhar com as outras paredes
box5.rotation.y = Math.PI; // Rotação para que a parede fique voltada para trás


// Função para gerar posições aleatórias dentro dos limites da caixa
function randomPositionWithinBox() {
	const x = Math.random() * 29 - 14.5; // Limites da caixa na direção X (-14.5 a 14.5)
	const y = Math.random() * 4 + 0.5;   // Altura aleatória na caixa
	const z = Math.random() * 29 - 14.5 + 30; // Ajuste na coordenada Z para estar diretamente acima do plano plane2
	return new THREE.Vector3(x, y, z);
}

const targetLoader = new GLTFLoader();

// Dentro da função spawnRandomSpheresWithinBox:
function spawnRandomSpheresWithinBox(numberOfTargets) {
	for (let i = 0; i < numberOfTargets; i++) {
		targetLoader.load('/assets/target.glb', (gltf) => {
			const target = gltf.scene;

			// Defina a escala desejada para o alvo (por exemplo, escala de 50% em todas as direções)
			const scaleFactor = 0.7;
			target.scale.set(scaleFactor, scaleFactor, scaleFactor);

			// Configurar material para receber e fazer o lançamento de sombras
			target.traverse(child => {
				if (child.isMesh) {
					child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
					child.receiveShadow = true; // Permitir que o objeto receba sombras
					// Defina outras propriedades do material aqui, se necessário
					child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
				}
			});

			const randomPosition = randomPositionWithinBox(); // Gera uma posição aleatória dentro da caixa
			target.position.copy(randomPosition);
			scene.add(target);
			spheres.push(target); // Adicione o alvo aos objetos da cena
		});
	}
}

// Chame a função para criar um número específico de esferas dentro da caixa
spawnRandomSpheresWithinBox(15); // Altere o número para a quantidade desejada de esferas

const gunsLoader = new GLTFLoader();
let gunsX = [-5.8, -4.5, -2.5, -2, -1, 1.7, 2.7, 5.5, 6.5];
for (let i = 0; i < gunsUrl.length; i++) {
	gunsLoader.load('./assets/Guns/glTF/' + gunsUrl[i], (gltf) => {
		const gun = gltf.scene;

		// Configurar material para receber e fazer o lançamento de sombras
		gun.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});
		gun.position.set(gunsX[i], 1.4, 0);
		gun.rotation.set(-Math.PI * 0.45, 0, 0);
		scene.add(gun);
		guns.push(gun); // Adicione o alvo aos objetos da cena
	});
}

/* Barreira para não entrar dentro do campo de tiro */
const environmentLoader = new GLTFLoader();
let environmentX = [13.5, 11, 8.5, 6, 3.5, 1, -1.5, -4, -6.5, -9, -11.5, -13.6];
for (let i = 0; i < 12; i++) {
	environmentLoader.load('./assets/environment/Barrier_Single.gltf', (gltf) => {
		const environment = gltf.scene;

		// Configurar material para receber e fazer o lançamento de sombras
		environment.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});
		environment.position.set(environmentX[i], 0, 15.2);
		environment.rotation.set(0, Math.PI * 1, 0)
		scene.add(environment);
		//environment.push(environment); // Adicione o alvo aos objetos da cena
	});
}

// parede de tras do clube
let structuresUrl = ['']
let environmentX1 = [0, -10, -2, 6, 12];
let environmentZ1 = [0, -13, -15.2, -13, -10];
let environmentR1 = [0, Math.PI * 0.3, 0, 0, 0]
for (let i = 1; i <= 4; i++) {
	environmentLoader.load('./assets/environment/Structure_'+i+'.gltf', (gltf) => {
		const environment = gltf.scene;

		// Configurar material para receber e fazer o lançamento de sombras
		environment.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});
		environment.position.set(environmentX1[i], 0, environmentZ1[i]);
		environment.rotation.set(0, environmentR1[i], 0)
		scene.add(environment);
		//environment.push(environment); // Adicione o alvo aos objetos da cena
	});
}

// Portao

for (let i = 0; i < 1; i++) {
	environmentLoader.load('./assets/environment/portao.glb', (gltf) => {
		const environment = gltf.scene;

		// Configurar material para receber e fazer o lançamento de sombras
		environment.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				//child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				//child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});
		let environmentScale = 0.07;
		environment.scale.set(environmentScale,environmentScale,environmentScale);
		environment.position.set(-14.2, 0, 10);
		environment.rotation.set(0, Math.PI * 0.5, 0)
		scene.add(environment);
		//environment.push(environment); // Adicione o alvo aos objetos da cena
	});
}

// Loja de arma
for (let i = 0; i < 1; i++) {
	environmentLoader.load('./assets/environment/gun_shop.glb', (gltf) => {
		const environment = gltf.scene;

		// Configurar material para receber e fazer o lançamento de sombras
		environment.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				//child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});
		let environmentScale = 1.5;
		environment.scale.set(environmentScale,environmentScale,environmentScale);
		environment.position.set(19.2, 0, 10);
		environment.rotation.set(0, Math.PI * 1.5, 0)
		scene.add(environment);
		//environment.push(environment); // Adicione o alvo aos objetos da cena
	});
}

// Burger van
for (let i = 0; i < 1; i++) {
	environmentLoader.load('./assets/environment/burger_van.glb', (gltf) => {
		const environment = gltf.scene;

		// Configurar material para receber e fazer o lançamento de sombras
		environment.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				//child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});
		let environmentScale = 2;
		environment.scale.set(environmentScale,environmentScale,environmentScale);
		environment.position.set(19.2, 0, -1);
		environment.rotation.set(0, Math.PI * 1.2, 0)
		scene.add(environment);
		//environment.push(environment); // Adicione o alvo aos objetos da cena
	});
}

// Crie uma textura com base em um canvas contendo o texto
function createTextTexture(text, color) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	const fontSize = 24;
	const fontFace = 'Arial';

	context.font = `${fontSize}px ${fontFace}`;

	const textWidth = context.measureText(text).width;
	canvas.width = textWidth;
	canvas.height = fontSize * 2; // Ajuste conforme necessário

	context.font = `${fontSize}px ${fontFace}`;
	context.fillStyle = color;
	context.fillText(text, 0, fontSize); // Desloque para baixo para centralizar

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;

	return texture;
}

// Crie um material usando a textura criada
const textMaterial = new THREE.SpriteMaterial({
	map: createTextTexture('Hits: 0', '#000000') // Inicialmente zero
});

// Crie um sprite usando o material
const textSprite = new THREE.Sprite(textMaterial);
textSprite.scale.set(10, 5, 1); // Ajuste conforme necessário

// Posicione o sprite na cena
textSprite.position.set(0, 10, 40); // Ajuste a posição conforme necessário

scene.add(textSprite);

// Função para atualizar o texto
function updateText(text) {
	textMaterial.map = createTextTexture(text, '#000000');
	textMaterial.needsUpdate = true;
}


// Carregue a textura da mira
textureLoader = new THREE.TextureLoader();
const crosshairTexture = textureLoader.load('/crosshair.png');

// Defina as dimensões da mira
const crosshairSize = 0.01; // Ajuste conforme necessário

// Crie um material utilizando a textura da mira
const crosshairMaterial = new THREE.SpriteMaterial({ map: crosshairTexture });

// Crie um sprite utilizando o material criado
const crosshairSprite = new THREE.Sprite(crosshairMaterial);

// Defina a escala da mira para o tamanho desejado
crosshairSprite.scale.set(crosshairSize, crosshairSize, 1);

// Posicione a mira no centro da tela
crosshairSprite.position.set(0, 0, 0); // Ajuste a profundidade (-10 é um exemplo)

// Adicione a mira à cena
scene.add(crosshairSprite);

let bags = [];
const sandLoader = new GLTFLoader();
// Dentro da função spawnRandomSpheresWithinBox:
function spawnWallSandBags() {
	for (let i = 0; i < 9; i++) {
		sandLoader.load('/assets/sand_bags.glb', (gltf) => {
			const sand_bag = gltf.scene;

			// Defina a escala desejada para o alvo (por exemplo, escala de 50% em todas as direções)
			const scaleFactor = 0.02;
			sand_bag.scale.set(scaleFactor, scaleFactor, scaleFactor);

			// Configurar material para receber e fazer o lançamento de sombras
			sand_bag.traverse(child => {
				if (child.isMesh) {
					child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
					child.receiveShadow = true; // Permitir que o objeto receba sombras
					// Defina outras propriedades do material aqui, se necessário
					child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
				}
			});
			sand_bag.rotation.y = Math.PI / 2; // Radianos equivalentes a 90 graus
			scene.add(sand_bag);
			bags.push(sand_bag); // Adicione o alvo aos objetos da cena

		});
	}


}

spawnWallSandBags();

/* Light */
const ambientLight = new THREE.AmbientLight(0x888888);
scene.add(ambientLight);

/* Spot Light */
const spotLight = new THREE.SpotLight(0xFFFFFF, 50000);
scene.add(spotLight);
spotLight.castShadow = true;
spotLight.angle = 0.4;
spotLight.position.set(-100, 100, 60);

const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper);

/* Create tables */

const tableLoader = new GLTFLoader();
let tables = [];
for (let i = 0; i < 4; i++) {
	tableLoader.load(
		'./assets/Container_Long.gltf',
		gltf => {
			const table = gltf.scene;
			table.position.set(0, 0, 0);

			// Configurar material para receber e fazer o lançamento de sombras
			table.traverse(child => {
				if (child.isMesh) {
					child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
					child.receiveShadow = true; // Permitir que o objeto receba sombras
					// Defina outras propriedades do material aqui, se necessário
					child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
				}
			});

			const tableScale = 0.6;
			table.scale.set(tableScale, tableScale, tableScale);
			scene.add(table);
			tables.push(table);
		},
		xhr => {
			console.log((xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded');
		},
		err => {
			console.error(err);
		}
	);
}

const box2MultiMaterial = [
	new THREE.MeshBasicMaterial({ map: textureLoader.load('/Daylight Box_Right.bmp') }),
	new THREE.MeshBasicMaterial({ map: textureLoader.load('/Daylight Box_Left.bmp') }),
	new THREE.MeshBasicMaterial({ map: textureLoader.load('/Daylight Box_Top.bmp') }),
	new THREE.MeshBasicMaterial({ map: textureLoader.load('/Daylight Box_Bottom.bmp') }),
	new THREE.MeshBasicMaterial({ map: textureLoader.load('/Daylight Box_Front.bmp') }),
	new THREE.MeshBasicMaterial({ map: textureLoader.load('/Daylight Box_Back.bmp') }),
]
box2MultiMaterial.forEach(e => {
	e.side = THREE.BackSide;
})

// Crie uma geometria que cubra toda a cena (por exemplo, um cubo grande ou uma esfera)
const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000); // Tamanho grande para cobrir toda a cena
const skybox = new THREE.Mesh(skyGeometry, box2MultiMaterial);
scene.add(skybox);


/* GUI */
const gui = new dat.GUI();
const options = {
	wireframe: false,
	speed: 0.01,
	angle: 0.4,
	penumbra: 0,
	intensity: 50000
}

gui.add(options, 'speed', 0, 0.1);
gui.add(options, 'angle', 0, 1);
gui.add(options, 'penumbra', 0, 1);
gui.add(options, 'intensity', 0, 50000);


/* Mouse RayCaster */
const mousePosition = new THREE.Vector2();

window.addEventListener('mousemove', e => {
	mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
	mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;
})

const rayCaster = new THREE.Raycaster();


/* Load object with GLTFLoader */

let mixer;
let model;
let clayClips;
let clayClipsName = [];
let clayAction;
const assetLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/');
assetLoader.setDRACOLoader(dracoLoader);
assetLoader.load(
	clayUrl.href,
	gltf => {
		model = gltf.scene;
		model.position.set(12, 0, 10);
		// Rotacionar o modelo em 90 graus no eixo Y
		model.rotation.y = -Math.PI / 2; // Radianos equivalentes a 90 graus
		//model.scale.set(0.01, 0.01, 0.01);

		// Configurar material para receber e fazer o lançamento de sombras
		model.traverse(child => {
			if (child.isMesh) {
				child.castShadow = true; // Permitir que o objeto faça o lançamento de sombras
				child.receiveShadow = true; // Permitir que o objeto receba sombras
				// Defina outras propriedades do material aqui, se necessário
				child.material.side = THREE.DoubleSide; // Exemplo: definir o material para renderizar em ambos os lados
			}
		});

		scene.add(model);
		mixer = new THREE.AnimationMixer(model);
		clayClips = gltf.animations;

		clayClips.forEach(e => {
			clayClipsName.push(e.name);
		})

		//console.log(clayClips);
		const clip = THREE.AnimationClip.findByName(clayClips, 'idle');
		clayAction = mixer.clipAction(clip);
		clayAction.play();
	},
	xhr => {
		console.log((xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded');
	},
	err => {
		console.error(err);
	}
);

// Auxiliares para a função animate
let step = 0;
const clock = new THREE.Clock();
let att = false, att2 = false;
let posx = [10, 0, -10, 10, 0, -10, 10, 0, -10];
let posy = [0, 0, 0, 2, 2, 2, 4, 4, 4];
let posxTables = [5.5, 2, -2, -5.5];
let poszTables = [0, 0, 0, 0];

function animate(time) {

	if (bags.length == 9 & att == false) {
		att = true;

		for (let ii = 0; ii < 9; ii++) {
			bags[ii].position.set(posx[ii], posy[ii], 45);
		}
	}

	if (tables.length == 4 & att2 == false) {
		att2 = true;
		for (let i = 0; i < tables.length; i++) {
			tables[i].position.set(posxTables[i], 0, poszTables[i]);
		}
	}

	let dt = clock.getDelta();
	if (mixer !== undefined) {
		mixer.update(dt);
	}

	step += options.speed;

	spotLight.angle = options.angle;
	spotLight.penumbra = options.penumbra;
	spotLight.intensity = options.intensity;
	sLightHelper.update();

	rayCaster.setFromCamera(mousePosition, camera);
	const intersects = rayCaster.intersectObjects(scene.children);
	//console.log(intersects);

	intersects.forEach(e => {
		if (e.object.name === 'theBox') {
			e.object.rotation.x = time / 1000;
			e.object.rotation.y = time / 1000;
		}
	})

	const timee = performance.now();
	if (controls.isLocked === true) {
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 10;

		const intersections = raycaster.intersectObjects(objects, false);

		const onObject = intersections.length > 0;

		const delta = (timee - prevTime) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number(moveForward) - Number(moveBackward);
		direction.x = Number(moveRight) - Number(moveLeft);
		direction.normalize(); // this ensures consistent movements in all directions

		if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
		if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

		if (onObject === true) {

			velocity.y = Math.max(0, velocity.y);
			canJump = true;

		}

		controls.moveRight(- velocity.x * delta);
		controls.moveForward(- velocity.z * delta);


		const offset = new THREE.Vector3(0.2, 0, -0.5); // Define o deslocamento para frente (pode ajustar os valores conforme necessário)

		blaster.position.copy(camera.position);
		blaster.quaternion.copy(camera.quaternion);
		blaster.position.y = blaster.position.y - 0.3;

		const forwardOffset = offset.clone().applyQuaternion(camera.quaternion); // Rotaciona o offset com a mesma rotação de mesh1
		blaster.position.add(forwardOffset);


		// Defina um novo offset para o crosshairSprite
		const offset2 = new THREE.Vector3(0, 0, -0.4); // Ajuste os valores conforme necessário

		// Clone a posição e rotação da câmera para o crosshairSprite
		crosshairSprite.position.copy(camera.position);
		crosshairSprite.quaternion.copy(camera.quaternion);

		// Calcule o deslocamento para frente para o crosshairSprite
		const forwardOffset2 = offset2.clone().applyQuaternion(camera.quaternion);

		// Ajuste a posição do crosshairSprite na frente da câmera
		crosshairSprite.position.add(forwardOffset2);

		controls.getObject().position.y += (velocity.y * delta); // new behavior

		if (controls.getObject().position.y < 3) {

			velocity.y = 0;
			controls.getObject().position.y = 2;

			canJump = true;

		}
	}


	updateBullets();
	prevTime = timee;
	renderer.render(scene, camera);
}

async function createBullet() {
	if (!blaster) {
		return;
	}

	if (bulletMtl) {
		objLoader.setMaterials(bulletMtl);
	}

	const bulletModel = await objLoader.loadAsync(bulletUrlObj);

	camera.getWorldDirection(directionVector);

	const aabb = new THREE.Box3().setFromObject(blaster);
	const size = aabb.getSize(new THREE.Vector3());

	const vec = blaster.position.clone();
	vec.y += 0.06;

	bulletModel.position.add(
		vec.add(
			directionVector.clone().multiplyScalar(size.z * 0.5)
		)
	)

	// rotate children to match gun for simplicity
	bulletModel.children.forEach(child => child.rotateX(Math.PI * -0.5));

	// use the same rotation as as the gun
	bulletModel.rotation.copy(blaster.rotation);

	scene.add(bulletModel);

	const b = new Bullet(bulletModel);
	b.setVelocity(
		directionVector.x * 0.9,
		directionVector.y * 0.9,
		directionVector.z * 0.9
	)

	bullets.push(b);
	console.log("rito")
}

function updateBullets() {
	for (let i = 0; i < bullets.length; ++i) {
		const b = bullets[i];
		try {
			b.update();
		} catch (error) {
			continue;
		}

		if (b.shouldRemove) {
			scene.remove(b.group);
			bullets.splice(i, 1);
			i--;
		}
		else {
			if (model !== undefined) {
				const modelFeetPosition = new THREE.Vector3();
				model.getWorldPosition(modelFeetPosition); // Obtém a posição dos pés do modelo (ou de onde você está verificando)

				const offset = new THREE.Vector3(0, 1, 0); // Deslocamento para cima (ajuste conforme necessário)

				const targetPosition = modelFeetPosition.clone().add(offset); // Posição um pouco acima dos pés do modelo

				if (b.group.position.distanceToSquared(targetPosition) < 0.5) {
					scene.remove(b.group);
					bullets.splice(i, 1);
					i--;
					countHits = 0;
					updateText('Hits: ' + countHits);
					model.visible = false;
					clayAction.stop();
					// Escolhendo o índice aleatório para o array `arr`:
					const randomIndex = Math.floor(Math.random() * clayClipsName.length);
					console.log(clayClipsName[randomIndex]);
					const clip = THREE.AnimationClip.findByName(clayClips, clayClipsName[randomIndex]);
					clayAction = mixer.clipAction(clip);
					clayAction.play();

					setTimeout(() => {
						model.visible = true;
					}, 1000);
				}

			}

			spheres.forEach(obj => {
				if (b.group.position.distanceToSquared(obj.position) < 0.5) {
					scene.remove(b.group);
					bullets.splice(i, 1);
					i--;

					if (obj.visible == true) {
						countHits++;
						updateText('Hits: ' + countHits);
						obj.visible = false;
						obj.position.copy(randomPositionWithinBox());
						setTimeout(() => {
							obj.visible = true;
						}, 2000);
					}
				}
			})
		}
	}
}

async function createBlaster() {
	const mtl = await mtlLoader.loadAsync('assets/blasterG.mtl');
	mtl.preload();

	objLoader.setMaterials(mtl);

	const modelRoot = await objLoader.loadAsync('assets/blasterG.obj');

	return modelRoot;
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', e => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
})