# Curvy Indexer API

![image](https://github.com/user-attachments/assets/ed15bca2-7c8b-4d90-a43e-251cacf71611)

## Overview

This part of the repository contains imlpementation code for Curvy Indexer API on Starknet. The code
represents a backend server implemented with Express and PostgreSQL. The server provides an API and also
an Indexer component which listens for every event emitted by our smart contracts, which we later store 
within our database.

## Start

In order to start the project, please create a `.env` file by looking at our `.env.example`. There are two approcahes
you can take to start the project.

If you feel like running it in Docker, you can run:

```bash
docker compose up -d --build
```

This will setup an Indexer API, a PostgreSQL database and also an Adminer instance for you to take a look into the data.
If you feel like running the project locally, first install the project dependencies by running:

```bash
npm install
```

and start the Indexer with:

```bash
npm run start
```

Please notice that for a local run of the project you need to have a running database. 
