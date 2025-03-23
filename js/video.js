import {sliderNames} from './videoSliderNames.js';
import * as p5 from '../lib/p5.min.js';
import '../lib/p5.min.js';

const mainSketch = (p5) => {

    let particles = [];
    const particleArrayLength = 5000

    let imgs = []

    let scenes = []
    let activeScene = 0

    let maxNoiseScale = 0.2
    let curlNoiseScale
    let maxNoiseTimeScale = 0.051
    var maxSpawnRadius = 500
    var maxSpawnCirleSpeed = 0.05
    let maxStokeWeight = 40
//var maxSpawnOffsetMultiplier = 10

//Technicalities
    var spawnCirleSpeed = 0.1
    var spawnRadius
    let lastParticleSpawned = 0
    var spawnCircleAngle = 0
    let maxSpawnRandSize
    let curlFactor

    let sceneSliderSum = 0.01
    let currentSliderNo = 0

    let higlightColor = "lightgreen"
    let bgColor = "lightgray"
    let divs = []
    let checkboxes = []
    let rotation = 0

// Connection to a broadcast channel
    const bc = new BroadcastChannel("sceneValues");

    var sliders = []


    var sliderKeys = Object.keys(sliderNames);
    var sliderValues = {}
    var checkboxValues = {}

    function windowResized() {
        resizeCanvas(p5.windowWidth, p5.windowHeight);
    }

    p5.setup = function () {

        p5.noFill()
        p5.createCanvas(p5.windowWidth, p5.windowHeight);

        p5.colorMode(p5.HSB, 1)

        Object.keys(sliderNames).forEach(k => {
            sliderValues[k] = sliderNames[k].default
        })

        maxSpawnRandSize = p5.width / 2
        createPropertiesSliders()
        createSceneInterface()

        for (let i = 0; i < particleArrayLength; i++) {
            particles.push(p5.createVector(p5.random(-maxSpawnRandSize, maxSpawnRandSize), p5.random(-maxSpawnRandSize, maxSpawnRandSize)));
        }

        p5.strokeWeight(1.5)
        p5.clear();

        //let usbMidiKnobInterface = "USB MIDI ADC 64"// [ID] or "device name"
        // let midiInput, midiOutput, midiMsg = {}
        //setupMidi(usbMidiKnobInterface, null) // deviceIn, deviceOut
    }

    async function createSceneInterface() {
        let scenes = localStorage.getItem("scenes");

        if (!scenes) {
            console.log("Loading scenes from external file...");
            try {
                const response = await fetch("defaultScenes.json");
                if (!response.ok) throw new Error("Failed to load scenes.json");
                scenes = await response.text(); // store raw string to match localStorage.setItem/getItem
                localStorage.setItem("scenes", scenes);
            } catch (err) {
                console.error("Failed to fetch scenes:", err);
                return;
            }
        }

        const parsedScenes = JSON.parse(scenes);
        parsedScenes.sliderValues.forEach((scene, i) => {
            createSceneButton(i);
            createSceneSliders(i);
        });

        loadScene(0);
    }

    function createSceneSliders(i) {
        let sceneSliderCont = document.getElementById("sceneSliderContainer")
        let div = p5.createDiv(`<span class="sceneSliderLabel">${i}</span>`)
        let sceneSlider = p5.createSlider(0, 1, 0, 0)
        sceneSlider.id("sceneSlider" + i)
        sceneSlider.addClass("sceneSlider")
        sceneSlider.input(updateSceneSliders)
        sceneSlider.parent(div);
        div.parent(sceneSliderCont)
    }

    p5.draw = function () {

        p5.translate(p5.width / 2, p5.height / 2)

        p5.rotate(sliderValues.rotation - 0.5)

        curlFactor = sliders["curlFactor"].value()
        curlNoiseScale = sliders["curlNoiseScale"].value()

        // checkBeat()
        // if (beat) {
        //     newSeed += random(0.5)
        // }
        // currentSeed += (newSeed - currentSeed) * 0.02
        // noiseSeed(currentSeed);
        // if (frameCount % 100 === 0){
        //     console.log(typeof sliderValues.bgTransparency)
        //     console.log(sliderValues.bgTransparency == 0)
        //     console.log(sliderValues.bgTransparency)
        // }

        p5.background(0, sliderValues.bgTransparency);

        let colorChange = (sliderValues.colorChange - 0.5) / 5000
        spawnRadius = sliders["spawnRadius"].value()
        spawnCirleSpeed = (2 ** (sliders["spawnCirleSpeed"].value() * 4)) / 8
        let stokeWeight = sliders["stokeWeight"].value()
        let particleNo = Math.floor((particleArrayLength - 1) * sliders["particleReducer"].value()) + 1

        let lineModulo = Math.floor(particleNo / 200)

        let spawnRate = 1 + (sliders["spawnRate"].value() * particleArrayLength / 40)

        spawnCircleAngle += spawnCirleSpeed * maxSpawnCirleSpeed

        for (let i = 0; i < spawnRate; i++) {
            lastParticleSpawned = (lastParticleSpawned + 1) % particleNo
            spawnParticle(particles[lastParticleSpawned], i, spawnRate)
        }
        for (let i = 0; i < particleNo; i++) {
            let currentP = i + lastParticleSpawned % particleNo

            let hue = (sliderValues.color + (colorChange * currentP)) % 1
            let sat = (sliderValues.saturation)

            p5.strokeWeight(0.3 + stokeWeight * maxStokeWeight)

            let p = particles[i];
            if (sliderValues.pointAlpha > 0.05) {
                let alpha = sliderValues.pointAlpha
                p5.stroke(hue, sat, 1, alpha)
                p5.point(p.x, p.y);
            }

            if (sliderValues.ellipseSize > 0.02) {
                if (i % 5 == 0) {
                    p5.stroke(hue, sat, 1, sliderValues.ellipseAlpha)
                    p5.ellipse(p.x, p.y, sliderNames.ellipseSize.max * sliderValues.ellipseSize)
                }
            }

            if (sliderValues.linesTransparency > 0.05) {
                if (i % lineModulo === 0) {
                    p5.stroke(hue, sat, 1, sliderValues.linesTransparency)

                    let lineDist = 50
                    let foundLines = 0

                    for (let ii = 1; 1 < 20; ii++) {

                        let otherIndex = (i + ii) % particleNo

                        if (abs(particles[otherIndex].x - p.x) < lineDist
                            && abs(particles[otherIndex].y - p.y) < lineDist) {
                            line(p.x, p.y, particles[otherIndex].x, particles[otherIndex].y)

                            foundLines += 1
                            if (foundLines > 5) {
                                break
                            }
                        }
                    }
                }
            }

            let fishcount = particleNo / (particleNo / 1000)
            if (i % fishcount == 0 && sliders["img1Alpha"].value() > 0.1) {
                p5.tint(255, sliders["img1Alpha"].value())
                p5.image(imgs[4], p.x, p.y, 200, 200);
            }
            if (i % (fishcount + 80) == 0 && sliders["img2Alpha"].value() > 0.1) {
                p5.tint(255, sliders["img2Alpha"].value())
                p5.image(imgs[5], p.x, p.y, 200, 200);
            }
            if (i % (fishcount + 70) == 0 && sliders["img3Alpha"].value() > 0.1) {
                p5.tint(255, sliders["img3Alpha"].value())
                p5.image(imgs[2], p.x, p.y, 200, 200);
            }
            // if (i % (fishcount + 20) == 0 && sliders["img4Alpha"].value() > 0.1) {
            //     tint(255, sliders["img4Alpha"].value())
            //     image(imgs[3], p.x, p.y, 200, 200);
            // }
            if (i % (fishcount / 2 + 100) == 0 && sliders["img4Alpha"].value() > 0.1) {
                p5.tint(255, sliders["img4Alpha"].value())
                p5.image(imgs[7], p.x, p.y, 200, 200);
            }
            if (i % (fishcount + 5) == 0 && sliders["img4Alpha"].value() > 0.1) {
                p5.tint(255, sliders["img4Alpha"].value())
                p5.image(imgs[6], p.x, p.y, 200, 200);
            }

            // if (i % (fishcount + 90) == 0 && sliders["img4Alpha"].value() > 0.1) {
            //     tint(255, sliders["img4Alpha"].value())
            //     image(imgs[4], p.x, p.y, 200, 200);
            // }
            // if (i % (fishcount + 420) == 0 && sliders["img4Alpha"].value() > 0.1) {
            //     tint(255, sliders["img4Alpha"].value())
            //     image(imgs[5], p.x, p.y, 200, 200);
            // }

            if (sliderValues.line2Alpha
                && i % 10 == 0
                && i !== lastParticleSpawned
            ) {
                p5.stroke(hue, sat, 1, sliderValues.line2Alpha)
                let otherP = (i + 1) % particleNo
                p5.line(p.x, p.y, particles[otherP].x, particles[otherP].y)
            }

            if (sliderValues.line3Alpha
                && i % 10 == 0
                && i !== lastParticleSpawned
            ) {
                p5.stroke(hue, sat, 1, sliderValues.line3Alpha)
                let otherP2 = Math.floor((i + (spawnRate / 2)) % particleNo)
                p5.line(p.x, p.y, particles[otherP2].x, particles[otherP2].y)
            }


            //Move the Particles
            let n = p5.noise(p.x * maxNoiseScale * curlNoiseScale, p.y * maxNoiseScale * curlNoiseScale, p5.frameCount * (sliders["noiseTimeScale"].value() * maxNoiseTimeScale));
            let b = p5.TAU * n * (p.x / (p5.width / 2) * curlFactor);
            let a = p5.TAU * n * ((p.y / (p5.height / 2) + 1) * curlFactor);

            p.x += p5.cos(a) * sliderNames.particleMoveSpeed.max * sliderValues["particleMoveSpeed"]
            p.y += p5.sin(b) * sliderNames.particleMoveSpeed.max * sliderValues["particleMoveSpeed"]

            p.x += (p.x) * ((sliderNames.zoomSpeed.max * sliderValues["zoomSpeed"]) - (sliderNames.zoomSpeed.max / 2))
            p.y += (p.y) * ((sliderNames.zoomSpeed.max * sliderValues["zoomSpeed"]) - (sliderNames.zoomSpeed.max / 2))

            //Translation
            p.x += ((sliders["moveX"].value() - 0.5) * sliderNames.moveX.max)
            p.y += ((sliders["moveY"].value() - 0.5) * sliderNames.moveX.max)

        }
    }

    function spawnParticle(p, i, spawnRate) {
        let spawnRandSizeX = maxSpawnRandSize * sliderValues.spawnRandomnessSizeX
        let spawnRandSizeY = maxSpawnRandSize * sliderValues.spawnRandomnessSizeY

        let spawnOffsetX = (sliders["spawnOffsetX"].value() - 0.5) * p5.width
        let spawnOffsetY = (sliders["spawnOffsetY"].value() - 0.5) * p5.height

        let maxSpawnOffsetMultiplier = p5.width / spawnRate
        let correctionX = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * sliders["spawnOffsetMultiplierX"].value()
        let correctionY = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * sliders["spawnOffsetMultiplierY"].value()

        spawnOffsetX += (i * sliders["spawnOffsetMultiplierX"].value() * maxSpawnOffsetMultiplier) - correctionX
        spawnOffsetY += (i * sliders["spawnOffsetMultiplierY"].value() * maxSpawnOffsetMultiplier) - correctionY

        //Just the randomness size
        p.x = p5.random(-spawnRandSizeX, spawnRandSizeX) + spawnOffsetX;
        p.y = p5.random(-spawnRandSizeY, spawnRandSizeY) + spawnOffsetY;

        //Add some circular movement
        let iOffset = sliderValues.spawnOffsetMultiplierCircle * i * maxSpawnOffsetMultiplier
        p.x += p5.cos(spawnCircleAngle) * spawnRadius * (maxSpawnRadius + iOffset)
        p.y += p5.sin(spawnCircleAngle) * spawnRadius * (maxSpawnRadius + iOffset)
    }

    function preload() {
        imgs.push(p5.loadImage('img/fish1.png'))
        imgs.push(p5.loadImage('img/fish2.png'))
        imgs.push(p5.loadImage('img/fish3.png'))
        imgs.push(p5.loadImage('img/fish4.png'))
        imgs.push(p5.loadImage('img/bubble1.png'))
        imgs.push(p5.loadImage('img/bubble2.png'))
        imgs.push(p5.loadImage('img/computer.png'))
        imgs.push(p5.loadImage('img/cloud-999.png'))
    }

    function keyPressed() {

        const sceneKeys = ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "è", "y", "a", "s", "d", "f", "g", "h", "j", "k", "l", "ö"];

        let sceneNo = sceneKeys.indexOf(key)
        if (-1 !== sceneNo) {
            console.log("load Scene " + sceneNo)
            loadScene(sceneNo)
            return
        }

        if (key == " ") {
            console.log("Shuffle!")
            shuffleSliders()
            return
        }

        if (key === "m") {
            console.log("Toggle Menu")
            document.getElementById('visualsMenuContainer').classList.toggle("hide")
            // document.getElementById('audio-sliders-container').classList.toggle("hide")
        }

        if (sliderKeys[key] === undefined) return
        currentSliderNo = key
        for (let i = 0; i < sliderKeys.length; i++) {
            divs[sliderKeys[i]].style('background-color', bgColor);
        }
        divs[sliderKeys[key]].style('background-color', higlightColor);
    }

    function shuffleSliders() {
        for (let key in sliders) {
            sliders[key].value(p5.random(0, 1))
        }
    }

