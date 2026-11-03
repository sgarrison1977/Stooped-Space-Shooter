from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated, Literal
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()


@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


api_router = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True)
        if data.get("_id") is None:
            data.pop("_id", None)
        return data

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)


class Score(BaseDocument):
    player_id: str
    difficulty: str = "normal"
    name: str
    best_wave: int = 0
    best_kills: int = 0
    total_kills: int = 0
    runs: int = 0
    updated_at: str


class ScoreSubmit(BaseModel):
    player_id: str = Field(min_length=6, max_length=64)
    name: str = Field(min_length=1, max_length=20)
    wave: int = Field(ge=1, le=10000)
    kills: int = Field(ge=0, le=1000000)
    difficulty: Literal["casual", "normal", "hard", "extreme"] = "normal"


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    best_wave: int
    best_kills: int
    runs: int
    is_you: bool


@api_router.get("/")
async def root():
    return {"message": "Emberdeep API"}


@api_router.post("/scores", response_model=LeaderboardEntry)
async def submit_score(body: ScoreSubmit):
    now = datetime.now(timezone.utc).isoformat()
    name = body.name.strip()[:20] or "Pilot"
    key = {"player_id": body.player_id, "difficulty": body.difficulty}
    doc = await db.scores.find_one(key)
    if doc is None:
        score = Score(player_id=body.player_id, difficulty=body.difficulty, name=name, best_wave=body.wave,
                      best_kills=body.kills, total_kills=body.kills, runs=1, updated_at=now)
        try:
            await db.scores.insert_one(score.to_mongo())
        except DuplicateKeyError:
            return await submit_score(body)
    else:
        score = Score.from_mongo(doc)
        better = body.wave > score.best_wave or (body.wave == score.best_wave and body.kills > score.best_kills)
        score.name = name
        score.runs += 1
        score.total_kills += body.kills
        score.updated_at = now
        if better:
            score.best_wave = body.wave
            score.best_kills = body.kills
        data = score.to_mongo()
        data.pop("_id", None)
        await db.scores.update_one(key, {"$set": data})
    ahead = await db.scores.count_documents({"difficulty": body.difficulty, "$or": [
        {"best_wave": {"$gt": score.best_wave}},
        {"best_wave": score.best_wave, "best_kills": {"$gt": score.best_kills}},
    ]})
    return LeaderboardEntry(rank=ahead + 1, name=score.name, best_wave=score.best_wave,
                            best_kills=score.best_kills, runs=score.runs, is_you=True)


@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def leaderboard(player_id: Optional[str] = None,
                      difficulty: Literal["casual", "normal", "hard", "extreme"] = "normal",
                      limit: int = Query(50, ge=1, le=100)):
    docs = await db.scores.find({"difficulty": difficulty}).sort([("best_wave", -1), ("best_kills", -1)]).to_list(limit)
    out = []
    for i, d in enumerate(docs):
        s = Score.from_mongo(d)
        out.append(LeaderboardEntry(rank=i + 1, name=s.name, best_wave=s.best_wave, best_kills=s.best_kills,
                                    runs=s.runs, is_you=bool(player_id) and s.player_id == player_id))
    return out


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await db.scores.update_many({"difficulty": {"$exists": False}}, {"$set": {"difficulty": "normal"}})
    existing = await db.scores.index_information()
    if "player_id_1" in existing:
        await db.scores.drop_index("player_id_1")
    await db.scores.create_index([("player_id", 1), ("difficulty", 1)], unique=True)
    await db.scores.create_index([("difficulty", 1), ("best_wave", -1), ("best_kills", -1)])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
