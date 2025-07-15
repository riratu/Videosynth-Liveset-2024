import {sliderNames} from './videoSliderNames.js';
import * as p5 from '../lib/p5.min.js';
import '../lib/p5.min.js';
import {animationCurves} from './visualScenes.js';
import {toggleExpert} from "./main.js";

export var sliders = []
export var animationVals = []
export let resultSliders = []
export var paramVals = {}

let beat

export var checkboxValues = {}

export var sliderKeys = Object.keys(sliderNames);

function moveParticle(p5, p, maxNoiseScale, maxNoiseTimeScale) {
    let n = p5.noise(p.x * maxNoiseScale * paramVals["curlNoiseScale"], p.y * maxNoiseScale * paramVals["curlNoiseScale"], p5.frameCount * (paramVals["noiseTimeScale"] * maxNoiseTimeScale));
    let b = p5.TAU * n * (p.x / (p5.width / 2) * paramVals["curlFactor"]);
    let a = p5.TAU * n * ((p.y / (p5.height / 2) + 1) * paramVals["curlFactor"]);

    p.x += p5.cos(a) * sliderNames.particleMoveSpeed.max * paramVals["particleMoveSpeed"]
    p.y += p5.sin(b) * sliderNames.particleMoveSpeed.max * paramVals["particleMoveSpeed"]

    p.x += (p.x) * (( paramVals["zoomSpeed"]))
    p.y += (p.y) * ((paramVals["zoomSpeed"]))

    //Translation
    p.x += ((paramVals["moveX"] - 0.5) * sliderNames.moveX.max)
    p.y += ((paramVals["moveY"] - 0.5) * sliderNames.moveX.max)
}

function drawImages(particleNo, i, p5, imgs, p) {
    let fishcount = particleNo / (particleNo / 1000)
    if (i % fishcount == 0 && paramVals["img1Alpha"] > 0.1) {
        p5.tint(255, paramVals["img1Alpha"])
        p5.image(imgs[4], p.x, p.y, 200, 200);
    }
    if (i % (fishcount + 80) == 0 && paramVals["img2Alpha"] > 0.1) {
        p5.tint(255, paramVals["img2Alpha"])
        p5.image(imgs[5], p.x, p.y, 200, 200);
    }
    if (i % (fishcount + 70) == 0 && paramVals["img3Alpha"] > 0.1) {
        p5.tint(255, paramVals["img3Alpha"])
        p5.image(imgs[2], p.x, p.y, 200, 200);
    }
    // if (i % (fishcount + 20) == 0 && paramVals["img4Alpha"] > 0.1) {
    //     tint(255, paramVals["img4Alpha"])
    //     image(imgs[3], p.x, p.y, 200, 200);
    // }
    if (i % (fishcount / 2 + 100) == 0 && paramVals["img4Alpha"] > 0.1) {
        p5.tint(255, paramVals["img4Alpha"])
        p5.image(imgs[7], p.x, p.y, 200, 200);
    }
    if (i % (fishcount + 5) == 0 && paramVals["img4Alpha"] > 0.1) {
        p5.tint(255, paramVals["img4Alpha"])
        p5.image(imgs[6], p.x, p.y, 200, 200);
    }
}

function drawLines2(i, lineModulo, p5, hue, sat, particleNo, particles, p) {
    if (paramVals.linesTransparency > 0.05) {
        if (i % lineModulo === 0) {
            p5.stroke(hue, sat, 1, paramVals.linesTransparency)

            let lineDist = 50
            let foundLines = 0

            for (let ii = 1; 1 < 20; ii++) {

                let otherIndex = (i + ii) % particleNo

                if (p5.abs(particles[otherIndex].x - p.x) < lineDist
                    && p5.abs(particles[otherIndex].y - p.y) < lineDist) {
                    p5.line(p.x, p.y, particles[otherIndex].x, particles[otherIndex].y)

                    foundLines += 1
                    if (foundLines > 5) {
                        break
                    }
                }
            }
        }
    }
}

