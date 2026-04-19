from pydantic import BaseModel


class ConnectRequest(BaseModel):
    port: str
    baudrate: int = 115200


class PlotRequest(BaseModel):
    filename: str
    x_column: str
    y_columns: list[str]


class PullFileRequest(BaseModel):
    filename: str
