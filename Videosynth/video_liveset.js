let particles = [];
const particleArrayLength = 10000
beatLength = 5000
lastBeat = 0
currentSeed = 0

// Max Values for Sliders
newSeed = 0
maxSpeed = 5
maxCurlFactor = 50
maxZoomSpeed = 0.1
maxSpawnRandSize = 0
maxTranslationSpeed = 20
maxEllipseSize = 150
let maxNoiseScale = 0.2
let curlNoiseScale
let maxNoiseTimeScale = 0.051
var maxSpawnRadius = 500
var maxSpawnCirleSpeed = 0.01
let maxStokeWeight = 40

//Technicalities

var spawnCirleSpeed = 0.1
var spawnRadius
let lastParticleSpawned = 0
var spawnCircleAngle = 0

//Webmidi
/* PREFS */
let midiDeviceIn = 1 // [ID] or "device name"
let midiDeviceOut = 1 // [ID] or "device name"
let midiThru = false // optionally pass all in -> out

let midiInput, midiOutput, midiMsg = {}

let currentSliderNo = 0

let higlightColor = "lightgreen"
let bgColor = "lightgray"
let mic
let divs = []
let checkboxes = []

var sliders = {}
var sliderNames = {
    "zoomSpeed": 0.2,
    "translateX": 0.5,
    "translateY": 0.5,
    "strokeHueStart": 0.5,
    "strokeHueTravel": 0.5,
    "strokeSatStart": 0,
    "strokeSatTravel": 0.5,
    "bgTransparency": 0.5,
    "particleReducer": 1,
    "stokeWeight": 2,
    "pointAlpha": 1,
    "particleMoveSpeed": 0.5,
    "ellipseAlpha": 1,
    "spawnRate": 0.1,
    "linesTransparency": 0,
    "curlNoiseScale": 0.1,
    "ellipseSize": 0.1,
    "noiseTimeScale": 0.1,
    "spawnRandomnessSize": 1,
    "spawnRadius": 0.5,
    "spawnCirleSpeed": 0.1,
    "curlFactor": 0.5,

};

var sliderKeys = Object.keys(sliderNames);

function setup() {
    mic = new p5.AudioIn()
    mic.start()
    mic.amp(10)

    noFill()
    createCanvas(windowWidth, windowHeight);

    colorMode(HSB, 1)

    maxSpawnRandSize = width / 2
    createInterface()

    for (let i = 0; i < particleArrayLength; i++) {
        particles.push(createVector(random(-maxSpawnRandSize, maxSpawnRandSize), random(-maxSpawnRandSize, maxSpawnRandSize)));
    }

    strokeWeight(1.5)
    clear();

    setupMidi(midiDeviceIn, midiDeviceOut) // deviceIn, deviceOut
}