const mainSketch = (p5) => {

    let particles = [];
    const particleArrayLength = 1000

    let imgs = []

    let maxNoiseScale = 0.2
    let maxNoiseTimeScale = 0.051
    var maxSpawnRadius = 500
    var maxSpawnCirleSpeed = 0.05

//Technicalities
    var spawnCirleSpeed = 0.1
    let lastParticleSpawned = 0
    var spawnCircleAngle = 0
    let maxSpawnRandSize

    let currentSliderNo = 0

    let higlightColor = "lightgreen"
    let bgColor = "lightgray"
    let divs = []
    let checkboxes = []

    let particleReducer = 1
    let particleNo

    let gl

    // Connection to a broadcast channel
    const bc = new BroadcastChannel("sceneValues");

    p5.windowResized = function () {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    }

    p5.setup = function () {
        p5.noFill()

        p5.createCanvas(p5.windowWidth, p5.windowHeight);

        gl = p5.createGraphics(p5.windowWidth, p5.windowHeight, p5.WEBGL);
        gl.setAttributes({ alpha: true });

        p5.colorMode(p5.HSB, 1)

        Object.keys(sliderNames).forEach(k => {
            paramVals[k] = sliderNames[k].default
        })

        maxSpawnRandSize = p5.width / 2
        createPropertiesSliders()

        for (let i = 0; i < particleArrayLength; i++) {
            particles.push(p5.createVector(p5.random(-maxSpawnRandSize, maxSpawnRandSize), p5.random(-maxSpawnRandSize, maxSpawnRandSize)));
        }

        p5.strokeWeight(1.5)
        p5.clear();

        //let usbMidiKnobInterface = "USB MIDI ADC 64"// [ID] or "device name"
        //let midiInput, midiOutput, midiMsg = {}
        //setupMidi(usbMidiKnobInterface, null) // deviceIn, deviceOut
    }

    p5.draw = function () {

        //make it ok for slower devices
        if (p5.frameRate() < 15) {
            if (particleReducer > 0.05) {
                particleReducer *= 0.95
            }
        } else if (p5.frameRate() < 25
            && particleReducer > 0.05) {
            particleReducer -= 0.0001
        } else if (particleReducer !== 1
            && p5.frameRate() > 40) {
            particleReducer += 0.0001
            if (particleReducer > 1) {
                particleReducer = 1
            }
        }

        p5.translate(p5.width / 2, p5.height / 2)

        //Todo: Make rotation better for the 3d stuff
        //p5.rotate(paramVals.rotation * p5.PI * 2)

        // checkBeat()
        // if (beat) {
        //     newSeed += random(0.5)
        // }
        // currentSeed += (newSeed - currentSeed) * 0.02
        // noiseSeed(currentSeed);
        // if (frameCount % 100 === 0){
        //     console.log(typeof paramVals.bgTransparency)
        //     console.log(paramVals.bgTransparency == 0)
        //     console.log(paramVals.bgTransparency)
        // }

        p5.background(0, paramVals.bgTransparency);

        let colorChange = (paramVals.colorChange - 0.5) / 5000
        spawnCirleSpeed = (2 ** (paramVals["spawnCirleSpeed"] * 4)) / 8
        let stokeWeight = paramVals["stokeWeight"]
        particleNo = Math.floor((particleArrayLength - 1) * particleReducer) + 1

        let sphereNumberModulo =  Math.floor(particleNo / paramVals["sphereCount"])
        let boxNumberModulo =  Math.floor(particleNo / paramVals["boxCount"])

        let lineModulo = Math.floor(particleNo / 200)

        let spawnRate = 1 + (paramVals["spawnRate"] * particleArrayLength / 20)

        spawnCircleAngle += spawnCirleSpeed * maxSpawnCirleSpeed

        gl.background(0, 10);
        gl.noFill();

        for (let i = 0; i < particleNo; i++) {
            //part no 1000
            //last spawned = 500
            //i = 100
            //result 700 / 1000 = 0.7
            // last spawned - i = 400
            //
            let p = particles[i];
            moveParticle(p5, p, maxNoiseScale, maxNoiseTimeScale);

            const currentP = i > lastParticleSpawned
                ? i - lastParticleSpawned
                : particleNo - lastParticleSpawned + i;
            const age = currentP / particleNo

            let hue = (paramVals.color + (colorChange * age)) % 1
            let sat = (paramVals.saturation)

            p5.strokeWeight(0.3 + stokeWeight)


            if (paramVals.pointAlpha > 0.05) {
                let alpha = paramVals.pointAlpha
                p5.stroke(hue, sat, 1, alpha)
                p5.point(p.x, p.y);
            }

            if (paramVals.ellipseSize > 0.02) {
                if (i % 5 == 0) {
                    p5.stroke(hue, sat, 1, paramVals.ellipseAlpha)
                    p5.ellipse(p.x, p.y, paramVals.ellipseSize)
                }
            }

            //
            //

            drawImages(particleNo, i, p5, imgs, p);

            // if (i % (fishcount + 90) == 0 && paramVals["img4Alpha"] > 0.1) {
            //     tint(255, paramVals["img4Alpha"])
            //     image(imgs[4], p.x, p.y, 200, 200);
            // }
            // if (i % (fishcount + 420) == 0 && paramVals["img4Alpha"] > 0.1) {
            //     tint(255, paramVals["img4Alpha"])
            //     image(imgs[5], p.x, p.y, 200, 200);
            // }

            drawLines2(i, lineModulo, p5, hue, sat, particleNo, particles, p);

            if (paramVals.line2Alpha
                && i % 10 == 0
                && i !== lastParticleSpawned
            ) {
                p5.stroke(hue, sat, 1, paramVals.line2Alpha)
                let otherP = (i + 1) % particleNo
                p5.line(p.x, p.y, particles[otherP].x, particles[otherP].y)
            }

            if (paramVals.line3Alpha
                && i % 10 == 0
                && i !== lastParticleSpawned
            ) {
                p5.stroke(hue, sat, 1, paramVals.line3Alpha)
                let otherP2 = Math.floor((i + (spawnRate / 2)) % particleNo)
                p5.line(p.x, p.y, particles[otherP2].x, particles[otherP2].y)
            }

            p5.translate(0, 0)
            //gl.orbitControl();
            if (i % sphereNumberModulo === 0) {
                // gl.translate(-300, -300)
                gl.stroke(255);
                gl.push();
                gl.translate(p.x, p.y);
                gl.rotateY(p5.frameCount / paramVals["rotation"])
                gl.sphere(paramVals["sphereSize"] - (age * (paramVals["sphereSize"])), 10, 5);
                gl.pop();
            }
            if (i % boxNumberModulo === 0) {
                // gl.translate(-300, -300)
                gl.stroke(255);
                gl.push();
                gl.translate(p.x, p.y);
                gl.rotateY(p5.frameCount / paramVals["rotation"])
                gl.box(paramVals["boxSize"] - (age * (paramVals["boxSize"])));
                gl.pop();
            }

            // if (i % 157 === 0) {
            //     // gl.translate(-300, -300)
            //     gl.stroke(255);
            //     gl.push();
            //     const newX = (p.x + p5.width / 2) % p5.width
            //     const newY = (p.x + p5.height / 2) % p5.height
            //     gl.translate(newX, newY);
            //     gl.rotateY(p5.frameCount / 60)
            //     gl.box(200 - (age * 200));
            //     gl.pop();
            // }

        }


        for (let i = 0; i < spawnRate; i++) {
            lastParticleSpawned = (lastParticleSpawned + 1) % particleNo
            spawnParticle(i, spawnRate)
        }

        //Span new Particles
        if (beat) {
            let spawnNo = paramVals["spawnRateOnBeat"]
            console.log("spawn " + spawnNo + " on beat ")
            for (let i = 0; i <spawnNo; i++) {
                lastParticleSpawned = (lastParticleSpawned + 1) % particleNo
                spawnParticle(i, spawnNo)
            }
        }

        p5.image(gl, -p5.width / 2, -p5.height / 2)
        beat = false
    }

    function spawnParticle(i, spawnRate) {
        let p = particles[lastParticleSpawned]
        let spawnRandSizeX = maxSpawnRandSize * paramVals.spawnRandomnessSizeX
        let spawnRandSizeY = maxSpawnRandSize * paramVals.spawnRandomnessSizeY

        let spawnOffsetX = (paramVals["spawnOffsetX"] - 0.5) * p5.width
        let spawnOffsetY = (paramVals["spawnOffsetY"] - 0.5) * p5.height

        let maxSpawnOffsetMultiplier = p5.width / spawnRate
        let correctionX = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * paramVals["spawnOffsetMultiplierX"]
        let correctionY = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * paramVals["spawnOffsetMultiplierY"]

        spawnOffsetX += (i * paramVals["spawnOffsetMultiplierX"] * maxSpawnOffsetMultiplier) - correctionX
        spawnOffsetY += (i * paramVals["spawnOffsetMultiplierY"] * maxSpawnOffsetMultiplier) - correctionY

        //Just the randomness size
        p.x = p5.random(-spawnRandSizeX, spawnRandSizeX) + spawnOffsetX;
        p.y = p5.random(-spawnRandSizeY, spawnRandSizeY) + spawnOffsetY;

        //Add some circular movement
        let iOffset = paramVals.spawnOffsetMultiplierCircle * i * maxSpawnOffsetMultiplier
        p.x += p5.cos(spawnCircleAngle) * paramVals["spawnRadius"] * (maxSpawnRadius + iOffset)
        p.y += p5.sin(spawnCircleAngle) * paramVals["spawnRadius"] * (maxSpawnRadius + iOffset)
    }

     p5.preload = function () {
        imgs.push(p5.loadImage('img/fish1.png'))
        imgs.push(p5.loadImage('img/fish2.png'))
        imgs.push(p5.loadImage('img/fish3.png'))
        imgs.push(p5.loadImage('img/fish4.png'))
        imgs.push(p5.loadImage('img/bubble1.png'))
        imgs.push(p5.loadImage('img/bubble2.png'))
        imgs.push(p5.loadImage('img/computer.png'))
        imgs.push(p5.loadImage('img/cloud-999.png'))
    }

    p5.keyPressed =  function (keyboardEvent) {

        let key = keyboardEvent.key

        // const sceneKeys = ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "è", "y", "a", "s", "d", "f", "g", "h", "j", "k", "l", "ö"];
        //
        // let sceneNo = sceneKeys.indexOf(key)
        // if (-1 !== sceneNo) {
        //     console.log("load Scene " + sceneNo)
        //     //loadScene(sceneNo)
        //     return
        // }

        if (key == " ") {
            console.log("Shuffle!")
            shuffleSliders()
            return
        }

        if (key === "m") {
            console.log("Toggle Menu")
            document.getElementById('visualsMenuContainer').classList.toggle("hide")
            toggleExpert()
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

    function createPropertiesSliders() {

        let i = 0

        // Create sliders for all controls in the list
        let sliderContaier = document.getElementById("sliderContainer")

        let sectionDiv
        for (let slider in sliderNames) {

            if (sliderNames[slider].type && sliderNames[slider].type === "section"){
                let titleDiv = p5.createDiv(`<h1>${slider}</h1>`)
                titleDiv.parent(sliderContaier)
                sectionDiv = p5.createDiv()
                sectionDiv.addClass("visual-slider-sections")
                sectionDiv.parent(sliderContaier)
                continue
            }

            let sliderName = slider;
            divs[sliderName] = p5.createDiv(`<span class="visual-labels">${i} ${sliderName}</span>`)
            divs[sliderName].addClass("visual-slider-entity")
            divs[sliderName].parent(sectionDiv)

            checkboxes[sliderName] = p5.createCheckbox()
            checkboxes[sliderName].addClass("visualCheckboxes")
            checkboxes[sliderName].parent(divs[sliderName])


            let animationElems = createAnimationUi(divs[sliderName].elt)
            animationVals[sliderName] = animationElems

            //checkboxes[sliderName].elt.addEventListener('input', updateCheckboxValue);

            let max = sliderNames[sliderName].max !== undefined ? sliderNames[sliderName].max : 1;
            let min = sliderNames[sliderName].min !== undefined ? sliderNames[sliderName].min : 0;
            let sliderObj = p5.createSlider(min, max, sliderNames[sliderName].default, 0)
            sliderObj.id(sliderName)
            sliderObj.addClass("visualSliders")
            sliderObj.parent(divs[sliderName]);
            sliderObj.elt.addEventListener('input', updateSliderValue);
            sliders[sliderName] = sliderObj

            let resSliderObj = p5.createSlider(0, 1, sliderNames[sliderName].default, 0)
            resSliderObj.id(sliderName)
            resSliderObj.addClass("visualSliders, resultSlider")
            resSliderObj.attribute("disabled", "disabled")
            resSliderObj.parent(divs[sliderName]);
            resultSliders[sliderName] = resSliderObj

            i++
        }

    }

    function createAnimationUi(parentDiv){

        let div = document.createElement("div");
        div.classList.add("animation-prop-div")

        parentDiv.appendChild(div);

        let animationElements = {}

        // Create select fot type
        const array = ["---", ...Object.keys(animationCurves)];
        let typeSelect = document.createElement("select");
        for (var i = 0; i < array.length; i++) {
            var option = document.createElement("option");
            option.value = array[i];
            option.text = array[i];
            typeSelect.appendChild(option);
        }
        div.appendChild(typeSelect);
        animationElements.type = typeSelect

        // Create select for speed
        let speedSelect = document.createElement("select");
        for (var i = 0; i < 5; i++) {
            var mod = 0.25 * (2 ** i); // actual modulo value
            var speed = (1 / mod).toFixed(2); // user-facing speed multiplier
            var option = document.createElement("option");
            option.value = mod;
            option.text = `${speed}×`;
            if (mod === 1) option.selected = true;
            speedSelect.appendChild(option);
        }
        animationElements.speed = speedSelect
        div.appendChild(speedSelect);

        //Create Slider for the amount of the animation
        let animationAmountSlider = p5.createSlider(0, 1, 0, 0)
        //resSliderObj.id()
        animationAmountSlider.addClass("visualSliders")
        animationAmountSlider.parent(div)
    //    div.appendChild(animationAmountSlider);
        animationElements.amount = animationAmountSlider

        return animationElements
    }


    function updateSliderValue(evt) {
        paramVals[evt.target.id] = Number(evt.target.value)
    }

    // bc.onmessage = (event) => {
    //     let message = event.data.split(':');
    //     let value = message[1]
    //     setSceneSlider(message[0], value)
    // };

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
            paramVals[sliderKeys[currentSliderNo]] = control.value
        }
    }
}

new window.p5(mainSketch);

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

export function setVisualParameter(parameterName, value) {
    sliders[parameterName].elt.value = value
    paramVals[parameterName] = value
}

export function setBeat(){
    beat = true
}


