import {sliderNames} from "./videoSliderNames.js";
import { setVisualParameter, paramVals, animationVals, sliders, resultSliders} from "./visuals.js";

let sceneSliderSum = 0.01
let activeScene = 0
export let scenes = []

export let animationCurves = {
    "Ramp in": v => v,
    "Ramp out": v => 1 - v,
    "Sine": v => Math.sin(v * 2 * Math.PI) * 0.5 + 0.5,

    "Ease In": v => v * v,
    "Ease Out": v => 1 - (1 - v) * (1 - v),
    "Ease InOut": v => v < 0.5
        ? 2 * v * v
        : 1 - Math.pow(-2 * v + 2, 2) / 2,

    "Cubic In": v => v ** 3,
    "Cubic Out": v => 1 - (1 - v) ** 3,
    "Cubic InOut": v => v < 0.5
        ? 4 * v ** 3
        : 1 - Math.pow(-2 * v + 2, 3) / 2,

    "Bounce Out": v => {
        const n1 = 7.5625, d1 = 2.75;
        if (v < 1 / d1) return n1 * v * v;
        else if (v < 2 / d1) return n1 * (v -= 1.5 / d1) * v + 0.75;
        else if (v < 2.5 / d1) return n1 * (v -= 2.25 / d1) * v + 0.9375;
        else return n1 * (v -= 2.625 / d1) * v + 0.984375;
    },
    "Bounce In": v => 1 - animationCurves["Bounce Out"](1 - v),

    "Peak": v => v < 0.2 ? 1 : 0,
    "Pulse": v => (v >= 0.5 && v <= 0.7) ? 1 : 0,
    "Random": _ => Math.random(),
 //   "Noise": v => p5.noise(v * 10), // scale for detail
};

document.getElementById("saveSceneButton").addEventListener("click", saveScene);
document.getElementById("deleteSceneButton").addEventListener("click", deleteScene);
document.getElementById("updateSceneButton").addEventListener("click", updateScene);
document.getElementById("renameSceneButton").addEventListener("click", renameScene);
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

    const parsedScenes = JSON.parse(scenesAsJson);
    scenes = parsedScenes.scenes

    //remove in the future when no old scenes are there.
    let foundScenesWithoutId = false
    scenes.forEach(function(scene) {
        if (!scene.id) {
            foundScenesWithoutId = true
            scene.id = crypto.randomUUID();
        }
    });
    if (foundScenesWithoutId){
        saveScenesToLocalStorage(scenes)
    }

    if (!scenes){
        throw new Error("Could not Load Scenes. Try to empty Browser Cache. All will be lost.")
    }

    let sceneCont = document.getElementById("sceneLinkContainer")
    sceneCont.innerHTML = ""

    scenes.forEach((scene, i) => {
        createSceneButton(scene);
        createSceneSlider(scene);
    });

    setTimeout(() => {loadScene(34);}, 500)

}

function createSceneSlider(scene) {
    //console.log("create scene slider " + scene.id )
    const sceneSliderCont = document.getElementById("sceneSliderContainer");

    const div = document.createElement("div");
    div.innerHTML = `<span class="sceneSliderLabel">${scene.description}</span>`;

    const sceneSlider = document.createElement("input");
    sceneSlider.type = "range";
    sceneSlider.min = "0";
    sceneSlider.max = "1";
    sceneSlider.step = 1e-18;
    sceneSlider.value = "0";
    sceneSlider.id = "sceneSlider " + scene.id
    sceneSlider.classList.add("sceneSlider");
    sceneSlider.addEventListener("input", updateSceneSliders);

    div.appendChild(sceneSlider);
    sceneSliderCont.appendChild(div);
}

