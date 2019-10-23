# Nodejs Testing Documentation

To run the tests for nodejs binding of **rticonnextdds_connector**:

1. Install [chai](http://chaijs.com/) assertion library, [chai-as-promised](https://github.com/domenic/chai-as-promised) which extends *chai* to work with Promise,
[sinon](http://sinonjs.org/) for test spies and [mocha](https://mochajs.org/) testing framework with:

  ```
  npm install chai
  npm install chai-as-promised
  npm install mocha 
  npm install sinon 
  ```

2. To execute all the tests, issue the following command from the base directory: 
  
   ``mocha ./test/nodejs``
  
   To execute each test individually, also include the name of the test file: 
  
   ``mocha ./test/nodejs/test_rticonnextdds_dataflow.js``

Nodejs tests are organized as follows:

1. ``test_rticonnextdds_connector.js``: Contains tests for ``rticonnextdds_connector.Connector`` object
2. ``test_rticonnextdds_input.js``: Contains tests for ``rticonnextdds_connector.Input`` object
3. ``test_rticonnextdds_output.js``: Contains tests for ``rticonnextdds_connector.Output`` object
4. ``test_rticonnextdds_dataflow.js``: Tests the dataflow between an ``rticonnextdds_connector.Input`` and ``rticonnextdds_connector.Output`` object.
5. ``test_rticonnextdds_data_access.js``: Tests the methods available for accessing the data on ``Input`` and ``Output`` objects.
6. ``test_rticonnextdds_data_iterators.js``: Contains tests for the data access iterators implemented by ``rticonnextdds_connector.ValidSampleIterator`` and ``rticonnextdds_connector.SampleIterator`` objects.
7. ``test_rticonnextdds_metadata.js``: Contains tests for the ``rticonnextdds_connector.SampleInfo`` object.
8. ``test_rticonnextdds_discovery.js``: Tests the discovery mechanism between an ``rticonnextdds_connector.Input`` and ``rticonnextdds_connector.Output`` object.