// function mouseWheel(event) {
//     // Adjust the slider value based on the scroll direction
//     const slider = sliders[sliderKeys[currentSliderNo]]
//     let newValue = slider.value() - event.delta / 1000;
//     newValue = constrain(newValue, slider.elt.min, slider.elt.max);
//     slider.value(newValue);
// }

    function saveScene() {
        //existing = localStorage.getItem("sliderScene" + key)
        // if (existing){
        //     console.log("Already existing " + key)
        //     return
        // }
        let newScene = {}
        newScene["sliderValues"] = {...sliderValues}
        newScene["anmiation"] = {...checkboxValues}
        scenes.push(newScene)
        let sceneNo = scenes.length
        console.log("Save Scene " + sceneNo)
        let string = JSON.stringify(scenes)
        localStorage.setItem("scenes", string)

        createSceneButton(sceneNo - 1)
        createSceneSliders(sceneNo - 1)
    }

    function updateScene() {
        scenes[activeScene] = {...sliderValues}
        console.log("Save Scene " + activeScene)
        let string = JSON.stringify(scenes)
        localStorage.setItem("scenes", string)
    }

    function createSceneButton(sceneNo) {
        let sceneCont = document.getElementById("sceneLinkContainer")
        let sceneLink = document.createElement("button")
        sceneLink.onclick = () => loadScene(sceneNo);
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
        console.log(scenes)
        let string = JSON.stringify(scenes)
        localStorage.setItem("scenes", string)

        document.querySelectorAll('.sceneLink').forEach(e => e.remove());
        scenes.forEach((scene, i) => {
            createSceneButton(i)
            createSceneSliders(i)
        })
    }

    function loadScene(number) {

        console.log("Load Scene " + number)
        activeScene = number
        if (!scenes[number]) {
            return
        }
        sliderValues = scenes[number].sliderValues
        console.log(sliderValues)
        Object.keys(sliderNames).forEach(k => {
            if (sliderValues[k] !== null && sliderValues[k] !== undefined) {
                sliders[k].elt.value = sliderValues[k]
            }
        })

        let div = document.getElementById("sceneSliderContainer")
        div.classList.add("hide")

        document.querySelectorAll(".sceneLink.active").forEach(element => {
            element.classList.remove("active");
        });

        document.getElementById("loadScene" + number).classList.add("active")

    }


    function createPropertiesSliders() {

        let i = 0

        // Create sliders for all controls in the list
        let sliderContaier = document.getElementById("sliderContainer")

        console.log(sliderNames)

        for (let slider in sliderNames) {
            console.log(slider)

            let sliderName = slider;
            divs[sliderName] = p5.createDiv(`<span class="visual-labels">${i} ${sliderName}</span>`)
            divs[sliderName].addClass("visual-slider-entity")
            divs[sliderName].parent(sliderContaier)

            checkboxes[sliderName] = p5.createCheckbox()
            checkboxes[sliderName].addClass("visualCheckboxes")
            checkboxes[sliderName].parent(divs[sliderName])
            //checkboxes[sliderName].elt.addEventListener('input', updateCheckboxValue);

            let sliderObj = p5.createSlider(0, 1, sliderNames[sliderName].default, 0)
            sliderObj.id(sliderName)
            sliderObj.addClass("visualSliders")
            sliderObj.parent(divs[sliderName]);
            sliderObj.elt.addEventListener('input', updateSliderValue);
            sliders[sliderName] = sliderObj

            i++
        }

    }

    function updateSceneSliders() {

        sceneMixer()

        let sceneSliderValueMap = []
        sceneSliderSum = 0.01

        let sceneSliders = document.querySelectorAll(".sceneSlider")

        sceneSliders.forEach((elem, i) => {
            sceneSliderValueMap[i] = elem.value
            sceneSliderSum += Number(elem.value)
        })

        //Take the scenes and add the values of the sliders together

        for (let slider in sliderNames) {

            let valueFromScenes = 0

            sceneSliderValueMap.forEach((value, i) => {
                valueFromScenes += Number(scenes[i][slider] * value)
            })

            let newValue = valueFromScenes / sceneSliderSum
            sliders[slider].elt.value = newValue
            sliderValues[slider] = newValue
        }
    }

    function sceneMixer() {
        let div = document.getElementById("sceneSliderContainer")
        div.classList.remove("hide")

        document.querySelectorAll(".sceneLink.active").forEach(element => {
            element.classList.remove("active");
        });

        document.getElementById("selectSceneMixer").classList.add("active")
    }

    function updateSliderValue(evt) {
        sliderValues[evt.target.id] = Number(evt.target.value)
    }

    bc.onmessage = (event) => {
        let message = event.data.split(':');
        let value = message[1]
        setSceneSlider(message[0], value)
    };

