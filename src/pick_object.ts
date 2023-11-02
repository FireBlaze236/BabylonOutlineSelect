import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, int, Material, StandardMaterial, Color3, AssetsManager, AbstractMesh } from "@babylonjs/core";

const getPickedObject = (scene : Scene, posX : number, posY : number) : AbstractMesh | null => {
    const pick_info = scene.pick(posX, posY);

    const pickedMesh : AbstractMesh = pick_info.pickedMesh;
    if (pick_info.hit) {
        return pickedMesh;
    }
    return null;
};

export {getPickedObject};