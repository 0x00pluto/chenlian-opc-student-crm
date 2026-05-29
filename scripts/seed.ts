import { runSeed } from "../src/lib/seed";

runSeed()
  .then((result) => {
    console.log("Seed completed.");
    for (const a of result.accounts) {
      console.log(`  ${a.email} - ${a.role}`);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
