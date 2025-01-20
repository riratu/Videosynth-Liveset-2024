let sounds = []
var slider = []
let folderColors = {
   "1": "lightblue",
    "2": "lightgreen"
}

//Webmidi
/* PREFS */
let midiDeviceIn = 1 // [ID] or "device name"
let midiDeviceOut = 1 // [ID] or "device name"
let midiThru = false // optionally pass all in -> out
let midiInput, midiOutput, midiMsg = {}

function preload() {
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i] = loadSound("sounds/" + soundsFiles[i]);
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
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i].loop();
        sounds[i].rate(1); // Slightly vary the speed for each loop

        stroke(255)
        fill(255)
        fill(255)


        let folderName = soundsFiles[i].split('/')[0]
        if  (folderName !== lastFolder){
            lastFolder = folderName
            //offset += 40
            containerDiv = createDiv("<h3>" + folderName + "</h3>")

            let bgColor = folderColors[folderName] ?? "lightgray"

            containerDiv.style('background-color', bgColor);
            containerDiv.addClass('scene');
           // containerDiv.position(20, offset + 10)

        }

        offset += 40

        let div = createDiv(`<p>c${i} | ${soundsFiles[i].split('/')[1]}</p>`)
        //div.position(20, offset + 10)
        div.parent(containerDiv)

        slider[i] = createSlider(0, 1, 0, 0)
        //slider[i].position(20, offset + 25)
        sounds[i].amp(0)
        slider[i].input(updateSound);
        slider[i].parent(div)

        reverb.process(sounds[i], 3, 2)
    }
    //createCanvas(windowWidth, windowHeight);


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
    // use control.type, .channel, .controllerNumber, .controllerName, .value
    //console.log(control.controller.number)

    sliderNo = control.controller.number
    currentSlider = slider[sliderNo]
    if (currentSlider){
        currentSlider.elt.value = control.value - 0.05
        updateSound()
    }
}
