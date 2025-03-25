import {sliderNames} from "./videoSliderNames.js";
import { setVisualParameter, paramVals, animationSelects, sliders, resultSliders, sliderKeys} from "./video.js";

let sceneSliderSum = 0.01
let activeScene = 0
let scenes = []

let currentValueForAnimation = 0

export let animVals = {
    "Linear": (v) => v,
    "Sine": (v) => (Math.sin(v * Math.PI) + 1) / 2,
    "Peak": (v) => v < 0.2 ? 1 : 0,
    "2 on the Floor": (v) => v % 0.5 < 0.1 ? 1 : 0,
    "4 on the Floor": (v) => v % 0.25 < 0.1 ? 1 : 0,
    "Pulse": (v) => v >= 0.5 && v <= 0.7 ? 1 : 0,
    "Linear invert": (v) => 1 - v,
};

document.getElementById("saveSceneButton").addEventListener("click", saveScene);
document.getElementById("deleteSceneButton").addEventListener("click", deleteScene);
document.getElementById("updateSceneButton").addEventListener("click", updateScene);
document.getElementById("saveButtonButton").addEventListener("click", downloadScenes);

export async function createSceneInterface() {
    let scenesAsJson = localStorage.getItem("scenes");

    if (!scenesAsJson) {
        console.log("Loading scenes from external file...");
        try {
            const response = await fetch("defaultScenes.json");
            if (!response.ok) throw new Error("Failed to load scenes.json");
            scenesAsJson = await response.text();
           //localStorage.setItem("scenes", scenes);
        } catch (err) {
            console.error("Failed to fetch scenes:", err);
            return;
        }
    }

    JSON.parse( localStorage.getItem("scenes"));

    const parsedScenes = JSON.parse(scenesAsJson);
    scenes = parsedScenes.scenes

    if (!scenes){
        throw new Error("Could not Load Scenes. Try to empty Browser Cache. All will be lost.")
    }
    scenes.forEach((scene, i) => {
        createSceneButton(i);
        createSceneSliders(i);
    });

    selectScene(0);
}

function createSceneSliders(i) {
    const sceneSliderCont = document.getElementById("sceneSliderContainer");

    const div = document.createElement("div");
    div.innerHTML = `<span class="sceneSliderLabel">${i}</span>`;

    const sceneSlider = document.createElement("input");
    sceneSlider.type = "range";
    sceneSlider.min = "0";
    sceneSlider.max = "1";
    sceneSlider.step = 1e-18;
    sceneSlider.value = "0";
    sceneSlider.id = "sceneSlider" + i;
    sceneSlider.classList.add("sceneSlider");
    sceneSlider.addEventListener("input", updateSceneSliders);

    div.appendChild(sceneSlider);
    sceneSliderCont.appendChild(div);
}

function saveScene(no) {
    let newScene = {}
    newScene["description"] = `Scene ${scenes.length + 1} description`
    newScene["sliderValues"] = { ...paramVals }
    newScene["animation"] = getAnimationStates()
    scenes.push(newScene)
    saveScenesToLocalStorage(scenes)

    let sceneNo = scenes.length
    console.log("Save Scene " + sceneNo)
    createSceneButton(sceneNo - 1)
    createSceneSliders(sceneNo - 1)
}

function getAnimationStates(){
    let animationStates = {}
    Object.keys(sliderNames).forEach(k => {
        animationStates[k] = {}
        if (animationSelects[k].value !== "---"){
            animationStates[k].type = animationSelects[k].value
        }
    })
    return animationStates
}

function setAnimationStates(animationStates){
    Object.keys(sliderNames).forEach(k => {
       if ( animationStates[k]){
           animationSelects[k].value = animationStates[k].type
       }
    })
}

function saveScenesToLocalStorage(scenes){
    let scenesForSaving = {
        schemaVersion: "0.1",
        date: new Date().toISOString(),
        scenes: scenes
    }

    let string = JSON.stringify(scenesForSaving)
    localStorage.setItem("scenes", string)
}

function updateScene() {
    scenes[activeScene].sliderValues = {...paramVals}
    scenes[activeScene].animation = getAnimationStates()
    console.log("Save Scene " + activeScene)
    saveScenesToLocalStorage(scenes)
}

function createSceneButton(sceneNo) {
    let sceneCont = document.getElementById("sceneLinkContainer")
    let sceneLink = document.createElement("button")
    sceneLink.onclick = () => selectScene(sceneNo);
    sceneLink.innerHTML = `${sceneNo}`
    sceneLink.classList.add("sceneLink")

    if (sceneNo === activeScene) {
        sceneLink.classList.add("active")
    }
    sceneLink.id = "loadScene" + sceneNo
    //sceneLink.innerHTML = `<button onclick="loadScene(${sceneNo})">Scene ${sceneNo}</button>`
    sceneCont.appendChild(sceneLink)
}