function draw() {
    //frameRate(1)

    let micLevel = mic.getLevel()

    const slider = sliders[sliderKeys[currentSliderNo]]
    let newValue = micLevel
    newValue = constrain(newValue, 0, 1);

    translate(width / 2, height / 2)

    curlFactor = sliders["curlFactor"].value()
    curlNoiseScale = sliders["curlNoiseScale"].value()

    checkBeat()
    if (beat) {
        newSeed += random(0.5)
    }
    currentSeed += (newSeed - currentSeed) * 0.02
    noiseSeed(currentSeed);

    background(0, sliders["bgTransparency"].value());

    let ellipseSize = sliders["ellipseSize"].value() * maxEllipseSize
    let strokeHueStart = sliders["strokeHueStart"].value()
    let strokeSatStart = sliders["strokeSatStart"].value()
    let strokeHueTravel = (sliders["strokeHueTravel"].value() - 0.5) / 5000
    let strokeSatTravel = (sliders["strokeSatTravel"].value() - 0.5) / 5000
    let linesTransparency = sliders["linesTransparency"].value()
    spawnRadius = sliders["spawnRadius"].value()
    spawnCirleSpeed = sliders["spawnCirleSpeed"].value()
    let pointAlpha = sliders["pointAlpha"].value()
    let stokeWeight =  sliders["stokeWeight"].value()
    let particleNo = Math.floor((particleArrayLength -1) * sliders["particleReducer"].value()) + 1

    let lineModulo = Math.floor(particleNo / 200)

    let spawnRate = sliders["spawnRate"].value() * particleArrayLength / 10

    for (let i = 0; i < spawnRate; i++) {
        lastParticleSpawned = (lastParticleSpawned + 1) % particleNo
        spawnParticle(particles[lastParticleSpawned])
    }

    for (let i = 0; i < particleNo; i++) {
        let hue = (strokeHueStart + (strokeHueTravel * i)) % 1
        let sat = (strokeSatStart + (strokeSatTravel * i))

        strokeWeight(0.3 + stokeWeight * maxStokeWeight)


        let p = particles[i];
        if (pointAlpha > 0.05){
            stroke(hue , sat, pointAlpha)
            point(p.x, p.y);
        }


        if (sliders["ellipseSize"].value() > 0.01) {
            if (i % 5 == 0){
                stroke(hue, sat, sliders["ellipseAlpha"].value())
                ellipse(p.x, p.y, ellipseSize)
            }
        }

        if (linesTransparency) {
            
           //ich habe 10000 items im array.
           //ich will aber nur 500 davon, auch wenn das array 10000 lang ist.

            //sie sollen gleich verteilt sein. also wenn es 1000 sind wäre es 1000 % 2. bei 2000 % 4 mache es allgemein

           
            if (i % lineModulo === 0){
                let lastIndex = (i + 2) % particleNo;
                //strokeWeight(5)
                stroke(hue, sat, 1, linesTransparency)
                
                let lineDist = 50
                let foundLines = 0

                for (let ii = 1; 1 < 20; ii++){

                    let otherIndex = ii % particleArrayLength

                    if (abs(particles[otherIndex].x - p.x) < lineDist
                        && abs(particles[otherIndex].y - p.y) < lineDist){
                         line(p.x, p.y, particles[otherIndex].x, particles[otherIndex].y)

                        foundLines+= 1
                        if (foundLines > 5){
                            break
                        }
                    }
                }
            }
        }

        let n = noise(p.x * maxNoiseScale * curlNoiseScale, p.y * maxNoiseScale * curlNoiseScale, frameCount * (sliders["noiseTimeScale"].value() * maxNoiseTimeScale));
        let b = TAU * n * ((p.x / (width / 2)) - 0.5) * curlFactor;
        let a = TAU * n * ((p.y / (height / 2)));
        p.x += cos(a) * maxSpeed * sliders["particleMoveSpeed"].value();
        p.y += sin(b) * maxSpeed * sliders["particleMoveSpeed"].value();

        p.x += (p.x) * maxZoomSpeed * sliders["zoomSpeed"].value()
        p.y += (p.y) * maxZoomSpeed * sliders["zoomSpeed"].value()

        //Translation
        p.x += ((sliders["translateX"].value() - 0.5) * maxTranslationSpeed)
        p.y += ((sliders["translateY"].value() - 0.5) * maxTranslationSpeed)

        // if (!onScreen(p)) {
        //     spawnParticle(p)
        // }
    }
}

function spawnParticle(p){
    spawnRandSize = maxSpawnRandSize * sliders["spawnRandomnessSize"].value()

    //Just the randomness size
    p.x = random(-spawnRandSize, spawnRandSize);
    p.y = random(-spawnRandSize, spawnRandSize);

    //Add some circular movement
    spawnCircleAngle +=  spawnCirleSpeed * maxSpawnCirleSpeed
    p.x += cos(spawnCircleAngle) * spawnRadius * maxSpawnRadius
    p.y += sin(spawnCircleAngle) * spawnRadius * maxSpawnRadius
}

function keyPressed(){                      


        console.log(key)
    if (key == " "){
        console.log("Shuffle!")
        shuffleSliders()
        return
    }

    if (key === "m"){
        console.log("Toggle Menu")
        document.getElementById('menuContainer').style.display =
            document.getElementById('menuContainer').style.display === 'none' ? '' : 'none';
    }

    if (sliderKeys[key] === undefined) return
    currentSliderNo = key
    for (let i = 0; i < sliderKeys.length; i++){
        divs[sliderKeys[i]].style('background-color', bgColor);
    }
    divs[sliderKeys[key]].style('background-color', higlightColor);
}

function shuffleSliders() {
    sliders

    for (let key in sliders) {
        sliders[key].value(random(0, 1))
    }
}
function mouseWheel(event) {
    // Adjust the slider value based on the scroll direction
    const slider = sliders[sliderKeys[currentSliderNo]]
    let newValue = slider.value() - event.delta / 1000;
    newValue = constrain(newValue, slider.elt.min, slider.elt.max);
    slider.value(newValue);
}

function createInterface() {

    let i = 0
    // Create sliders for all controls in the list

    let menuContainer = createDiv("<h3>The Sliders</h3>")
    menuContainer.id("menuContainer")
    menuContainer.position(20, 20).style('background-color', "lightgrey");

    let startButton = createButton('Start Audio');
    startButton.mousePressed(startAudio);
    startButton.parent(menuContainer)
    
    let sliderContaier = createDiv("")
    sliderContaier.id("sliderContainer")
    sliderContaier.parent(menuContainer)

    for (let slider in sliderNames) {

        let sliderName = slider;
        divs[sliderName] = createDiv(`<p>${i} ${sliderName}</p>`)
        divs[sliderName].parent(sliderContaier)

        checkboxes[sliderName] = createCheckbox()
        checkboxes[sliderName].style('display', "inline");
        checkboxes[sliderName].parent(divs[sliderName])

        sliders[sliderName] = createSlider(0, 1, sliderNames[sliderName], 0)
        sliders[sliderName].parent(divs[sliderName]);

        i++
    }
}

