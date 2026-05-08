#!/usr/bin/env python3
"""Test script to verify configuration loading."""
import os
import sys

# Test different CORS_ORIGINS values
test_cases = [
    ("", "Empty string"),
    ("http://localhost:3000", "Single URL"),
    ("http://localhost:3000,https://example.com", "Comma-separated"),
    ('["http://localhost:3000"]', "JSON array"),
    ('["http://localhost:3000", "https://example.com"]', "JSON array multiple"),
]

print("Testing CORS_ORIGINS parsing...\n")

for value, description in test_cases:
    print(f"Test: {description}")
    print(f"  Input: {repr(value)}")
    
    # Set environment variable
    if value:
        os.environ["CORS_ORIGINS"] = value
    else:
        os.environ.pop("CORS_ORIGINS", None)
    
    try:
        # Clear the cache
        from app.config import get_settings
        get_settings.cache_clear()
        
        # Load settings
        settings = get_settings()
        print(f"  Result: {settings.CORS_ORIGINS}")
        print(f"  ✓ Success\n")
    except Exception as e:
        print(f"  ✗ Error: {e}\n")
        sys.exit(1)

print("All tests passed! ✓")
