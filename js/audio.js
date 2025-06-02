import {setSceneSlider, animateSliders} from './visualScenes.js';
import {renderLaunchpad} from './launchpad_mini_controller.js';

let noSound = false
let sounds = []
export var audioTrack = []
let sceneNo = 0
var sliderNoInScene = 0

const bc = new BroadcastChannel("sceneValues");

let columnNo = 4
let sliderNosByScenes = []
export let rampTime = 1
let lastSlider = 0
let intervals = []
let maxChannelCount
let midiConnected = true

export function setRampTime(newTime){
    rampTime = newTime
}

let selection = {
    scene: 0,
    row: 0,
    col: 0,
    no: 0,
    parameter: 0
}

let lastUpdatedSliders = []

let soundFileDir = "sounds/compressed/"

// Audio Effects --------------------------------------------------

// Create a highpass filter
const highpass = new Tone.Filter(500, "highpass");

let mainGains = []
let reverbGains = []
var reverbSlider = []
var defaultReverbGain = 0.1
const reverbFx = new Tone.Reverb(145).toDestination();
reverbFx.wet.value = 1;

let fx2Gains = []
let fx2Slider = []
let fx2 = new Tone.PingPongDelay({
    delayTime: "16n",
    feedback: 0.6,
    wet: 1,
}).toDestination();

const multiband = createMultibandCompressor();
multiband.output.toDestination();

//Signal Loudness to Sidechain
const drumGroup = new Tone.Gain(1.5)

//This group will be ducking
const sidechainGroup = new Tone.Gain(0.01).connect(multiband.input)
//const sidechainGroup = new Tone.Gain(0.01).toDestination()

let sideChainRatio = 3
let sideChainReleaseTime = 1

// Invert Signal for Sidechain
const negate = new Tone.Multiply(-sideChainRatio)
const follower = new Tone.Follower(sideChainReleaseTime)

let merger

export function setupAudio() {
    maxChannelCount = Tone.getContext().rawContext.destination.maxChannelCount;
    Tone.getContext().rawContext.destination.channelCount = maxChannelCount;
    Tone.getContext().rawContext.destination.channelCountMode = "explicit";
    Tone.getContext().rawContext.destination.channelInterpretation = "discrete";

    merger = Tone.getContext().rawContext.createChannelMerger(maxChannelCount);
    merger.channelCount = 1;
    merger.channelCountMode = "explicit";
    merger.channelInterpretation = "discrete";
    merger.connect(Tone.getContext().rawContext.destination);

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
                    Tone.Transport.start()
                }
            }
        }).sync();
        sounds[i].volume.value = 0

        if (midiConnected){
            sounds[i].start(0)
        }

        let defaultGain = Tone.gainToDb(defaultReverbGain)

        mainGains[i] = new Tone.Channel({volume: -140, channelCount: 2})
        reverbGains[i] = new Tone.Channel({
            volume: defaultGain,
            channelCount: 2
        }).connect(highpass)
        fx2Gains[i] = new Tone.Channel({
            volume: -140,
            channelCount: 2
        }).connect(fx2)

        sounds[i].connect(mainGains[i])
        mainGains[i].connect(reverbGains[i])
        mainGains[i].connect(fx2Gains[i])

        if (soundsFiles[i].includes("to_sc")) {
            console.log("Connecting " + soundsFiles[i] + " to Sidechain")
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


    //Webmidi
    /* PREFS */
    //  let midiDeviceIn // = 1 // [ID] or "device name"
    //let midiDeviceOut // = 1 // [ID] or "device name"

// let midiThru = false // optionally pass all in -> out
// let midiInput, midiOutput, midiMsg = {}
    // setupMidi(midiDeviceIn, midiDeviceOut) // deviceIn, deviceOut


    let lastFolder = ""
    let containerDiv
    let offset = 0
    let slidersinCurrentScene = []
    let sceneNo = -1
    for (let i = 0; i < sounds.length; i++) {

        let folderName = soundsFiles[i].split('/')[0]
        if (folderName !== lastFolder) {
            sceneNo++

            if (slidersinCurrentScene.length > 0) {
                sliderNosByScenes.push(slidersinCurrentScene)
                slidersinCurrentScene = []
            }

            lastFolder = folderName
            containerDiv = document.createElement("div")
            containerDiv.innerHTML = "<h3 class='expert'>" + folderName + "</h3>";

            containerDiv.classList.add("scene");

            const sliderContainer = document.getElementById("audio-sliders-container");
            sliderContainer.appendChild(containerDiv);

        }

        offset += 40

        const div = document.createElement("div");
        div.innerHTML = `<p class='expert'>c${i} | ${soundsFiles[i].split('/')[1]}</p>`;
        div.classList.add("slider-entity");

        containerDiv.appendChild(div); // Set containerDiv as the parent

        slidersinCurrentScene.push(i)

        audioTrack[i] = createNewSlider(0, sceneNo)
        let sliderDomObject = audioTrack[i].slider
        sliderDomObject.addEventListener("input", () => updateSound(i));
        div.appendChild(sliderDomObject)

        reverbSlider[i] = createNewSlider(defaultReverbGain, sceneNo)
        let reverbSliderDomObject = reverbSlider[i].slider
        reverbSliderDomObject.addEventListener("input", (() => updateReverb(i)))
        reverbSliderDomObject.classList.add("expert")
        div.appendChild(reverbSliderDomObject)

        fx2Slider[i] = createNewSlider(0, sceneNo)
        let fxSliderDomObject = fx2Slider[i].slider
        fxSliderDomObject.addEventListener("input", (() => updateFx2(i)))
        fxSliderDomObject.classList.add("expert")
        div.appendChild(fxSliderDomObject)
    }
    sliderNosByScenes.push(slidersinCurrentScene)
}

