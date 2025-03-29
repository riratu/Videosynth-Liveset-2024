import { updateSound, controlChange } from './audio.js';

let idIn = "USB MIDI ADC 64";
let midiInput

setupMidi(idIn)

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
        if (!midiInput) {
            console.log("Know Controller " + idIn + " not found")
            return
        }

        // if(typeof idOut === 'number') {
        //     midiOutput = WebMidi.outputs[idOut]
        // } else {
        //     midiOutput - WebMidi.getOutputByName(idOut)
        // }

        // midiInput.addListener('midimessage', 'all', function(e) {
        //     if(midiThru) {
        //         if(e.data.length == 3) {
        //             midiOutput.send(e.data[0], [e.data[1], e.data[2]])
        //         } else {
        //             midiOutput.send(e.data[0])
        //         }
        //     }
        //     let midiMsg = {}
        //     midiMsg.data = e.data
        //     midiMsg.timestamp = e.timestamp
        //     // parseMidi(midiMsg) // optionally send raw only
        // })

        // controlChange
        midiInput.addListener('controlchange', "all", function(e) {
            controlChange(e)
        })
    })
}

