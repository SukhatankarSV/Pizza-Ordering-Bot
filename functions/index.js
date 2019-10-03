'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

admin.initializeApp({
	credential: admin.credential.applicationDefault(),
  	databaseURL: 'ws://quiet-dryad-162004.firebaseio.com/'
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  function checkstatus()
  {
    return admin.database().ref('data').once('value').then((snapshot)=>{
    	const value=snapshot.child('orderstatus').val();
    	if(value===true){
         	agent.add('Your order has been placed successfully and ready to dispatch. Thank you for buying from YoYo Pizza!');
        }
      	else{
          	agent.add('Order request failed. Please reorder. What size of pizza do you want - samll, medium or large?');
        }
  	});
  }
  
  function addorder(agent){
    const pizzatype = agent.parameters.pizza_type;
    const pizzasize = agent.parameters.pizza_size;
    const pizzacount = agent.parameters.number;
    const pizzatoppings=agent.parameters.pizza_toppings;
    const custname=agent.parameters.personname;
    const custaddress=agent.parameters.address;
    const custphone=agent.parameters.phone_number;
    const orderstatus=true;
   
    return admin.database().ref('data').set({
    	pizzatype: pizzatype,
      	pizzasize: pizzasize,
      	pizzacount: pizzacount,
      	pizzatoppings: pizzatoppings,
      	orderstatus: orderstatus,
        customername: custname,
        customerphone: custphone,
        customeraddress: custaddress
    });
  }
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Welcome', addorder);
  intentMap.set('Check Status',checkstatus);
  agent.handleRequest(intentMap);
});