
let noSound = false
let sounds = []
var slider = []

let settings = {}
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

let mainGains = []
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


function setup() {
    settingsfromStorage = JSON.parse(localStorage.getItem("settings"))
    if (settingsfromStorage){ settings = settingsfromStorage }

    if (settings.expertMode){
        document.body.classList.add("show-expert")
    }

    //Make it 1, when there is no Signal from the Drum.
    const shift = new Tone.Add(1)
    const comp = new Tone.Compressor(-30, 3);

    drumGroup.connect(comp).connect(follower);
    follower.connect(new Tone.Signal()).chain(negate, shift, sidechainGroup.gain);

    highpass.connect(reverbFx)

    let loadedCount = 0;
    const totalSounds = soundsFiles.length;

    soundsFiles.sort()
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i] = new Tone.Player({
            url: soundFileDir + soundsFiles[i],
            loop: true,
            onload: function () {  // Callback when the sound is loaded
                loadedCount++;
                if (loadedCount === totalSounds) {
                    toggleAudio(); // Start once all are loaded
                }
            }
        }).sync().start(0);
        sounds[i].volume.value = 0

        defaultGain = Tone.gainToDb(defaultReverbGain)

        mainGains[i] = new Tone.Channel({ volume: -140 })
        reverbGains[i] = new Tone.Channel({ volume: defaultGain }).connect(highpass)
        fx2Gains[i] = new Tone.Channel({ volume: -100 }).connect(fx2)

        sounds[i].connect(mainGains[i])
        mainGains[i].connect(reverbGains[i])
        mainGains[i].connect(fx2Gains[i])

        if (i < 5){
            mainGains[i].fan(drumGroup, Tone.getDestination())
        } else {
            mainGains[i].connect(sidechainGroup)
        }
    }

    // Ducking Control
    const sidechainSlider = document.getElementById("sidechain-slider");
    const ratioDisplay = document.getElementById("ratio-value");

    sidechainSlider.oninput = () => {
        const ratio = Number(sidechainSlider.value);
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
    let sceneNo = -1
    for (let i = 0; i < soundsFiles.length; i++) {

        let folderName = soundsFiles[i].split('/')[0]
        if  (folderName !== lastFolder){
            sceneNo ++

            if (slidersinCurrentScene.length > 0){
                sliderNosByScenes.push(slidersinCurrentScene)
                slidersinCurrentScene = []
            }

            lastFolder = folderName
            containerDiv = document.createElement("div")
            containerDiv.innerHTML = "<h3 class='expert'>" + folderName + "</h3>";

            let bgColor = folderColors[sceneNo] ?? "#555"

            //containerDiv.style.backgroundColor = bgColor;
            containerDiv.classList.add("scene");

            const sliderContainer = document.getElementById("many-sliders-container");
            sliderContainer.appendChild(containerDiv);


        }

        offset += 40

        const div = document.createElement("div");
        div.innerHTML = `<p class='expert'>c${i} | ${soundsFiles[i].split('/')[1]}</p>`;
        div.classList.add("slider-entity");

        containerDiv.appendChild(div); // Set containerDiv as the parent

            slidersinCurrentScene.push(i)

            slider[i] = createNewSlider(0, sceneNo)
        sliderDomObject = slider[i].slider
        sliderDomObject.addEventListener("input", () => updateSound(i));
            div.appendChild(sliderDomObject)

        if (!simpleMode){

            reverbSlider[i] = createNewSlider(defaultReverbGain, sceneNo)
            reverbSliderDomObject = reverbSlider[i].slider
            reverbSliderDomObject.addEventListener("input", (() => updateReverb(i)))
            reverbSliderDomObject.classList.add("expert")
            div.appendChild(reverbSliderDomObject)


            fx2Slider[i] = createNewSlider(0, sceneNo)
            fxSliderDomObject = fx2Slider[i].slider
            fxSliderDomObject.addEventListener("input", (() => updateFx2(i)))
            fxSliderDomObject.classList.add("expert")
            div.appendChild(fxSliderDomObject)
        }
    }
    sliderNosByScenes.push(slidersinCurrentScene)
}

function createNewSlider(value, folderNo){
    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.value = value;
    slider.step = 1e-18;

    sliderobject = {}
    sliderobject.getValue = () => { return Number(slider.value)}
    sliderobject.slider = slider
    sliderobject.scene = folderNo

    return sliderobject
}

function updateReverb(i){
    const newValue = Number(reverbSlider[i].slider.value) * 4
    reverbGains[i].volume.value = Tone.gainToDb(newValue)
}

function updateFx2(i){
    const newValue = Number(fx2Slider[i].slider.value)
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
        mainGains[i].volume.value = Tone.gainToDb((slider[i].slider.value * 0.5))
    }

    updateBroadcastChannel(i)

    renderLanunchpad()
}

function updateBroadcastChannel(i){
    if (slider[i].scene > 1) {
        let max = 0;
        sliderNosByScenes[slider[i].scene].forEach(
            (index) => {
                max = Math.max(slider[index].slider.value, max)
            })

        //Broadcast the Values to the visual thingie
        bc.postMessage(slider[i].scene + ":" + max);


    }
}

function setZero(){
    for (let i = 0; i < soundsFiles.length; i++) {
        mainGains[i].volume.value = Tone.gainToDb(0)
        slider[i].slider.value = 0

        reverbGains[i].volume.value = Tone.gainToDb(defaultReverbGain)
        reverbSlider[i].slider.value = defaultReverbGain

        fx2Slider[i].slider.value = 0
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
        lastSlider.slider.parentElement.classList.remove("red");
        newSlider.slider.parentElement.classList.add("red");

        //Preview Sound
        //sounds[selection.no].connect(Tone.Destination, 1, 2);
    }
}

function setSliderValue(value, targetParameter = null) {
    value = Number(value)
    console.log("Set Controller " + targetParameter + " to value " + value)

    let sliderNumber= selection.no

    //If there is already an interval for this paremater, clear it
    if(undefined !==intervals[sliderNumber + targetParameter]){
        clearInterval(intervals[sliderNumber + targetParameter]);
    }

    // Set the interval to update the value over the specified duration
    let endValue = value;
    let step = rampTime * 100 // Number of steps for smooth transition
    let currentStep = 0;

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
        parameterGain = mainGains[sliderNumber]
    }

    let startValue = Number(parameterSlider.getValue())

    // Set the interval to update the value over the specified duration
    intervals[sliderNumber + targetParameter] = setInterval(() => {
        currentStep++;
        currentValue = (startValue + (endValue - startValue) * (currentStep / step));

        if (currentStep < step) {
            parameterSlider.slider.value = currentValue
            parameterGain.volume.value = Tone.gainToDb(currentValue)
            updateBroadcastChannel(sliderNumber)
            return
        }

        clearInterval(intervals[sliderNumber + targetParameter]);
        delete intervals[sliderNumber + targetParameter];

        renderLanunchpad()
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
    settings.expertMode = document.body.classList.toggle("show-expert");
    localStorage.setItem("settings", JSON.stringify(settings))
}

function helloClick(){
    setup()
   // toggleAudio()
    document.getElementById("helloContainer").classList.add("hide")
}