#!/usr/bin/env python3
"""Restore saved Storage files through the Supabase Storage API."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true', help='Actually upload to the target project')
    parser.add_argument('--overwrite', action='store_true', help='Replace existing objects at the same paths')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    subprocess.run([sys.executable, str(root / 'verify.py')], check=True)
    snapshot = json.loads((root / 'catalog.json').read_text())
    assets = {row['path']: row for row in json.loads((root / 'assets.json').read_text())}
    if not args.execute:
        print(f"Dry run: {len(snapshot['storage_objects'])} Storage files. No network requests made.")
        return
    base = os.environ['SUPABASE_URL'].rstrip('/')
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    if urllib.parse.urlsplit(base).scheme != 'https':
        raise ValueError('SUPABASE_URL must use HTTPS')

    def request(path, method, body=None, extra_headers=None):
        headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
        headers.update(extra_headers or {})
        req = urllib.request.Request(base + '/storage/v1/' + path, data=body, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            # Do not print headers or response bodies containing credential details.
            raise RuntimeError(f'Storage API returned HTTP {error.code} for {method} {path}') from None

    for bucket in snapshot['storage_buckets']:
        bucket_id = urllib.parse.quote(bucket['id'], safe='')
        # Listing buckets verifies admin access without reading credential material.
        existing = json.loads(request('bucket', 'GET'))
        if not any(row['id'] == bucket['id'] for row in existing):
            request('bucket', 'POST', json.dumps(bucket).encode(), {'Content-Type': 'application/json'})
        for obj in snapshot['storage_objects']:
            if obj['bucket_id'] != bucket['id']:
                continue
            path = 'media/' + bucket['id'] + '/' + obj['name']
            asset = assets[path]
            target = 'object/' + bucket_id + '/' + urllib.parse.quote(obj['name'], safe='/')
            request(target, 'POST', (root / path).read_bytes(), {
                'Content-Type': asset['content_type'],
                'Cache-Control': obj['metadata'].get('cacheControl', 'max-age=3600'),
                'x-upsert': 'true' if args.overwrite else 'false',
            })
    print(f"Uploaded {len(snapshot['storage_objects'])} Storage files")


if __name__ == '__main__':
    main()
