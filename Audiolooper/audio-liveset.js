let sounds = []
let slider = []
let folderColors = {
   "1": "lightblue",
    "2": "lightgreen"
}
function preload() {
    for (let i = 0; i < soundsFiles.length; i++) {
        sounds[i] = loadSound("sounds/" + soundsFiles[i]);
    }
}

function setup() {
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

        //text("heeeelo", 200, 100)
        let div = createDiv(`<p>${soundsFiles[i]}</p>`)
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
