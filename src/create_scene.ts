import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, int, Material, StandardMaterial, Color3, AssetsManager, Camera } from "@babylonjs/core";

const groundPosition = new Vector3(0, -1.0, 0);
const lightDir = new Vector3(1, 1, 0);

const createScene = (canvas : HTMLCanvasElement, scene : Scene) : [Camera, Mesh[], Material[]] => {
    var camera: ArcRotateCamera = new ArcRotateCamera("Camera", -Math.PI / 2 + Math.PI / 4, Math.PI / 2 - 0.4, 10, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 50;

    var light1: HemisphericLight = new HemisphericLight("light1", lightDir, scene);
    var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
    var boxa: Mesh = MeshBuilder.CreateBox("boxa", {width : 2.0, height: 2.0, depth: 2.0}, scene);
    var boxb: Mesh = MeshBuilder.CreateBox("boxn", {width : 1.8, height: 0.6, depth: 4.0}, scene);
    var cyla : Mesh = MeshBuilder.CreateCylinder("cyla", {height: 4.0, diameter: 1.0});
    boxa.position = new Vector3(0, 0, 3);
    boxb.position = new Vector3(0, 1.0 - 0.25, 1.5);
    cyla.position = new Vector3(-1.0, 2.0, 3.0);
    var ground: Mesh = MeshBuilder.CreateGround("ground", {width: 10, height: 10, subdivisions: 2}, scene);
    ground.position = groundPosition;


    var mat_red = new StandardMaterial("mat_red", scene);
    mat_red.diffuseColor = new Color3(1.0, 0.2, 0.3);
    var mat_blue = new StandardMaterial("mat_blue", scene);
    mat_blue.diffuseColor = new Color3(0.1, 0.1, 0.9);
    var mat_violet = new StandardMaterial("mat_violet", scene);
    mat_violet.diffuseColor = new Color3(0.4, 0.2, 0.9);
    var mat_yellow = new StandardMaterial("mat_yellow", scene);
    mat_yellow.diffuseColor = new Color3(0.7, 0.8, 0.0);
    sphere.material = mat_red;
    boxa.material = mat_blue;
    boxb.material = mat_violet;
    cyla.material = mat_yellow;

    var meshes : Mesh[] = [sphere, boxa, boxb, cyla, ground];
    var mats : Material[] = [mat_red, mat_blue, mat_violet, mat_yellow];

    mats.forEach((mat) => {

    });


    var assetManager : AssetsManager = new AssetsManager(scene);
    var meshTask = assetManager.addMeshTask("obj_mesh_task", "", "./assets/", "monke.obj");

    meshTask.onSuccess = (task) => {
        let mesh = task.loadedMeshes[0] as Mesh;
        mesh.position = new Vector3(0, 2.0, 0.3);
        mesh.scaling = new Vector3(2.0, 2.0 , 2.0);
        mesh.rotate(Vector3.Up(), Math.PI);
        mesh.material = mat_yellow;

        meshes.push(mesh);
    };
    meshTask.onError = function (task, message, exception) {
        console.log(message, exception);
    };

    assetManager.load();



    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
        // Shift+Ctrl+Alt+I
        if ( ev.ctrlKey && ev.altKey && ev.key === 'j') {
            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
            } else {
                scene.debugLayer.show();
            }
        }
    });

    return [camera, meshes, mats];
    
}

export {createScene};