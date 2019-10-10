/******************************************************************************
* (c) 2005-2015 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

const sleep = require('sleep');
const rti   = require('rticonnextdds-connector');

const connector = new rti.Connector("MyParticipantLibrary::Zero",__dirname + "/../ShapeExample.xml");
const input = connector.getInput("MySubscriber::MySquareReader");
const output = connector.getOutput("MyPublisher::MySquareWriter");

connector.on('on_data_available',
   function() {
     input.take();
     for (var i=0; i < input.samples.getLength(); i++) {
         if (input.infos.isValid(i)) {
             //get the received sample
             const mysample = input.samples.getJSON(i)
             //change the color
             mysample.color = 'YELLOW'
            //set the sample to write
            output.instance.setFromJSON(mysample);
            //write
            console.log("Writing...");
            output.write();
         }
     }

});

console.log("Waiting for data");
