#!/usr/bin/env node

import { fetchCLIArguments, mergeSecurityRules } from "./merge-security-rules.js";

function run() {
  console.info('Starting Security Rule Merger...');

  try {
    fetchCLIArguments(mergeSecurityRules);
    console.info('Security rules merged successfully!');
  } catch (error) {
    console.error('Error merging security rules:', error);
  }
}

run();
