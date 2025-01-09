
import { fetchCLIArguments, mergeSecurityRules } from "./merge-security-rules";

export default function run() {
  fetchCLIArguments(mergeSecurityRules);
}

run();
