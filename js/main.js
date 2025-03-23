import {setupAudio} from './audio.js';
import {popStream} from './video.js';
import {setupLaunchpad} from './launchpad_mini_controller.js';
import {createSceneInterface} from './visualScenes.js';

document.addEventListener("DOMContentLoaded", () => {

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
})
