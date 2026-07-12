#!/usr/bin/env python
"""Verify X credentials and optionally publish a single disposable test post."""

from __future__ import annotations

import argparse
import os
import sys

import requests
from dotenv import load_dotenv
from requests_oauthlib import OAuth1

API_BASE = "https://api.x.com/2"
REQUIRED = (
    "X_API_KEY",
    "X_API_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
    "X_BOT_USERNAME",
)


def fail(message: str) -> "NoReturn":
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--post",
        action="store_true",
        help="publish one real test post after identity verification",
    )
    parser.add_argument(
        "--text",
        default="wyrd systems check. commentary only.",
        help="test post text",
    )
    args = parser.parse_args()

    load_dotenv()
    missing = [name for name in REQUIRED if not os.getenv(name)]
    if missing:
        fail("missing environment variables: " + ", ".join(missing))

    username = os.environ["X_BOT_USERNAME"].strip().lstrip("@").lower()
    auth = OAuth1(
        os.environ["X_API_KEY"],
        os.environ["X_API_SECRET"],
        os.environ["X_ACCESS_TOKEN"],
        os.environ["X_ACCESS_TOKEN_SECRET"],
    )

    try:
        response = requests.get(f"{API_BASE}/users/me", auth=auth, timeout=30)
    except requests.RequestException as exc:
        fail(f"identity request failed: {exc}")

    if response.status_code != 200:
        fail(f"identity check returned HTTP {response.status_code}: {response.text[:500]}")

    data = response.json().get("data", {})
    actual_username = str(data.get("username", "")).lower()
    if not actual_username:
        fail("identity response did not contain a username")
    if actual_username != username:
        fail(f"token belongs to @{actual_username}, expected @{username}; refusing to post")

    print(f"authenticated as @{actual_username} (user id {data.get('id')})")

    if not args.post:
        print("identity verified; no post created (pass --post to publish)")
        return

    text = args.text.strip()
    if not text:
        fail("post text is empty")
    if len(text) > 280:
        fail(f"post text is {len(text)} characters; refusing to exceed 280")

    try:
        response = requests.post(
            f"{API_BASE}/tweets",
            auth=auth,
            json={"text": text},
            timeout=30,
        )
    except requests.RequestException as exc:
        fail(f"create-post request failed: {exc}")

    if response.status_code not in (200, 201):
        fail(f"create post returned HTTP {response.status_code}: {response.text[:500]}")

    post = response.json().get("data", {})
    post_id = post.get("id")
    if not post_id:
        fail("create-post response did not contain a post ID")

    print(f"created: https://x.com/{actual_username}/status/{post_id}")


if __name__ == "__main__":
    main()
