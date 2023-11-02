import { Scene, Color3, Engine } from '@babylonjs/core';
import {Container, Button, Slider, TextBlock, AdvancedDynamicTexture, Control, StackPanel, ColorPicker, ToggleButton, RadioButton} from "@babylonjs/gui";

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

var outline_color : Color3 = new Color3(1.0, 0.0, 0.0);
var outline_width : number = 1.0;
var outline_smoothing : boolean = false;
const uiWidth = 200;


const createUI = (scene : Scene, engine : Engine) => {
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
}

export {createUI, outline_color, outline_smoothing, outline_width};