function saveScene(no) {
    let description = prompt("Enter scene description:", `Scene ${scenes.length + 1} description`);
    if (description === null) return; // User cancelled

    let newScene = {}
    newScene["description"] = description
    newScene["sliderValues"] = { ...paramVals }
    newScene["animation"] = getAnimationStates()
    scenes.push(newScene)
    saveScenesToLocalStorage(scenes)

    let sceneNo = scenes.length
    console.log("Save Scene " + sceneNo)
    createSceneButton(newScene)
    createSceneSlider(newScene)
}

function getAnimationStates(){
    let animationStates = {}
    Object.keys(sliderNames).forEach(k => {
        if (animationVals[k] && animationVals[k].type.value !== "---" ){
            animationStates[k] = {}
            animationStates[k].type = animationVals[k].type.value
            animationStates[k].speed = animationVals[k].speed.value
            console.log(animationVals[k].amount.elt.value)
            animationStates[k].amount = animationVals[k].amount.elt.value
        }
    })
    return animationStates
}

function setAnimationStates(animationStates) {
    Object.keys(sliderNames).forEach(k => {
        if (sliderNames[k].type && sliderNames[k].type === "section") {
            return; // Skips to next iteration
        }

        let state = animationStates[k]
        if (!state) state = {}

        let type = state.type

        if (!type || type === "") type  = "---"
        animationVals[k].type.value = type

        let speed = state.speed
        if (!speed || speed === "") speed = "1"
        animationVals[k].speed.value = speed

        let amount = state.amount
        if (undefined === amount) amount = 0
        animationVals[k].amount.elt.value = amount
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
    const sceneIndex = scenes.findIndex(s => s.id === activeScene);
    if (sceneIndex !== -1) {
        scenes[sceneIndex].sliderValues = { ...paramVals };
        scenes[sceneIndex].animation = getAnimationStates();
        console.log("Save Scene " + scenes[sceneIndex].description);
        saveScenesToLocalStorage(scenes);
    } else {
        console.warn("Scene not found for id:", id);
    }
}

function renameScene() {
    let description = prompt("Enter scene description:", `Scene ${scenes.length + 1} description`);
    if (description === null) return; // User cancelled

    const sceneIndex = scenes.findIndex(s => s.id === activeScene);
    if (sceneIndex == -1) {
        console.error("scene not found")
        return;
    }
    scenes[sceneIndex].description = description;

    console.log("Rename Scene " + activeScene)
    saveScenesToLocalStorage(scenes)
    createSceneInterface()
}

function createSceneButton(scene) {
    let sceneCont = document.getElementById("sceneLinkContainer")
    let sceneLink = document.createElement("a")
    sceneLink.onclick = () => loadScene(scene.id);
    sceneLink.innerHTML = scene.description
    sceneLink.classList.add("sceneLink")

    if (scene === activeScene) {
        sceneLink.classList.add("active")
    }
    sceneLink.id = "loadScene" + scene.description
    sceneCont.appendChild(sceneLink)
}

function deleteScene() {
    document.getElementById("loadScene" + activeScene).remove()
    scenes.splice(activeScene, 1);
    console.log("Delete Scene " + activeScene)
    saveScenesToLocalStorage(scenes)

    document.querySelectorAll('.sceneLink').forEach(e => e.remove());
    createSceneInterface()
}

export function loadScene(id) {

    console.log("Load Scene " + id)
    activeScene = id

    const scene = scenes.find(s => s.id === id);

    if (!scene) {
        console.log("scene not found")
        return
    }
    let sliderValues = scene.sliderValues
    Object.keys(sliderNames).forEach(k => {
        if (sliderValues[k] !== null
            && sliderValues[k] !== undefined
        ) {
            console.log(k.type)
            setVisualParameter(k, sliderValues[k])
        }
    })

    let animationStates = scene.animation
    if (animationStates){
        setAnimationStates(animationStates)
    }

    let div = document.getElementById("sceneSliderContainer")
    div.classList.add("hide")

    document.querySelectorAll(".sceneLink.active").forEach(element => {
        element.classList.remove("active");
    });

    document.getElementById("loadScene" + scene.description).classList.add("active")

    document.querySelectorAll('.animation-prop-div').forEach(element => {
        element.classList.remove('hide');
    });
}

function updateSceneSliders() {

    sceneMixer()

    let sceneSliderValueMap = []
    sceneSliderSum = 0.01

    //Scene Slides are audio Sliders?
    let sceneSliders = document.querySelectorAll(".sceneSlider")

    //caluculate the slider proportions only once and not for every Slider again
    sceneSliders.forEach((elem, i) => {
        sceneSliderValueMap[i] = Number(elem.value)
        sceneSliderSum += Number(elem.value)
    })

    //Take the scenes and add the values of the sliders together
    for (let slider in sliderNames) {
        if (sliderNames[slider].type && sliderNames[slider].type === "section"){
            continue
        }

        let valueFromScenes = 0

        sceneSliderValueMap.forEach((value, i) => {
            let sliderVal = scenes[i].sliderValues[slider] ?? 0
            valueFromScenes += Number(sliderVal * value)
        })

        let newValue = valueFromScenes / sceneSliderSum
        setVisualParameter(slider, newValue)
    }
}

export function sceneMixer() {
    activeScene = -1
    let div = document.getElementById("sceneSliderContainer")
    div.classList.remove("hide")

    document.querySelectorAll(".sceneLink.active").forEach(element => {
        element.classList.remove("active");
    });

    document.getElementById("selectSceneMixer").classList.add("active")

    document.querySelectorAll('.animation-prop-div').forEach(element => {
        element.classList.add('hide');
    });
}

function downloadScenes() {
    const filename = 'videsynth_scenes.json';
    let jsonStr = localStorage.getItem("scenes");

    let file = new Blob([jsonStr], {type: "application/json"});
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

export function setSceneSlider(sceneId, value) {
    const slider = document.getElementById("sceneSlider " + sceneId);
    if (slider) {
        slider.value = value;
        updateSceneSliders()
    } else {
        console.log("no scene no " + sceneId);
    }
}

// Takes a current Value and appies it to all the sliders
// wich have the animate checkbox activates
// in proportion to the scene slider values
export function animateSliders(currentTime) {

    let measureStartTime = Date.now()
    const sceneSliders = [...document.querySelectorAll(".sceneSlider")];
    const sliderValues = sceneSliders.map(s => Number(s.value));
    const totalWeight = sliderValues.reduce((sum, v) => sum + v, 0) || 1;

    const computeAnim = (animType, speed, weight, influence) => {
        if (!animationCurves[animType] || animType === "---") return 0;
        const pos = (currentTime % speed) / speed;
        return animationCurves[animType](pos) * influence * weight;
    };

    for (const slider in sliderNames) {
        if (sliderNames[slider].type && sliderNames[slider].type === "section"){
            return
        }
        let sum = 0;
        let animated = false;
        const influence = Number(animationVals[slider].amount.elt.value);

        if (activeScene === -1) {
            //If we are in the scene mixer, add the animation values and weights together.
            sliderValues.forEach((weight, i) => {
                const anim = scenes[i].animation?.[slider];
                if (weight > 0 && anim?.type && anim.type !== "---") {
                    sum += computeAnim(anim.type, Number(anim.speed), weight, influence);
                    animated = true;
                }
            });
        } else {
            //If we selected a scene, just take the value from the animation slider.
            const anim = animationVals[slider];
            const animType = anim.type.value;
            const speed = Number(anim.speed.value);
            if (animationCurves[animType]) {
                sum += computeAnim(animType, speed, 1, influence);
                animated = true;
            }
        }

        if (animated) {
            const val = (sum / (activeScene === -1 ? totalWeight : 1)) + sliders[slider].value();
            paramVals[slider] = val;
            resultSliders[slider].elt.value = val;
        }
    }

    console.log("Animation Time: " + Date.now() - measureStartTime)
}