import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import { Engine, Scene, ArcRotateCamera, Color4, ShaderMaterial, Vector2, Vector3, HemisphericLight, Mesh, MeshBuilder, int, Material, StandardMaterial, Color3, AssetsManager, AbstractMesh, PostProcess, BlackAndWhitePostProcess, BlurPostProcess, RenderTargetTexture, StencilOperation, StencilState, Camera, PassCubePostProcess, PassPostProcess, Effect, EndsWith, Observable } from '@babylonjs/core';

import {createScene} from "./create_scene";
import { getPickedObject } from "./pick_object";
import {createUI, outline_color, outline_smoothing, outline_width} from "./create_ui";
import {get_postprocess_stack, get_render_target, get_mask_material} from "./postprocess_rendering";



var pickedMesh : AbstractMesh | null = null;
var need_outline = false;
var mesh_to_outline : Mesh | null = null;



var app = () => {
        if(!Engine.isSupported()) {
            window.alert("Sorry! your browser does not support babylon!");
            return;
        }
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);
        var [camera, meshes, materials] = createScene(canvas, scene);

        // Create UI
        createUI(scene, engine);

        // Add listener to pick mesh
        canvas.addEventListener("pointermove", (event) => {
            pickedMesh = getPickedObject(scene, event.x, event.y);
            if(pickedMesh != null) {
                //console.log(pickedMesh.name);
                need_outline = true;
                mesh_to_outline = pickedMesh as Mesh;
            }
            else
            {
                need_outline = false;
                console.log("Nothing picked!");
            }
        });
        

        var mask_mat = get_mask_material(scene);
        var rtta = get_render_target(scene, engine, camera);
        var [copy, dilate, blur, diff, compose] = get_postprocess_stack(camera, engine, rtta);

        const renderWithPostProcessing = (target_mesh : Mesh, scene : Scene, camera : Camera) => {
            // Setup post process for getting outline
            var prevMat = target_mesh.material;
            target_mesh.material = mask_mat;
            rtta.addPostProcess(copy);
            rtta.addPostProcess(dilate);
            rtta.addPostProcess(diff);
            if(outline_smoothing) {
                rtta.addPostProcess(blur);
            }


            // Render to texture target get the outline from post processing
            camera.customRenderTargets.push(rtta);
            rtta.renderList.push(target_mesh);
            scene.render();
            camera.customRenderTargets.pop();
            rtta.renderList.pop();
            rtta.clearPostProcesses();


            // Render normally with composition
            camera.attachPostProcess(compose);
            target_mesh.material = prevMat;
            scene.render();
            camera.detachPostProcess(compose);
        }

        // run the main render loop
        engine.runRenderLoop(() => {
            if(need_outline) {
                renderWithPostProcessing(mesh_to_outline, scene, camera);
            }
            else
            {
                scene.render();
            }
        });
};

app();