// Takes a current Value and appies it to all the sliders
// wich have the animate checkbox activates
// in proportion to the scene slider values
    function updateanimationSliders(currentValueFromAnimation) {

        //get the current animation value ->  ( sine(Tone.transport.seconds)

        let sceneSliderValueMap = []

        //This is too slow
        let sceneSliders = document.querySelectorAll(".sceneSlider")

        sceneSliders.forEach((elem, i) => {
            sceneSliderValueMap[i] = elem.value
            // let  totalValue += Number(elem.value)
        })

        //Take the scenes and add the values of the sliders together
        for (let slider in sliderNames) {
            // let valueFromScenes = 0
            // sceneSliderValueMap.forEach((value, i) => {
            //         if (checkboxes[sliderKeys[i]].checked()){
            //             valueFromScenes += 1
            //             console.log("checked: " + i)
            //         }
            //
            // })
            // if (valueFromScenes > 0){
            let newValue = valueFromScenes / sceneSliderSum
            sliders[slider].elt.value = newValue
            sliderValues[slider] = newValue
            console.log("Update Slider Value ".newValue)
            // }
        }
    }

    function onScreen(v) {
        return v.x >= -p5.width / 2 && v.x <= p5.width / 2 && v.y >= -p5.height / 2 && v.y <= p5.height / 2;
    }

    function testPerformance() {
        background(0)
        color(1)
        stroke(1)
        text(frameRate(), 10, 10)
        for (let i = 0; i < 100000000; i++) {
            let eums = sliderNames.spawnOffsetMultiplierCircle.default
        }
        return
    }

    function checkBeat() {
        let beat = false
        if (millis() > (lastBeat + beatLength)) {
            let lastBeat = millis()
            beat = true
        }
    }

