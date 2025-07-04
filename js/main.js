import {setupAudio, setZero, toggleAudio} from './audio.js';
import {popStream} from './visuals.js';
import {setupLaunchpad} from './launchpad_mini_controller.js';
import {createSceneInterface, sceneMixer} from './visualScenes.js';
let settings= {}

document.addEventListener("DOMContentLoaded", () => {

    let settingsfromStorage = JSON.parse(localStorage.getItem("settings"))
    if (settingsfromStorage) {
        settings = settingsfromStorage
    }

    if (settings.expertMode) {
        document.body.classList.add("show-expert")
    }

    console.log("settings")
    console.log(settings.load)

    if (settings.load){
        startAll()
    }

    document.getElementById("helloClick").addEventListener("click", () => {
            saveSetting("load", true)
            startAll
        }
    );

    document.getElementById("visualsOnly").addEventListener("click", () => {
        document.getElementById("helloContainer").classList.add("hide")
        document.getElementById('visualsMenuContainer').classList.toggle("hide")
    })

    document.getElementById("popStream").addEventListener("click", popStream)

    document.getElementById("toggleExpertModeButton").addEventListener("click", toggleExpert)
    document.getElementById("setZeroButton").addEventListener("click", setZero)
    document.getElementById("toggleAudioButton").addEventListener("click", toggleAudio)
})

function startAll(){
    createSceneInterface()
    setupAudio()
    setupLaunchpad()
    document.getElementById("helloContainer").classList.add("hide")
    document.getElementById("audio-sliders-container").classList.remove("hide")
    document.getElementById("selectSceneMixer").addEventListener("click", sceneMixer)
}

export function toggleExpert() {
    settings.expertMode = document.body.classList.toggle("show-expert");
    saveSetting("expert", true)
}

function saveSetting(name, value){
    let settings = JSON.parse(localStorage.getItem("settings"))

    if (!settings){
        settings = {}
    }
    settings[name] = value
    localStorage.setItem("settings", JSON.stringify(settings))
}