function createNewSlider(value, folderNo) {
    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1;
    slider.step = 1e-18;
    slider.valueAsNumber = value

    let sliderobject = {}
    sliderobject.getValue = () => {
        return Number(slider.value)
    }
    sliderobject.slider = slider
    sliderobject.scene = folderNo

    return sliderobject
}

function updateReverb(i) {
    const newValue = Number(reverbSlider[i].slider.value) * 2
    reverbGains[i].volume.value = Tone.gainToDb(newValue)
}

function updateFx2(i) {
    const newValue = Number(fx2Slider[i].slider.value)
    fx2Gains[i].volume.value = Tone.gainToDb(newValue)
}

Tone.Transport.scheduleRepeat((time) => {
    animateSliders(Number(Tone.Transport.seconds))
}, "16n")

export function toggleAudio() {
    // Resume or create the AudioContext
    const status = Tone.Transport.state;
    if (status === "started") {
        Tone.Transport.stop()
    } else {
        Tone.Transport.start()
    }
}

export function updateSound(i) {
    if (!noSound) {

        let gain = audioTrack[i].slider.value
        setSliderValue(gain, "gain", 0.1, i)

        if (!midiConnected){
            if (gain === 0) {
                console.log("Stoping Sound " + i)
                sounds[i].stop(0)
            } else {
                if ("started" !== sounds[i].state) {
                    console.log("Starting Sound " + i)
                    sounds[i].start(0)
                }
            }
        }
    }

    //make only if fade to zero

    selection.no = i

    lastUpdatedSliders = [i, ...lastUpdatedSliders.filter(x => x !== i)];
    if (lastUpdatedSliders.length > 5) {
        let removed = lastUpdatedSliders.pop();
        setSliderValue(0, "gain", 10, removed)
        console.log(removed);
    }

    updateBroadcastChannel(i)
    renderLaunchpad()
}

function updateBroadcastChannel(i) {
   // if (audioTrack[i].scene > 1) {
        let sum = 0;
        let count = 0;

        sliderNosByScenes[audioTrack[i].scene].forEach((index) => {
            sum += Number(audioTrack[index].slider.value);
            count++;
        });

        let avg = sum / count

        // Broadcast the Values to the visual thingie
        bc.postMessage(audioTrack[i].scene + ":" + avg);
        setSceneSlider(audioTrack[i].scene, avg);
   // }
}

export function setZero() {
    for (let i = 0; i < soundsFiles.length; i++) {
        mainGains[i].volume.value = Tone.gainToDb(0)
        audioTrack[i].slider.value = 0

        reverbGains[i].volume.value = Tone.gainToDb(defaultReverbGain)
        reverbSlider[i].slider.value = defaultReverbGain

        fx2Slider[i].slider.value = 0
        fx2Gains[i].volume.value = Tone.gainToDb(0)
    }
}

