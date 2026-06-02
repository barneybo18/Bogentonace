#!/usr/bin/env node

/**
 * SAP Setup Verification Script
 * Checks if your environment is ready to register an agent on Synapse Agent Protocol
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const checks: CheckResult[] = [];

function check(name: string, passed: boolean, message: string) {
  checks.push({ name, passed, message });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${message}`);
}

async function main() {
  console.log("\n🔍 SAP Setup Verification\n");
  console.log("Checking prerequisites for agent registration...\n");

  // 1. Check .env.local exists
  const envPath = path.join(__dirname, ".env.local");
  const envExists = fs.existsSync(envPath);
  check("Environment file", envExists, envExists ? ".env.local found" : ".env.local not found");

  // 2. Check required env vars
  if (envExists) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const rpcUrlExists = envContent.includes("SYNAPSE_RPC_URL");
    const keyExists = envContent.includes("SOLANA_PRIVATE_KEY");

    check("RPC URL", rpcUrlExists, rpcUrlExists ? "SYNAPSE_RPC_URL configured" : "SYNAPSE_RPC_URL missing");
    check("Private Key", keyExists, keyExists ? "SOLANA_PRIVATE_KEY configured" : "SOLANA_PRIVATE_KEY missing");
  }

  // 3. Check SAP SDK is installed
  const nodeModulesPath = path.join(__dirname, "node_modules", "@oobe-protocol-labs", "synapse-sap-sdk");
  const sdkInstalled = fs.existsSync(nodeModulesPath);
  check(
    "SAP SDK",
    sdkInstalled,
    sdkInstalled ? "@oobe-protocol-labs/synapse-sap-sdk installed" : "SDK not installed - run 'npm install'"
  );

  // 4. Check package.json has register-agent script
  const pkgPath = path.join(__dirname, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const scriptExists = pkg.scripts?.["register-agent"];
  check(
    "NPM Script",
    !!scriptExists,
    scriptExists ? "register-agent script available" : "register-agent script missing"
  );

  // 5. Check sapClient.ts exists
  const sapClientPath = path.join(__dirname, "lib", "sapClient.ts");
  const sapClientExists = fs.existsSync(sapClientPath);
  check("SAP Client", sapClientExists, sapClientExists ? "lib/sapClient.ts found" : "lib/sapClient.ts missing");

  // 6. Check registerAgent.ts exists
  const registerScriptPath = path.join(__dirname, "scripts", "registerAgent.ts");
  const registerScriptExists = fs.existsSync(registerScriptPath);
  check(
    "Register Script",
    registerScriptExists,
    registerScriptExists ? "scripts/registerAgent.ts found" : "scripts/registerAgent.ts missing"
  );

  // Summary
  console.log("\n" + "=".repeat(50));
  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  console.log(`\nResults: ${passed}/${total} checks passed\n`);

  if (passed === total) {
    console.log("🎉 Your environment is ready!");
    console.log("\nNext steps:");
    console.log("  1. Ensure you have SOL in your wallet");
    console.log("  2. Run: npm run register-agent");
    console.log("  3. Save the agent public key to .env.local");
    console.log();
  } else {
    console.log("⚠️  Please fix the issues above before registering.\n");
    console.log("Common fixes:");
    console.log("  - Run: npm install");
    console.log("  - Check SYNAPSE_RPC_URL and SOLANA_PRIVATE_KEY in .env.local");
    console.log("  - Verify SAP SDK package is installed");
    console.log();
  }

  process.exit(passed === total ? 0 : 1);
}

main();
