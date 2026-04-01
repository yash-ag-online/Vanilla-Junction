import app from './app.js';
import { envValues } from './utils.js';

const port = envValues.port;

app.listen(port, () => {
  console.log(`app is listening on port: ${port}`);
});
