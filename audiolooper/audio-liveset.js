
let noSound = false
let sounds = []
var slider = []

let folderColors = [
   "lightblue",
    "lightgreen",
    "LightSkyBlue",
    "lightyellow",
    "beige",
    "azure",
    "ghostWhite",
    "lavenderBlush",
    "Linen",
    "SteelBlue"
]

let simpleMode = false
let mode = "slider"
let columnNo = 4
let sliderNosByScenes = []
let rampTime = 1
let lastSlider = 0
let intervals = []

const bc = new BroadcastChannel("sceneValues");

// track: no
//     parameters.gain
//         slider
//         gain
//     parameters.reverb

let parameters = Object.freeze({
    gain: "gain",
    reverb: "reverb",
    fx2: "fx2"
})

let selection = {
        scene: 0,
        row: 0,
        col: 0,
        no: 0,
        parameter: 0
    }

//Webmidi
/* PREFS */
let midiDeviceIn // = 1 // [ID] or "device name"
let midiDeviceOut // = 1 // [ID] or "device name"

let midiThru = false // optionally pass all in -> out
let midiInput, midiOutput, midiMsg = {}

let soundFileDir = "sounds/compressed/"

// Audio Effects --------------------------------------------------

// Create a highpass filter
const highpass = new Tone.Filter(500, "highpass");

let reverbGains = []
var reverbSlider = []
var defaultReverbGain = 0.1
const reverbFx = new Tone.Reverb(15).toDestination();
reverbFx.wet.value = 1;

let fx2Gains = []
let fx2Slider = []
let fx2 = new Tone.PingPongDelay({
    delayTime: "16n",
    feedback: 0.6,
    wet: 1,
}).toDestination();

//Signal Loudness to Sidechain
const drumGroup = new Tone.Gain(1.5)

//This group will be ducking
const sidechainGroup = new Tone.Gain(0.01).toDestination()

let sideChainRatio = 3
let sideChainReleaseTime = 1

// Invert Signal for Sidechain
const negate = new Tone.Multiply(-sideChainRatio)
const follower = new Tone.Follower(sideChainReleaseTime)

function preload() {

}

function setup() {
    //Make it 1, when there is no Signal from the Drum.
    const shift = new Tone.Add(1)
    const comp = new Tone.Compressor(-30, 3);

    drumGroup.connect(comp).connect(follower);
    follower.connect(new Tone.Signal()).chain(negate, shift, sidechainGroup.gain);

    highpass.connect(reverbFx)

    soundsFiles.sort()
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i] = new Tone.Player({
            url: soundFileDir + soundsFiles[i],
            loop: true
        }).sync().start(0);
        sounds[i].volume.value = -150

        defaultGain = Tone.gainToDb(defaultReverbGain)
        reverbGains[i] = new Tone.Channel({ volume: defaultGain }).connect(highpass)
        fx2Gains[i] = new Tone.Channel({ volume: -100 }).connect(fx2)

        sounds[i].connect(reverbGains[i])
        sounds[i].connect(fx2Gains[i])

        if (i < 5){
            sounds[i].fan(drumGroup, Tone.getDestination())
        } else {
            sounds[i].connect(sidechainGroup)
        }
    }

    // Ducking Control
    const sidechainSlider = document.getElementById("sidechain-slider");
    const ratioDisplay = document.getElementById("ratio-value");

    sidechainSlider.oninput = () => {
        const ratio = Number(sidechainSlider.value);
        console.log(ratio)
        negate.value = -ratio; // Update sidechain ratio
        ratioDisplay.textContent = ratio;
    };

    const sidechainReleaseSlider = document.getElementById("sidechain-release");
    sidechainReleaseSlider.value = sideChainReleaseTime
    const releaseDisplay = document.getElementById("release-value");

    sidechainReleaseSlider.oninput = () => {
        follower.smoothing = 0.1 + Number(sidechainReleaseSlider.value);
        releaseDisplay.textContent = sidechainReleaseSlider.value;
    };

    Tone.Transport.loop = true;
    Tone.Transport.loopStart = "1m";
    Tone.Transport.bpm.value = 120;
    Tone.Transport.loopEnd = "32m";


    setupMidi(midiDeviceIn, midiDeviceOut) // deviceIn, deviceOut
    setupLaunchpad()



    let lastFolder = ""
    let containerDiv
    let offset = 0
    let filesInFolder = 0
    let slidersinCurrentScene = []
    let folderNo = 0
    for (let i = 0; i < soundsFiles.length; i++) {

        let folderName = soundsFiles[i].split('/')[0]
        if  (folderName !== lastFolder){
            if (slidersinCurrentScene.length > 0){
                sliderNosByScenes.push(slidersinCurrentScene)
                slidersinCurrentScene = []
            }

            lastFolder = folderName
            containerDiv = document.createElement("div")
            containerDiv.innerHTML = "<h3 class='expert'>" + folderName + "</h3>";

            let bgColor = folderColors[folderNo] ?? "#555"

            //containerDiv.style.backgroundColor = bgColor;
            containerDiv.classList.add("scene");

            const sliderContainer = document.getElementById("all-the-sliders");
            sliderContainer.appendChild(containerDiv);

            folderNo ++
        }

        offset += 40

        const div = document.createElement("div");
        div.innerHTML = `<p class='expert'>c${i} | ${soundsFiles[i].split('/')[1]}</p>`;
        div.classList.add("slider-entity");

        containerDiv.appendChild(div); // Set containerDiv as the parent

            slidersinCurrentScene.push(i)

            slider[i] = createNewSlider(0, 1, 0, 0)
            slider[i].addEventListener("input", () => updateSound(i));
            div.appendChild(slider[i])

        if (!simpleMode){
            reverbSlider[i] = createNewSlider(0, 1, 0, 0)
            reverbSlider[i].addEventListener("input", (() => updateReverb(i)))
            reverbSlider[i].classList.add("expert")
            reverbSlider[i].value = defaultReverbGain
            div.appendChild(reverbSlider[i])

            fx2Slider[i] = createNewSlider(0, 1, 0, 0)
            fx2Slider[i].addEventListener("input", (() => updateFx2(i)))
            fx2Slider[i].classList.add("expert")
            div.appendChild(fx2Slider[i])
        }
    }
    sliderNosByScenes.push(slidersinCurrentScene)
}

