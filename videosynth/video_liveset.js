let particles = [];
const particleArrayLength = 10000
beatLength = 5000
lastBeat = 0
currentSeed = 0

let scenes = []
let activeScene = 0

// Max Values for Sliders
newSeed = 0
maxCurlFactor = 50
maxZoomSpeed = 0.05
maxSpawnRandSize = 0
maxTranslationSpeed = 20

let maxNoiseScale = 0.2
let curlNoiseScale
let maxNoiseTimeScale = 0.051
var maxSpawnRadius = 500
var maxSpawnCirleSpeed = 1
let maxStokeWeight = 40
//var maxSpawnOffsetMultiplier = 10

//Technicalities

var spawnCirleSpeed = 0.1
var spawnRadius
let lastParticleSpawned = 0
var spawnCircleAngle = 0

//Webmidi
/* PREFS */
let midiDeviceIn = "USB MIDI ADC 64"// [ID] or "device name"
let midiDeviceOut = 1 // [ID] or "device name"
let midiThru = false // optionally pass all in -> out

let midiInput, midiOutput, midiMsg = {}

let currentSliderNo = 0

let higlightColor = "lightgreen"
let bgColor = "lightgray"
let mic
let divs = []
let checkboxes = []
let rotation = 0

// Connection to a broadcast channel
const bc = new BroadcastChannel("sceneValues");

var sliders = []
var sliderNames = {
    "zoomSpeed": {
        description: "",
        default: 0.5,
        max: 0.05,
        min: 0.01,
    },
    "moveX": {
        default: 0.5,
        max: 5
    },
    "moveY": {
        default: 0.5,
        max: 5
    },
    "saturation": {
        default: 0,
    },
    "color": {
        default: 0.5,
    },
    "colorChange": {
        default: 0.5,
    },
    "bgTransparency": {
        default: 0.5,
    },
    "particleReducer": {
        default: 1,
    },
    "stokeWeight": {
        default: 0.05,
    },
    "pointAlpha": {
        default: 1,
    },
    "particleMoveSpeed": {
        default: 0.5,
        max: 5
    },
    "ellipseAlpha": {
        default: 1,
    },
    "spawnRate": {
        default: 0.1,
    },
    "linesTransparency": {
        default: 0,
    },
    "curlNoiseScale": {
        default: 0.1,
    },
    "ellipseSize": {
        default: 0.1,
        max: 450
    },
    "noiseTimeScale": {
        default: 0.1
    },
    "spawnRandomnessSizeX": {
        default: 0,
    },
    "spawnRadius": {
        default: 0,
    },
    "spawnCirleSpeed": {
        default: 0.1,
    },
    "curlFactor": {
        default: 0.5,
    },
    "spawnRandomnessSizeY": {
        default: 0,
    },
    "img1Alpha": {
        default: 0,
    },
    "spawnOffsetY": {
        default: 0.5,
    },
    "img2Alpha": {
        default: 0,
    },
    "spawnOffsetX": {
        default: 0.5,
    },
    "img3Alpha": {
        default: 0,
    },
    "img4Alpha": {
        default: 0,
    },
    "spawnOffsetMultiplierX": {
        default: 0.5
    },
    "spawnOffsetMultiplierY": {
        default: 0,
    },
    "spawnOffsetMultiplierCircle": {
        default: 0,
    },
    "line2Alpha": {
        default: 0,
    },
    "line3Alpha": {
        default: 0,
    },
    "rotation": {
        default: 0.5,
    }
};

var sliderKeys = Object.keys(sliderNames);
var sliderValues = {}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function setup() {
    mic = new p5.AudioIn()
    mic.start()
    mic.amp(10)

    noFill()
    createCanvas(windowWidth, windowHeight);

    colorMode(HSB, 1)

    Object.keys(sliderNames).forEach(k => {
        sliderValues[k] = sliderNames[k].default
    })

    maxSpawnRandSize = width / 2
    createInterface()
    createSceneInterface()

    for (let i = 0; i < particleArrayLength; i++) {
        particles.push(createVector(random(-maxSpawnRandSize, maxSpawnRandSize), random(-maxSpawnRandSize, maxSpawnRandSize)));
    }

    strokeWeight(1.5)
    clear();

    setupMidi(midiDeviceIn, midiDeviceOut) // deviceIn, deviceOut

}

