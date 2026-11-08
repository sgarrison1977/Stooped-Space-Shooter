# EMBERDEEP backend: new mode leaderboard keys (bossrush, hardcore, daily-YYYYMMDD) + validation
import os
import uuid
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
CREATED = []  # (player_id, difficulty) pairs created by this module


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    c = MongoClient(os.environ["MONGO_URL"])
    col = c[os.environ["DB_NAME"]].scores
    for p, d in CREATED:
        col.delete_one({"player_id": p, "difficulty": d})


def submit(api, diff, wave=4, kills=20):
    p = "TEST_" + uuid.uuid4().hex[:10]
    r = api.post(f"{BASE_URL}/api/scores", json={"player_id": p, "name": "TEST_Mode", "wave": wave, "kills": kills, "difficulty": diff})
    if r.status_code == 200:
        CREATED.append((p, diff))
    return p, r


# Mode keys accepted + persisted in their own leaderboard
@pytest.mark.parametrize("diff", ["bossrush", "hardcore", "daily-20260601"])
def test_submit_mode_key_and_verify(api, diff):
    p, r = submit(api, diff, wave=7, kills=33)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["best_wave"] == 7 and d["best_kills"] == 33 and d["is_you"] is True and d["rank"] >= 1
    lb = api.get(f"{BASE_URL}/api/leaderboard", params={"difficulty": diff, "player_id": p})
    assert lb.status_code == 200
    mine = [e for e in lb.json() if e["is_you"]]
    assert len(mine) == 1 and mine[0]["best_wave"] == 7


# Mode boards isolated from normal board
def test_bossrush_not_in_normal(api):
    p, r = submit(api, "bossrush", wave=2, kills=1)
    assert r.status_code == 200
    lb = api.get(f"{BASE_URL}/api/leaderboard", params={"difficulty": "normal", "player_id": p}).json()
    assert not any(e["is_you"] for e in lb)


# Invalid difficulty keys rejected
@pytest.mark.parametrize("diff", ["BossRush", "ab", "daily_2026", "x" * 30, "boss rush", "../etc"])
def test_submit_invalid_difficulty(api, diff):
    _, r = submit(api, diff)
    assert r.status_code == 422, f"{diff} -> {r.status_code}"


def test_leaderboard_invalid_difficulty(api):
    r = api.get(f"{BASE_URL}/api/leaderboard", params={"difficulty": "Boss_Rush"})
    assert r.status_code == 422


def test_leaderboard_bossrush_get(api):
    r = api.get(f"{BASE_URL}/api/leaderboard", params={"difficulty": "bossrush"})
    assert r.status_code == 200 and isinstance(r.json(), list)
