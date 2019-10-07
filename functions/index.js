'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

var orderid='';

var pizzatype=null;
var pizzasize=null;
var pizzatoppings=null;
var pizzacount=null;
var custname=null;
var custaddress=null;
var custphone=null;
var dbref;
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
    agent.add(`Welcome to YoYo Pizza!`);
    agent.add('Hi');
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function checkStatus()
  {
    return admin.database().ref('data').once('value').then((snapshot)=>{
    	const value=snapshot.child('orderstatus').val();
    	if(value==='placed'){
          	var psize=snapshot.child('pizzasize').val();
            var ptype=snapshot.child('pizzatype').val();
            var ptop=snapshot.child('pizzatoppings').val();
            var pcnt=snapshot.child('pizzacount').val();
            var pcname=snapshot.child('customername').val();
            var pcadd=snapshot.child('customeraddress').child('business-name').val()+" "+snapshot.child('customeraddress').child('street-address').val()+" "+snapshot.child('customeraddress').child('city').val();
          	var pcphone=snapshot.child('customerphone').val();
          	var pcost=snapshot.child('pizzacost').val();
          	agent.add('Your order with orderid '+ snapshot.child('orderID').val() +' has been placed successfully and ready to dispatch.'+' Your Order details - \n1. Pizza Size:'+ psize+' \n2. Pizza Type:'+ptype+' \n3. Pizza toppings:'+ptop+' \n4. Pizza Count:'+pcnt+' \n5. Customer Name:'+pcname+' \n6. Customer Address:'+pcadd+' \n7. Customer Phone:'+pcphone +'\n8. Pizza Cost:'+pcost+'.'+ 'Thank you for buying from YoYo Pizza!');
        }
      	else{
          	agent.add('Order request failed. Please reorder. What size of pizza do you want - small, medium or large?');
        }
  	});
  }
  function getPizzaType(agent){
   		pizzatype=agent.parameters["pizza_type"];
        dbref=admin.database().ref('data');
        return dbref.update({
            pizzatype: pizzatype
        });
  }
  function getPizzaSize(agent){
   		pizzasize=agent.parameters["pizza_size"];
        var cost=0;
        if(pizzasize==="small" || pizzasize==="Small")
          cost=95;
    	else if(pizzasize==="medium" || pizzasize==="Medium")
          cost=195;
   		else
          cost=395;
    	dbref=admin.database().ref('data');
        return dbref.update({
                pizzasize: pizzasize,
          		pizzacost:cost
            });
  }
  function getPizzaToppings(agent){
   		pizzatoppings=agent.parameters["pizza_toppings"];
    	dbref=admin.database().ref('data');
    	return dbref.update({
            pizzatoppings: pizzatoppings
        });
  }
  function getPizzaCount(agent){
   		pizzacount=agent.parameters["number"];
    	dbref=admin.database().ref('data');
    	return dbref.update({
            pizzacount: pizzacount
        });
  }
  function getPizzaCustomerName(agent){
   		custname=agent.parameters["personname"];
    	dbref=admin.database().ref('data');
    	return dbref.update({
            customername: custname
        });
  }
  function getPizzaCustomerAddress(agent){
   		custaddress=agent.parameters["address"];
   		dbref=admin.database().ref('data');
    	return dbref.update({
            customeraddress: custaddress
        });
  }
  function getPizzaCustomerPhone(agent){
   		 custphone=agent.parameters["phone_number"];
    	 
         var result='';
         var characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
         var charactersLength=characters.length;
         for ( var i = 0; i < 10; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
         }
    	orderid=result;
        
    	dbref=admin.database().ref('data');
    	agent.add('Your Order with Order ID '+result+' has been confirmed. To check current status, type "status". ' );
    	return dbref.update({
            customerphone: custphone,
          	orderID: orderid,
          	orderstatus: 'placed'
          	//orderID:result
          
        });
  }
  
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('sizetotype',getPizzaSize);
  intentMap.set('order',getPizzaType);
  intentMap.set('topping_confirm',getPizzaToppings);
  intentMap.set('pizza_count',getPizzaCount);
  intentMap.set('Get Name',getPizzaCustomerName);
  intentMap.set('Get Address',getPizzaCustomerAddress);
  intentMap.set('Get Phone',getPizzaCustomerPhone);
  //intentMap.set('sizetotype',getPizzaSize);
  intentMap.set('Check Order Status',checkStatus);
  agent.handleRequest(intentMap);
});