function noteOn(note) {
    console.log(note)
    // use note.type, .channel, .name, .number, .octave, .velocity
    let x = map(note.number, 0, 128, 0, width)
    let h = map(note.velocity, 0, 128, 0, height)
    switch(note.number){
        case 36: beat = 1;
            break;
        case 37: beat2 = 1;
            break;
        case 38: beat3 = 1;
            break;
        case 39: beat4 = 0.01;
            break;
    }
}

function noteOff(note) {
    switch(note){
        case 36: //beat = 1;
            break;
        case 37: //beat2 = 1;
            break;
        case 38: //beat3 = 1;
            break;
        case 39: beat4 = 0.0;
            break;
    }
    // use note.type, .channel, .name, .number, .octave, .velocity
}

function pitchBend(pitch) {
// use pitch.type, .channel, .value
}

function sendNote(channel, note, octave, duration, velocity) {
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
    } else if(mm.pitch != undefined) {
        pitchBend(mm.pitch)
    } else if(mm.control != undefined) {
        controlChange(mm.control)
    }
}

function setupMidi(idIn, idOut) {

    WebMidi.enable(function(err) {
        if(err) {
            console.log("WebMidi could not be enabled.", err);
        }

        // Print to console available MIDI in/out id/names
        WebMidi.inputs.forEach(function(element, c) {
            console.log("in  \[" + c + "\] " + element.name)
        });
        WebMidi.outputs.forEach(function(element, c) {
            console.log("out  \[" + c + "\] " + element.name)
        });

        // assign in channel:
        if(typeof idIn === 'number') {
            midiInput = WebMidi.inputs[idIn]
        } else {
            midiInput = WebMidi.getInputByName(idIn)
        }

        if(typeof idOut === 'number') {
            midiOutput = WebMidi.outputs[idOut]
        } else {
            midiOutput - WebMidi.getOutputByName(idOut)
        }
        if (!midiInput) {
            console.log("Midi Device " + idOut + " not found")
            return
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
            // parseMidi(midiMsg) // optionally send raw only
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
            note.velocity = floor(127 * e.velocity)

            midiMsg.note = note
            parseMidi(midiMsg)
        })

        // noteOff
        // midiInput.addListener('noteoff', "all", function(e) {
        // 	let note = {
        // 		type: 'noteoff'
        // 	}

        // 	midiMsg.note = note
        // 	parseMidi(midiMsg)
        // })

        // pitchBend
        midiInput.addListener('pitchbend', "all", function(e) { console.log(control)})

        // controlChange
        midiInput.addListener('controlchange', "all", function(e) {
            controlChange(e)
        })
    })
}