"""
Populate seller_id in MySQL `crops` table by matching seller_phone to farmer/buyer tables.

Usage (preview only):
  set DB_USE=mysql
  set DB_HOST=127.0.0.1
  set DB_PORT=3306
  set DB_USER=root
  set DB_PASSWORD=yourpw
  set DB_NAME=agri_ai
  python backend\populate_seller_id.py

To actually apply updates, pass --apply:
  python backend\populate_seller_id.py --apply

The script is idempotent and will only update rows where seller_id IS NULL.
It prints a preview of changes before applying.
"""
import os
import sys
import argparse
import traceback

try:
    import mysql.connector as mysql
except Exception:
    try:
        import pymysql as mysql
    except Exception:
        mysql = None


def get_cfg():
    return {
        'host': os.environ.get('DB_HOST', '127.0.0.1'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'agri_ai'),
    }


def main(apply=False):
    if mysql is None:
        print('No MySQL driver available (install mysql-connector-python or pymysql).')
        sys.exit(1)
    cfg = get_cfg()
    print('Connecting to MySQL at {host}:{port} db={database} user={user}'.format(**cfg))
    try:
        conn = mysql.connect(**cfg)
    except Exception:
        print('Could not connect to MySQL; check DB env vars and that the server is running.')
        traceback.print_exc()
        sys.exit(1)

    try:
        cur = conn.cursor()
        # Fetch crops with NULL seller_id or seller_id=0
        cur.execute("SELECT id, seller_name, seller_phone, region, state, crop_name, created_at FROM crops WHERE seller_id IS NULL OR seller_id=0 ORDER BY created_at DESC LIMIT 500")
        rows = cur.fetchall()
        if not rows:
            print('No crops found with missing seller_id.')
            return

        preview = []
        print(f'Found {len(rows)} crops with missing seller_id (showing up to 500).')
        for r in rows:
            cid, sname, sphone, region, state, crop_name, created_at = r
            sphone_norm = (sphone or '').strip()
            matched_id = None
            matched_tbl = None
            if sphone_norm:
                # look in farmer, then buyer
                for tbl in ('farmer', 'buyer', 'admin'):
                    try:
                        cur.execute(f"SELECT id,name,phone FROM {tbl} WHERE phone=%s LIMIT 1", (sphone_norm,))
                        found = cur.fetchone()
                        if found:
                            matched_id = found[0]
                            matched_tbl = tbl
                            break
                    except Exception:
                        continue
            preview.append({'crop_id': cid, 'seller_phone': sphone_norm, 'seller_name': sname, 'matched_tbl': matched_tbl, 'matched_id': matched_id, 'crop_name': crop_name, 'created_at': str(created_at)})

        # Print preview
        for p in preview:
            print(p)

        if not apply:
            print('\nRun this script with --apply to write the suggested seller_id values to the crops table.')
            return

        # Apply updates
        updated = 0
        for p in preview:
            if p['matched_id']:
                try:
                    cur.execute('UPDATE crops SET seller_id=%s WHERE id=%s', (p['matched_id'], p['crop_id']))
                    updated += 1
                except Exception as e:
                    print('Failed to update crop id', p['crop_id'], '->', e)
        conn.commit()
        print(f'Applied updates: {updated} rows updated.')

    except Exception:
        print('Error during preview/apply:')
        traceback.print_exc()
    finally:
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Populate seller_id in crops by matching seller_phone')
    parser.add_argument('--apply', action='store_true', help='Actually apply updates to the database')
    args = parser.parse_args()
    main(apply=args.apply)