export function selectSliderByNo(newSliderNo) {
    let newSlider = audioTrack[newSliderNo]
    if (undefined === newSlider) return false
    lastSlider = audioTrack[selection.no]
    if (undefined !== lastSlider){
        lastSlider.slider.parentElement.classList.remove("red");
    }
    selection.no = newSliderNo
    newSlider.slider.parentElement.classList.add("red");
    return true
}

function highlightSliderByScene(newSliderNo) {
    newSliderNo = sliderNosByScenes[sceneNo][sliderNoInScene]
    selectSliderByNo(newSliderNo)
}

//change speed in sec
//Value normalised
export function setSliderValue(value, targetParameter = null, speed = null, controllerNo = null) {

    value = Number(value);

    if (null === controllerNo) controllerNo = selection.no
    let sliderNumber = controllerNo

    console.log("Set Controller " + sliderNumber + " param " + targetParameter + " to value " + value);

    // Clear existing interval for this parameter
    if (intervals[sliderNumber + targetParameter] !== undefined) {
        clearInterval(intervals[sliderNumber + targetParameter]);
    }

    let endValue = value;

    if (null === speed) {
        speed = rampTime
    }

    let durationMs = speed * 1000; // Convert seconds to milliseconds
    let stepTime = 10; // Interval step time in milliseconds
    let totalSteps = durationMs / stepTime;
    let currentStep = 0;

    let parameterSlider;
    let parameterGain;

    if (targetParameter === "reverb") {
        parameterSlider = reverbSlider[sliderNumber];
        parameterGain = reverbGains[sliderNumber];
    } else if (targetParameter === "delay") {
        parameterSlider = fx2Slider[sliderNumber];
        parameterGain = fx2Gains[sliderNumber];
    } else {
        parameterSlider = audioTrack[sliderNumber];
        parameterGain = mainGains[sliderNumber];
    }

    if (undefined === parameterSlider) return
    let startValue = Number(parameterSlider.getValue());

    intervals[sliderNumber + targetParameter] = setInterval(() => {
        currentStep++;
        let currentValue = startValue + (endValue - startValue) * (currentStep / totalSteps);

        if (currentStep < totalSteps) {
            parameterSlider.slider.value = currentValue;
            parameterGain.volume.value = Tone.gainToDb(currentValue);
            updateBroadcastChannel(sliderNumber);
        } else {
            parameterSlider.slider.value = endValue;
            parameterGain.volume.value = Tone.gainToDb(endValue);
            clearInterval(intervals[sliderNumber + targetParameter]);
            delete intervals[sliderNumber + targetParameter];
            renderLaunchpad();
        }
    }, stepTime);

    let renderInterval;
    if (Object.keys(intervals).length > 0) {
        renderInterval = setInterval(() => {
            renderLaunchpad();
            if (Object.keys(intervals).length === 0) {
                clearInterval(renderInterval);
            }
        }, 200);
    }

}

document.addEventListener('keydown', audiokeyPressed);

function audiokeyPressed(event) {

    let key = event.key
    if (key === "Tab") {
        toggleAudio()
    } else if (key === "Escape"){
        toggleAudioSliders()
    }

    //Select the current Ramp Time
    let rampTimeMap = {"A": 1, "S": 4, "D": 8, "F": 16, "G": 32}
    if (rampTimeMap[key]) {
        rampTime = Number(rampTimeMap[key])
        console.log("Ramp Time: " + rampTime + " sek")
        return
    }

    let columnMap = {
        "q": 0, "w": 1, "e": 2, "r": 3,
    }
    if (columnMap[key] !== undefined) {
        selection.col = columnMap[key]
        selection.scene = selection.col + (selection.row * columnNo)
        console.log("Change Scene to " + columnMap[key])
        highlightSliderByScene(selection.scene, 0);
        return
    }

    let rowMap = {
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
        "5": 4,
        "6": 7,
        "7": 8,
        "8": 9,
        "9": 10,
        "0": 11
    }
    if (rowMap[key] !== undefined) {
        selection.row = rowMap[key] - 1
        selection.scene = selection.col + (selection.row * 4)
        console.log("Change Scene to " + columnMap[key])
        highlightSliderByScene(selection.scene, 0);
        return
    }

    //Select the current slider
    let sliderMap = {"u": 0, "i": 1, "o": 2, "p": 3}
    if (sliderMap[key] !== undefined) {
        selection.noInSceneo = (sliderMap[key])
        highlightSliderByScene(selection.scene, sliderMap[key]);
        return
    }

    if (key === "ArrowDown") {
        selectSliderByNo(selection.no + 1)
        return
    }

    if (key === "ArrowUp") {
        selectSliderByNo(selection.no - 1)
        return
    }

    if (key === "ArrowRight") {
        let newNo = Math.floor((selection.no + 4) / 4) * 4
        selectSliderByNo(newNo)
        return
    }

    if (key === "ArrowLeft") {
        let newNo = Math.floor((selection.no - 4) / 4) * 4
        selectSliderByNo(newNo)
        return
    }

    //Set the value for the current slider
    let valueMap = {
        "a": 0,
        "s": 1,
        "d": 2,
        "f": 3,
        "g": 4,
        "h": 5,
        "j": 6,
        "k": 7,
        "l": 8,
        "ö": 9
    }
    let newValue = valueMap[key]
    if (undefined !== newValue) {
        //console.log(newValue)
        //Set the Slider Value
        setSliderValue(newValue / 9, selection.no);
    }
}

