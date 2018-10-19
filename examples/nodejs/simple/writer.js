/******************************************************************************
* (c) 2005-2015 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var sleep = require('sleep');
var rti   = require('rticonnextdds-connector');

var connector = new rti.Connector("MyParticipantLibrary::Zero",__dirname + "/../ShapeExample.xml");
var output = connector.getOutput("MyPublisher::MySquareWriter");

var i =0;
for (;;) {
    /* We clear the instance associated to this output
       otherwise the sample will have the values set in the
       previous iteration
    */
    output.clear_members();
    i = i + 1;
    output.instance.setNumber("x",i);
    output.instance.setNumber("y",i*2);
    output.instance.setNumber("shapesize",30);
    output.instance.setString("color", "BLUE");
    console.log("Writing...");
    output.write();
    sleep.sleep(2);
}
