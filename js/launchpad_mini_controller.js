import { getVelFromCurrentTrack, getVelFromTrack, selectSliderByNo, setSliderValue, monitorChannel } from './audio.js';

//Globals
const launchpadDeviceName = "Launchpad Mini"
const modes = Object.freeze({
    faders: "faders",
    overview: "overview"
});
let currentMode = modes.overview

let velocitySeps = 7
let currentNote = 0
let launchPadSelect
let rampTime
let midiOutput
let midiInput

function noteOn(note) {
    // use note.type, .channel, .name, .number, .octave, .velocity

    //Buttons on the right on the Pad as Sliders
    if ((note.number + 8) % 16 == 0){
        return
    }

    //Overview Section
    if (currentMode === modes.overview) {
        launchPadSelect = note.number;
        currentNote = note.number;

        let row = Math.floor(note.number / 16);
        let column = note.number % 16;

        // Use 8 columns to get contiguous slider indexes.
        selectSliderByNo(row * 8 + column);

        monitorChannel(true)

        renderFaders();
        currentMode = modes.faders;
        return;
    }


    //Fader Section
    if (currentMode === modes.faders){
        let slider0Vel = mapLaunchpadSliderToGain(note.number, 0)
        if (undefined !== slider0Vel){
            setSliderValue(slider0Vel, "gain");
            renderFaders()
        }

        let slider1Vel = mapLaunchpadSliderToGain(note.number, 1)
        if (undefined !== slider1Vel){
            setSliderValue(slider1Vel, "reverb");
            renderFaders()
        }

        let slider2Vel = mapLaunchpadSliderToGain(note.number, 2)
        if (undefined !== slider2Vel){
            setSliderValue(slider2Vel, "delay");
            renderFaders()
        }
        return
    }

}

export function renderLaunchpad(){
    if (currentMode === modes.overview) renderOverview()
    if (currentMode === modes.faders) renderFaders()
}

function renderFaders(){
    let velocity = getVelFromCurrentTrack("gain")
    console.log(velocity)
    renderSlider(0, velocity, 4)

    velocity = getVelFromCurrentTrack("reverb")
    renderSlider(2, velocity, 2)

    velocity =  getVelFromCurrentTrack("delay")
    renderSlider(4, velocity, 7)

    function renderSlider(colOffset, velocity, colorNo) {
        // Iterate through columns
        for (let col = 0; col < 2; col++) {
            // Iterate through rows
            for (let row = 0; row < 8; row++) {

                let threshold = 16 - (row + (8 - col * 8));
                let color = 1 + velocity * 16 >= threshold ? colorNo : 0;

                setButton(col + colOffset + row * 16, color / 7);
            }
        }
    }
}

function mapLaunchpadSliderToGain(note, sliderNo){
    // Maps a Launchpad slider note to a velocity (0-1 range)

    let rowIndex = Math.floor(note / 16);
    let rawColIndex = note % 8;

    let colIndex = rawColIndex - (sliderNo * 2)
    if (
        colIndex < 0 || colIndex > 1
    ) {
        return
    }

    let rowVelocity = ((7 - rowIndex) / 7) / 2

     let columnVelocity =  colIndex / 2;
     let totalVelocity = rowVelocity + columnVelocity;

    return totalVelocity;
}

function renderOverview() {
    for (let i = 0; i < 64; i++) {
        let velocity = getVelFromTrack(i)

        let row = Math.floor(i / 8) * 16;
        let col = (i % 4) + ((Math.floor(i / 4) % 2) * 4);

        setButton(col + row, velocity);
    }
}

function noteOff(note) {
    monitorChannel(false)

    if (note.number === launchPadSelect) {

        renderOverview()
        currentMode = modes.overview
        launchPadSelect = null
    }
}

//Velocity normalised between 0 and 1
function setButton(buttonIndex, velocity) {

    if (!midiOutput){
        console.log("no out")
        return
    }

    const colorMap = [0, 16, 32, 21, 21, 18, 11, 1, 2, 3];

    let colorIndex = Math.round(velocity * (colorMap.length - 1));
    let midiColor = colorMap[colorIndex] / 127;

    midiOutput
        .channels[1]
        .playNote(buttonIndex, { attack:  midiColor});
}

function parseMidi(mm) {
    if(mm.note != undefined) {
        switch (mm.note.type) {
            case 'noteon':
                noteOn(mm.note)
                break;
            case 'noteoff':
                noteOff(mm.note)
                break;
        }
    }
}

//Top Buttons
function launchpadControlChange(control){
    const controllerOffset= 103
    const controllserSplitPoint = 5
    const currentControll = control.controller.number - controllerOffset
    if (currentControll >= controllserSplitPoint){
        rampTime = Math.pow((currentControll - controllserSplitPoint), 2)
        console.log("Set Ramp Time " + rampTime)

        for (let i = 0; i < 4; i++){
            WebMidi.getOutputByName(launchpadDeviceName).channels[1].sendControlChange(i + controllerOffset + controllserSplitPoint, 0);
        }
        WebMidi.getOutputByName(launchpadDeviceName).channels[1].sendControlChange(control.controller.number, 5);
    }

}

export function setupLaunchpad() {
    const deviceName = "Launchpad Mini"

    WebMidi.enable(function(err) {
        if(err) {
            console.log("WebMidi could not be enabled.", err);
        }

        midiInput = WebMidi.getInputByName(deviceName)
        midiOutput = WebMidi.getOutputByName(deviceName)

        if (!midiInput) {
            console.log("Launchpad in not found")
        }

        if (!midiOutput) {
            console.log("Launchpad out not found")
            return
        }

        for (let i = 0; i < 128; i++){
            setButton(i, 0)
        }

        for (let i = 0; i < 8; i++){
            setButton(8 + i * 16, (7  - i) / 7)
        }

        midiInput.addListener('midimessage', 'all', function(e) {
            let midiMsg = {}
            midiMsg.data = e.data
            midiMsg.timestamp = e.timestamp
        })

        // noteOn
        midiInput.addListener('noteon', "all", function(e) {
            let midiMsg = {}

            let note = {
                type: 'noteon'
            }
            note.channel = e.channel
            note.number = e.note.number
            note.name = e.note.name
            note.octave = e.note.octave
            note.velocity = Math.floor(127 * e.velocity)

            midiMsg.note = note
            parseMidi(midiMsg)
        })

        //noteOff
        midiInput.addListener('noteoff', "all", function(e) {
        	let note = {
        		type: 'noteoff'
        	}

            note.number = e.note.number
            let midiMsg = {}
        	midiMsg.note = note
        	parseMidi(midiMsg)
        })

        midiInput.channels[1].addListener("controlchange", e => {
            launchpadControlChange(e)
        });

    })
}