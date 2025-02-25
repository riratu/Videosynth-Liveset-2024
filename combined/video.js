    let particles = [];
    const particleArrayLength = 10000
    beatLength = 5000
    lastBeat = 0
    currentSeed = 0

    let imgs = []

    let scenes = []
    let activeScene = 0

// Max Values for Sliders
    newSeed = 0
    maxCurlFactor = 50
    maxZoomSpeed = 0.05
    maxSpawnRandSize = 0
    maxTranslationSpeed = 20

    let maxNoiseScale = 0.2
    let curlNoiseScale
    let maxNoiseTimeScale = 0.051
    var maxSpawnRadius = 500
    var maxSpawnCirleSpeed = 0.05
    let maxStokeWeight = 40
//var maxSpawnOffsetMultiplier = 10

//Technicalities

    var spawnCirleSpeed = 0.1
    var spawnRadius
    let lastParticleSpawned = 0
    var spawnCircleAngle = 0

    let currentSliderNo = 0

    let higlightColor = "lightgreen"
    let bgColor = "lightgray"
    let mic
    let divs = []
    let checkboxes = []
    let rotation = 0

// Connection to a broadcast channel
    const bc = new BroadcastChannel("sceneValues");

    var sliders = []
    var sliderNames = {
        "zoomSpeed": {
            description: "",
            default: 0.5,
            max: 0.05,
            min: 0.01,
        },
        "moveX": {
            default: 0.5,
            max: 5
        },
        "moveY": {
            default: 0.5,
            max: 5
        },
        "saturation": {
            default: 0,
        },
        "color": {
            default: 0.5,
        },
        "colorChange": {
            default: 0.5,
        },
        "bgTransparency": {
            default: 0.5,
        },
        "particleReducer": {
            default: 1,
        },
        "stokeWeight": {
            default: 0.05,
        },
        "pointAlpha": {
            default: 1,
        },
        "particleMoveSpeed": {
            default: 0.5,
            max: 5
        },
        "ellipseAlpha": {
            default: 1,
        },
        "spawnRate": {
            default: 0.1,
        },
        "linesTransparency": {
            default: 0,
        },
        "curlNoiseScale": {
            default: 0.1,
        },
        "ellipseSize": {
            default: 0.1,
            max: 450
        },
        "noiseTimeScale": {
            default: 0.1
        },
        "spawnRandomnessSizeX": {
            default: 0,
        },
        "spawnRadius": {
            default: 0,
        },
        "spawnCirleSpeed": {
            default: 0.1,
        },
        "curlFactor": {
            default: 0.5,
        },
        "spawnRandomnessSizeY": {
            default: 0,
        },
        "img1Alpha": {
            default: 0,
        },
        "spawnOffsetY": {
            default: 0.5,
        },
        "img2Alpha": {
            default: 0,
        },
        "spawnOffsetX": {
            default: 0.5,
        },
        "img3Alpha": {
            default: 0,
        },
        "img4Alpha": {
            default: 0,
        },
        "spawnOffsetMultiplierX": {
            default: 0.5
        },
        "spawnOffsetMultiplierY": {
            default: 0,
        },
        "spawnOffsetMultiplierCircle": {
            default: 0,
        },
        "line2Alpha": {
            default: 0,
        },
        "line3Alpha": {
            default: 0,
        },
        "rotation": {
            default: 0.5,
        }
    };

    var sliderKeys = Object.keys(sliderNames);
    var sliderValues = {}

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
    }

    function setup() {
        // mic = new p5.AudioIn()
        // mic.start()
        // // mic.amp(10)

        noFill()
        createCanvas(windowWidth, windowHeight);

        colorMode(HSB, 1)

        Object.keys(sliderNames).forEach(k => {
            sliderValues[k] = sliderNames[k].default
        })

        maxSpawnRandSize = width / 2
        createPropertiesSliders()
        createSceneInterface()

        for (let i = 0; i < particleArrayLength; i++) {
            particles.push(createVector(random(-maxSpawnRandSize, maxSpawnRandSize), random(-maxSpawnRandSize, maxSpawnRandSize)));
        }

        strokeWeight(1.5)
        clear();


        let usbMidiKnobInterface = "USB MIDI ADC 64"// [ID] or "device name"
        // let midiInput, midiOutput, midiMsg = {}
        setupMidi(usbMidiKnobInterface, null) // deviceIn, deviceOut
    }

    function createSceneInterface() {
        $values = localStorage.getItem("scenes")
        if (!$values) {
            console.log("Load Scenes from Server")
            scenes = "scenes:\"[{\"zoomSpeed\":0.717857142857143,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.671428571428571,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0607142857142857,\"particleReducer\":1,\"stokeWeight\":0.246428571428571,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.0357142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.0428571428571429,\"spawnCirleSpeed\":0.310714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.502619047619048,\"img2Alpha\":0,\"spawnOffsetX\":0.516904761904762,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.184761904761905,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.501071428571429,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.103571428571429,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.342857142857143,\"color\":0.271428571428571,\"colorChange\":0.5,\"bgTransparency\":0.5,\"particleReducer\":1,\"stokeWeight\":0,\"pointAlpha\":0.435714285714286,\"particleMoveSpeed\":0.5,\"ellipseAlpha\":1,\"spawnRate\":0.1,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0.1,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.5,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.528571428571429,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0,\"color\":0,\"colorChange\":0.414285714285714,\"bgTransparency\":0.0428571428571429,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.857142857142857,\"ellipseAlpha\":0.2,\"spawnRate\":0.0285714285714286,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.592857142857143,\"spawnRandomnessSizeX\":0.992857142857143,\"spawnRadius\":0.25,\"spawnCirleSpeed\":0.0285714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.455595238095238,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.405595238095238},{\"zoomSpeed\":0.635714285714286,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.285714285714286,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.0428571428571429,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.857142857142857,\"ellipseAlpha\":0.2,\"spawnRate\":0.15,\"linesTransparency\":0,\"curlNoiseScale\":0.142857142857143,\"ellipseSize\":0,\"noiseTimeScale\":0.0357142857142857,\"spawnRandomnessSizeX\":0.935714285714286,\"spawnRadius\":0.25,\"spawnCirleSpeed\":0.592857142857143,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.741309523809524},{\"zoomSpeed\":0.635714285714286,\"moveX\":0.5,\"moveY\":0.742857142857143,\"saturation\":0.235714285714286,\"color\":0.414285714285714,\"colorChange\":0.621428571428571,\"bgTransparency\":0.0857142857142857,\"particleReducer\":1,\"stokeWeight\":0.15,\"pointAlpha\":0.7,\"particleMoveSpeed\":0.857142857142857,\"ellipseAlpha\":0.235714285714286,\"spawnRate\":0.15,\"linesTransparency\":0,\"curlNoiseScale\":0.0214285714285714,\"ellipseSize\":0.05,\"noiseTimeScale\":0.0357142857142857,\"spawnRandomnessSizeX\":0.935714285714286,\"spawnRadius\":0.25,\"spawnCirleSpeed\":0.414285714285714,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.741309523809524},{\"zoomSpeed\":0.642857142857143,\"moveX\":0.492857142857143,\"moveY\":0.514285714285714,\"saturation\":0.235714285714286,\"color\":0.414285714285714,\"colorChange\":0.621428571428571,\"bgTransparency\":0.0857142857142857,\"particleReducer\":1,\"stokeWeight\":0.15,\"pointAlpha\":0.7,\"particleMoveSpeed\":0.121428571428571,\"ellipseAlpha\":0.507142857142857,\"spawnRate\":0.05,\"linesTransparency\":0,\"curlNoiseScale\":0.157142857142857,\"ellipseSize\":0,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.25,\"spawnCirleSpeed\":0.0214285714285714,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.469880952380952,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.248452380952381,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.412738095238095},{\"zoomSpeed\":0.571428571428571,\"moveX\":0.492857142857143,\"moveY\":0.514285714285714,\"saturation\":0.235714285714286,\"color\":0.414285714285714,\"colorChange\":0.621428571428571,\"bgTransparency\":0.0857142857142857,\"particleReducer\":1,\"stokeWeight\":0.15,\"pointAlpha\":0.7,\"particleMoveSpeed\":0.121428571428571,\"ellipseAlpha\":0.507142857142857,\"spawnRate\":0.05,\"linesTransparency\":0,\"curlNoiseScale\":0.157142857142857,\"ellipseSize\":0,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.25,\"spawnCirleSpeed\":0.0214285714285714,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.469880952380952,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.248452380952381,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.412738095238095},{\"zoomSpeed\":0.492857142857143,\"moveX\":0.507142857142857,\"moveY\":0.664285714285714,\"saturation\":1,\"color\":0.657142857142857,\"colorChange\":0.785714285714286,\"bgTransparency\":0.0857142857142857,\"particleReducer\":1,\"stokeWeight\":0.00714285714285714,\"pointAlpha\":0.7,\"particleMoveSpeed\":0.121428571428571,\"ellipseAlpha\":0.507142857142857,\"spawnRate\":0.05,\"linesTransparency\":0,\"curlNoiseScale\":0.157142857142857,\"ellipseSize\":0.335714285714286,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0,\"spawnCirleSpeed\":0,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0,\"img2Alpha\":0,\"spawnOffsetX\":0.498452380952381,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":1,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.507261904761905},{\"zoomSpeed\":0.507142857142857,\"moveX\":0.507142857142857,\"moveY\":0.585714285714286,\"saturation\":0.571428571428571,\"color\":0.657142857142857,\"colorChange\":0.785714285714286,\"bgTransparency\":0.05,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":0.7,\"particleMoveSpeed\":0.364285714285714,\"ellipseAlpha\":0,\"spawnRate\":0.00714285714285714,\"linesTransparency\":0,\"curlNoiseScale\":0.157142857142857,\"ellipseSize\":0.335714285714286,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0.0142857142857143,\"spawnRadius\":0.557142857142857,\"spawnCirleSpeed\":0,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0,\"img2Alpha\":0,\"spawnOffsetX\":0.434166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":1,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0.455595238095238,\"line3Alpha\":0.57702380952381,\"rotation\":0.507261904761905},{\"zoomSpeed\":0.728571428571429,\"moveX\":0.485714285714286,\"moveY\":0.785714285714286,\"saturation\":0,\"color\":0.657142857142857,\"colorChange\":0.785714285714286,\"bgTransparency\":0.05,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":0.7,\"particleMoveSpeed\":0,\"ellipseAlpha\":0,\"spawnRate\":0.00714285714285714,\"linesTransparency\":0,\"curlNoiseScale\":0.464285714285714,\"ellipseSize\":0.335714285714286,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0,\"spawnCirleSpeed\":0,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.334166666666667,\"img2Alpha\":0,\"spawnOffsetX\":0.548452380952381,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.369880952380952,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0.534166666666667,\"line3Alpha\":0.57702380952381,\"rotation\":0.378690476190476},{\"zoomSpeed\":0.935714285714286,\"moveX\":0.485714285714286,\"moveY\":0.785714285714286,\"saturation\":0,\"color\":0.657142857142857,\"colorChange\":0.785714285714286,\"bgTransparency\":0.05,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":0.7,\"particleMoveSpeed\":0.178571428571429,\"ellipseAlpha\":0,\"spawnRate\":0.00714285714285714,\"linesTransparency\":0,\"curlNoiseScale\":0.464285714285714,\"ellipseSize\":0.335714285714286,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0.121428571428571,\"spawnRadius\":0.05,\"spawnCirleSpeed\":0.0142857142857143,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.398452380952381,\"img2Alpha\":0,\"spawnOffsetX\":0.519880952380952,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.312738095238095,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0.534166666666667,\"line3Alpha\":0.57702380952381,\"rotation\":0.478690476190476},{\"zoomSpeed\":0.6266326530612248,\"moveX\":0.4928571428571428,\"moveY\":0.7322448979591839,\"saturation\":0.23234693877551046,\"color\":0.40836734693877524,\"colorChange\":0.6125510204081628,\"bgTransparency\":0.08448979591836733,\"particleReducer\":0.9857142857142857,\"stokeWeight\":0.14785714285714285,\"pointAlpha\":0.69,\"particleMoveSpeed\":0.8448979591836734,\"ellipseAlpha\":0.23234693877551046,\"spawnRate\":0.14785714285714285,\"linesTransparency\":0,\"curlNoiseScale\":0.02112244897959181,\"ellipseSize\":0.04928571428571428,\"noiseTimeScale\":0.035204081632653046,\"spawnRandomnessSizeX\":0.9223469387755104,\"spawnRadius\":0.2464285714285714,\"spawnCirleSpeed\":0.40836734693877524,\"curlFactor\":0.4928571428571428,\"spawnRandomnessSizeY\":0.9857142857142857,\"img1Alpha\":0,\"spawnOffsetY\":0.4717346938775514,\"img2Alpha\":0,\"spawnOffsetX\":0.47725000000000034,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.7307193877551021},{\"zoomSpeed\":0.7,\"moveX\":0.4784285714285717,\"moveY\":0.7739285714285717,\"saturation\":1,\"color\":0.471428571428571,\"colorChange\":0.7,\"bgTransparency\":0.049249999999999995,\"particleReducer\":0.985,\"stokeWeight\":0.049249999999999995,\"pointAlpha\":0.6894999999999999,\"particleMoveSpeed\":0.17589285714285757,\"ellipseAlpha\":0,\"spawnRate\":0.007035714285714283,\"linesTransparency\":0.642857142857143,\"curlNoiseScale\":0.4573214285714283,\"ellipseSize\":0.33067857142857177,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0.157142857142857,\"spawnRadius\":0.049249999999999995,\"spawnCirleSpeed\":0.014071428571428585,\"curlFactor\":0.221428571428571,\"spawnRandomnessSizeY\":0.164285714285714,\"img1Alpha\":0,\"spawnOffsetY\":0.3924755952380953,\"img2Alpha\":0,\"spawnOffsetX\":0.391309523809524,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0.605595238095238,\"rotation\":0.4715101190476188},{\"zoomSpeed\":0.5761668387431846,\"moveX\":0.9134352321538296,\"moveY\":0.4567176160769142,\"saturation\":0.29510984423431397,\"color\":0.46374404093963584,\"colorChange\":0.6885896365467326,\"bgTransparency\":0.7518274603112283,\"particleReducer\":0.9689439885693307,\"stokeWeight\":0.09134352321538293,\"pointAlpha\":0.6782607919985315,\"particleMoveSpeed\":0.17302571224452376,\"ellipseAlpha\":0,\"spawnRate\":0.04918497403905233,\"linesTransparency\":0.6323782376449587,\"curlNoiseScale\":0.6394046625076802,\"ellipseSize\":0.3252883390197043,\"noiseTimeScale\":0.5340082895668541,\"spawnRandomnessSizeX\":0.22484559560709677,\"spawnRadius\":0.048447199428466536,\"spawnCirleSpeed\":0.013842056979561885,\"curlFactor\":0.21781917074437418,\"spawnRandomnessSizeY\":0.9836994807810466,\"img1Alpha\":0,\"spawnOffsetY\":0.4551952240233246,\"img2Alpha\":0,\"spawnOffsetX\":0,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.46382425929015203},{\"zoomSpeed\":0.514285714285714,\"moveX\":0.792857142857143,\"moveY\":0.464285714285714,\"saturation\":0.714285714285714,\"color\":0.471428571428571,\"colorChange\":0.7,\"bgTransparency\":0.764285714285714,\"particleReducer\":0.985,\"stokeWeight\":0.764285714285714,\"pointAlpha\":0.6894999999999999,\"particleMoveSpeed\":0.17589285714285757,\"ellipseAlpha\":0,\"spawnRate\":0.1,\"linesTransparency\":0.778571428571429,\"curlNoiseScale\":0.65,\"ellipseSize\":0.33067857142857177,\"noiseTimeScale\":0.542857142857143,\"spawnRandomnessSizeX\":0.228571428571429,\"spawnRadius\":0.049249999999999995,\"spawnCirleSpeed\":0.014071428571428585,\"curlFactor\":0.221428571428571,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.462738095238095,\"img2Alpha\":0,\"spawnOffsetX\":0,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.4715101190476188},{\"zoomSpeed\":0.857142857142857,\"moveX\":0.485714285714286,\"moveY\":0.464285714285714,\"saturation\":0.3,\"color\":0.471428571428571,\"colorChange\":0.7,\"bgTransparency\":0.0571428571428571,\"particleReducer\":0.985,\"stokeWeight\":0.0928571428571429,\"pointAlpha\":0.6894999999999999,\"particleMoveSpeed\":0.857142857142857,\"ellipseAlpha\":0,\"spawnRate\":0.107142857142857,\"linesTransparency\":0.414285714285714,\"curlNoiseScale\":0.65,\"ellipseSize\":0.33067857142857177,\"noiseTimeScale\":0.542857142857143,\"spawnRandomnessSizeX\":0.228571428571429,\"spawnRadius\":0.049249999999999995,\"spawnCirleSpeed\":0.014071428571428585,\"curlFactor\":0.221428571428571,\"spawnRandomnessSizeY\":0.557142857142857,\"img1Alpha\":0,\"spawnOffsetY\":0.47702380952381,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.4715101190476188},{\"zoomSpeed\":0.621428571428571,\"moveX\":0.407142857142857,\"moveY\":0.464285714285714,\"saturation\":0.3,\"color\":0.471428571428571,\"colorChange\":0.7,\"bgTransparency\":0.0428571428571429,\"particleReducer\":1,\"stokeWeight\":0.0428571428571429,\"pointAlpha\":0.6894999999999999,\"particleMoveSpeed\":0.857142857142857,\"ellipseAlpha\":0,\"spawnRate\":0.107142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.285714285714286,\"ellipseSize\":0.33067857142857177,\"noiseTimeScale\":0.542857142857143,\"spawnRandomnessSizeX\":0.107142857142857,\"spawnRadius\":0.464285714285714,\"spawnCirleSpeed\":0.407142857142857,\"curlFactor\":0.221428571428571,\"spawnRandomnessSizeY\":0.185714285714286,\"img1Alpha\":0,\"spawnOffsetY\":0.412738095238095,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.4715101190476188},{\"zoomSpeed\":0.471428571428571,\"moveX\":0.471428571428571,\"moveY\":1,\"saturation\":0.0642857142857143,\"color\":0.471428571428571,\"colorChange\":0.7,\"bgTransparency\":0.214285714285714,\"particleReducer\":0.271428571428571,\"stokeWeight\":0.0642857142857143,\"pointAlpha\":0.35,\"particleMoveSpeed\":0.178571428571429,\"ellipseAlpha\":0,\"spawnRate\":0.9,\"linesTransparency\":0,\"curlNoiseScale\":0.385714285714286,\"ellipseSize\":0.428571428571429,\"noiseTimeScale\":0.542857142857143,\"spawnRandomnessSizeX\":1,\"spawnRadius\":0,\"spawnCirleSpeed\":0.407142857142857,\"curlFactor\":0.221428571428571,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0.107142857142857,\"spawnOffsetY\":0.442857142857143,\"img2Alpha\":0.162738095238095,\"spawnOffsetX\":0.47702380952381,\"img3Alpha\":0.105595238095238,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.669880952380952,\"spawnOffsetMultiplierY\":0.248452380952381,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.4715101190476188},{\"zoomSpeed\":0.471428571428571,\"moveX\":0.471428571428571,\"moveY\":1,\"saturation\":0.0642857142857143,\"color\":0.471428571428571,\"colorChange\":0.7,\"bgTransparency\":0.214285714285714,\"particleReducer\":0.271428571428571,\"stokeWeight\":0.0642857142857143,\"pointAlpha\":0.35,\"particleMoveSpeed\":0.178571428571429,\"ellipseAlpha\":0,\"spawnRate\":0.9,\"linesTransparency\":0,\"curlNoiseScale\":0.385714285714286,\"ellipseSize\":0.428571428571429,\"noiseTimeScale\":0.542857142857143,\"spawnRandomnessSizeX\":1,\"spawnRadius\":0,\"spawnCirleSpeed\":0.407142857142857,\"curlFactor\":0.221428571428571,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0.107142857142857,\"spawnOffsetY\":0.442857142857143,\"img2Alpha\":0.162738095238095,\"spawnOffsetX\":0.47702380952381,\"img3Alpha\":0.105595238095238,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.669880952380952,\"spawnOffsetMultiplierY\":0.248452380952381,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.4715101190476188},{\"zoomSpeed\":0.357142857142857,\"moveX\":0.464285714285714,\"moveY\":0.5,\"saturation\":0,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.614285714285714,\"particleReducer\":1,\"stokeWeight\":0.0428571428571429,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.764285714285714,\"ellipseAlpha\":0,\"spawnRate\":0.0714285714285714,\"linesTransparency\":0,\"curlNoiseScale\":0,\"ellipseSize\":0.121428571428571,\"noiseTimeScale\":0.185714285714286,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.614285714285714,\"spawnCirleSpeed\":0.685714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.47702380952381,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0},{\"zoomSpeed\":0.357142857142857,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.0571428571428571,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.0571428571428571,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.857142857142857,\"ellipseAlpha\":0.2,\"spawnRate\":0.15,\"linesTransparency\":0,\"curlNoiseScale\":0,\"ellipseSize\":0,\"noiseTimeScale\":0.0785714285714286,\"spawnRandomnessSizeX\":1,\"spawnRadius\":0.15,\"spawnCirleSpeed\":0.114285714285714,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.641309523809524,\"spawnOffsetMultiplierY\":0.584166666666667,\"spawnOffsetMultiplierCircle\":0.462738095238095,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0},{\"zoomSpeed\":0.407142857142857,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.0571428571428571,\"particleReducer\":1,\"stokeWeight\":0.0428571428571429,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.764285714285714,\"ellipseAlpha\":0.2,\"spawnRate\":0.15,\"linesTransparency\":0,\"curlNoiseScale\":0,\"ellipseSize\":0,\"noiseTimeScale\":0,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.15,\"spawnCirleSpeed\":0.985714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.641309523809524,\"spawnOffsetMultiplierY\":0.584166666666667,\"spawnOffsetMultiplierCircle\":0.462738095238095,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0},{\"zoomSpeed\":0.378571428571429,\"moveX\":0.464285714285714,\"moveY\":0.5,\"saturation\":0,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.0571428571428571,\"particleReducer\":1,\"stokeWeight\":0.0428571428571429,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.764285714285714,\"ellipseAlpha\":0.2,\"spawnRate\":0.15,\"linesTransparency\":0,\"curlNoiseScale\":0,\"ellipseSize\":0,\"noiseTimeScale\":0.185714285714286,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.614285714285714,\"spawnCirleSpeed\":0.721428571428571,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.47702380952381,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0},{\"zoomSpeed\":0.492857142857143,\"moveX\":0.45,\"moveY\":0.435714285714286,\"saturation\":0.35,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.614285714285714,\"particleReducer\":1,\"stokeWeight\":0.0428571428571429,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.764285714285714,\"ellipseAlpha\":0,\"spawnRate\":0.814285714285714,\"linesTransparency\":0.585714285714286,\"curlNoiseScale\":0.642857142857143,\"ellipseSize\":0.121428571428571,\"noiseTimeScale\":0.185714285714286,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.614285714285714,\"spawnCirleSpeed\":0.685714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0.75,\"img1Alpha\":0.471428571428571,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0.441309523809524,\"img4Alpha\":0.698452380952381,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.47702380952381,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0},{\"zoomSpeed\":0.492857142857143,\"moveX\":0.45,\"moveY\":0.435714285714286,\"saturation\":0.35,\"color\":0.8,\"colorChange\":0.671428571428571,\"bgTransparency\":0.614285714285714,\"particleReducer\":1,\"stokeWeight\":0.0428571428571429,\"pointAlpha\":0.628571428571429,\"particleMoveSpeed\":0.764285714285714,\"ellipseAlpha\":0,\"spawnRate\":0.814285714285714,\"linesTransparency\":0.585714285714286,\"curlNoiseScale\":0,\"ellipseSize\":0.121428571428571,\"noiseTimeScale\":0.185714285714286,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.614285714285714,\"spawnCirleSpeed\":0.685714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.478571428571429,\"img2Alpha\":0,\"spawnOffsetX\":0.484166666666667,\"img3Alpha\":0,\"img4Alpha\":0.698452380952381,\"spawnOffsetMultiplierX\":0,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.47702380952381,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0},{\"zoomSpeed\":0.5,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.503571428571429,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.5,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":1,\"particleMoveSpeed\":0.5,\"ellipseAlpha\":1,\"spawnRate\":0.1,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.5,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.760714285714286,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.503571428571429,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0357142857142857,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.1,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":1,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.331190476190476,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.760714285714286,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.503571428571429,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0357142857142857,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.232142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":1,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.331190476190476,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.717857142857143,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.671428571428571,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0357142857142857,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.232142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":1,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":1,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.331190476190476,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.717857142857143,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.671428571428571,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0607142857142857,\"particleReducer\":1,\"stokeWeight\":0.246428571428571,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.0357142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0.0392857142857143,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0.0204761904761905,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.0954761904761905,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.717857142857143,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.671428571428571,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0607142857142857,\"particleReducer\":1,\"stokeWeight\":0.246428571428571,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.0357142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0.175,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.378571428571429,\"spawnCirleSpeed\":0.492857142857143,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.481190476190476,\"img2Alpha\":0,\"spawnOffsetX\":0.449047619047619,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.0526190476190476,\"spawnOffsetMultiplierY\":0.0561904761904762,\"spawnOffsetMultiplierCircle\":0.2725,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.717857142857143,\"moveX\":0.5,\"moveY\":0.5,\"saturation\":0.671428571428571,\"color\":0.335714285714286,\"colorChange\":0.857142857142857,\"bgTransparency\":0.0607142857142857,\"particleReducer\":1,\"stokeWeight\":0.246428571428571,\"pointAlpha\":1,\"particleMoveSpeed\":0,\"ellipseAlpha\":1,\"spawnRate\":0.0357142857142857,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0.0428571428571429,\"spawnCirleSpeed\":0.310714285714286,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.502619047619048,\"img2Alpha\":0,\"spawnOffsetX\":0.516904761904762,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.184761904761905,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0.501071428571429,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5},{\"zoomSpeed\":0.5,\"moveX\":0.646153846153846,\"moveY\":0.5,\"saturation\":0,\"color\":0.5,\"colorChange\":0.5,\"bgTransparency\":0.5,\"particleReducer\":1,\"stokeWeight\":0.05,\"pointAlpha\":1,\"particleMoveSpeed\":0.5,\"ellipseAlpha\":1,\"spawnRate\":0.1,\"linesTransparency\":0,\"curlNoiseScale\":0.1,\"ellipseSize\":0.1,\"noiseTimeScale\":0.1,\"spawnRandomnessSizeX\":0,\"spawnRadius\":0,\"spawnCirleSpeed\":0.1,\"curlFactor\":0.5,\"spawnRandomnessSizeY\":0,\"img1Alpha\":0,\"spawnOffsetY\":0.5,\"img2Alpha\":0,\"spawnOffsetX\":0.5,\"img3Alpha\":0,\"img4Alpha\":0,\"spawnOffsetMultiplierX\":0.5,\"spawnOffsetMultiplierY\":0,\"spawnOffsetMultiplierCircle\":0,\"line2Alpha\":0,\"line3Alpha\":0,\"rotation\":0.5}]\""
        }
            scenes = JSON.parse($values)
            scenes.forEach((scene, i) => {
                createSceneButton(i)
                createSceneSliders(i)
            })

        loadScene(0)

    }

    function createSceneSliders(i) {
        let sceneSliderCont = document.getElementById("sceneSliderContainer")
        let div = createDiv(`<span class="sceneSliderLabel">${i}</span>`)
        let sceneSlider = createSlider(0, 1, 0, 0)
        sceneSlider.id("sceneSlider" + i)
        sceneSlider.addClass("sceneSlider")
        sceneSlider.input(updateSceneSliders)
        sceneSlider.parent(div);
        div.parent(sceneSliderCont)
    }

    function draw() {

        translate(width / 2, height / 2)

        // rotation += ((sliderValues.rotation - 0.5) / 40)
        rotate(sliderValues.rotation - 0.5)

        //Test Performance of certain things
        //testPerformance();

        //frameRate(1)

        // let micLevel = mic.getLevel()

        //const slider = sliders[sliderKeys[currentSliderNo]]
        // let newValue = micLevel


        curlFactor = sliders["curlFactor"].value()
        curlNoiseScale = sliders["curlNoiseScale"].value()

        // checkBeat()
        // if (beat) {
        //     newSeed += random(0.5)
        // }
        // currentSeed += (newSeed - currentSeed) * 0.02
        // noiseSeed(currentSeed);
        // if (frameCount % 100 === 0){
        //     console.log(typeof sliderValues.bgTransparency)
        //     console.log(sliderValues.bgTransparency == 0)
        //     console.log(sliderValues.bgTransparency)
        // }

        background(0, sliderValues.bgTransparency);

        let colorChange = (sliderValues.colorChange - 0.5) / 5000
        spawnRadius = sliders["spawnRadius"].value()
        spawnCirleSpeed = (2 ** (sliders["spawnCirleSpeed"].value() * 4)) / 8
        let stokeWeight = sliders["stokeWeight"].value()
        let particleNo = Math.floor((particleArrayLength - 1) * sliders["particleReducer"].value()) + 1

        let lineModulo = Math.floor(particleNo / 200)

        let spawnRate = 1 + (sliders["spawnRate"].value() * particleArrayLength / 40)

        spawnCircleAngle += spawnCirleSpeed * maxSpawnCirleSpeed

        for (let i = 0; i < spawnRate; i++) {
            lastParticleSpawned = (lastParticleSpawned + 1) % particleNo
            spawnParticle(particles[lastParticleSpawned], i, spawnRate)
        }
        for (let i = 0; i < particleNo; i++) {
            currentP = i + lastParticleSpawned % particleNo

            let hue = (sliderValues.color + (colorChange * currentP)) % 1
            let sat = (sliderValues.saturation)

            strokeWeight(0.3 + stokeWeight * maxStokeWeight)

            let p = particles[i];
            if (sliderValues.pointAlpha > 0.05) {
                let alpha = sliderValues.pointAlpha
                stroke(hue, sat, 1, alpha)
                point(p.x, p.y);
            }

            if (sliderValues.ellipseSize > 0.02) {
                if (i % 5 == 0) {
                    stroke(hue, sat, 1, sliderValues.ellipseAlpha)
                    ellipse(p.x, p.y, sliderNames.ellipseSize.max * sliderValues.ellipseSize)
                }
            }

            if (sliderValues.linesTransparency > 0.05) {
                if (i % lineModulo === 0) {
                    stroke(hue, sat, 1, sliderValues.linesTransparency)

                    let lineDist = 50
                    let foundLines = 0

                    for (let ii = 1; 1 < 20; ii++) {

                        let otherIndex = (i + ii) % particleNo

                        if (abs(particles[otherIndex].x - p.x) < lineDist
                            && abs(particles[otherIndex].y - p.y) < lineDist) {
                            line(p.x, p.y, particles[otherIndex].x, particles[otherIndex].y)

                            foundLines += 1
                            if (foundLines > 5) {
                                break
                            }
                        }
                    }
                }
            }

            let fishcount = particleNo / (particleNo / 1000)
            if (i % fishcount == 0 && sliders["img1Alpha"].value() > 0.1) {
                tint(255, sliders["img1Alpha"].value())
                image(imgs[4], p.x, p.y, 200, 200);
            }
            if (i % (fishcount + 80) == 0 && sliders["img2Alpha"].value() > 0.1) {
                tint(255, sliders["img2Alpha"].value())
                image(imgs[5], p.x, p.y, 200, 200);
            }
            if (i % (fishcount + 70) == 0 && sliders["img3Alpha"].value() > 0.1) {
                tint(255, sliders["img3Alpha"].value())
                image(imgs[2], p.x, p.y, 200, 200);
            }
            // if (i % (fishcount + 20) == 0 && sliders["img4Alpha"].value() > 0.1) {
            //     tint(255, sliders["img4Alpha"].value())
            //     image(imgs[3], p.x, p.y, 200, 200);
            // }
            if (i % (fishcount / 2 + 100) == 0 && sliders["img4Alpha"].value() > 0.1) {
                tint(255, sliders["img4Alpha"].value())
                image(imgs[7], p.x, p.y, 200, 200);
            }
            if (i % (fishcount + 5) == 0 && sliders["img4Alpha"].value() > 0.1) {
                tint(255, sliders["img4Alpha"].value())
                image(imgs[6], p.x, p.y, 200, 200);
            }

            // if (i % (fishcount + 90) == 0 && sliders["img4Alpha"].value() > 0.1) {
            //     tint(255, sliders["img4Alpha"].value())
            //     image(imgs[4], p.x, p.y, 200, 200);
            // }
            // if (i % (fishcount + 420) == 0 && sliders["img4Alpha"].value() > 0.1) {
            //     tint(255, sliders["img4Alpha"].value())
            //     image(imgs[5], p.x, p.y, 200, 200);
            // }

            if (sliderValues.line2Alpha
                && i % 10 == 0
                && i !== lastParticleSpawned
            ) {
                stroke(hue, sat, 1, sliderValues.line2Alpha)
                otherP = (i + 1) % particleNo
                line(p.x, p.y, particles[otherP].x, particles[otherP].y)
            }

            if (sliderValues.line3Alpha
                && i % 10 == 0
                && i !== lastParticleSpawned
            ) {
                stroke(hue, sat, 1, sliderValues.line3Alpha)
                otherP = Math.floor((i + (spawnRate / 2)) % particleNo)
                line(p.x, p.y, particles[otherP].x, particles[otherP].y)
            }


            //Move the Particles
            let n = noise(p.x * maxNoiseScale * curlNoiseScale, p.y * maxNoiseScale * curlNoiseScale, frameCount * (sliders["noiseTimeScale"].value() * maxNoiseTimeScale));
            let b = TAU * n * (p.x / (width / 2) * curlFactor);
            let a = TAU * n * ((p.y / (height / 2) + 1) * curlFactor);

            p.x += cos(a) * sliderNames.particleMoveSpeed.max * sliderValues["particleMoveSpeed"]
            p.y += sin(b) * sliderNames.particleMoveSpeed.max * sliderValues["particleMoveSpeed"]

            p.x += (p.x) * ((maxZoomSpeed * sliderValues["zoomSpeed"]) - (maxZoomSpeed / 2))
            p.y += (p.y) * ((maxZoomSpeed * sliderValues["zoomSpeed"]) - (maxZoomSpeed / 2))

            //Translation
            p.x += ((sliders["moveX"].value() - 0.5) * maxTranslationSpeed)
            p.y += ((sliders["moveY"].value() - 0.5) * maxTranslationSpeed)

        }
    }

    function spawnParticle(p, i, spawnRate) {
        spawnRandSizeX = maxSpawnRandSize * sliderValues.spawnRandomnessSizeX
        spawnRandSizeY = maxSpawnRandSize * sliderValues.spawnRandomnessSizeY

        spawnOffsetX = (sliders["spawnOffsetX"].value() - 0.5) * width
        spawnOffsetY = (sliders["spawnOffsetY"].value() - 0.5) * height

        maxSpawnOffsetMultiplier = width / spawnRate
        correctionX = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * sliders["spawnOffsetMultiplierX"].value()
        correctionY = ((maxSpawnOffsetMultiplier * spawnRate) / 2) * sliders["spawnOffsetMultiplierY"].value()

        spawnOffsetX += (i * sliders["spawnOffsetMultiplierX"].value() * maxSpawnOffsetMultiplier) - correctionX
        spawnOffsetY += (i * sliders["spawnOffsetMultiplierY"].value() * maxSpawnOffsetMultiplier) - correctionY

        //Just the randomness size
        p.x = random(-spawnRandSizeX, spawnRandSizeX) + spawnOffsetX;
        p.y = random(-spawnRandSizeY, spawnRandSizeY) + spawnOffsetY;

        //Add some circular movement
        iOfset = sliderValues.spawnOffsetMultiplierCircle * i * maxSpawnOffsetMultiplier
        p.x += cos(spawnCircleAngle) * spawnRadius * (maxSpawnRadius + iOfset)
        p.y += sin(spawnCircleAngle) * spawnRadius * (maxSpawnRadius + iOfset)
    }

    function preload() {
        imgs.push(loadImage('img/fish1.png'))
        imgs.push(loadImage('img/fish2.png'))
        imgs.push(loadImage('img/fish3.png'))
        imgs.push(loadImage('img/fish4.png'))
        imgs.push(loadImage('img/bubble1.png'))
        imgs.push(loadImage('img/bubble2.png'))
        imgs.push(loadImage('img/computer.png'))
        imgs.push(loadImage('img/cloud-999.png'))
    }

    function keyPressed() {

        const sceneKeys = ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "è", "y", "a", "s", "d", "f", "g", "h", "j", "k", "l", "ö"];

        let sceneNo = sceneKeys.indexOf(key)
        if (-1 !== sceneNo) {
            console.log("load Scene " + sceneNo)
            loadScene(sceneNo)
            return
        }

        if (key == " ") {
            console.log("Shuffle!")
            shuffleSliders()
            return
        }

        if (key === "m") {
            console.log("Toggle Menu")
            document.getElementById('visualsMenuContainer').classList.toggle("hide")
            document.getElementById('audio-sliders-container').classList.toggle("hide")
        }

        if (sliderKeys[key] === undefined) return
        currentSliderNo = key
        for (let i = 0; i < sliderKeys.length; i++) {
            divs[sliderKeys[i]].style('background-color', bgColor);
        }
        divs[sliderKeys[key]].style('background-color', higlightColor);
    }

    function shuffleSliders() {
        for (let key in sliders) {
            sliders[key].value(random(0, 1))
        }
    }