export function monitorChannel(connect){
    try {
        if (connect) {
            sounds[selection.no].connect(merger, 0, maxChannelCount - 1);
        } else {
            sounds[selection.no].disconnect(merger, 0, maxChannelCount - 1);
        }
    } catch (e) {
    }
}

export function getVelFromCurrentTrack(param){
    return getVelFromTrack(selection.no, param)
}

export function getVelFromTrack(trackNo, param = "gain"){
    if (!audioTrack[trackNo]){
        return
    }
    if (param === "gain"){
        return Number(audioTrack[trackNo].getValue())
    } else if (param === "delay"){
        return Number(fx2Slider[trackNo].getValue());
    } else if (param === "reverb"){
        return Number(reverbSlider[trackNo].getValue());
    }
}

export function controlChange(control) {
    // use control.type, .channel, .selection.no, .controllerName, .value
    let controllerNo = control.controller.number
    let currentSlider = audioTrack[controllerNo].slider
    if (currentSlider) {
        currentSlider.value = control.value
        updateSound(controllerNo)
    }
}

function toggleAudioSliders(){
    document.getElementById("audio-sliders-container").classList.toggle("hide")
}

function createMultibandCompressor() {
    // Create crossover filters
    const lowFilter = new Tone.Filter(250, "lowpass");
    lowFilter.rolloff = -24;

    const midFilter = new Tone.Filter(250, "highpass");
    midFilter.rolloff = -24;

    const midHighFilter = new Tone.Filter(2500, "lowpass");
    midHighFilter.rolloff = -24;

    const highFilter = new Tone.Filter(2500, "highpass");
    highFilter.rolloff = -24;

    // Create compressors
    // Gentle mastering-style compression
    const lowCompressor = new Tone.Compressor({
        threshold: -12,
        ratio: 4,
        attack: 0.01,
        release: 0.01,
        knee: 2
    });

    const midCompressor = new Tone.Compressor({
        threshold: -12,
        ratio: 4,
        attack: 0.05,
        release: 1,
        knee: 4
    });

    const highCompressor = new Tone.Compressor({
        threshold: -8,
        ratio: 2,
        attack: 0.001,
        release: 0.05,
        knee: 6
    });


    // Create gains
    const lowGain = new Tone.Gain(1);
    const midGain = new Tone.Gain(1);
    const highGain = new Tone.Gain(1);

    // Create input/output
    const input = new Tone.Gain(1);
    const output = new Tone.Gain(1);

    // Connect everything
    // Low band
    input.connect(lowFilter);
    lowFilter.connect(lowCompressor);
    lowCompressor.connect(lowGain);
    lowGain.connect(output);

    // Mid band
    input.connect(midFilter);
    midFilter.connect(midHighFilter);
    midHighFilter.connect(midCompressor);
    midCompressor.connect(midGain);
    midGain.connect(output);

    // High band
    input.connect(highFilter);
    highFilter.connect(highCompressor);
    highCompressor.connect(highGain);
    highGain.connect(output);

    // Return controls
    return {
        input,
        output,
        filters: { lowFilter, midFilter, midHighFilter, highFilter },
        compressors: { lowCompressor, midCompressor, highCompressor },
        gains: { lowGain, midGain, highGain }
    };
}
