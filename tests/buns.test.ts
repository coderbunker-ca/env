import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(process.cwd(), "tmp-buns-test");
const BUNS_BIN = join(process.cwd(), "scripts/buns.sh");
const VALIDATE_SCRIPT = join(process.cwd(), "scripts/validate-env.ts");

describe("buns script", () => {
  beforeAll(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR);
    // Ensure scripts are executable
    spawnSync("chmod", ["+x", BUNS_BIN]);
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  test("proxies --version to bun", () => {
    const result = spawnSync(BUNS_BIN, ["--version"], {
      cwd: TEST_DIR,
      env: { ...process.env, VALIDATE_SCRIPT_PATH: VALIDATE_SCRIPT },
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  test("validates environment against src/configSchema.ts", () => {
    const serviceDir = join(TEST_DIR, "validation-test");
    mkdirSync(serviceDir);
    mkdirSync(join(serviceDir, "src"));

    // Create a dummy schema and a mock zod to avoid dependency issues in the test
    mkdirSync(join(serviceDir, "node_modules/zod"), { recursive: true });
    writeFileSync(
      join(serviceDir, "node_modules/zod/index.js"),
      `const z = {
        string: () => ({}),
        object: (obj) => ({ safeParse: (env) => {
          const issues = [];
          for (const key in obj) { if (!env[key]) issues.push({ path: [key], message: "Required" }); }
          return issues.length ? { success: false, error: { issues } } : { success: true, data: env };
        } })
      };
      module.exports = { z };`
    );
    writeFileSync(
      join(serviceDir, "node_modules/zod/package.json"),
      `{ "name": "zod", "main": "index.js", "version": "3.0.0" }`
    );

    writeFileSync(
      join(serviceDir, "src/configSchema.ts"),
      `import { z } from "zod"; export const configSchema = z.object({ TEST_VAR: z.string() });`
    );

    // Should fail without TEST_VAR
    const failResult = spawnSync(BUNS_BIN, ["--version"], {
      cwd: serviceDir,
      env: { ...process.env, VALIDATE_SCRIPT_PATH: VALIDATE_SCRIPT },
      encoding: "utf-8",
    });
    expect(failResult.status).toBe(1);
    expect(failResult.stderr).toContain("Environment validation failed");

    // Should pass with TEST_VAR
    const passResult = spawnSync(BUNS_BIN, ["--version"], {
      cwd: serviceDir,
      env: { ...process.env, TEST_VAR: "present", VALIDATE_SCRIPT_PATH: VALIDATE_SCRIPT },
      encoding: "utf-8",
    });
    expect(passResult.status).toBe(0);
    expect(passResult.stdout).toContain("Environment validation passed");
  });

  // Note: Testing actual SOPS decryption in a standalone test is tricky without a real key.
  // We can test that it ATTEMPTS to load if local.enc.env exists.
  test("attempts to load local.enc.env if present", () => {
    const sopsDir = join(TEST_DIR, "sops-test");
    mkdirSync(sopsDir);
    writeFileSync(join(sopsDir, "local.enc.env"), "DUMMY_DATA");

    const result = spawnSync(BUNS_BIN, ["--version"], {
      cwd: sopsDir,
      env: { ...process.env, VALIDATE_SCRIPT_PATH: VALIDATE_SCRIPT },
      encoding: "utf-8",
    });

    // It should fail because DUMMY_DATA is not a valid SOPS file
    expect(result.status).toBe(1);
  });
});
