from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth, surveys, tests, suggestions, reports

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Brain Capital Monitor API",
    description="PBCM - 個人の脳の健康・スキルを自己報告で計測するAPI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(surveys.router)
app.include_router(tests.router)
app.include_router(suggestions.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "PBCM API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
