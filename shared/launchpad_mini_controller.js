
//let currentColor = 0
let currentNote = 0
let velocitySeps = 7
let launchPadSelect

const dawMidiDevice = "IAC-Treiber Bus 1"
const launchpadDeviceName = "Launchpad Mini"

const modes = Object.freeze({
    faders: "faders",
    overview: "overview"
});
let currentMode = modes.overview

function noteOn(note) {
    // use note.type, .channel, .name, .number, .octave, .velocity

    //Buttons on the right as Sliders
    if ((note.number + 8) % 16 == 0){
        vel = 7 - ((note.number -8) / 16)
        setButton(currentNote, vel / velocitySeps)
        setSliderValue(vel / velocitySeps, selection.no);
        return
    }

    //Overview Section
    if (currentMode === modes.overview){
        launchPadSelect = note.number
        currentNote = note.number

        row = Math.floor(note.number / 16)
        column = note.number % 16

        sceneNo = row * 2 + (Math.floor(column/4))
        currentSliderInScene = column % 4

        highlightSelectedSlider(sceneNo, currentSliderInScene);

        renderFaders()
        currentMode = modes.faders
        return
    }

    if (currentMode === modes.faders){

        let slider0Vel = mapLaunchpadSliderToGain(note.number, 0)
        if (undefined !== slider0Vel){
            setSliderValue(slider0Vel, parameters.gain);
            renderFaders()
        }

        let slider1Vel = mapLaunchpadSliderToGain(note.number, 1)
        if (undefined !== slider1Vel){
            setSliderValue(slider1Vel, parameters.reverb);
            renderFaders()
        }

        let slider2Vel = mapLaunchpadSliderToGain(note.number, 2)
        if (undefined !== slider2Vel){
            setSliderValue(slider2Vel, parameters.fx2);
            renderFaders()
        }
        return
    }

}

function renderLanunchpad(){
    if (currentMode === modes.overview) renderOverview()
    if (currentMode === modes.faders) renderFaders()
}

function renderFaders(){
    let velocity = slider[selection.no].value;
    renderSlider(0, velocity, 4)

    velocity = reverbSlider[selection.no].value;
    renderSlider(2, velocity, 2)

    velocity = fx2Slider[selection.no].value;
    renderSlider(4, velocity, 7)

    function renderSlider(colOffset, velocity, colorNo) {
        // Iterate through columns
        for (let col = 0; col < 2; col++) {
            // Iterate through rows
            for (let row = 0; row < 8; row++) {

                let threshold = 16 - (row + (8 - col * 8));
                let color = velocity * 16 >= threshold ? colorNo : 0;

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
    for (i = 0; i < 64; i ++) {
        let scene = Math.floor(i / 4)
        let sliderinScene = i % 4
        currentSlider = slider[sliderNosByScenes[scene]?.[sliderinScene]] ?? null;
        if (null !== currentSlider) {
            velocity = Number(currentSlider.value)
        } else {
            velocity = 0
        }

        row = Math.floor(scene / 2) * 16
        col = sliderinScene + (scene % 2 * 4)

        setButton(col + row, velocity);
    }
}

function noteOff(note) {
    if (note.number === launchPadSelect) {

        renderOverview()
        currentMode = modes.overview
        launchPadSelect = null
    }
}

//Velocity normalised between 0 and 1
function setButton(buttonIndex, velocity) {

    if (!midiOutput){
        console.log("Launchpad out not found")
        return
    }

    const colorMap = [0, 16, 32, 21, 21, 18, 11, 1, 2, 3];

    let colorIndex = Math.round(velocity * (colorMap.length - 1));
    let midiColor = colorMap[colorIndex];

    midiOutput
        .channels[1]
        .playNote(buttonIndex, { attack:  midiColor / 127});
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

function launchpadControlChange(control){
    const controllerOffset= 103
    const controllserSplitPoint = 5
currentControll = control.controller.number - controllerOffset
    if (currentControll >= controllserSplitPoint){
        rampTime = 1 + Math.pow((currentControll - controllserSplitPoint), 3)

        for (i = 0; i < 4; i++){
            WebMidi.getOutputByName(launchpadDeviceName).channels[1].sendControlChange(i + controllerOffset + controllserSplitPoint, 0);
        }
    }
    WebMidi.getOutputByName(launchpadDeviceName).channels[1].sendControlChange(control.controller.number, 5);
}

function setupLaunchpad() {
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
        	midiMsg.note = note
        	parseMidi(midiMsg)
        })

        midiInput.channels[1].addListener("controlchange", e => {
            launchpadControlChange(e)
        });

    })
}