function createSceneInterface(){
    $values = localStorage.getItem("scenes")
    if ($values !== undefined && $values !== null) {
        scenes = JSON.parse($values)
        let sceneSliderCont = document.getElementById("sceneSliderContainer")
        scenes.forEach((scene, i) => {
            createSceneButton(i)

            let div = createDiv(`<span class="sceneSliderLabel">${i}</span>`)
            //div.addClass("sceneSliderLabel")
            let sceneSlider = createSlider(0, 1, 0, 0)
            sceneSlider.id("sceneSlider" + i)
            sceneSlider.addClass("sceneSlider")
            sceneSlider.input(updateSceneSliders)
            sceneSlider.parent(div);
            div.parent(sceneSliderCont)

        })
    }
}

function draw() {

    translate(width / 2, height / 2)

    rotation += ((sliderValues.rotation - 0.5) / 40)
    //rotate(rotation)

    //Test Performance of certain things
    //testPerformance();

    //frameRate(1)

    let micLevel = mic.getLevel()

    //const slider = sliders[sliderKeys[currentSliderNo]]
    let newValue = micLevel


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

    background(0, sliderValues.bgTransparency);

    let colorChange = (sliderValues.colorChange - 0.5) / 5000
    spawnRadius = sliders["spawnRadius"].value()
    spawnCirleSpeed = sliders["spawnCirleSpeed"].value()
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
        currentP = i + lastParticleSpawned % particleNo

        let hue = (sliderValues.color + (colorChange * currentP)) % 1
        let sat = (sliderValues.saturation)

        strokeWeight(0.3 + stokeWeight * maxStokeWeight)

        let p = particles[i];
        if (sliderValues.pointAlpha > 0.05) {
            let alpha = sliderValues.pointAlpha
            stroke(hue, sat, 1, alpha)
            point(p.x, p.y);
        }

        if (sliderValues.ellipseSize > 0.02) {
            if (i % 5 == 0) {
                stroke(hue, sat, 1, sliderValues.ellipseAlpha)
                ellipse(p.x, p.y, sliderNames.ellipseSize.max * sliderValues.ellipseSize)
            }
        }

        if (sliderValues.linesTransparency > 0.05) {
            if (i % lineModulo === 0) {
                stroke(hue, sat, 1, sliderValues.linesTransparency)

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

        if (i % 100 == 0 && sliders["img1Alpha"].value() > 0.1) {
            tint(255, sliders["img1Alpha"].value())
            image(img, p.x, p.y, 200, 200);
        }
        if (i % 70 == 0 && sliders["img2Alpha"].value() > 0.1) {
            tint(255, sliders["img2Alpha"].value())
            image(img, p.x, p.y, 200, 200);
        }
        if (i % 80 == 0 && sliders["img3Alpha"].value() > 0.1) {
            tint(255, sliders["img3Alpha"].value())
            image(img, p.x, p.y, 200, 200);
        }
        if (i % 90 == 0 && sliders["img4Alpha"].value() > 0.1) {
            tint(255, sliders["img4Alpha"].value())
            image(img, p.x, p.y, 200, 200);
        }

        if (sliderValues.line2Alpha
            && i % 10 == 0
            && i !== lastParticleSpawned
        ) {
            stroke(hue, sat, 1, sliderValues.line2Alpha)
            otherP = (i + 1) % particleNo
            line(p.x, p.y, particles[otherP].x, particles[otherP].y)
        }

        if (sliderValues.line3Alpha
            && i % 10 == 0
            && i !== lastParticleSpawned
        ) {
            stroke(hue, sat, 1, sliderValues.line3Alpha)
            otherP = Math.floor((i + (spawnRate / 2)) % particleNo)
            line(p.x, p.y, particles[otherP].x, particles[otherP].y)
        }


        //Move the Particles
        let n = noise(p.x * maxNoiseScale * curlNoiseScale, p.y * maxNoiseScale * curlNoiseScale, frameCount * (sliders["noiseTimeScale"].value() * maxNoiseTimeScale));
        let b = TAU * n * (p.x / (width / 2) * curlFactor);
        let a = TAU * n * ((p.y / (height / 2) + 1) * curlFactor);

        p.x += cos(a) * sliderNames.particleMoveSpeed.max * sliderValues["particleMoveSpeed"]
        p.y += sin(b) * sliderNames.particleMoveSpeed.max * sliderValues["particleMoveSpeed"]

        p.x += (p.x) * ((maxZoomSpeed * sliderValues["zoomSpeed"]) - (maxZoomSpeed / 2))
        p.y += (p.y) * ((maxZoomSpeed * sliderValues["zoomSpeed"]) - (maxZoomSpeed / 2))

        //Translation
        p.x += ((sliders["moveX"].value() - 0.5) * maxTranslationSpeed)
        p.y += ((sliders["moveY"].value() - 0.5) * maxTranslationSpeed)

    }
}

function spawnParticle(p, i, spawnRate) {
    spawnRandSizeX = maxSpawnRandSize * sliderValues.spawnRandomnessSizeX
    spawnRandSizeY = maxSpawnRandSize * sliderValues.spawnRandomnessSizeY

    spawnOffsetX = (sliders["spawnOffsetX"].value() - 0.5) * width
    spawnOffsetY = (sliders["spawnOffsetY"].value() - 0.5) * height

    maxSpawnOffsetMultiplier = width / spawnRate
    correctionX = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * sliders["spawnOffsetMultiplierX"].value()
    correctionY = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * sliders["spawnOffsetMultiplierY"].value()

    spawnOffsetX += (i * sliders["spawnOffsetMultiplierX"].value() * maxSpawnOffsetMultiplier) - correctionX
    spawnOffsetY += (i * sliders["spawnOffsetMultiplierY"].value() * maxSpawnOffsetMultiplier) - correctionY

    //Just the randomness size
    p.x = random(-spawnRandSizeX, spawnRandSizeX) + spawnOffsetX;
    p.y = random(-spawnRandSizeY, spawnRandSizeY) + spawnOffsetY;

    //Add some circular movement
    iOfset = sliderValues.spawnOffsetMultiplierCircle * i * maxSpawnOffsetMultiplier
    p.x += cos(spawnCircleAngle) * spawnRadius * (maxSpawnRadius + iOfset)
    p.y += sin(spawnCircleAngle) * spawnRadius * (maxSpawnRadius + iOfset)
}

function preload() {
    img = loadImage('img/1814.png');
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
        document.getElementById('menuContainer').style.display =
            document.getElementById('menuContainer').style.display === 'none' ? '' : 'none';
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
        sliders[key].value(random(0, 1))
    }
}

