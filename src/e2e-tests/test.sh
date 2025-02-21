#!/bin/bash

WORKSPACE_PATH="./src/e2e-tests/workspace-success"
TEMPLATE_FILE="firestore.rules.template"
OUTPUT_FILE="firestore.rules"


# 测试1 将根目录下的和outputfile同名的文件覆盖
echo "Running Test 1: Successful Merge"
node ./dist/src/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE"
if [ -f "$WORKSPACE_PATH/$OUTPUT_FILE" ]; then
  echo "Test 1 Passed: File $OUTPUT_FILE generated successfully."
else
  echo "Test 1 Failed: $OUTPUT_FILE not generated."
fi

WORKSPACE_PATH="./src/e2e-tests/workspace-success-double-template"
echo "Running Test 2: Multiple Template Files"
node ./dist/src/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE"
if [ -f "$WORKSPACE_PATH/$OUTPUT_FILE" ]; then
  echo "Test 1 Passed: File $OUTPUT_FILE generated successfully."
else
  echo "Test 1 Failed: $OUTPUT_FILE not generated."
fi


echo "Running Test 3: firestore.rules Skipped"
WORKSPACE_PATH="./src/e2e-tests/workspace-success-firestore-existed"
node ./dist/src/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE"
if grep -q "firestore.rules" "$WORKSPACE_PATH/$OUTPUT_FILE"; then
  echo "Test 3 Failed: firestore.rules should be skipped."
else
  echo "Test 3 Passed: firestore.rules correctly skipped."
fi
# ========== Run Tests ==========


echo "Running Test 4: No .rules Files Found"

WORKSPACE_PATH="./src/e2e-tests/workspace-error-no-rules"

# Run the command and capture the error message
error_message=$(node ./dist/src/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE" 2>&1)

# Check if the error message contains NO_RULE_FILE_TO_MERGE
if [[ "$error_message" == *"No rule file need to merged, exit."* ]]; then
  echo "Test 4 Passed (Correctly threw NO_RULE_FILE_TO_MERGE error)"
else
  echo "Test 4 Failed"
  echo "Actual output: $error_message"
fi

# 测试 5: 没有指定的template文件
echo "Running Test 5: Missing Template File"

WORKSPACE_PATH="./src/e2e-tests/workspace-error-no-template-file"

# Run the command and capture the error message
error_message=$(node ./dist/src/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE" 2>&1)

# Check if the error message contains SR_TEMPLATE_NOT_FOUND_ERROR
if [[ "$error_message" == *"Cannot find SR Template:$TEMPLATE_FILE"* ]]; then
  echo "Test 5 Passed (Correctly threw SR_TEMPLATE_NOT_FOUND_ERROR)"
else
  echo "Test 5 Failed"
  echo "Actual output: $error_message"
fi
