
let noSound = false
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
let midiDeviceIn // = 1 // [ID] or "device name"
let midiDeviceOut // = 1 // [ID] or "device name"
let midiThru = false // optionally pass all in -> out
let midiInput, midiOutput, midiMsg = {}

let soundFileDir = "sounds/compressed/"
const reverb = new Tone.Reverb(10).toDestination();
// Create a highpass filter
const highpass = new Tone.Filter(500, "highpass");

function preload() {

    soundsFiles.sort()
    for (let i = 0; i < soundsFiles.length; i++) {
        console.log(soundsFiles[i])
        sounds[i] = new Tone.Player({
            url: soundFileDir + soundsFiles[i],
            loop: true
        }).toDestination().sync().start(0);
        sounds[i].volume.value = -150
        sounds[i].connect(highpass)
        sounds[i].toDestination()
    }
    highpass.connect(reverb)
    reverb.wet.value = 0.5; // Lower the reverb volume
}

function setup() {

    Tone.Transport.loop = true;
    Tone.Transport.loopStart = "1m";
    Tone.Transport.loopEnd = "18m";

    setupMidi(midiDeviceIn, midiDeviceOut) // deviceIn, deviceOut
    setupLaunchpad()

    let startButton = createButton('Start Audio');
    startButton.mousePressed(startAudio); // Trigger start on button press
   // startButton.position(20, 10);
    noCanvas()

    // reverb = new p5.Reverb();


    let lastFolder = ""
    let containerDiv
    let offset = 0
    let filesInFolder = 0
    let slidersinCurrentScene = []
    for (let i = 0; i < soundsFiles.length; i++) {

        let folderName = soundsFiles[i].split('/')[0]
        if  (folderName !== lastFolder){
            if (slidersinCurrentScene.length > 0){
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
            slider[i].input(updateSound);
            slider[i].parent(div)
            slidersinCurrentScene.push(i)
        //}

    }
    sliderNosByScenes.push(slidersinCurrentScene)
}

function startAudio() {
    // Resume or create the AudioContext

    Tone.Transport.start()
    //
    // context = getAudioContext();
    // context.resume().then(() => {
    //     console.log('AudioContext resumed');
    // });

    // sounds[0].loop();
    // for (let i = 1; i < soundsFiles.length; i++) {
    //     console.log(i)
    //     console.log(sounds[i])
    //         //sounds[i].syncedStart(sounds[0]);
    //     sounds[i].loop()
    // }
}

function updateSound() {
    if (!noSound) {
        for (let i = 0; i < soundsFiles.length; i++) {
           sounds[i].volume.value = Tone.gainToDb(slider[i].value())
        }
    }
}

function controlChange(control) {
    // use control.type, .channel, .currentSliderNo, .controllerName, .value
    //console.log(control.controller.number)

    controllerNo = control.controller.number
    currentSlider = slider[controllerNo]
    if (currentSlider){
        currentSlider.elt.value = control.value
        updateSound()
    }
}

function highlightSelectedSlider(sceneNo, sliderNoInScene) {
    //console.log(slidersinScene)
    newSliderNo = sliderNosByScenes[sceneNo][sliderNoInScene]
    newSlider = slider[newSliderNo]
    if (undefined !== newSliderNo) {
        lastSlider = slider[currentSliderNo]
        //console.log("Remove Class from " + currentSliderNo)
        currentSliderNo = newSliderNo
        lastSlider.parent().classList.remove("red")
        newSlider.parent().classList.add("red")
        //console.log("Select Slider " + currentSliderNo)
    }
}

function setSliderValue(selectNo, currentSliderNo) {
    console.log("Set value " + selectNo + " for controller " + currentSliderNo)

    // Set the interval to update the value over the specified duration
    let startValue = slider[currentSliderNo].value()
    let endValue = selectNo;
    let step = rampTime * 100 // Number of steps for smooth transition
    let currentStep = 0;

    let controller = {
        number: currentSliderNo
    };

    let control = {
        value: startValue,
        controller: controller
    };

    if (undefined !== intervals[currentSliderNo]) {
        clearInterval(intervals[currentSliderNo])
    }
    // Set the interval to update the value over the specified duration
    intervals[currentSliderNo] = setInterval(() => {
        currentStep++;
        control.value = startValue + (endValue - startValue) * (currentStep / step);
        controlChange(control);
        WebMidi.getOutputByName(dawMidiDevice).channels[1].sendControlChange(currentSliderNo, control.value * 127)

        if (currentStep >= step) {
            //console.log("Interval finished clear" + currentSliderNo)
            clearInterval(intervals[currentSliderNo]); // Stop the interval when done
        }
    }, (rampTime / 100));
}

function keyPressed(){

    //console.log(key)

    //Select the current Ramp Time
    let rampTimeMap = { "A": 1,  "S": 4, "D": 8, "F": 16, "G": 32 }
    if (rampTimeMap[key]){
        rampTime = Number(rampTimeMap[key])
        console.log("Ramp Time: " + rampTime + " sek")
        return
    }

    let sceneMap =  {
        "Q": 0, "W": 1, "E": 2, "R": 3, "T": 4, "Z": 5, "U": 6, "I": 7, "O": 8, "P": 9,
        "1": 10, "2": 11, "3": 12, "4": 13, "5": 14, "6": 15, "7": 16, "8": 17, "9": 18, "0": 19
    }
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

    if (key == "ArrowDown"){
        console.log("SCIS OLD " + currentSliderInScene)
        if (undefined !== sliderNosByScenes[sceneNo][currentSliderInScene + 1]){
            currentSliderInScene ++
            console.log("SCIS NEW" + currentSliderInScene)
            highlightSelectedSlider(sceneNo, currentSliderInScene);
        }
        return
    }

    if (key == "ArrowUp"){
        console.log("SCIS OLD " + currentSliderInScene)
        if (currentSliderInScene < 1) return
        currentSliderInScene --
        console.log("SCIS NEW " + currentSliderInScene)
        highlightSelectedSlider(sceneNo, currentSliderInScene);
        return
    }

    if (key == "ArrowRight"){
        sceneNo ++

        if (undefined === sliderNosByScenes[sceneNo][currentSliderInScene]){
            currentSliderInScene =  sliderNosByScenes[sceneNo].length -1
        }

        highlightSelectedSlider(sceneNo, currentSliderInScene);
        return
    }

    if (key == "ArrowLeft"){
        sceneNo --
        if (undefined === sliderNosByScenes[sceneNo][currentSliderInScene]){
            currentSliderInScene =  sliderNosByScenes[sceneNo].length -1
        }
        highlightSelectedSlider(sceneNo, currentSliderInScene);
        return
    }

    //Set the value for the current slider
    let valueMap = { "a": 0, "s": 1, "d": 2, "f": 3, "g": 4, "h": 5, "j": 6, "k": 7, "l": 8, "ö": 9 }
    let newValue = valueMap[key]
    if (undefined !== newValue){
        //Set the Slider Value
        setSliderValue(newValue / 9, currentSliderNo);

    }
    return
}

// function selectSlider(selectNo, sceneNo){
//
// }
// function assignValue(selectNo, currentSliderNo){
//
// }


