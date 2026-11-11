#!/usr/bin/env python3
"""Verify this catalogue backup without credentials or a network connection."""
import hashlib
import json
from pathlib import Path


def verify():
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / 'manifest.json').read_text())
    actual_files = {str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()}
    assert actual_files == set(manifest['files']) | {'manifest.json'}, 'File inventory differs'
    for name, expected in manifest['files'].items():
        path = root / name
        assert path.resolve().is_relative_to(root), f'Unsafe path: {name}'
        data = path.read_bytes()
        assert len(data) == expected['bytes'], f'Size mismatch: {name}'
        assert hashlib.sha256(data).hexdigest() == expected['sha256'], f'Checksum mismatch: {name}'

    snapshot = json.loads((root / 'catalog.json').read_text())
    tables = snapshot['tables']
    assert {name: len(rows) for name, rows in tables.items()} == manifest['table_counts']
    ids = {}
    for name, rows in tables.items():
        if name == 'collection_products':
            keys = [(row['collection_id'], row['product_id']) for row in rows]
        else:
            keys = [row['id'] for row in rows]
        assert len(set(keys)) == len(keys), f'Duplicate primary key: {name}'
        ids[name] = set(keys)
        if name in ('products', 'categories', 'collections'):
            assert len({row['slug'] for row in rows}) == len(rows), f'Duplicate slug: {name}'
    for row in tables['products']:
        assert row['collection_id'] in ids['collections'], row['slug']
        assert row['category_id'] is None or row['category_id'] in ids['categories'], row['slug']
    for row in tables['product_images']:
        assert row['product_id'] in ids['products'], row['id']
        assert bool(row['storage_path']) != bool(row['external_url']), row['id']
    for row in tables['collection_products']:
        assert row['product_id'] in ids['products'] and row['collection_id'] in ids['collections']
    assert len({(row['product_id'], row['sort_order']) for row in tables['product_images']}) == len(tables['product_images'])

    assets = json.loads((root / 'assets.json').read_text())
    by_path = {asset['path']: asset for asset in assets}
    urls = {asset['source_url'] for asset in assets}
    assert len(assets) == len(by_path) == manifest['asset_count']
    for asset in assets:
        assert asset['sha256'] == manifest['files'][asset['path']]['sha256']
        assert asset['bytes'] == manifest['files'][asset['path']]['bytes']
    for obj in snapshot['storage_objects']:
        path = 'media/' + obj['bucket_id'] + '/' + obj['name']
        assert path in by_path, f'Missing storage object: {path}'
        assert by_path[path]['bytes'] == obj['metadata']['size'], path
    for row in tables['product_images']:
        if row['storage_path']:
            assert 'media/product-media/' + row['storage_path'] in by_path, row['id']
        else:
            assert row['external_url'] in urls, row['id']
    for row in tables['collections']:
        assert not row['hero_image_url'] or row['hero_image_url'] in urls, row['id']
    for row in tables['products']:
        for field in ('certificate_url', 'declaration_url'):
            assert not row[field] or row[field] in urls, row['id']
    print(f"OK: {manifest['table_counts']}; {len(assets)} assets; all SHA-256 checksums match")


if __name__ == '__main__':
    verify()