function deleteScene() {
    document.getElementById("loadScene" + activeScene).remove()
    scenes.splice(activeScene, 1);
    console.log("Delete Scene " + activeScene)
    saveScenesToLocalStorage(scenes)

    document.querySelectorAll('.sceneLink').forEach(e => e.remove());
    scenes.forEach((scene, i) => {
        createSceneButton(i)
        createSceneSliders(i)
    })
}

function selectScene(number) {

    console.log("Load Scene " + number)
    activeScene = number
    if (!scenes[number]) {
        return
    }
    let sliderValues = scenes[number].sliderValues
    Object.keys(sliderNames).forEach(k => {
        if (sliderValues[k] !== null && sliderValues[k] !== undefined) {
            setVisualParameter(k, sliderValues[k])
        }
    })

    let animationStates = scenes[number].animation
    console.log(animationStates)
    if (animationStates){
        setAnimationStates(animationStates)
    }

    let div = document.getElementById("sceneSliderContainer")
    div.classList.add("hide")

    document.querySelectorAll(".sceneLink.active").forEach(element => {
        element.classList.remove("active");
    });

    document.getElementById("loadScene" + number).classList.add("active")
}

function updateSceneSliders() {

    sceneMixer()

    let sceneSliderValueMap = []
    sceneSliderSum = 0.01

    let sceneSliders = document.querySelectorAll(".sceneSlider")

    //caluculate this only once and not for every Slider again
    sceneSliders.forEach((elem, i) => {
        sceneSliderValueMap[i] = Number(elem.value)
        sceneSliderSum += Number(elem.value)
    })

    //Take the scenes and add the values of the sliders together

    for (let slider in sliderNames) {
        let valueFromScenes = 0

        sceneSliderValueMap.forEach((value, i) => {
            let sliderVal = scenes[i].sliderValues[slider] ?? 0
            valueFromScenes += Number(sliderVal * value)
        })

        let newValue = valueFromScenes / sceneSliderSum
        setVisualParameter(slider, newValue)
    }
}

function sceneMixer() {
    activeScene = -1
    let div = document.getElementById("sceneSliderContainer")
    div.classList.remove("hide")

    document.querySelectorAll(".sceneLink.active").forEach(element => {
        element.classList.remove("active");
    });

    document.getElementById("selectSceneMixer").classList.add("active")
}

function downloadScenes() {
    const filename = 'videsynth_scenes.json';
    const jsonStr = JSON.stringify(scenes);

    let file = new Blob([JSON.stringify(scenes, null, 2)], {type: "application/json"});
    var a = document.createElement("a"),
        url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);

}

export function setSceneSlider(no, value) {
    const slider = document.getElementById("sceneSlider" + no);
    if (slider) {
        slider.value = value;
        updateSceneSliders()
    } else {
        console.log("no scene no " + no);
    }
}

// Takes a current Value and appies it to all the sliders
// wich have the animate checkbox activates
// in proportion to the scene slider values
export function animateSliders(currentValueForAnimation) {
    //console.log(currentValueForAnimation)

    //get the current animation value ->  ( sine(Tone.transport.seconds)

    let sceneSliderValueMap = []
    let sceneSliderSum = 0

    //This is too slow
    let sceneSliders = document.querySelectorAll(".sceneSlider")

    sceneSliders.forEach((elem, i) => {
        sceneSliderValueMap[i] = Number(elem.value)
        sceneSliderSum += Number(elem.value)
    })

    //Take the scenes and add the values of the sliders together
    for (let slider in sliderNames) {
        let animated = false
        let valueFromScenes = 0

        if (activeScene == -1) {
            sceneSliderValueMap.forEach((value, i) => {
                if (value > 0 && scenes[i].animation[slider]) {
                    let animationStyle = scenes[i].animation[slider].type
                    if (animationStyle != undefined && animationStyle !== "---") {
                        animated = true;
                        valueFromScenes += animVals[animationStyle](currentValueForAnimation) * value * scenes[i].sliderValues[slider]
                    }
                }
            })
        } else {
            sceneSliderSum = 1
            let animationStyle = animationSelects[slider].value
            if (animVals[animationStyle]) {
                animated = true
                valueFromScenes += animVals[animationStyle](currentValueForAnimation) * Number(sliders[slider].value())
            }
        }
        if (animated === true) {
            let newValue = valueFromScenes / sceneSliderSum
            paramVals[slider] = newValue
            resultSliders[slider].elt.value = newValue
        }
    }
}