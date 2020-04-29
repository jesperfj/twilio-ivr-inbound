const datastore = require(Runtime.getFunctions()['datastore'].path);
const ivrlib = require(Runtime.getFunctions()['ivrlib'].path);

exports.handler = function(context, event, callback) {
  try {

    const contacts = datastore.datastore(context)

    const ivr = new ivrlib.IVR(context, event, callback)

    console.log(event)

    ivr.step.welcome = async (context,event,twiml) => {
      const contact = await contacts.getContact(event.Caller)
      if(contact) {
        // Known
        twiml
        .gather({ input: "speech", action: ivr.nextstep("storeFavoriteColor") })
        .say({voice: 'Polly.Amy-Neural'}, `Hi ${contact.name}. What is your favorite color?`
        )
      } else {
        // Stranger
        twiml
        .gather({ input: "speech", action: ivr.nextstep("storeName") })
        .say({voice: 'Polly.Amy-Neural'}, `Hi Stranger. What is your name?`
        )

      }
    }

    ivr.step.storeName = async (context,event,twiml) => {
      const callerName = event.SpeechResult
      await contacts.putContact({ phoneNumber: event.Caller, name: callerName })
      twiml.say(`Thank you, ${callerName}`)
    }

    ivr.step.storeFavoriteColor = async (context,event,twiml) => {
      // find contact in our database from phone number
      const contact = await contacts.getContact(event.Caller)
      if(contact) {
        // known caller
        await contacts.putContact({...contact, favoriteColor: event.SpeechResult})
      } else {
        // new contact
        await contacts.putContact({
          phoneNumber: event.Caller, 
          name: "Unknown", 
          favoriteColor: event.SpeechResult
        })
      }
      twiml.say("Thank you!")
    }

    ivr.runstep()
  }
  catch(error) {
    console.error("Exception during function call: "+error)
    console.error(error.stack)
  }
}
