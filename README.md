# TMFR Telemetry Viewer

A tool for pulling and plotting CSV telemetry data logged by a Teensy 4.1 to an SD card. The Teensy firmware exposes a simple serial protocol, the FastAPI backend wraps that into an HTTP API, and the Next.js frontend gives you a browser UI to connect to the device, browse files, and plot the data.

You can also skip the serial workflow entirely and upload a local CSV file directly.

## How it works

The Teensy firmware initializes the SD card on boot and listens for two serial commands: `LIST` returns a list of files on the card, and `GET <filename>` transfers the contents of a file. The backend manages the serial connection, parses the incoming CSV data with pandas, and detects a sensible default for the time axis. The frontend handles everything else: connecting to the device, browsing the file list, uploading local files, and rendering the chart.

## Project structure

```
firmware/    PlatformIO project for Teensy 4.1 (Arduino framework)
backend/     FastAPI backend (Python 3.11+)
frontend/    Next.js frontend (TypeScript)
```

## Firmware

The firmware is a PlatformIO project targeting the Teensy 4.1. You can flash it with the PlatformIO CLI or the VS Code extension.

```bash
cd firmware
pio run --target upload
```

The sketch communicates at 115200 baud over USB serial by default.

## Backend

Python 3.11 or newer is required.

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -e .
uvicorn backend.main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

## Frontend

Node.js and pnpm are required.

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Usage

1. Open the configuration modal (the gear icon in the top bar). Click **Scan** to find available serial ports, select the one your Teensy is on, and click **Connect**.

<img width="681" height="774" alt="image" src="https://github.com/user-attachments/assets/d5241cb6-e7e7-4465-aca8-71fa605009fd" />

3. Once connected, click **Fetch Files** to list the CSV files on the SD card, then click **Pull** next to a file to transfer it. Alternatively, drag a local CSV file onto the drop zone or click to browse.

<img width="631" height="825" alt="image" src="https://github.com/user-attachments/assets/17533499-62bb-4e0e-a088-1d76a5db1d63" />

5. Then click **Generate Plot**.

<img width="1916" height="907" alt="image" src="https://github.com/user-attachments/assets/3848ff11-4c72-4ab0-a06f-525151aa2369" />

## Tech stack

NextJs(Front end), FastAPI (backend)