function createNewSlider(value){
    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.value = value;
    slider.step = 1e-18;
    return slider
}

function updateReverb(i){
    const newValue = Number(reverbSlider[i].value) * 4
    reverbGains[i].volume.value = Tone.gainToDb(newValue)
}

function updateFx2(i){
    const newValue = Number(fx2Slider[i].value)
    fx2Gains[i].volume.value = Tone.gainToDb(newValue)
}

function toggleAudio() {
    // Resume or create the AudioContext
    const status = Tone.Transport.state;
if (status === "started"){
    Tone.Transport.stop()
} else {
    Tone.Transport.start()
}

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

function updateSound(i) {
    if (!noSound) {
        //for (let i = 0; i < soundsFiles.length; i++) {
           sounds[i].volume.value = Tone.gainToDb((slider[i].value * 0.7))
        //}
    }

    //Broadcast the Values to the other thingies
    bc.postMessage(i + ":" + slider[i].value);

    renderLanunchpad()
}

function setZero(){
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i].volume.value = Tone.gainToDb(0)
        slider[i].value = 0

        reverbGains[i].volume.value = Tone.gainToDb(defaultReverbGain)
        reverbSlider[i].value = defaultReverbGain

        fx2Slider[i].value = 0
        fx2Gains[i].volume.value = Tone.gainToDb(0)
    }
}

function controlChange(control) {
    // use control.type, .channel, .selection.no, .controllerName, .value
    controllerNo = control.controller.number
    currentSlider = slider[controllerNo]
    if (currentSlider){
        currentSlider.value = control.value
        updateSound(controllerNo)
    }
}

function highlightSelectedSlider(sceneNo, sliderNoInScene) {
    newSliderNo = sliderNosByScenes[sceneNo][sliderNoInScene]
    newSlider = slider[newSliderNo]
    if (undefined !== newSliderNo) {
        lastSlider = slider[selection.no]
        selection.no = newSliderNo
        lastSlider.parentElement.classList.remove("red");
        newSlider.parentElement.classList.add("red");
    }
}

