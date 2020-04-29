// This is a stab at some library code that simplifies writing IVRs in Node.js and Twilio Functions.
// It can eventually be moved to an npm package as a proper library.

async function defaultWelcome(context,event,twiml) {
  twiml.say("This is the default welcome message for I V R lib")
  return null
}

class IVR {
  //step = {}
  constructor(context, event, callback) {
    console.log(context)
    this.step = {}
    this.step.welcome = defaultWelcome
    this.context = context
    this.event = event
    this.callback = callback
    this.twiml = new Twilio.twiml.VoiceResponse()
  }

  runstep() {
    let currentStep = this.step.welcome
    let action = "welcome"
    if(this.event.action) {
      currentStep = this.step[this.event.action]
      action = this.event.action
    }
    console.log(`Executing step ${action}`)
    try {
      // This is needed to get them into the closure of the anonymous functions
      // below. Maybe there is a better way :-)
      const cb = this.callback
      const tw = this.twiml
      currentStep(this.context,this.event,this.twiml).then(function(result) {
        cb(null,tw)
      },function(error) {
        console.log("Error executing step: "+error)
        cb(null,tw)
      })
    } catch(error) {
      console.log("Exception: "+error)
      this.twiml.say("Exception")
      this.callback(null,this.twiml)
    }
  }

  nextstep(name) {
    return `${this.context.PATH}?action=${name}`
  }
}

module.exports = {
  IVR
}