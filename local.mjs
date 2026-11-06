// Run the scraper on your PC: npm run local
import { handler } from './index.mjs';

handler({})
  .then((res) => console.log('Done:', res))
  .catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
