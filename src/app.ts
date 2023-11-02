import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import { Engine, Scene, ArcRotateCamera, Color4, ShaderMaterial, Vector2, Vector3, HemisphericLight, Mesh, MeshBuilder, int, Material, StandardMaterial, Color3, AssetsManager, AbstractMesh, PostProcess, BlackAndWhitePostProcess, BlurPostProcess, RenderTargetTexture, StencilOperation, StencilState, Camera, PassCubePostProcess, PassPostProcess, Effect, EndsWith } from '@babylonjs/core';

import {createScene} from "./create_scene";
import { getPickedObject } from "./pick_object";
import { MaterialStencilState } from "@babylonjs/core/Materials/materialStencilState";




const primitiveTypes = [
    "sphere", "cube", "box", "cone"
];
const randMinusOneToOne = () => {
    return  2.0 * Math.random() - 1.0;
};


var pickedMesh : AbstractMesh | null = null;

const customFragmentShader = `
precision highp float;

void main(void) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
}
`;

var need_outline = false;
var mesh_to_outline : Mesh | null = null;

var app = () => {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);
        //scene.autoClearDepthAndStencil = false;


        var [camera, meshes, materials] = createScene(canvas, scene);

        const shaderMaterial = new ShaderMaterial("shader", scene, "./WHITE", {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
          });
            
        canvas.addEventListener("pointerdown", (event) => {
            pickedMesh = getPickedObject(scene, event.x, event.y);
            if(pickedMesh != null) {
                console.log(pickedMesh.name);
                need_outline = true;
                mesh_to_outline = pickedMesh as Mesh;
            }
            else
            {
                need_outline = false;
                console.log("Nothing picked!");
            }
        });
        
        var outline_mat = new ShaderMaterial("outlineMat", scene, "./WHITE", {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "outlineColor"],
        });


        var prevClear = scene.clearColor;
        var prevDepth = engine.getDepthFunction();
        // RT 1
        var rtta = new RenderTargetTexture("rtta", {
            width: engine.getRenderWidth(),
            height: engine.getRenderHeight(),
        }, scene);
        rtta.onBeforeRenderObservable.add(() => {
            engine.setDepthFunction(Engine.ALWAYS);
            scene.clearColor = new Color4(0, 0, 0, 1.0);
        });
        rtta.onAfterRenderObservable.add(() => {
            engine.setDepthFunction(prevDepth);
            scene.clearColor = prevClear;
        });

        var copy = new PassPostProcess("copy", 1.0, camera, 0, engine, true);
        camera.detachPostProcess(copy);
        copy.onApply = (effect) => {
        };
        var dilate = new PostProcess("dilate", "./DILATE", ["screenSize", "k"], ["prevTex"], 1.0, camera);
        camera.detachPostProcess(dilate);

        dilate.onApply = (effect) => {
            effect.setTextureFromPostProcessOutput("prevTex", copy);
            effect.setFloat("k", 4.0);
            effect.setFloat2("screenSize", copy.width, copy.height);
        };


        var blur = new BlurPostProcess("blur", new Vector2(1, 1), 16, 1.0, camera, 0, engine, true);
        camera.detachPostProcess(blur);
        var diff = new PostProcess("diff", "./DIFF", ["screenSize"], ["prevTex"], 1.0, camera);
        camera.detachPostProcess(diff);
        diff.onApply = function (effect) {
            effect.setTextureFromPostProcess("prevTex", dilate);
            effect.setFloat2("screenSize", engine.getRenderWidth(), engine.getRenderHeight());
        }; 


        rtta.addPostProcess(copy);
        rtta.addPostProcess(dilate);
        rtta.addPostProcess(diff);


        var compose = new PostProcess("compose", "./COMPOSE", ["screenSize", "outlineColor"], ["outlineMask"], 1.0, camera, 0, engine, true);
        camera.detachPostProcess(compose);
        compose.onApply = (effect) => {
            effect.setTexture("outlineMask", rtta);
            effect.setFloat2("screenSize", engine.getRenderWidth(), engine.getRenderHeight());
            effect.setFloat3("outlineColor", 1.0, 0.0, 0.0);
            effect.setBool("glow", true);
        };

        // run the main render loop
        engine.runRenderLoop(() => {
            if(need_outline) {
                var prevMat = mesh_to_outline.material;
                mesh_to_outline.material = outline_mat;

                // RTTA
                camera.customRenderTargets.push(rtta);
                rtta.renderList.push(mesh_to_outline);
                scene.render();
                camera.customRenderTargets.pop();
                rtta.renderList.pop();


                camera.attachPostProcess(compose);
                mesh_to_outline.material = prevMat;
                scene.render();
                camera.detachPostProcess(compose);
            }
            else
            {
                scene.render();
            }
        });
};

app();