function mouseReleased() {

}

function onScreen(v) {
    return v.x >= -width / 2 && v.x <= width / 2 && v.y >= -height / 2 && v.y <= height / 2;
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



function noteOn(note) {
    console.log(note)
    // use note.type, .channel, .name, .number, .octave, .velocity
    let x = map(note.number, 0, 128, 0, width)
    let h = map(note.velocity, 0, 128, 0, height)
    //console.log(note)
    switch(note.number){
        case 36: beat = 1;
            break;
        //console.log(note)
        case 37: beat2 = 1;
            break;
        case 38: beat3 = 1;
            break;
        case 39: beat4 = 0.01;
            console.log("4")
            break;
    }
}

function noteOff(note) {
    console.log(note)
    switch(note){
        case 36: //beat = 1;
            break;
        //console.log(note)
        case 37: //beat2 = 1;
            break;
        case 38: //beat3 = 1;
            break;
        case 39: beat4 = 0.0;
            break;
    }
    // use note.type, .channel, .name, .number, .octave, .velocity
}

function pitchBend(pitch) {
    // use pitch.type, .channel, .value
    console.log("pitch")
}

function controlChange(control) {
    // use control.type, .channel, .controllerNumber, .controllerName, .value
    //console.log(control.controller.number)

    sliderNo = control.controller.number

    slider = sliders[sliderKeys[sliderNo]]
    console.log(sliderNo)
    //console.log(sliderKeys[sliderNo])
    if (slider){
        slider.elt.value = control.value
    }
}



function mousePressed() {
    // example of sending midi note
    sendNote(1, "C", 3, 1000, 127); // channel, note, octave, duration, velocity
}

function sendNote(channel, note, octave, duration, velocity) {
}

function parseMidi(mm) {
    //print(mm)
    if(mm.note != undefined) {
        switch (mm.note.type) {
            case 'noteon':
                noteOn(mm.note)
                break;
            case 'noteoff':
                noteOff(mm.note)
                break;
        }
    } else if(mm.pitch != undefined) {
        pitchBend(mm.pitch)
    } else if(mm.control != undefined) {
        controlChange(mm.control)
    }
}

function setupMidi(idIn, idOut) {
    WebMidi.enable(function(err) {
        if(err) {
            console.log("WebMidi could not be enabled.", err);
        }

        // Print to console available MIDI in/out id/names
        WebMidi.inputs.forEach(function(element, c) {
            print("in  \[" + c + "\] " + element.name)
        });
        WebMidi.outputs.forEach(function(element, c) {
            print("out \[" + c + "\] " + element.name)
        });

        // assign in channel:
        if(typeof idIn === 'number') {
            midiInput = WebMidi.inputs[idIn]
        } else {
            midiInput = WebMidi.getInputByName(idIn)
        }

        if(typeof idOut === 'number') {
            midiOutput = WebMidi.outputs[idOut]
        } else {
            midiOutput - WebMidi.getOutputByName(idOut)
        }

        midiInput.addListener('midimessage', 'all', function(e) {
            if(midiThru) {
                if(e.data.length == 3) {
                    midiOutput.send(e.data[0], [e.data[1], e.data[2]])
                } else {
                    midiOutput.send(e.data[0])
                }
            }
            midiMsg = {}
            midiMsg.data = e.data
            midiMsg.timestamp = e.timestamp
            // parseMidi(midiMsg) // optionally send raw only
        })

        // noteOn
        midiInput.addListener('noteon', "all", function(e) {
            let note = {
                type: 'noteon'
            }
            note.channel = e.channel
            note.number = e.note.number
            note.name = e.note.name
            note.octave = e.note.octave
            note.velocity = floor(127 * e.velocity)

            midiMsg.note = note
            parseMidi(midiMsg)
        })

        // noteOff
        // midiInput.addListener('noteoff', "all", function(e) {
        // 	let note = {
        // 		type: 'noteoff'
        // 	}
        // 	note.channel = e.channel
        // 	note.number = e.note.number
        // 	note.name = e.note.name
        // 	note.octave = e.note.octave
        // 	note.velocity = 0

        // 	midiMsg.note = note
        // 	parseMidi(midiMsg)
        // })

        // pitchBend
        midiInput.addListener('pitchbend', "all", function(e) { console.log(control)})

        // controlChange
        midiInput.addListener('controlchange', "all", function(e) {
            controlChange(e)
        })
    })
}