//Midi-------------------------------------

    function controlChange(control) {
        // use control.type, .channel, .currentSliderNo, .controllerName, .value

        currentSliderNo = control.controller.number

        let slider = sliders[sliderKeys[currentSliderNo]]
        if (slider) {
            slider.elt.value = control.value
            sliderValues[sliderKeys[currentSliderNo]] = control.value
        }
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


}

new window.p5(mainSketch);

export function setSceneSlider(no, value) {
    const slider = document.getElementById("sceneSlider" + no);
    if (slider) {
        slider.value = value;
        updateSceneSliders()
    } else {
        console.log("no scene no " + no);
    }
}

//Stolen from Ted Davis p5live.org
export function popStream(force) {
    let p5pop, p5popStream, p5popActive = true

    let icon = {}
    icon.maximize = ""
    let newBG = "black"

    if (force) {
        p5popActive = true;
    }
    p5popStream = document.querySelector('canvas').captureStream()

    if (p5pop && !p5pop.closed) {
        p5pop.vid.srcObject = p5popStream;
    } else {
        // technique built upon : http://plnkr.co/edit/jDzbtPYrYItQ4peplOAN
        let popup_html = '<!DOCTYPE html><html><head><title>P5LIVE - VISUALS STREAM</title></head><body><div id="but" style="position:fixed;right:5px;top:5px;z-index:10;border:none;color:#fff;padding:5px;font-size:16pt;cursor:pointer;opacity:.5;" onmouseenter="this.style.opacity=1;" onmouseleave="this.style.opacity=.5;" onclick="openFullscreen();" title="Fullscreen">' + icon.maximize + '</div><br><video id="vid" playsinline autoplay muted style="position:fixed;left:0;top:0;width:100vw;height:100vh;background-color:#000;"></video><script>var vid=document.getElementById("vid");document.body.style.margin="0";document.body.style.background="' + newBG + '";function openFullscreen(){if(vid.requestFullscreen) {vid.requestFullscreen(); } else if (vid.mozRequestFullScreen) { /* Firefox */ vid.mozRequestFullScreen();}else if(vid.webkitRequestFullscreen) {/* Chrome, Safari & Opera */ vid.webkitRequestFullscreen();}else if(vid.msRequestFullscreen){/* IE/Edge */ vid.msRequestFullscreen();}}<\/script><style>::-webkit-media-controls {display:none !important;}<\/style></body></html>';
        let popup_url = URL.createObjectURL(new Blob([popup_html], {
            type: 'text/html'
        }));
        p5pop = window.open(popup_url, "P5LIVE - VISUALS STREAM", 'left=0,top=0,width=0,height=0');
        URL.revokeObjectURL(popup_url);
        p5pop.onload = function () {
            p5pop.vid.srcObject = p5popStream;
            // let ctrls = p5pop.document.getElementById("controldiv");
            // ctrls.disabled="true";
        }

        var p5popTick = setInterval(function () {
            if (p5pop.closed) {
                p5popActive = false;
                clearInterval(p5popTick);
            }
        }, 500);
    }
}

