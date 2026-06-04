import { loadEnvFiles } from "../src/lib/load-env";

loadEnvFiles();

import { runSeed } from "../src/lib/seed";

runSeed()
  .then((result) => {
    console.log("Seed completed.", result.stats);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