// function mouseWheel(event) {
//     // Adjust the slider value based on the scroll direction
//     const slider = sliders[sliderKeys[currentSliderNo]]
//     let newValue = slider.value() - event.delta / 1000;
//     newValue = constrain(newValue, slider.elt.min, slider.elt.max);
//     slider.value(newValue);
// }

    function saveScene(key) {
        //existing = localStorage.getItem("sliderScene" + key)
        // if (existing){
        //     console.log("Already existing " + key)
        //     return
        // }
        scenes.push({...sliderValues})
        let sceneNo = scenes.length
        console.log("Save Scene " + sceneNo)
        let string = JSON.stringify(scenes)
        localStorage.setItem("scenes", string)

        createSceneButton(sceneNo - 1)
        createSceneSliders(sceneNo - 1)
    }

    function updateScene() {
        scenes[activeScene] = {...sliderValues}
        console.log("Save Scene " + activeScene)
        let string = JSON.stringify(scenes)
        localStorage.setItem("scenes", string)
    }

    function createSceneButton(sceneNo) {
        let sceneCont = document.getElementById("sceneLinkContainer")
        let sceneLink = document.createElement("button")
        sceneLink.onclick = () => loadScene(sceneNo);
        sceneLink.innerHTML = `${sceneNo}`
        sceneLink.classList.add("sceneLink")

        if (sceneNo === activeScene) {
            sceneLink.classList.add("active")
        }
        sceneLink.id = "loadScene" + sceneNo
        //sceneLink.innerHTML = `<button onclick="loadScene(${sceneNo})">Scene ${sceneNo}</button>`
        sceneCont.appendChild(sceneLink)
    }

    function deleteScene() {
        document.getElementById("loadScene" + activeScene).remove()
        scenes.splice(activeScene, 1);
        console.log("Delete Scene " + activeScene)
        console.log(scenes)
        let string = JSON.stringify(scenes)
        localStorage.setItem("scenes", string)

        document.querySelectorAll('.sceneLink').forEach(e => e.remove());
        scenes.forEach((scene, i) => {
            createSceneButton(i)
            createSceneSliders(i)
        })
    }

    function loadScene(number) {

        console.log("Load Scene " + number)
        //console.log("length;") scenes.length
        activeScene = number
        if (!scenes[number]) {
            return
        }
        sliderValues = scenes[number]
        Object.keys(sliderNames).forEach(k => {
            if (sliderValues[k] !== null && sliderValues[k] !== undefined) {
                sliders[k].elt.value = sliderValues[k]
            }
        })

        let div = document.getElementById("sceneSliderContainer")
        div.classList.add("hide")

        document.querySelectorAll(".sceneLink.active").forEach(element => {
            element.classList.remove("active");
        });

        document.getElementById("loadScene" + number).classList.add("active")

    }


    function createPropertiesSliders() {

        let i = 0

        // Create sliders for all controls in the list
        let sliderContaier = document.getElementById("sliderContainer")

        for (let slider in sliderNames) {

            let sliderName = slider;
            divs[sliderName] = createDiv(`<span class="visual-labels">${i} ${sliderName}</span>`)
            divs[sliderName].addClass("visual-slider-entity")
            divs[sliderName].parent(sliderContaier)

            checkboxes[sliderName] = createCheckbox()
            checkboxes[sliderName].addClass("visualCheckboxes")
            checkboxes[sliderName].parent(divs[sliderName])

            sliders[sliderName] = createSlider(0, 1, sliderNames[sliderName].default, 0)
            sliders[sliderName].id(sliderName)
            sliders[sliderName].addClass("visualSliders")
            sliders[sliderName].parent(divs[sliderName]);
            sliders[sliderName].elt.addEventListener('input', updateSliderValue);

            i++
        }

    }

    function updateSceneSliders() {

        sceneMixer()

        let sceneSliderValueMap = []
        let totalValue = 0.01

        let sceneSliders = document.querySelectorAll(".sceneSlider")

        sceneSliders.forEach((elem, i) => {
            sceneSliderValueMap[i] = elem.value
            totalValue += Number(elem.value)
        })

        //Take the scenes and add the values of the sliders together

        for (let slider in sliderNames) {

            let valueFromScenes = 0

            sceneSliderValueMap.forEach((value, i) => {
                valueFromScenes += Number(scenes[i][slider] * value)
            })

            let newValue = valueFromScenes / totalValue
            sliders[slider].elt.value = newValue
            sliderValues[slider] = newValue
        }
    }

    function sceneMixer() {
        let div = document.getElementById("sceneSliderContainer")
        div.classList.remove("hide")

        document.querySelectorAll(".sceneLink.active").forEach(element => {
            element.classList.remove("active");
        });

        document.getElementById("selectSceneMixer").classList.add("active")
    }

    function updateSliderValue(evt) {
        sliderValues[evt.target.id] = Number(evt.target.value)
    }

    bc.onmessage = (event) => {
        let message = event.data.split(':');
        let value = message[1]
        setSceneSlider(message[0], value)
    };

    function setSceneSlider(no, value){
        document.getElementById("sceneSlider" + no).value = value
        updateSceneSliders()
    }


    function onScreen(v) {
        return v.x >= -width / 2 && v.x <= width / 2 && v.y >= -height / 2 && v.y <= height / 2;
    }

    function testPerformance() {
        background(0)
        color(1)
        stroke(1)
        text(frameRate(), 10, 10)
        for (i = 0; i < 100000000; i++) {
            eums = sliderNames.spawnOffsetMultiplierCircle.default
        }
        return
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

//Midi-------------------------------------

    function controlChange(control) {
        // use control.type, .channel, .currentSliderNo, .controllerName, .value

        currentSliderNo = control.controller.number

        slider = sliders[sliderKeys[currentSliderNo]]
        if (slider) {
            slider.elt.value = control.value
            sliderValues[sliderKeys[currentSliderNo]] = control.value
        }
    }

    function downloadScenes() {
        const filename = 'videsynth_scenes.json';
        const jsonStr = JSON.stringify(scenes);

        let file = new Blob([JSON.stringify(scenes, null, 2)], {type: "application/json"});
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);

    }


