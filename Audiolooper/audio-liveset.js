let sounds = []
var slider = []
let folderColors = {
   "01": "lightblue",
    "02": "lightgreen",
    "03": "LightSkyBlue",
    "04": "lightyellow"
}

let mode = "slider"
let sceneNo = 0
let currentSliderNo = 0
let currentSliderInScene = 0
let sliderNosByScenes = []
let rampTime = 1
let lastSlider = null
let intervals = []

//Webmidi
/* PREFS */
let midiDeviceIn = 1 // [ID] or "device name"
let midiDeviceOut = 1 // [ID] or "device name"
let midiThru = false // optionally pass all in -> out
let midiInput, midiOutput, midiMsg = {}

function preload() {
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i] = loadSound("soundsMp3/" + soundsFiles[i].replace('.wav', '.mp3'));
        // sounds[i] = loadSound("sounds/" + soundsFiles[i]);
    }
}

function setup() {
    setupMidi(midiDeviceIn, midiDeviceOut) // deviceIn, deviceOut

    let startButton = createButton('Start Audio');
    startButton.mousePressed(startAudio); // Trigger start on button press
   // startButton.position(20, 10);
    noCanvas()

    reverb = new p5.Reverb();

    let lastFolder = ""
    let containerDiv
    let offset = 0
    let filesInFolder = 0
    let slidersinCurrentScene = []
    for (let i = 0; i < soundsFiles.length; i++) {
        if (i < 0){
            sounds[i].syncedStart(sounds[0]);
        } else {
            sounds[i].loop();
        }
        //sounds[i].rate(1);

        let folderName = soundsFiles[i].split('/')[0]
        if  (folderName !== lastFolder){
           console.log(slidersinCurrentScene)
            if (slidersinCurrentScene.length > 0){
                console.log("push " + slidersinCurrentScene)
                sliderNosByScenes.push(slidersinCurrentScene)
                slidersinCurrentScene = []
            }

            lastFolder = folderName
            containerDiv = createDiv("<h3>" + folderName + "</h3>")

            let bgColor = folderColors[folderName] ?? "#555"

            containerDiv.style('background-color', bgColor);
            containerDiv.addClass('scene');
            sliderContainer = document.getElementById("all-the-sliders")
            containerDiv.parent(sliderContainer)
           // containerDiv.position(20, offset + 10)

        }

        offset += 40

        let div = createDiv(`<p>c${i} | ${soundsFiles[i].split('/')[1]}</p>`)
        div.parent(containerDiv)
        div.addClass('slider-entity')

        //for (let ii = 0; ii<2;ii ++){
            slider[i] = createSlider(0, 1, 0, 0)
            //slider[i].position(20, offset + 25)
            sounds[i].amp(0)
            slider[i].input(updateSound);
            slider[i].parent(div)
            slidersinCurrentScene.push(i)
        //}

        reverb.process(sounds[i], 3, 2)
    }
    sliderNosByScenes.push(slidersinCurrentScene)
}

function startAudio() {
    // Resume or create the AudioContext
    context = getAudioContext();
    context.resume().then(() => {
        console.log('AudioContext resumed');
    });
}

function updateSound() {
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i].amp(slider[i].value());
    }
}


function controlChange(control) {
    // use control.type, .channel, .currentSliderNo, .controllerName, .value
    //console.log(control.controller.number)

    currentSliderNo = control.controller.number
    currentSlider = slider[currentSliderNo]
    if (currentSlider){
        currentSlider.elt.value = control.value
        updateSound()
    }
}

function highlightSelectedSlider(sceneNo, sliderNo) {
    //console.log(slidersinScene)
    newSliderNo = sliderNosByScenes[sceneNo][sliderNo]
    newSlider = slider[newSliderNo]
    if (newSlider) {
        lastSlider = slider[currentSliderNo]
        currentSliderNo = newSliderNo
        console.log("Slider No " + currentSliderNo)
        console.log("Remove Class from " + lastSlider)
        lastSlider.parent().classList.remove("red")
        newSlider.parent().classList.add("red")
        console.log("Select Slider " + currentSliderNo)
    }
}

function keyPressed(){

     console.log(key)

    //Select the current Ramp Time
    let rampTimeMap = { "A": 1,  "S": 4, "D": 8, "F": 16, "G": 32 }
    if (rampTimeMap[key]){
        rampTime = Number(rampTimeMap[key])
        console.log("Ramp Time: " + rampTime + " sek")
        return
    }

    let sceneMap =  { "Q": 0, "W": 1, "E": 2, "R": 3, "T": 4, "Z": 5, "U": 6, "I": 7, "O": 8, "P": 9 }
    if (sceneMap[key] !== undefined){
        sceneNo = sceneMap[key]
        console.log("Change Scene to " + sceneMap[key])
        highlightSelectedSlider(sceneNo, 0);
        return
    }

    //Select the current slider
    let sliderMap = { "q": 0, "w": 1, "e": 2, "r": 3, "t": 4, "z": 5, "u": 6, "i": 7, "o": 8, "p": 9 }
    if (sliderMap[key] !== undefined){
        currentSliderInScene = (sliderMap[key])
        highlightSelectedSlider(sceneNo, sliderMap[key]);
        return
    }

    //Set the value for the current slider
    let valueMap = { "a": 0, "s": 1, "d": 2, "f": 3, "g": 4, "h": 5, "j": 6, "k": 7, "l": 8, "ö": 9 }
    let selectNo = valueMap[key]
    if (undefined !== selectNo){
        //Set the Slider Value
        console.log("Set value " + selectNo + " for controller " + currentSliderNo)

        // Set the interval to update the value over the specified duration
        let startValue = slider[currentSliderNo].value()
        let endValue = selectNo / 9;
        let step = rampTime * 100 // Number of steps for smooth transition
        let currentStep = 0;

        let controller = {
            number: currentSliderNo
        };

        let control = {
            value: startValue,
            controller: controller
        };

        controller = 5

        if (undefined !== intervals[currentSliderNo]){
            console.log("Clear Interval " + currentSliderNo)
            clearInterval(intervals[currentSliderNo])
        }
        // Set the interval to update the value over the specified duration
        intervals[currentSliderNo] = setInterval(() => {
            currentStep++;
            control.value = startValue + (endValue - startValue) * (currentStep / step);
            controlChange(control);

            if (currentStep >= step) {
                clearInterval(intervals[currentSliderNo]); // Stop the interval when done
            }
        }, rampTime / step);
    }
    return
}

// function selectSlider(selectNo, sceneNo){
//
// }
// function assignValue(selectNo, currentSliderNo){
//
// }


