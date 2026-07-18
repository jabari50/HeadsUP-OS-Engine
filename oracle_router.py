"""
HeadsUp OS Oracle — FastAPI Router
POST /api/v1/oracle/nil-scan
Mounts oracle_nil_engine.run_oracle_nil_scan() as a secured endpoint.
"""

import os
from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import JSONResponse

from oracle_nil_engine import OracleNILRequest, OracleNILResponse, run_oracle_nil_scan

oracle_router = APIRouter(prefix="/api/v1/oracle", tags=["HeadsUp OS Oracle"])

_ENGINE_API_KEY: str = os.environ.get("HU_ENGINE_API_KEY", "")


def _verify(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Bearer token required.")
    token = authorization.removeprefix("Bearer ").strip()
    if not _ENGINE_API_KEY or token != _ENGINE_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid API key.")
    return token


@oracle_router.post(
    "/nil-scan",
    response_model=OracleNILResponse,
    status_code=status.HTTP_200_OK,
    summary="HeadsUp OS Oracle — NIL Intelligence Scan",
    description=(
        "Full Oracle execution chain: CIR gate → Neural Audit → PEG matrix → "
        "LLM NIL narrative. AIS_EXCLUSION and uncleared HUMAN_GATE entries "
        "return suppressed output without firing the LLM."
    ),
)
async def oracle_nil_scan(
    request: OracleNILRequest,
    _token: str = Depends(_verify),
) -> OracleNILResponse:
    try:
        return await run_oracle_nil_scan(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Oracle execution error: {str(e)}",
        )