// function mouseWheel(event) {
//     // Adjust the slider value based on the scroll direction
//     const slider = sliders[sliderKeys[currentSliderNo]]
//     let newValue = slider.value() - event.delta / 1000;
//     newValue = constrain(newValue, slider.elt.min, slider.elt.max);
//     slider.value(newValue);
// }

function saveScene(key) {
    //existing = localStorage.getItem("sliderScene" + key)
    // if (existing){
    //     console.log("Already existing " + key)
    //     return
    // }
    scenes.push({ ...sliderValues })
    let sceneNo = scenes.length
    console.log("Save Scene " + sceneNo)
    let string = JSON.stringify(scenes)
    localStorage.setItem("scenes", string)

    createSceneButton(sceneNo -1)
}

function updateScene() {
    scenes[activeScene] = { ...sliderValues }
    console.log("Save Scene " + sceneNo)
    let string = JSON.stringify(scenes)
    localStorage.setItem("scenes", string)
}

function createSceneButton(sceneNo){
    let sceneCont = document.getElementById("sceneLinkContainer")
    let sceneLink = document.createElement("button")
    sceneLink.onclick = () => loadScene(sceneNo);
    sceneLink.innerHTML = `Scene ${sceneNo}`
    sceneLink.classList.add("sceneLink")

    if (sceneNo === activeScene){
        sceneLink.classList.add("active")
    }
    sceneLink.id = "loadScene" + sceneNo
    //sceneLink.innerHTML = `<button onclick="loadScene(${sceneNo})">Scene ${sceneNo}</button>`
    sceneCont.appendChild(sceneLink)
}

