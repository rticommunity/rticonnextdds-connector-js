Release Notes
=============

Supported Platforms
~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* has been tested with Node.js versions 8.7.0, 
10.4.0 and 11.15.0. 

*Connector* currently does not work with Node.js 12 because some of its 
dependencies, such as *ffi* are not yet compatible with this version.

*Connector* uses a native C library that works on most Windows®, Linux® and
macOS® platforms. It has been tested on the following systems:

    * Windows: Windows 7 and Windows 10
    * x86/x86_64 Linux: CentOS 7.6, 8.0; Ubuntu® 18.04; SUSE® 15
    * Arm® Linux (Raspberry Pi)
    * Mac®: OS X 10.10.2, macOS 10.12.2, macOS 10.14

*Connector* is supported in other languages in addition to JavaScript, see
`the main Connector
repository <https://github.com/rticommunity/rticonnextdds-connector>`__.

RTI Connext DDS Version
~~~~~~~~~~~~~~~~~~~~~~~
The library used by *Connector* is built on top of *RTI Connext DDS* 6.0.1.
