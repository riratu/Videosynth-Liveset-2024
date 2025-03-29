import {setupAudio, setZero, toggleAudio} from './audio.js';
import {popStream} from './visuals.js';
import {setupLaunchpad} from './launchpad_mini_controller.js';
import {createSceneInterface} from './visualScenes.js';
let settings= {}

document.addEventListener("DOMContentLoaded", () => {

    let settingsfromStorage = JSON.parse(localStorage.getItem("settings"))
    if (settingsfromStorage) {
        settings = settingsfromStorage
    }

    if (settings.expertMode) {
        document.body.classList.add("show-expert")
    }

    document.getElementById("helloClick").addEventListener("click", () => {
            setupAudio()
            setupLaunchpad()
            createSceneInterface()
            document.getElementById("helloContainer").classList.add("hide")
            document.getElementById("audio-sliders-container").classList.remove("hide")
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

function toggleExpert() {
    settings.expertMode = document.body.classList.toggle("show-expert");
    localStorage.setItem("settings", JSON.stringify(settings))
}
