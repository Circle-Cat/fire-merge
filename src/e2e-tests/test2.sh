#!/bin/bash

# Define template file and output file
TEMPLATE_FILE="firestore.rules.template"
OUTPUT_FILE="firestore.rules"

run_test() {
  local test_name="$1"
  local workspace_path="$2"
  local expected_exception="$3"

  echo "Running $test_name"

  # Run the command and capture error message
  error_message=$(node ./dist/src/index.js --workspace_path "$workspace_path" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE" 2>&1)

  # Get the exit status of the command
  local exit_status=$?

  # Check if the command was expected to succeed
  if [ "$expected_exception" == "none" ]; then
    if [ $exit_status -eq 0 ]; then
      echo "$test_name Passed"
    else
      echo "$test_name Failed (Expected success, but failed)"
      echo "Error: $error_message"
    fi
  else
    # If an exception was expected, check if the error message matches
    if [[ "$error_message" == *"$expected_exception"* ]]; then
      echo "$test_name Passed (Correctly threw error: $expected_exception)"
    else
      echo "$test_name Failed"
      echo "Expected error: $expected_exception"
      echo "Actual output: $error_message"
    fi
  fi
}

# ========== Run Tests ==========

# Test 1: Successful merge
run_test "Test 1: Successful Merge" "./src/e2e-tests/workspace-success" "none"

# Test 2: Multiple template files, should still succeed
run_test "Test 2: Multiple Template Files" "./src/e2e-tests/workspace-success-double-template" "none"

# Test 3: No .rules files found (should throw NO_RULE_FILE_TO_MERGE error)
run_test "Test 3: No .rules Files Found" "./src/e2e-tests/workspace-error-no-rules" "NO_RULE_FILE_TO_MERGE"

# Test 4: Missing template file (should throw SR_TEMPLATE_NOT_FOUND_ERROR)
run_test "Test 4: Missing Template File" "./src/e2e-tests/workspace-error-no-template-file" "SR_TEMPLATE_NOT_FOUND_ERROR"

# Test 5: Overwrite existing firestore.rules
WORKSPACE_PATH="./src/e2e-tests/workspace-success-firestore-existed"
echo "Running Test 5: Overwrite Existing firestore.rules"

# Pre-create an old firestore.rules file
echo "// OLD CONTENT, SHOULD BE OVERWRITTEN" > "$WORKSPACE_PATH/$OUTPUT_FILE"

# Run the command
node ./dist/src/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE"

# Check if the old content still exists
if grep -q "// OLD CONTENT, SHOULD BE OVERWRITTEN" "$WORKSPACE_PATH/$OUTPUT_FILE"; then
  echo "Test 5 Failed (firestore.rules was not properly overwritten)"
else
  echo "Test 5 Passed (firestore.rules successfully overwritten)"
fi

echo "All tests completed."
