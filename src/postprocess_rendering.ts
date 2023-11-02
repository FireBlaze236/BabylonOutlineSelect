import { Engine, Scene, ArcRotateCamera, Color4, ShaderMaterial, Vector2, Vector3, HemisphericLight, Mesh, MeshBuilder, int, Material, StandardMaterial, Color3, AssetsManager, AbstractMesh, PostProcess, BlackAndWhitePostProcess, BlurPostProcess, RenderTargetTexture, StencilOperation, StencilState, Camera, PassCubePostProcess, PassPostProcess, Effect, EndsWith, Observable } from '@babylonjs/core';
import {createUI, outline_color, outline_smoothing, outline_width} from "./create_ui";

const get_render_target = (scene, engine, camera) => {

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


    return rtta;
}

const get_mask_material = (scene) => {
    // A simple one color material
    var mask_mat = new ShaderMaterial("outlineMat", scene, "./WHITE", {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "outlineColor"],
    });

    return mask_mat;
}

const get_postprocess_stack = (camera, engine, rtta) => {
    // Copy to buffer
    var copy = new PassPostProcess("copy", 1.0, camera, 0, engine, true);
    camera.detachPostProcess(copy);
    copy.onApply = (effect) => {
    };

    // Dilation operation
    var dilate = new PostProcess("dilate", "./DILATE", ["screenSize", "k"], ["prevTex"], 1.0, camera);
    camera.detachPostProcess(dilate);

    dilate.onApply = (effect) => {
        effect.setTextureFromPostProcessOutput("prevTex", copy);
        effect.setFloat("k", outline_width * 2.0);
        effect.setFloat2("screenSize", copy.width, copy.height);
    };

    // Blurring of the dilation edges
    var blur = new BlurPostProcess("blur2x2", new Vector2(1, 1), 8, {
        width : engine.getRenderWidth(),
        height: engine.getRenderHeight()
    }, camera, 0, engine, true);
    camera.detachPostProcess(blur);

    // Difference of output from the actual object mask
    var diff = new PostProcess("diff", "./DIFF", ["screenSize"], ["prevTex"], 1.0, camera);
    camera.detachPostProcess(diff);
    diff.onApply = function (effect) {
        effect.setTextureFromPostProcess("prevTex", dilate);
        effect.setFloat2("screenSize", engine.getRenderWidth(), engine.getRenderHeight());
    }; 

    // Composer to combine the masked outline with final output
    var compose = new PostProcess("compose", "./COMPOSE", ["screenSize", "outlineColor"], ["outlineMask"], 1.0, camera, 0, engine, true);
    camera.detachPostProcess(compose);
    compose.onApply = (effect) => {
        effect.setTexture("outlineMask", rtta);
        effect.setFloat2("screenSize", engine.getRenderWidth(), engine.getRenderHeight());
        effect.setFloat3("outlineColor", outline_color.r, outline_color.g, outline_color.b);
        effect.setBool("glow", true);
    };

    return [copy, dilate, blur, diff, compose];
}

export {get_mask_material, get_postprocess_stack, get_render_target};