function deleteScene(){
    document.getElementById("loadScene" + activeScene).remove()
    scenes.splice(activeScene, 1);
    console.log("Delete Scene " + activeScene)
    console.log(scenes)
    let string = JSON.stringify(scenes)
    localStorage.setItem("scenes", string)

    document.querySelectorAll('.sceneLink').forEach(e => e.remove());
    scenes.forEach((scene, i) => {
        createSceneButton(i)
    })
}

function loadScene(number) {

    console.log("Load Scene " + number)
    //console.log("length;") scenes.length
    activeScene = number
    if (!scenes[number]) { return }
    sliderValues = scenes[number]
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


function createInterface() {

    let i = 0

    // Create sliders for all controls in the list
    let sliderContaier = document.getElementById("sliderContainer")

    for (let slider in sliderNames) {

        let sliderName = slider;
        divs[sliderName] = createDiv(`<p>${i} ${sliderName}</p>`)
        divs[sliderName].parent(sliderContaier)

        checkboxes[sliderName] = createCheckbox()
        checkboxes[sliderName].style('display', "inline");
        checkboxes[sliderName].parent(divs[sliderName])

        sliders[sliderName] = createSlider(0, 1, sliderNames[sliderName].default, 0)
        sliders[sliderName].id(sliderName)
        sliders[sliderName].parent(divs[sliderName]);
        sliders[sliderName].elt.addEventListener('input', updateSliderValue);

        i++
    }

}

function updateSceneSliders(){
    let sceneSliderValueMap =  []
    let totalValue = 0.01

    let sceneSliders = document.querySelectorAll(".sceneSlider")

    sceneSliders.forEach((elem, i) =>{
        sceneSliderValueMap[i] = elem.value
        totalValue += Number(elem.value)
    })

    //Take the scenes and add the values of the sliders together

    for (let slider in sliderNames) {

        let valueFromScenes = 0

        sceneSliderValueMap.forEach((value, i) => {
            valueFromScenes += Number (scenes[i][slider] * value)
        })

        if (slider == "zoomSpeed"){
            console.log("total value " + totalValue + " velues from added " + valueFromScenes)
        }

        let newValue = valueFromScenes / totalValue
        sliders[slider].elt.value = newValue
        sliderValues[slider] = newValue
    }

    //
}

function sceneMixer(){
    let div = document.getElementById("sceneSliderContainer")
    div.classList.remove("hide")

    document.querySelectorAll(".sceneLink.active").forEach(element => {
        element.classList.remove("active");
    });

    document.getElementById("selectSceneMixer").classList.add("active")
}

function updateSliderValue(evt) {
    // console.log("update " + evt.target.id + " " + evt.target.value)
    sliderValues[evt.target.id] = Number(evt.target.value)
}

bc.onmessage = (event) => {
    console.log(event)
    let message = event.data.split(':');
    let sliderNo = message[0]
    let value = message[1]
    console.log(sliderNo)


    //console.log(message)
    //sliderValues[evt.target.id]
    sliders[sliderNo].evt.value = value

};


function onScreen(v) {
    return v.x >= -width / 2 && v.x <= width / 2 && v.y >= -height / 2 && v.y <= height / 2;
}

function testPerformance() {
    background(0)
    color(1)
    stroke(1)
    text(frameRate(), 10, 10)
    for (i = 0; i < 100000000; i++) {
        eums = sliderNames.spawnOffsetMultiplierCircle.default
    }
    return
}

function checkBeat() {
    beat = false
    if (millis() > (lastBeat + beatLength)) {
        lastBeat = millis()
        beat = true
    }
}

function startAudio() {
    // Resume or create the AudioContext
    context = getAudioContext();
    context.resume().then(() => {
        console.log('AudioContext resumed');
    });
}

//Midi-------------------------------------

function controlChange(control) {
    // use control.type, .channel, .currentSliderNo, .controllerName, .value
    //console.log(control.controller.number)

    currentSliderNo = control.controller.number

    // if (control.controller.number == 30){
    //     alert("foundthe30")
    // }

    slider = sliders[sliderKeys[sliderNo]]
    if (slider) {
        slider.elt.value = control.value
        sliderValues[sliderKeys[sliderNo]] = control.value
    }
}