//Stolen from Ted Davis p5live.org
    function popStream(force) {
        let p5pop, p5popStream, p5popActive = true

        icon = {}
        icon.maximize = ""
        newBG = "black"

        if (force) {
            p5popActive = true;
        }
        // if(sketchLoaded && p5popActive){
        p5popStream = document.querySelector('canvas').captureStream()

        if (p5pop && !p5pop.closed) {
            p5pop.vid.srcObject = p5popStream;
        } else {
            // technique built upon : http://plnkr.co/edit/jDzbtPYrYItQ4peplOAN
            let popup_html = '<!DOCTYPE html><html><head><title>P5LIVE - VISUALS STREAM</title></head><body><div id="but" style="position:fixed;right:5px;top:5px;z-index:10;border:none;color:#fff;padding:5px;font-size:16pt;cursor:pointer;opacity:.5;" onmouseenter="this.style.opacity=1;" onmouseleave="this.style.opacity=.5;" onclick="openFullscreen();" title="Fullscreen">' + icon.maximize + '</div><br><video id="vid" playsinline autoplay muted style="position:fixed;left:0;top:0;width:100vw;height:100vh;background-color:#000;"></video><script>var vid=document.getElementById("vid");document.body.style.margin="0";document.body.style.background="' + newBG + '";function openFullscreen(){if(vid.requestFullscreen) {vid.requestFullscreen(); } else if (vid.mozRequestFullScreen) { /* Firefox */ vid.mozRequestFullScreen();}else if(vid.webkitRequestFullscreen) {/* Chrome, Safari & Opera */ vid.webkitRequestFullscreen();}else if(vid.msRequestFullscreen){/* IE/Edge */ vid.msRequestFullscreen();}}<\/script><style>::-webkit-media-controls {display:none !important;}<\/style></body></html>';
            let popup_url = URL.createObjectURL(new Blob([popup_html], {
                type: 'text/html'
            }));
            p5pop = window.open(popup_url, "P5LIVE - VISUALS STREAM", 'left=0,top=0,width=0,height=0');
            URL.revokeObjectURL(popup_url);
            p5pop.onload = function () {
                p5pop.vid.srcObject = p5popStream;
                // let ctrls = p5pop.document.getElementById("controldiv");
                // ctrls.disabled="true";
            }

            var p5popTick = setInterval(function () {
                if (p5pop.closed) {
                    p5popActive = false;
                    clearInterval(p5popTick);
                }
            }, 500);
        }
        // }
    }