from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth, habits, grind, insights, settings as settings_router, notes

app = FastAPI(title="GRIND API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/auth",     tags=["auth"])
app.include_router(habits.router,          prefix="/api/habits",   tags=["habits"])
app.include_router(grind.router,           prefix="/api/grind",    tags=["grind"])
app.include_router(insights.router,        prefix="/api/insights", tags=["insights"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(notes.router,           prefix="/api/notes",    tags=["notes"])


@app.get("/health")
def health():
    return {"status": "ok"}
