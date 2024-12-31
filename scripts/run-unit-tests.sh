#!/bin/bash

# Run Jest tests sequentially and generate coverage reports
jest --runInBand --detectOpenHandles --forceExit --coverage
