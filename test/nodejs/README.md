# Nodejs Testing Documentation

To run the tests for nodejs binding of **rticonnextdds_connector**:

1. To execute all the tests, issue the following command from the base directory:

   ```console
   npm test
   ```

   Or directly with `node`:

   ```console
   node --test --test-concurrency=1 ./test/nodejs/test_*.js
   ```

   To execute each test individually, also include the name of the test file:

   ```console
   node --test ./test/nodejs/test_rticonnextdds_dataflow.js
   ```

   To produce a JUnit XML report:

   ```console
   npm run test-junit
   ```

Nodejs tests are organized as follows:

1. ``test_rticonnextdds_connector.js``: Contains tests for ``rticonnextdds_connector.Connector`` object
2. ``test_rticonnextdds_input.js``: Contains tests for ``rticonnextdds_connector.Input`` object
3. ``test_rticonnextdds_output.js``: Contains tests for ``rticonnextdds_connector.Output`` object
4. ``test_rticonnextdds_dataflow.js``: Tests the dataflow between an ``rticonnextdds_connector.Input`` and ``rticonnextdds_connector.Output`` object.
5. ``test_rticonnextdds_data_access.js``: Tests the methods available for accessing the data on ``Input`` and ``Output`` objects.
6. ``test_rticonnextdds_data_iterators.js``: Contains tests for the data access iterators implemented by ``rticonnextdds_connector.ValidSampleIterator`` and ``rticonnextdds_connector.SampleIterator`` objects.
7. ``test_rticonnextdds_metadata.js``: Contains tests for the ``rticonnextdds_connector.SampleInfo`` object.
8. ``test_rticonnextdds_discovery.js``: Tests the discovery mechanism between an ``rticonnextdds_connector.Input`` and ``rticonnextdds_connector.Output`` object.
