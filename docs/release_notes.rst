Release Notes
=============

Version 1.0.0
~~~~~~~~~~~~~

1.0.0 is the first official release of *RTI Connector for JavaScript* as well as
`RTI Connector for Python <https://community.rti.com/static/documentation/connector/1.0.0/api/python/index.html>`__.

If you had access to previous experimental releases, this release makes the product
more robust, modifies many APIs and adds new functionality. However the old 
APIs have been preserved for backward compatibility as much as possible.

*RTI Connector* 1.0.0 is built on `RTI Connext DDS 6.0.1 <https://community.rti.com/documentation/rti-connext-dds-601>`__.

Supported Platforms
~~~~~~~~~~~~~~~~~~~

*RTI Connector for JavaScript* has been tested with Node.js versions
10.4.0, 11.15.0 and 12.13.0.

*Connector* uses a native C library that works on most Windows®, Linux® and
macOS® platforms. It has been tested on the following systems:

  **Linux**
  * CentOS™ 6.0, 6.2-6.4, 7.0 (x64)
  * Red Hat® Enterprise Linux 6.0-6.5, 6.7, 6.8, 7, 7.3, 7.5, 7.6, 8  (x64)
  * SUSE® Linux Enterprise Server 12 SP2  (x64)
  * Ubuntu® 14.04, 18.04, 20.04 LTS (x64)
  * Ubuntu 18.04 LTS (64-bit Arm® v8)
  * Wind River® Linux 8 (Arm v7) (Custom-supported platform)
    
**macOS**  
  * macOS 10.13-10.15 (x64)
    
**Windows**    
  * Windows 8 (Visual Studio® 2013) (x64)
  * Windows 10 (Visual Studio 2015, 2017, 2019) (x64)
  * Windows Server 2012 R2 (Visual Studio 2013) (x64)
  * Windows Server 2016 (Visual Studio 2015, 2017, 2019) (x64)

*Connector* is supported in other languages in addition to JavaScript, see
`the main Connector
repository <https://github.com/rticommunity/rticonnextdds-connector>`__.


Support for Security, Monitoring and other Connext DDS add-on libraries
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

.. CON-221

It is now possible to load additional Connext DDS libraries at runtime. This means
that Connext DDS features such as Monitoring and Security Plugins are now supported.
Refer to :ref:`Loading Connext DDS Add-On Libraries` for more information.
