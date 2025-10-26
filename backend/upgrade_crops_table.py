"""
Safe migration helper: ensure `seller_id` column exists on the MySQL `crops` table.

Usage (Windows cmd.exe):
  set DB_USE=mysql
  set DB_HOST=127.0.0.1
  set DB_PORT=3306
  set DB_USER=root
  set DB_PASSWORD=yourpw
  set DB_NAME=agri_ai
  python backend\upgrade_crops_table.py

The script will check information_schema and ALTER TABLE only if the column is missing.
It does not modify other columns.
"""
import os
import sys
import traceback

try:
    import mysql.connector as mysql
    DRIVER = 'mysql.connector'
except Exception:
    try:
        import pymysql as mysql
        DRIVER = 'pymysql'
    except Exception:
        mysql = None
        DRIVER = None


def get_cfg_from_env():
    return {
        'host': os.environ.get('DB_HOST', '127.0.0.1'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'agri_ai'),
    }


def main():
    if mysql is None:
        print('No MySQL driver found. Install mysql-connector-python or pymysql and re-run this script.')
        sys.exit(1)

    cfg = get_cfg_from_env()
    print('Connecting to MySQL at {host}:{port} db={database} user={user}'.format(**cfg))
    try:
        # mysql-connector uses connect(**cfg); pymysql too
        conn = mysql.connect(**cfg)
    except Exception:
        print('Could not connect to MySQL — check your DB_* env vars and that MySQL is running.')
        traceback.print_exc()
        sys.exit(1)

    try:
        cur = conn.cursor()
        # Check whether crops table exists
        db_name = cfg.get('database')
        cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=%s AND table_name=%s", (db_name, 'crops'))
        tbl_exists = cur.fetchone()[0] > 0
        if not tbl_exists:
            print('No `crops` table found in database', db_name)
            print('Ensure your application has created the crops table or create it manually before running this script.')
            return

        # Check if seller_id column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema=%s AND table_name=%s AND column_name=%s", (db_name, 'crops', 'seller_id'))
        if cur.fetchone():
            print('Column `seller_id` already exists in `crops`. No action required.')
            return

        # Add the seller_id column
        print('Adding `seller_id` column to `crops` table...')
        alter_sql = "ALTER TABLE crops ADD COLUMN seller_id BIGINT UNSIGNED DEFAULT NULL"
        cur.execute(alter_sql)
        conn.commit()
        print('ALTER TABLE executed successfully. Column `seller_id` added.')

    except Exception:
        print('Error while checking/updating schema:')
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
    main()
import os
import sys
try:
    import mysql.connector
except Exception as e:
    print('mysql.connector not available:', e)
    sys.exit(1)

cfg = {
    'host': os.environ.get('DB_HOST', '127.0.0.1'),
    'port': int(os.environ.get('DB_PORT', '3306')),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'agri_ai'),
}

print('Connecting to MySQL with config:', {k: cfg[k] for k in ('host','port','user','database')})
try:
    cnx = mysql.connector.connect(**cfg)
    cur = cnx.cursor()
except Exception as e:
    print('Could not connect to MySQL:', e)
    sys.exit(1)

# Helper: check column existence
def column_exists(schema, table, column):
    cur.execute("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=%s AND table_name=%s AND column_name=%s", (schema, table, column))
    r = cur.fetchone()
    return r and r[0] > 0

try:
    table = 'crops'
    schema = cfg['database']
    to_add = []
    if not column_exists(schema, table, 'seller_id'):
        to_add.append("ADD COLUMN seller_id BIGINT UNSIGNED DEFAULT NULL")
    if not column_exists(schema, table, 'seller_phone'):
        to_add.append("ADD COLUMN seller_phone VARCHAR(20) DEFAULT NULL")
    # If quantity_kg / price_per_kg types are missing or different, we won't change them here.

    if to_add:
        alter_sql = f"ALTER TABLE {table} " + ", ".join(to_add)
        print('Running:', alter_sql)
        cur.execute(alter_sql)
        cnx.commit()
        print('Columns added successfully.')
    else:
        print('No columns to add; table already has required columns.')

    # Show current columns for visibility
    cur.execute("SELECT column_name, column_type FROM information_schema.columns WHERE table_schema=%s AND table_name=%s", (schema, table))
    cols = cur.fetchall()
    print('Current columns:')
    for c in cols:
        print(' -', c[0], c[1])

except Exception as e:
    print('Error while altering table:', e)
finally:
    try:
        cur.close()
    except:
        pass
    try:
        cnx.close()
    except:
        pass

print('Done.')
