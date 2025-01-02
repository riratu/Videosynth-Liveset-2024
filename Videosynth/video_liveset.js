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

//Technicalities

var spawnCirleSpeed = 0.1
var spawnRadius
let lastParticleSpawned = 0

let currentSliderNo = 0

let higlightColor = "lightgreen"
let bgColor = "lightgray"
let mic
let divs = []
let checkboxes = []

let sliders = {}
let sliderNames = {
    "zoomSpeed": 0.2,
    "translateX": 0.5,
    "translateY": 0.5,
    "strokeHueStart": 0.5,
    "strokeSatStart": 0,
    "strokeHueTravel": 0.5,
    "strokeSatTravel": 0.5,
    "particleReducer": 1,
    "pointAlpha": 1,
    "ellipseSize": 0.1,
    "ellipseAlpha": 1,
    "linesTransparency": 0,
    "curlFactor": 0.5,
    "curlNoiseScale": 0.1,
    "noiseTimeScale": 0.1,
    "particleMoveSpeed": 0.5,
    "spawnRandomnessSize": 1,
    "spawnRate": 0.1,
    "spawnRadius": 0.5,
    "spawnCirleSpeed": 0.1,
    "bgTransparency": 0.5,
};

let sliderKeys = Object.keys(sliderNames);

function setup() {

    let startButton = createButton('Start Audio');
    startButton.mousePressed(startAudio);
    startButton.position(10, 10)//

    mic = new p5.AudioIn()
    mic.start()
    mic.amp(10)

    noFill()
    createCanvas(windowWidth, windowHeight);

    colorMode(HSB, 1)

    maxSpawnRandSize = width / 2
    createSliders()
    for (let i = 0; i < particleArrayLength; i++) {
        particles.push(createVector(random(-maxSpawnRandSize, maxSpawnRandSize), random(-maxSpawnRandSize, maxSpawnRandSize)));
    }


    strokeWeight(1.5)
    clear();
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


        let p = particles[i];
        if (pointAlpha > 0.05){
            stroke(hue , sat, pointAlpha)
            point(p.x, p.y);
        }


        if (sliders["ellipseSize"].value() > 0.1) {
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
    angle = millis() * spawnCirleSpeed * maxSpawnCirleSpeed
    p.x += cos(angle) * spawnRadius * maxSpawnRadius
    p.y += sin(angle) * spawnRadius * maxSpawnRadius
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
        document.getElementById('sliderContainer').style.display =
            document.getElementById('sliderContainer').style.display === 'none' ? '' : 'none';
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

function createSliders() {

    let yPos = 20;

    let i = 0
    // Create sliders for all controls in the list
    let containerDif = createDiv("The Sliders")
    containerDif.position(20, 20).style('background-color', "lightgrey");
    containerDif.id("sliderContainer")

    for (let slider in sliderNames) {

        let sliderName = slider;
        divs[sliderName] = createDiv(`<p>${sliderName}</p>`)
        divs[sliderName].parent(containerDif)

        checkboxes[sliderName] = createCheckbox()
        checkboxes[sliderName].style('display', "inline");
        checkboxes[sliderName].parent(divs[sliderName])

        //div[sliderName].position(20, yPos);
        //yPos += 20;

        sliders[sliderName] = createSlider(0, 1, sliderNames[sliderName], 0)
        sliders[sliderName].parent(divs[sliderName]);

        i++
        //yPos += 20;  // Move down for the next slider
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