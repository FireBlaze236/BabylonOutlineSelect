import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import { Engine, Scene, ArcRotateCamera, Color4, ShaderMaterial, Vector2, Vector3, HemisphericLight, Mesh, MeshBuilder, int, Material, StandardMaterial, Color3, AssetsManager, AbstractMesh, PostProcess, BlackAndWhitePostProcess, BlurPostProcess, RenderTargetTexture, StencilOperation, StencilState, Camera, PassCubePostProcess, PassPostProcess, Effect, EndsWith, Observable } from '@babylonjs/core';

import {createScene} from "./create_scene";
import { getPickedObject } from "./pick_object";

import {Container, Button, Slider, TextBlock, AdvancedDynamicTexture, Control, StackPanel, ColorPicker, ToggleButton, RadioButton} from "@babylonjs/gui";


const randMinusOneToOne = () => {
    return  2.0 * Math.random() - 1.0;
};

var pickedMesh : AbstractMesh | null = null;
var need_outline = false;
var mesh_to_outline : Mesh | null = null;

var outline_color : Color3 = new Color3(1.0, 0.0, 0.0);
var outline_width : number = 1.0;
var outline_smoothing : boolean = false;

const add_slider = (label : string, label_text : string, uiWidth) : [Slider, TextBlock] => {
    var sliderLabel = new TextBlock(label, label_text);
    sliderLabel.color = "white";
    sliderLabel.heightInPixels = 20;
    sliderLabel.widthInPixels = uiWidth;
    var slider = new Slider(label+"slider");

    slider.widthInPixels = uiWidth;
    slider.heightInPixels = 20;
    slider.color = "white";

    return [slider, sliderLabel];
};


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



        var [camera, meshes, materials] = createScene(canvas, scene);

        const uiWidth = 200;
        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene, 0, true);
        var panel = new StackPanel("Panel");
        panel.background = "rgba(1.0, 1.0, 1.0, 0.3)";

        var text = new TextBlock("prop_text", "Properties");
        text.color = "white";
        text.heightInPixels = 30;
        text.widthInPixels = uiWidth;
        text.fontWeight = "bold";

        var [slider, sliderLabel] = add_slider("outline_width", "Outline Width", uiWidth);
        slider.value = outline_width;
        slider.maximum = 4.0;
        slider.minimum = 0.0;
        slider.onValueChangedObservable.add( (value) => {
            outline_width = value;
        });



        var toggleLabel = new TextBlock("toggle_label", "Smooth");
        toggleLabel.color = "white";
        toggleLabel.heightInPixels = 20;
        toggleLabel.widthInPixels = uiWidth;
        var toggle_button = new Button("toggle_smooth");
        
        toggle_button.heightInPixels = 20;
        toggle_button.widthInPixels = 20;

        toggle_button.onPointerClickObservable.add((value) => {
            outline_smoothing = !outline_smoothing;
            if(outline_smoothing) {
                toggle_button.background = "green";
            }
            else {
                toggle_button.background = "red";
            }
        });

        var colorPickerLabel = new TextBlock("color_label", "Color");
        colorPickerLabel.color = "white";
        colorPickerLabel.heightInPixels = 20;
        colorPickerLabel.widthInPixels = uiWidth;
        var colorPicker = new ColorPicker("color_picker");
        colorPicker.heightInPixels = uiWidth;
        colorPicker.widthInPixels = uiWidth;
        colorPicker.value = outline_color;

        colorPicker.onValueChangedObservable.add((value) => {
            outline_color = value;
        });

        

        panel.widthInPixels = uiWidth + 20;
        panel.addControl(text);
        panel.addControl(sliderLabel);
        panel.addControl(slider);
        panel.addControl(toggleLabel);
        panel.addControl(toggle_button);
        panel.addControl(colorPickerLabel);
        panel.addControl(colorPicker);
        panel.adaptWidthToChildren = false;
        panel.adaptHeightToChildren = true;
        advancedTexture.addControl(panel);
        const realignUI = () => {
            panel.leftInPixels = -engine.getRenderWidth() / 2.0 + panel.widthInPixels / 2.0;
            panel.topInPixels = (-engine.getRenderHeight() + panel.heightInPixels) / 2;

            setTimeout(()=> {
                realignUI();
            }, 0.2);
        }

        realignUI();


            
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
        
        var mask_mat = new ShaderMaterial("outlineMat", scene, "./WHITE", {
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
            effect.setFloat("k", outline_width * 2.0);
            effect.setFloat2("screenSize", copy.width, copy.height);
        };

        var blur = new BlurPostProcess("blur2x2", new Vector2(1, 1), 8, {
            width : engine.getRenderWidth(),
            height: engine.getRenderHeight()
        }, camera, 0, engine, true);
        camera.detachPostProcess(blur);

  

        var diff = new PostProcess("diff", "./DIFF", ["screenSize"], ["prevTex"], 1.0, camera);
        camera.detachPostProcess(diff);
        diff.onApply = function (effect) {
            effect.setTextureFromPostProcess("prevTex", dilate);
            effect.setFloat2("screenSize", engine.getRenderWidth(), engine.getRenderHeight());
        }; 


        var compose = new PostProcess("compose", "./COMPOSE", ["screenSize", "outlineColor"], ["outlineMask"], 1.0, camera, 0, engine, true);
        camera.detachPostProcess(compose);
        compose.onApply = (effect) => {
            effect.setTexture("outlineMask", rtta);
            effect.setFloat2("screenSize", engine.getRenderWidth(), engine.getRenderHeight());
            effect.setFloat3("outlineColor", outline_color.r, outline_color.g, outline_color.b);
            effect.setBool("glow", true);
        };

        // run the main render loop
        engine.runRenderLoop(() => {
            if(need_outline) {
                var prevMat = mesh_to_outline.material;
                mesh_to_outline.material = mask_mat;
                rtta.addPostProcess(copy);
                rtta.addPostProcess(dilate);
                rtta.addPostProcess(diff);
                if(outline_smoothing) {
                    rtta.addPostProcess(blur);
                }


                // RTTA
                camera.customRenderTargets.push(rtta);
                rtta.renderList.push(mesh_to_outline);
                scene.render();
                camera.customRenderTargets.pop();
                rtta.renderList.pop();

                rtta.clearPostProcesses();


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