function setSliderValue(value, targetParameter = null) {
    console.log("Set Controller " + targetParameter + " to value " + value)

    // Set the interval to update the value over the specified duration
    let endValue = Number(value);
    let step = rampTime * 100 // Number of steps for smooth transition
    let currentStep = 0;

    let sliderNumber= selection.no

    if (undefined !== intervals[selection.no]) {
        clearInterval(intervals[selection.no])
    }

    let parameterSlider
    let parameterGain
    //Set the destination
    if (targetParameter === parameters.reverb){
        parameterSlider = reverbSlider[sliderNumber]
        parameterGain =  reverbGains[sliderNumber]
    } else if (targetParameter === parameters.fx2){
        parameterSlider = fx2Slider[sliderNumber]
        parameterGain = fx2Gains[sliderNumber]
    } else {
        parameterSlider =  slider[sliderNumber]
        parameterGain = sounds[sliderNumber]
    }

    let startValue = parameterSlider.value

    // Set the interval to update the value over the specified duration
    intervals[selection.no] = setInterval(() => {
        currentStep++;
        currentValue = startValue + (endValue - startValue) * (currentStep / step);

        parameterSlider.value = currentValue
        parameterGain.volume.value = Tone.gainToDb(currentValue)

        if (currentStep >= step) {
            clearInterval(intervals[sliderNumber]); // Stop the interval when done
            renderLanunchpad()
        }
    }, (rampTime / 100));
}

document.addEventListener('keydown', keyPressed);
function keyPressed(event) {
    //console.log(event)

    key = event.key

    if (key == "Tab") {
        toggleAudio()
    }

    //Select the current Ramp Time
    let rampTimeMap = { "A": 1,  "S": 4, "D": 8, "F": 16, "G": 32 }
    if (rampTimeMap[key]){
        rampTime = Number(rampTimeMap[key])
        console.log("Ramp Time: " + rampTime + " sek")
        return
    }

    let columnMap =  {
        "q": 0, "w": 1, "e": 2, "r": 3,
    }
    if (columnMap[key] !== undefined){
        selection.col = columnMap[key]
        selection.scene = selection.col + (selection.row * columnNo)
        console.log("Change Scene to " + columnMap[key])
        highlightSelectedSlider(selection.scene, 0);
        return
    }

    let rowMap =  {
        "1": 1, "2": 2, "3": 3, "4": 4, "5": 4, "6": 7, "7": 8, "8": 9, "9":10, "0": 11
    }
    if (rowMap[key] !== undefined){
        selection.row = rowMap[key] - 1
        selection.scene = selection.col + (selection.row * 4)
        console.log("Change Scene to " + columnMap[key])
        highlightSelectedSlider(selection.scene, 0);
        return
    }

    //Select the current slider
    let sliderMap = {  "u": 0, "i": 1, "o": 2, "p": 3 }
    if (sliderMap[key] !== undefined){
        selection.noInSceneo = (sliderMap[key])
        highlightSelectedSlider(selection.scene, sliderMap[key]);
        return
    }

    if (key == "ArrowDown"){
        if (undefined !== sliderNosByScenes[selection.scene][selection.noInSceneo + 1]){
            selection.noInSceneo ++
            highlightSelectedSlider(selection.scene, selection.noInSceneo);
        }
        return
    }

    if (key == "ArrowUp"){
        console.log("SCIS OLD " + selection.noInSceneo)
        if (selection.noInSceneo < 1) return
        selection.noInSceneo --
        console.log("SCIS NEW " + selection.noInSceneo)
        highlightSelectedSlider(selection.scene, selection.noInSceneo);
        return
    }

    if (key == "ArrowRight"){
        selection.scene ++

        if (undefined === sliderNosByScenes[selection.scene][selection.noInSceneo]){
            selection.noInSceneo =  sliderNosByScenes[selection.scene].length -1
        }

        highlightSelectedSlider(selection.scene, selection.noInSceneo);
        return
    }

    if (key == "ArrowLeft"){
        selection.scene --
        if (undefined === sliderNosByScenes[selection.scene][selection.noInSceneo]){
            selection.noInSceneo =  sliderNosByScenes[selection.scene].length -1
        }
        highlightSelectedSlider(selection.scene, selection.noInSceneo);
        return
    }

    //Set the value for the current slider
    let valueMap = { "a": 0, "s": 1, "d": 2, "f": 3, "g": 4, "h": 5, "j": 6, "k": 7, "l": 8, "ö": 9 }
    let newValue = valueMap[key]
    if (undefined !== newValue){
        //console.log(newValue)
        //Set the Slider Value
        setSliderValue(newValue / 9, selection.no);
    }
    return
}
function toggleExpert() {
    document.body.classList.toggle("show-expert");
}
// function selectSlider(selectNo, selection.scene){
//
// }
// function assignValue(selectNo, selection.no){
//
// }


