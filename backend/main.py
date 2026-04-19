import io
import time

import pandas as pd
import serial
import serial.tools.list_ports
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ser = None
csv_store = {}


def parse_csv(filename, raw_bytes):
    df = pd.read_csv(io.BytesIO(raw_bytes), on_bad_lines="skip")
    csv_store[filename] = df
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    default_x = next(
        (c for c in numeric_cols if c.lower() in {"time", "t", "timestamp", "elapsed", "ms", "seconds"}),
        numeric_cols[0] if numeric_cols else None,
    )
    return {
        "filename": filename,
        "columns": df.columns.tolist(),
        "numeric_columns": numeric_cols,
        "row_count": len(df),
        "default_x": default_x,
    }


@app.get("/api/ports")
def ports():
    return [
        {"device": p.device, "description": p.description}
        for p in serial.tools.list_ports.comports()
    ]


@app.post("/api/connect")
async def connect(request: Request):
    global ser
    body = await request.json()
    if ser and ser.is_open:
        ser.close()
    try:
        ser = serial.Serial(body["port"], body.get("baudrate", 115200), timeout=5, write_timeout=3)
        time.sleep(0.5)
        ser.reset_input_buffer()
    except serial.SerialException as e:
        ser = None
        raise HTTPException(status_code=400, detail=str(e))
    return {"connected": True, "port": body["port"], "baudrate": body.get("baudrate", 115200)}


@app.post("/api/disconnect")
def disconnect():
    global ser
    if ser and ser.is_open:
        ser.close()
    ser = None
    return {"connected": False, "port": None, "baudrate": None}


def _serial_error(e: Exception) -> HTTPException:
    global ser
    try:
        if ser:
            ser.close()
    except Exception:
        pass
    ser = None
    return HTTPException(status_code=400, detail=f"Serial error (device disconnected?): {e}")


@app.get("/api/files")
def files():
    if not ser or not ser.is_open:
        raise HTTPException(status_code=400, detail="Not connected")

    try:
        ser.timeout = 0.1
        ser.reset_input_buffer()
        ser.write(b"LIST\n")
        ser.flush()
    except serial.SerialException as e:
        raise _serial_error(e)

    result = []
    deadline = time.monotonic() + 5.0
    try:
        while time.monotonic() < deadline:
            line = ser.readline()
            if not line:
                continue
            decoded = line.decode(errors="replace").strip()
            if decoded == "END_LIST":
                return result
            if "," in decoded:
                name, _, size = decoded.rpartition(",")
                result.append({"name": name.strip(), "size": int(size) if size.strip().isdigit() else 0})
    except serial.SerialException as e:
        raise _serial_error(e)

    raise HTTPException(status_code=408, detail="Timeout waiting for file list")


@app.post("/api/pull")
async def pull(request: Request):
    if not ser or not ser.is_open:
        raise HTTPException(status_code=400, detail="Not connected")

    body = await request.json()
    filename = body["filename"]

    try:
        ser.timeout = 0.1
        ser.reset_input_buffer()
        ser.write(f"GET {filename}\n".encode())
        ser.flush()

        deadline = time.monotonic() + 5.0
        while time.monotonic() < deadline:
            line = ser.readline()
            if not line:
                continue
            if line.strip() == b"BEGIN_FILE":
                break
            if line.strip().startswith(b"ERROR"):
                raise HTTPException(status_code=400, detail=line.decode().strip())
        else:
            raise HTTPException(status_code=408, detail="Timeout waiting for BEGIN_FILE")

        data = b""
        deadline = time.monotonic() + 30.0
        while time.monotonic() < deadline:
            data += ser.read(4096)
            if b"END_FILE" in data:
                raw = data[: data.index(b"END_FILE")].rstrip(b"\r\n")
                try:
                    return parse_csv(filename, raw)
                except Exception as e:
                    raise HTTPException(status_code=422, detail=f"Failed to parse CSV: {e}")

        raise HTTPException(status_code=408, detail="Timeout receiving file data")
    except HTTPException:
        raise
    except serial.SerialException as e:
        raise _serial_error(e)


@app.post("/api/csv/upload")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        return parse_csv(file.filename or "upload.csv", content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse CSV: {e}")


@app.post("/api/csv/plot-data")
async def plot_data(request: Request):
    body = await request.json()
    df = csv_store.get(body["filename"])
    if df is None:
        raise HTTPException(status_code=404, detail=f"Dataset '{body['filename']}' not found")

    x_col = body["x_column"]
    y_cols = body["y_columns"]

    if x_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{x_col}' not found")
    missing = [c for c in y_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Columns not found: {missing}")

    return {
        "x_column": x_col,
        "y_columns": y_cols,
        "x_data": df[x_col].tolist(),
        "series": {col: df[col].tolist() for col in y_cols},
        "row_count": len(df),
    }
