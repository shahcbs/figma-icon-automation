### 1. Install the necessary packages

Make sure you have Node.js and npm installed on your computer. Then, create a new project directory and initialize it with `npm init` to set up a new Node.js project. Next, install the required packages using npm:
```bash
npm install figma-api-exporter dotenv
```

### 2. Obtain an API key

If you don't have a Figma account, sign up for one. After creating your account, please follow this [instruction](https://www.figma.com/developers/api#access-tokens).

### 3. Prepare the .env file

Create a `.env` file in your project's root directory and store your Figma API token and file ID as follows:
```bash
FIGMA_API_TOKEN=YOUR_FIGMA_API_TOKEN_HERE
FIGMA_FILE_ID=YOUR_FIGMA_FILE_ID_HERE
```
Replace YOUR_FIGMA_API_TOKEN_HERE and YOUR_FIGMA_FILE_ID_HERE with your actual API token and file ID.

### 4. Write the syncing script

Create a JavaScript file (e.g., `fetch.js`) in your project directory with the following content:
```bash
// Import dotenv and configure it to read variables from the .env file
require('dotenv').config();

const figmaApiExporter = require('figma-api-exporter').default;
const exporter = figmaApiExporter(process.env.FIGMA_API_TOKEN);

exporter
  .getSvgs({
    fileId: process.env.FIGMA_FILE_ID,
    canvas: 'Icons', // Replace 'Icons' with the name of the canvas you want to sync SVGs from
  })
  .then(svgsData =>
    exporter.downloadSvgs({
      saveDirectory: './svgsFiles', // Directory where SVGs will be saved
      svgsData: svgsData.svgs,
      lastModified: svgsData.lastModified,
    })
  )
  .then(() => {
    console.log('SVGs synced successfully!');
  })
  .catch(error => {
    console.error('Error syncing SVGs:', error);
  });
```
### 5. Run the script

Open your terminal, navigate to the project directory, and run the sync script:
```bash
npm run fetch
```
The script will connect to your Figma account, fetch the SVGs from the specified canvas, and save them to the svgsFiles directory (you can change this directory path in the code if you prefer).

Please ensure you have the necessary permissions to access the Figma file and canvas you want to sync SVGs from. Also, be cautious about sharing your .env file or exposing sensitive information in your code, especially if you plan to share your project publicly.

