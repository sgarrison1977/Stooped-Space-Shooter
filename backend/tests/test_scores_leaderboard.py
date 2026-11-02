# EMBERDEEP backend: score submission (upsert best per player) + leaderboard tests
import os
import uuid
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # cleanup TEST_ data
    c = MongoClient(os.environ["MONGO_URL"])
    c[os.environ["DB_NAME"]].scores.delete_many({"player_id": {"$regex": "^TEST_"}})


def pid():
    return "TEST_" + uuid.uuid4().hex[:10]


# Health
def test_root(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200 and r.json()["message"] == "Emberdeep API"


# Score submit: create
def test_submit_new_player(api):
    p = pid()
    r = api.post(f"{BASE_URL}/api/scores", json={"player_id": p, "name": "TEST_Ace", "wave": 3, "kills": 12})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["best_wave"] == 3 and d["best_kills"] == 12 and d["runs"] == 1 and d["is_you"] is True
    assert isinstance(d["rank"], int) and d["rank"] >= 1
    assert "_id" not in d


# Score submit: upsert keeps best, increments runs, updates name
def test_upsert_keeps_best(api):
    p = pid()
    api.post(f"{BASE_URL}/api/scores", json={"player_id": p, "name": "TEST_A", "wave": 5, "kills": 20})
    r = api.post(f"{BASE_URL}/api/scores", json={"player_id": p, "name": "TEST_B", "wave": 2, "kills": 99})
    d = r.json()
    assert d["best_wave"] == 5 and d["best_kills"] == 20 and d["runs"] == 2 and d["name"] == "TEST_B"
    # same wave more kills -> better
    r = api.post(f"{BASE_URL}/api/scores", json={"player_id": p, "name": "TEST_B", "wave": 5, "kills": 30})
    d = r.json()
    assert d["best_kills"] == 30 and d["runs"] == 3
    # GET verifies persistence + is_you
    lb = api.get(f"{BASE_URL}/api/leaderboard", params={"player_id": p, "limit": 100}).json()
    mine = [x for x in lb if x["is_you"]]
    assert len(mine) == 1 and mine[0]["best_wave"] == 5 and mine[0]["best_kills"] == 30


# Rank ordering: higher wave ranks above
def test_rank_order(api):
    a, b = pid(), pid()
    ra = api.post(f"{BASE_URL}/api/scores", json={"player_id": a, "name": "TEST_hi", "wave": 9000, "kills": 1}).json()
    rb = api.post(f"{BASE_URL}/api/scores", json={"player_id": b, "name": "TEST_hi2", "wave": 9000, "kills": 5}).json()
    assert rb["rank"] == 1
    ra2 = api.get(f"{BASE_URL}/api/leaderboard").json()
    assert ra2[0]["name"] == "TEST_hi2" and ra2[1]["name"] == "TEST_hi"
    assert ra["rank"] >= 1


# Leaderboard sorted, is_you false without player_id
def test_leaderboard_sorted(api):
    lb = api.get(f"{BASE_URL}/api/leaderboard").json()
    assert isinstance(lb, list) and len(lb) >= 1
    keys = [(x["best_wave"], x["best_kills"]) for x in lb]
    assert keys == sorted(keys, reverse=True)
    assert all(x["is_you"] is False for x in lb)
    assert [x["rank"] for x in lb] == list(range(1, len(lb) + 1))


# Validation
@pytest.mark.parametrize("payload", [
    {"player_id": "TEST_vvvvvv", "name": "", "wave": 1, "kills": 0},
    {"player_id": "TEST_vvvvvv", "name": "x" * 21, "wave": 1, "kills": 0},
    {"player_id": "TEST_vvvvvv", "name": "ok", "wave": 0, "kills": 0},
    {"player_id": "TEST_vvvvvv", "name": "ok", "wave": 1, "kills": -1},
    {"player_id": "abc", "name": "ok", "wave": 1, "kills": 0},
    {"name": "ok", "wave": 1, "kills": 0},
])
def test_validation(api, payload):
    r = api.post(f"{BASE_URL}/api/scores", json=payload)
    assert r.status_code == 422


# Whitespace-only name edge case
def test_whitespace_name(api):
    r = api.post(f"{BASE_URL}/api/scores", json={"player_id": pid(), "name": "   ", "wave": 1, "kills": 0})
    assert r.status_code in (200, 422)
    if r.status_code == 200:
        assert r.json()["name"] == "Pilot"


def test_leaderboard_limit(api):
    assert api.get(f"{BASE_URL}/api/leaderboard", params={"limit": 0}).status_code == 422
    assert len(api.get(f"{BASE_URL}/api/leaderboard", params={"limit": 2}).json()) <= 2
