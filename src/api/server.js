const express = require('express');

const { v1: uuid } = require('uuid');

// Load the environment variables
require('dotenv').config();

// Get StorageService
const storageService = require('./StorageService')();

const app = express();

const port = process.env.PORT || 3000;

// Get sas for specific blob
app.get('/api/getSas', async (req, res) => { 
    try {

      const sasToken = await storageService.getSasToken();

      res.json({ sasToken });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`));