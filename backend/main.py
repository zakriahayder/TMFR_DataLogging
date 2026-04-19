from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from .models import ConnectRequest, PlotRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/ports")
def ports():
    return [{"device": "COM3", "description": "USB Serial Device"}]


@app.post("/api/serial/connect")
def connect(payload: ConnectRequest):
    return {
        "connected": True,
        "port": payload.port,
        "baudrate": payload.baudrate,
    }


@app.post("/api/csv/upload")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    return {
        "filename": file.filename,
        "columns": ["time", "rpm", "throttle"],
        "numeric_columns": ["time", "rpm", "throttle"],
        "preview_rows": [],
        "row_count": 100,
        "default_x": "time",
        "bytes": len(content),
    }


@app.post("/api/csv/plot-data")
def plot_data(payload: PlotRequest):
    return {
        "x_column": payload.x_column,
        "y_columns": payload.y_columns,
        "x_data": [0, 1, 2],
        "series": {col: [10, 20, 30] for col in payload.y_columns},
        "row_count": 3,
    }
