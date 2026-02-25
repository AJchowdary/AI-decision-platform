# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import pytest
from app.ingestion import parse_json_rows, parse_csv_rows

ACCOUNT_ID = "test-account-123"


def test_parse_json_valid_single_row():
    body = b'''{"session_id": "s1", "timestamp": "2024-01-15T10:00:00Z", "input": "hi", "output": "hello", "feedback_type": "thumb_up", "feedback_value": "1"}'''
    valid, errors = parse_json_rows(body, ACCOUNT_ID)
    assert len(valid) == 1
    assert len(errors) == 0
    assert valid[0]["account_id"] == ACCOUNT_ID
    assert valid[0]["session_id"] == "s1"
    assert valid[0]["feedback_type"] == "thumb_up"


def test_parse_json_valid_array():
    body = b'''[
        {"session_id": "a", "timestamp": "2024-01-15T10:00:00Z", "input": "x", "output": "y", "feedback_type": "thumb_down", "feedback_value": "-1"},
        {"session_id": "b", "timestamp": "2024-01-16T12:00:00Z", "input": "p", "output": "q", "feedback_type": "thumb_down", "feedback_value": "0"}
    ]'''
    valid, errors = parse_json_rows(body, ACCOUNT_ID)
    assert len(valid) == 2
    assert len(errors) == 0


def test_parse_json_missing_required():
    body = b'{"session_id": "s1", "timestamp": "2024-01-15T10:00:00Z", "input": "hi", "output": "ho"}'
    valid, errors = parse_json_rows(body, ACCOUNT_ID)
    assert len(valid) == 0
    assert any("feedback_type" in e.get("error", "") for e in errors)


def test_parse_json_invalid_timestamp():
    body = b'{"session_id": "s1", "timestamp": "not-a-date", "input": "a", "output": "b", "feedback_type": "up", "feedback_value": "1"}'
    valid, errors = parse_json_rows(body, ACCOUNT_ID)
    assert len(valid) == 0
    assert len(errors) > 0


def test_parse_json_invalid_json():
    valid, errors = parse_json_rows(b"not json", ACCOUNT_ID)
    assert len(valid) == 0
    assert len(errors) == 1


def test_parse_csv_valid():
    body = b"""session_id,timestamp,input,output,feedback_type,feedback_value
s1,2024-01-15T10:00:00Z,hi,hello,thumb_down,-1"""
    valid, errors = parse_csv_rows(body, ACCOUNT_ID)
    assert len(valid) == 1
    assert valid[0]["session_id"] == "s1"
    assert len(errors) == 0


def test_parse_csv_missing_column():
    body = b"""session_id,timestamp,input,output,feedback_type
s1,2024-01-15T10:00:00Z,hi,hello,thumb_down"""
    valid, errors = parse_csv_rows(body, ACCOUNT_ID)
    assert len(valid) == 0
    assert len(errors) > 0


def test_parse_csv_empty():
    valid, errors = parse_csv_rows(b"session_id,timestamp\n", ACCOUNT_ID)
    assert len(valid) == 0
    assert len(errors) > 0
