#!/bin/bash

WORKSPACE_PATH="../src/e2e-tests/workspace"
TEMPLATE_FILE="firestore.rules.template"
OUTPUT_FILE="firestore.rules"

rm -f "$WORKSPACE_PATH/$OUTPUT_FILE"

echo "Running Test 1: Successful Merge"
node ../fire-merge/dist/index.js --workspace_path "$WORKSPACE_PATH" --root_sr_template "$TEMPLATE_FILE" --root_sr_file "$OUTPUT_FILE"
if [ -f "$WORKSPACE_PATH/$OUTPUT_FILE" ]; then
  echo "Test 1 Passed: File $OUTPUT_FILE generated successfully."
else
  echo "Test 1 Failed: $OUTPUT_FILE not generated."
fi
