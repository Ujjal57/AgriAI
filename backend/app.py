from flask import Flask, request, jsonify
from flask import send_from_directory
import openpyxl
import os
from flask_cors import CORS
import datetime

# Additional imports required by the backend logic
import re
import requests
import threading
import smtplib
import ssl
import sqlite3
from email.message import EmailMessage
import urllib.parse
import uuid
import mimetypes

# Try to import a MySQL driver (mysql-connector or pymysql). If not available, fall back to sqlite.
try:
    import mysql.connector as mysql
    DB_DRIVER = 'mysql.connector'
except Exception:
    try:
        import pymysql as mysql
        DB_DRIVER = 'pymysql'
    except Exception:
        mysql = None
        DB_DRIVER = 'sqlite'

try:
    import bcrypt
except Exception:
    bcrypt = None

# Flask app
app = Flask(__name__)
CORS(app)


def get_db_connection():
    """Return ('mysql', conn) or ('sqlite', conn). Prefers MySQL if driver available and DB_USE=mysql."""
    use_mysql_env = os.environ.get('DB_USE', 'mysql').lower() == 'mysql'
    if use_mysql_env:
        # When DB_USE is explicitly mysql we require a working MySQL driver/connection.
        if mysql is None:
            raise RuntimeError('DB_USE=mysql but no MySQL driver is installed (mysql-connector or pymysql)')
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            return ('mysql', conn)
        except Exception as e:
            print('MySQL connect failed (get_db_connection):', e)
            # Do not silently fall back to sqlite when user requested MySQL
            raise

    # DB_USE is not 'mysql' -> use sqlite fallback
    db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
    conn = sqlite3.connect(db_path)
    return ('sqlite', conn)


def get_cursor(kind, conn):
    """Return a cursor; for mysql use buffered cursor to avoid unread results."""
    try:
        if kind == 'mysql' and hasattr(conn, 'cursor'):
            # mysql-connector supports buffered=True; pymysql offers default cursor
            try:
                return conn.cursor(buffered=True)
            except TypeError:
                return conn.cursor()
        else:
            return conn.cursor()
    except Exception:
        return conn.cursor()


def ensure_user_tables():
    """Create farmer, buyer, admin tables if they don't exist."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        if kind == 'mysql':
            for tbl in ('farmer', 'buyer', 'admin'):
                sql = (
                    f"CREATE TABLE IF NOT EXISTS `{tbl}` ("
                    "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                    "name VARCHAR(255) NOT NULL,"
                    "phone VARCHAR(20) NOT NULL UNIQUE,"
                    "email VARCHAR(255) DEFAULT NULL,"
                    "aadhar VARCHAR(32) NOT NULL,"
                    "password_hash VARCHAR(255) NOT NULL,"
                    "region VARCHAR(50) DEFAULT NULL,"
                    "state VARCHAR(100) DEFAULT NULL," 
                    "address VARCHAR(255) DEFAULT NULL," 
                    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                    "PRIMARY KEY (id)"
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                )
                cur.execute(sql)
            conn.commit()
        else:
            for tbl in ('farmer', 'buyer', 'admin'):
                    cur.execute(f'''
                    CREATE TABLE IF NOT EXISTS {tbl} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        phone TEXT NOT NULL UNIQUE,
                        email TEXT,
                        aadhar TEXT NOT NULL,
                        password_hash TEXT NOT NULL,
                        region TEXT,
                        state TEXT,
                        address TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
            conn.commit()
        try:
            cur.close()
        except Exception:
            pass
    finally:
        try:
            conn.close()
        except Exception:
            pass


def init_contact_excel():
    # placeholder for legacy excel init; no-op now
    return


def init_register_excel():
    # placeholder for legacy excel init; no-op now
    return



def identifier_exists_excluding(current_tbl, current_id, phone=None, aadhar=None, email=None):
    """Check phone/aadhar/email exists in any table excluding the provided current id in current_tbl."""
    kind, conn = get_db_connection()
    try:
        cur = conn.cursor()
        for tbl in ('farmer', 'buyer', 'admin'):
            # phone
            if phone:
                if kind == 'mysql':
                    cur.execute(f"SELECT id FROM {tbl} WHERE phone=%s LIMIT 1", (phone,))
                else:
                    cur.execute(f"SELECT id FROM {tbl} WHERE phone=? LIMIT 1", (phone,))
                r = cur.fetchone()
                if r:
                    r_id = r[0]
                    if not (tbl == current_tbl and r_id == current_id):
                        cur.close(); conn.close(); return True
            # aadhar
            if aadhar:
                if kind == 'mysql':
                    cur.execute(f"SELECT id FROM {tbl} WHERE aadhar=%s LIMIT 1", (aadhar,))
                else:
                    cur.execute(f"SELECT id FROM {tbl} WHERE aadhar=? LIMIT 1", (aadhar,))
                r = cur.fetchone()
                if r:
                    r_id = r[0]
                    if not (tbl == current_tbl and r_id == current_id):
                        cur.close(); conn.close(); return True
            # email
            if email:
                if kind == 'mysql':
                    cur.execute(f"SELECT id FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                else:
                    cur.execute(f"SELECT id FROM {tbl} WHERE email=? LIMIT 1", (email,))
                r = cur.fetchone()
                if r:
                    r_id = r[0]
                    if not (tbl == current_tbl and r_id == current_id):
                        cur.close(); conn.close(); return True
        cur.close()
    except Exception as e:
        print('identifier_exists_excluding error:', e)
    finally:
        try:
            conn.close()
        except Exception:
            pass
    return False






def identifier_exists(phone=None, aadhar=None, email=None):
    """Check if phone or aadhar or email exists across farmer, buyer and admin tables."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        if kind == 'mysql':
            for tbl in ('farmer', 'buyer', 'admin'):
                if phone:
                    cur.execute(f"SELECT 1 FROM {tbl} WHERE phone=%s LIMIT 1", (phone,))
                    if cur.fetchone():
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
                if aadhar:
                    cur.execute(f"SELECT 1 FROM {tbl} WHERE aadhar=%s LIMIT 1", (aadhar,))
                    if cur.fetchone():
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
                if email:
                    cur.execute(f"SELECT 1 FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                    if cur.fetchone():
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
            try:
                cur.close()
            except Exception:
                pass
        else:
            for tbl in ('farmer', 'buyer', 'admin'):
                if phone:
                    cur.execute(f"SELECT 1 FROM {tbl} WHERE phone=? LIMIT 1", (phone,))
                    if cur.fetchone():
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
                if aadhar:
                    cur.execute(f"SELECT 1 FROM {tbl} WHERE aadhar=? LIMIT 1", (aadhar,))
                    if cur.fetchone():
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
                if email:
                    cur.execute(f"SELECT 1 FROM {tbl} WHERE email=? LIMIT 1", (email,))
                    if cur.fetchone():
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
            try:
                cur.close()
            except Exception:
                pass
    except Exception as e:
        print('identifier_exists error:', e)
    finally:
        try:
            conn.close()
        except Exception:
            pass
    return False


def insert_user(role, name, phone, email, aadhar, password_hash, region=None, state=None, address=None):
    """Insert user into the given role table including optional region/state."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        if kind == 'mysql':
            cur.execute(
                f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state, address) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None, address if address else None)
            )
            conn.commit()
            try:
                cur.close()
            except Exception:
                pass
        else:
            cur.execute(
                f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state, address) VALUES (?,?,?,?,?,?,?,?)",
                (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None, address if address else None)
            )
            conn.commit()
            try:
                cur.close()
            except Exception:
                pass
        return True
    except Exception as e:
        print('insert_user error:', e)
        try:
            conn.rollback()
        except Exception:
            pass
        return False
    finally:
        try:
            conn.close()
        except Exception:
            pass



def find_user_by_email(email):
    """Return (table_name, row) for a user matching email or (None, None).
    Row columns: id,name,phone,email,aadhar,password_hash,region,state,address
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        for tbl in ('farmer', 'buyer', 'admin'):
            try:
                if kind == 'mysql':
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                else:
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address FROM {tbl} WHERE email=? LIMIT 1", (email,))
                row = cur.fetchone()
                if row:
                    try:
                        cur.close()
                    except Exception:
                        pass
                    try:
                        conn.close()
                    except Exception:
                        pass
                    return tbl, row
            except Exception:
                # continue to next table
                continue
        try:
            cur.close()
        except Exception:
            pass
    except Exception as e:
        print('find_user_by_email error:', e)
    finally:
        try:
            conn.close()
        except Exception:
            pass
    return None, None


def find_user_by_phone(phone):
    """Return (table_name, row) for a user matching phone or (None, None).
    Row columns: id,name,phone,email,aadhar,password_hash,region,state,address
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        for tbl in ('farmer', 'buyer', 'admin'):
            try:
                if kind == 'mysql':
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address FROM {tbl} WHERE phone=%s LIMIT 1", (phone,))
                else:
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address FROM {tbl} WHERE phone=? LIMIT 1", (phone,))
                row = cur.fetchone()
                if row:
                    try:
                        cur.close()
                    except Exception:
                        pass
                    try:
                        conn.close()
                    except Exception:
                        pass
                    return tbl, row
            except Exception:
                continue
        try:
            cur.close()
        except Exception:
            pass
    except Exception as e:
        print('find_user_by_phone error:', e)
    finally:
        try:
            conn.close()
        except Exception:
            pass
    return None, None


def identifier_exists_excluding(current_tbl, current_id, phone=None, aadhar=None, email=None):
    """Check phone/aadhar/email exists in any table excluding the provided current id in current_tbl."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        for tbl in ('farmer', 'buyer', 'admin'):
            # phone
            if phone:
                if kind == 'mysql':
                    cur.execute(f"SELECT id FROM {tbl} WHERE phone=%s LIMIT 1", (phone,))
                else:
                    cur.execute(f"SELECT id FROM {tbl} WHERE phone=? LIMIT 1", (phone,))
                r = cur.fetchone()
                if r:
                    r_id = r[0]
                    if not (tbl == current_tbl and r_id == current_id):
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
            # aadhar
            if aadhar:
                if kind == 'mysql':
                    cur.execute(f"SELECT id FROM {tbl} WHERE aadhar=%s LIMIT 1", (aadhar,))
                else:
                    cur.execute(f"SELECT id FROM {tbl} WHERE aadhar=? LIMIT 1", (aadhar,))
                r = cur.fetchone()
                if r:
                    r_id = r[0]
                    if not (tbl == current_tbl and r_id == current_id):
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
            # email
            if email:
                if kind == 'mysql':
                    cur.execute(f"SELECT id FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                else:
                    cur.execute(f"SELECT id FROM {tbl} WHERE email=? LIMIT 1", (email,))
                r = cur.fetchone()
                if r:
                    r_id = r[0]
                    if not (tbl == current_tbl and r_id == current_id):
                        try:
                            cur.close(); conn.close()
                        except Exception:
                            pass
                        return True
        try:
            cur.close()
        except Exception:
            pass
    except Exception as e:
        print('identifier_exists_excluding error:', e)
    finally:
        try:
            conn.close()
        except Exception:
            pass
    return False


def update_user(role, user_id, name, phone, email, aadhar, region=None, state=None, address=None):
    """Update a user's basic fields by id including optional region/state."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        if kind == 'mysql':
            cur.execute(f"UPDATE {role} SET name=%s, phone=%s, email=%s, aadhar=%s, region=%s, state=%s, address=%s WHERE id=%s", (name, phone, email if email else None, aadhar, region if region else None, state if state else None, address if address else None, user_id))
        else:
            cur.execute(f"UPDATE {role} SET name=?, phone=?, email=?, aadhar=?, region=?, state=?, address=? WHERE id=?", (name, phone, email if email else None, aadhar, region if region else None, state if state else None, address if address else None, user_id))
        conn.commit()
        try:
            cur.close()
        except Exception:
            pass
        return True
    except Exception as e:
        print('update_user error:', e)
        try:
            conn.rollback()
        except Exception:
            pass
        return False
    finally:
        try:
            conn.close()
        except Exception:
            pass


# ================= Contact API =================
@app.route('/contact', methods=['POST'])
def contact():
    data = request.get_json()
    first = data.get('first', '').strip()
    last = data.get('last', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    message = data.get('message', '').strip()
    # Server-side validation: ensure required fields are present
    if not first:
        return jsonify({'error': 'first_required'}), 400
    if not last:
        return jsonify({'error': 'last_required'}), 400
    if not phone or not phone.isdigit() or len(phone) < 7:
        # allow some flexibility; client requires 10 digits but server accepts if numeric
        return jsonify({'error': 'invalid_phone'}), 400
    if not message:
        return jsonify({'error': 'message_required'}), 400

    # Attempt DB insert; prefer MySQL (mysql-connector or pymysql), fallback to SQLite
    def get_mysql_conn():
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            return conn
        except Exception as e:
            print('DB connection error:', e)
            return None

    # Try MySQL first if driver available
    if mysql is not None:
        conn = get_mysql_conn()
        if conn:
            cursor = None
            try:
                cursor = conn.cursor()
                insert_sql = ("INSERT INTO contacts (first_name, last_name, phone, email, message, source)"
                              " VALUES (%s, %s, %s, %s, %s, %s)")
                cursor.execute(insert_sql, (first, last, phone, email if email else None, message, 'web'))
                conn.commit()
                # If email provided, send a thank-you email asynchronously
                if email:
                    def send_async():
                        try:
                            send_thankyou_email(email, first, last)
                        except Exception as e:
                            print('Error sending thank-you email:', e)
                    threading.Thread(target=send_async, daemon=True).start()
                return jsonify({'success': 'Message received and stored.'}), 200
            except Exception as e:
                print('DB insert error (mysql):', e)
                # fall through to sqlite fallback
            finally:
                try:
                    if cursor:
                        cursor.close()
                except Exception:
                    pass
                try:
                    conn.close()
                except Exception:
                    pass

    # SQLite fallback (no external DB driver or MySQL connection failed)
    try:
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), 'contacts.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                message TEXT NOT NULL,
                source TEXT DEFAULT 'web',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        sqlite_cursor.execute(
            'INSERT INTO contacts (first_name, last_name, phone, email, message, source) VALUES (?,?,?,?,?,?)',
            (first, last, phone, email if email else None, message, 'web')
        )
        sqlite_conn.commit()
        # If an email address was provided, send a thank-you email asynchronously
        if email:
            def send_async():
                try:
                    send_thankyou_email(email, first, last)
                except Exception as e:
                    print('Error sending thank-you email (sqlite):', e)
            threading.Thread(target=send_async, daemon=True).start()

        sqlite_cursor.close()
        sqlite_conn.close()
        return jsonify({'success': 'Message received and stored (sqlite).'}), 200
    except Exception as e:
        print('SQLite fallback error:', e)
        return jsonify({'error': 'failed_to_store'}), 500


@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.get_json() or {}
    q = data.get('q', '')
    source = data.get('source', 'auto')
    target = data.get('target', 'en')

    if not q:
        return jsonify({'error': 'No text provided.'}), 400

    try:
        # Use LibreTranslate public instance; for production replace with your own API/key
        resp = requests.post('https://libretranslate.de/translate', data={
            'q': q,
            'source': source,
            'target': target,
            'format': 'text'
        }, timeout=10)
        resp.raise_for_status()
        j = resp.json()
        translated = j.get('translatedText') or j.get('translated_text') or ''
        return jsonify({'translated': translated}), 200
    except Exception as e:
        print('Translation error:', e)
        return jsonify({'error': 'translation_failed'}), 500


# ================= Register API =================
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password', '').strip()
    role = (data.get('role') or '').strip().lower()
    aadhar = (data.get('aadhar') or '').strip()
    region = (data.get('region') or '').strip().lower()
    state = (data.get('state') or '').strip()
    address = (data.get('address') or '').strip()

    # Required fields check: name, phone, password, role, aadhar and address are required. Email is optional.
    if not name or not phone or not password or not role or not aadhar or not address:
        return jsonify({'error': 'Name, phone, password, role, aadhar and address are required.'}), 400

    # Name validation: first character must be uppercase
    if not name[0].isupper():
        return jsonify({'error': 'Name must start with a capital letter.'}), 400

    # Phone validation: must be 10 digits
    if not (phone.isdigit() and len(phone) == 10):
        return jsonify({'error': 'Phone number must be exactly 10 digits.'}), 400

    # Aadhar validation: must be exactly 12 digits
    if not (aadhar.isdigit() and len(aadhar) == 12):
        return jsonify({'error': 'Aadhar number must be exactly 12 digits.'}), 400

    # Email validation: only if provided
    email_regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    if email and not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format.'}), 400

    # Password validation: min 4 characters
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters.'}), 400

    # Ensure tables exist
    ensure_user_tables()

    # Check uniqueness across role tables for phone, aadhar and email (if provided)
    if identifier_exists(phone=phone):
        return jsonify({'error': 'Phone number already registered.'}), 400
    if identifier_exists(aadhar=aadhar):
        return jsonify({'error': 'Aadhar already registered.'}), 400
    if email and identifier_exists(email=email):
        return jsonify({'error': 'Email already registered.'}), 400

    # Validate role value and map to table name
    role_map = {'farmer': 'farmer', 'buyer': 'buyer', 'admin': 'admin'}
    if role not in role_map:
        return jsonify({'error': 'Invalid role.'}), 400

    # Hash the password with bcrypt
    try:
        pw_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pw_bytes, salt).decode('utf-8')
    except Exception as e:
        print('Password hashing failed:', e)
        return jsonify({'error': 'internal_error'}), 500

    # Validate region/state (optional but collected)
    if region and region not in ('north', 'south', 'east', 'west'):
        return jsonify({'error': 'invalid_region'}), 400
    if state and not re.match(r'^[A-Za-z\s]{2,}$', state):
        return jsonify({'error': 'invalid_state'}), 400

    # Insert the user into the role-specific table, including region/state/address
    ok = insert_user(role_map[role], name, phone, email, aadhar, hashed, region=region or None, state=state or None, address=address or None)
    if not ok:
        return jsonify({'error': 'failed_to_store'}), 500

    # Send welcome email if provided
    if email:
        try:
            # Use agriai.team7@gmail.com as sender; credentials should be in env vars
            smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
            smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
            smtp_port = int(os.environ.get('SMTP_PORT', '587'))
            smtp_password = os.environ.get('SMTP_PASSWORD')
            if smtp_password:
                # send using configured SMTP
                send_welcome_email(email, name, '', smtp_host=smtp_host, smtp_port=smtp_port, smtp_user=smtp_user, smtp_password=smtp_password)
            else:
                # try to send with default Gmail settings if possible (may fail without password)
                send_welcome_email(email, name, '', smtp_host=smtp_host, smtp_port=smtp_port, smtp_user=smtp_user, smtp_password=smtp_password)
        except Exception as e:
            print('Welcome email send error:', e)

    return jsonify({'success': 'User registered.'}), 200

    # For security, do not write credentials to local files. In production you should
    # store user records in a secure database with hashed passwords.
    return jsonify({'success': 'User registered.'}), 200


def ensure_mysql_schema():
    """
    If a MySQL driver is available and DB credentials are set, ensure the database and
    contacts table exist. This helps when using XAMPP's MySQL server.
    """
    # If DB_USE explicitly requests MySQL but no driver is installed, raise an error
    if os.environ.get('DB_USE', 'mysql').lower() == 'mysql' and mysql is None:
        raise RuntimeError('DB_USE=mysql but no MySQL driver (mysql-connector or pymysql) is available')


    def get_db_connection():
        """Return a DB connection. Prefer MySQL if configured and driver available, else use SQLite."""
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            if mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql':
                conn = mysql.connect(**cfg)
                return ('mysql', conn)
        except Exception as e:
            print('MySQL connection attempt failed:', e)

        # Fallback to SQLite stored in backend/users.sqlite3
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        conn = sqlite3.connect(db_path)
        return ('sqlite', conn)


    def ensure_user_tables():
        """Create farmer, buyer and admin tables in the selected DB if they do not exist."""
        kind, conn = get_db_connection()
        try:
            if kind == 'mysql':
                cur = get_cursor(kind, conn)
                # create tables with simple schema: id, name, phone, email, aadhar, password_hash, role, created_at
                for tbl in ('farmer', 'buyer', 'admin'):
                    sql = (
                        f"CREATE TABLE IF NOT EXISTS `{tbl}` ("
                        "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                        "name VARCHAR(255) NOT NULL,"
                        "phone VARCHAR(20) NOT NULL UNIQUE,"
                        "email VARCHAR(255) DEFAULT NULL,"
                        "aadhar VARCHAR(32) NOT NULL,"
                        "password_hash VARCHAR(255) NOT NULL,"
                        "region VARCHAR(50) DEFAULT NULL,"
                        "state VARCHAR(100) DEFAULT NULL,"
                        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                        "PRIMARY KEY (id)"
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                    )
                    cur.execute(sql)
                conn.commit()
                cur.close()
            else:
                cur = conn.cursor()
                for tbl in ('farmer', 'buyer', 'admin'):
                    cur.execute(f'''
                        CREATE TABLE IF NOT EXISTS {tbl} (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            phone TEXT NOT NULL UNIQUE,
                            email TEXT,
                            aadhar TEXT NOT NULL,
                            password_hash TEXT NOT NULL,
                            region TEXT,
                            state TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    ''')
                conn.commit()
                cur.close()
        finally:
            try:
                conn.close()
            except Exception:
                pass


    def identifier_exists(phone=None, aadhar=None, email=None):
        """Check if phone or aadhar or email exists across farmer, buyer and admin tables."""
        kind, conn = get_db_connection()
        try:
            cur = get_cursor(kind, conn)
            if kind == 'mysql':
                for tbl in ('farmer', 'buyer', 'admin'):
                    if phone:
                        cur.execute(f"SELECT 1 FROM {tbl} WHERE phone=%s LIMIT 1", (phone,))
                        if cur.fetchone():
                            cur.close()
                            conn.close()
                            return True
                    if aadhar:
                        cur.execute(f"SELECT 1 FROM {tbl} WHERE aadhar=%s LIMIT 1", (aadhar,))
                        if cur.fetchone():
                            cur.close()
                            conn.close()
                            return True
                    if email:
                        cur.execute(f"SELECT 1 FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                        if cur.fetchone():
                            cur.close()
                            conn.close()
                            return True
                cur.close()
            else:
                for tbl in ('farmer', 'buyer', 'admin'):
                    if phone:
                        cur.execute(f"SELECT 1 FROM {tbl} WHERE phone=? LIMIT 1", (phone,))
                        if cur.fetchone():
                            cur.close()
                            conn.close()
                            return True
                    if aadhar:
                        cur.execute(f"SELECT 1 FROM {tbl} WHERE aadhar=? LIMIT 1", (aadhar,))
                        if cur.fetchone():
                            cur.close()
                            conn.close()
                            return True
                    if email:
                        cur.execute(f"SELECT 1 FROM {tbl} WHERE email=? LIMIT 1", (email,))
                        if cur.fetchone():
                            cur.close()
                            conn.close()
                            return True
                cur.close()
        except Exception as e:
            print('identifier_exists error:', e)
        finally:
            try:
                conn.close()
            except Exception:
                pass
        return False


    def insert_user(role, name, phone, email, aadhar, password_hash, region=None, state=None):
        """Insert user into the given role table including region/state."""
        kind, conn = get_db_connection()
        try:
            cur = conn.cursor()
            if kind == 'mysql':
                cur.execute(
                    f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None)
                )
                conn.commit()
                cur.close()
            else:
                cur.execute(
                    f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state) VALUES (?,?,?,?,?,?,?)",
                    (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None)
                )
                conn.commit()
                cur.close()
            return True
        except Exception as e:
            print('insert_user error:', e)
            try:
                conn.rollback()
            except Exception:
                pass
            return False
        finally:
            try:
                conn.close()
            except Exception:
                pass

    try:
        # Connect without database to ensure the DB exists
        cfg = {
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': int(os.environ.get('DB_PORT', '3306')),
            'user': os.environ.get('DB_USER', 'root'),
            'password': os.environ.get('DB_PASSWORD', ''),
        }
        db_name = os.environ.get('DB_NAME', 'agri_ai')

        # First: create database if it doesn't exist, then close this connection
        conn = mysql.connect(**cfg)
        try:
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            try:
                cursor.close()
            except Exception:
                pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

        # Reconnect specifying the database, then create the table
        cfg['database'] = db_name
        conn = mysql.connect(**cfg)
        try:
            cursor = conn.cursor()
            # Single CREATE TABLE statement (no trailing semicolon)
            create_table_sql = (
                "CREATE TABLE IF NOT EXISTS contacts ("
                "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                "first_name VARCHAR(100) NOT NULL,"
                "last_name VARCHAR(100) NOT NULL,"
                "phone VARCHAR(20) NOT NULL,"
                "email VARCHAR(255) DEFAULT NULL,"
                "message TEXT NOT NULL,"
                "source VARCHAR(50) DEFAULT 'web',"
                "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,"
                "PRIMARY KEY (id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            )
            cursor.execute(create_table_sql)
            try:
                cursor.close()
            except Exception:
                pass
            # Ensure crops table exists as well
            try:
                cursor = conn.cursor()
                create_crops_sql = (
                    "CREATE TABLE IF NOT EXISTS crops ("
                    "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                    "seller_id BIGINT UNSIGNED DEFAULT NULL,"
                    "seller_name VARCHAR(255) NOT NULL,"
                    "seller_phone VARCHAR(20) DEFAULT NULL,"
                    "region VARCHAR(50) DEFAULT NULL,"
                    "state VARCHAR(100) DEFAULT NULL,"
                    "crop_name VARCHAR(255) NOT NULL,"
                    "category VARCHAR(100) DEFAULT NULL,"
                    "quantity_kg DECIMAL(12,3) NOT NULL DEFAULT 0.0,"
                    "price_per_kg DECIMAL(12,3) NOT NULL DEFAULT 0.0,"
                    # store image blob and mime type for crop listing images
                    "image_blob LONGBLOB NULL,"
                    "image_mime VARCHAR(100) DEFAULT NULL,"
                    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                    "PRIMARY KEY (id)"
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
                )
                cursor.execute(create_crops_sql)
            except Exception:
                try:
                    cursor.close()
                except Exception:
                    pass
            finally:
                try:
                    cursor.close()
                except Exception:
                    pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

        print('MySQL schema ensured (database and contacts table).')
    except Exception as e:
        print('Failed to ensure MySQL schema:', e)


def send_thankyou_email(to_email, first, last):
    """Send a simple thank-you email to the contact if SMTP is configured."""
    # New signature supports explicit SMTP params for flexible use
    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        if not smtp_host or not smtp_user or not smtp_password:
            print('SMTP not configured; skipping email send.')
            return
        # Subject with English and Hindi
        subj = 'Thank You for Contacting AgriAI🌾'

        # Support contact placeholders (optional env vars)
        support_email = os.environ.get('SUPPORT_EMAIL', smtp_user)
        support_phone = os.environ.get('SUPPORT_PHONE', '')

        # Compose bilingual body with the receiver's name
        display_name = first.strip() or 'Friend'
        body = (
            f"Dear {display_name},\n\n"
            "Thank you for reaching out to AgriAI!\n"
            "We have received your message and truly appreciate your interest in our platform. Our team will review your query and get back to you shortly.\n\n"
            "Warm regards,\n"
            "The AgriAI Team\n"
            "AI-Enhanced Contract Farming and Farmer Advisory System\n"
        )
        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = from_addr
        msg['To'] = to_email
        msg.set_content(body)
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            try:
                server.starttls(context=context)
            except Exception:
                pass
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

    # Backwards-compatible: try to get SMTP settings from env if not provided
    # Note: when calling this function earlier we may pass explicit params.
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        # allow users to paste Gmail App Passwords with spaces (e.g. 'abcd efgh ijkl mnop')
        if smtp_password:
            smtp_password = smtp_password.replace(' ', '').strip()
        from_addr = os.environ.get('SMTP_FROM', smtp_user)
        _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr)
    except Exception as e:
        print('send_thankyou_email error:', e)


def send_welcome_email(to_email, first, last, smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Send the welcome email to a newly registered user. Supports explicit SMTP params."""
    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        if not smtp_host or not smtp_user or not smtp_password:
            print('SMTP not configured for welcome email; skipping send.')
            return
        subj = 'Welcome to AgriAI!🌱'
        display_name = first.strip() or 'Friend'
        support_email = os.environ.get('SUPPORT_EMAIL', smtp_user)
        support_phone = os.environ.get('SUPPORT_PHONE', '')
        body = (
            f"Dear {display_name},\n\n"
            "Welcome to AgriAI — we’re delighted to have you with us! 🌾\n\n"
            "AgriAI is dedicated to empowering farmers through smart, data-driven solutions for better productivity and market access. You’re now part of a growing community working towards a smarter and more sustainable agriculture future.\n\n"
            "Stay tuned for updates, tips, and new features designed to make farming easier and more efficient.\n\n"
            "If you have any questions, feel free to contact us anytime at "
            f"{support_email}{(' / ' + support_phone) if support_phone else ''}.\n\n"
            "Warm regards,\n"
            "The AgriAI Team\n"
            "AI-Enhanced Contract Farming and Farmer Advisory System\n"
        )
        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = from_addr
        msg['To'] = to_email
        msg.set_content(body)
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            try:
                server.starttls(context=context)
            except Exception:
                pass
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

    try:
        smtp_host = smtp_host or os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(smtp_port or os.environ.get('SMTP_PORT', '587'))
        smtp_user = smtp_user or os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = smtp_password or os.environ.get('SMTP_PASSWORD')
        if smtp_password:
            smtp_password = smtp_password.replace(' ', '').strip()
        from_addr = os.environ.get('SMTP_FROM', smtp_user)
        _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr)
    except Exception as e:
        print('send_welcome_email error:', e)


def send_crop_uploaded_email(to_email, farmer_name, crop_name, smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Send the crop-uploaded notification email using configured SMTP settings.
    This uses the provided bilingual template and defaults to agriai.team7@gmail.com as sender.
    """
    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        if not smtp_host or not smtp_user or not smtp_password or not to_email:
            print('SMTP or recipient missing; skipping crop uploaded email send.')
            return
        subj = 'New Crop Uploaded Successfully on Agri AI🌾'
        # Exact body template provided by user
        body = (
            f"Dear {farmer_name or ''},\n\n"
            "Namaste! 🙏\n\n"
            f"We are happy to inform you that your crop {crop_name} has been successfully uploaded on Agri AI.\n"
            "Your crop is now visible to interested buyers and other farmers across the platform.\n\n"
            "Thank you for using Agri AI — empowering farmers with digital innovation for a smarter future in agriculture!\n\n"
            "If you have any questions or need help, feel free to reach us at agriai.team7@gmail.com.\n\n"
            "Warm regards,\n"
            "Team Agri AI\n"
            "AI-Enhanced Contract Farming and Farmer Advisory System🌱\n"
        )
        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = from_addr
        msg['To'] = to_email
        msg.set_content(body)
        context = ssl.create_default_context()
        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                try:
                    server.starttls(context=context)
                except Exception:
                    pass
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        except Exception as e:
            print('send_crop_uploaded_email error:', e)

    try:
        smtp_host = smtp_host or os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(smtp_port or os.environ.get('SMTP_PORT', '587'))
        smtp_user = smtp_user or os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = smtp_password or os.environ.get('SMTP_PASSWORD')
        if smtp_password:
            smtp_password = smtp_password.replace(' ', '').strip()
        from_addr = os.environ.get('SMTP_FROM', smtp_user)
        _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr)
    except Exception as e:
        print('send_crop_uploaded_email outer error:', e)


def send_crop_expired_email(to_email, farmer_name, crop_name, smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Notify farmer that their crop listing has expired."""
    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        if not smtp_host or not smtp_user or not smtp_password or not to_email:
            print('SMTP or recipient missing; skipping crop expired email send.')
            return
        subj = 'Your Crop Listing Has Expired on Agri AI'
        body = (
            f"Dear {farmer_name or ''},\n\n"
            "Namaste! 🙏\n\n"
            f"Your crop {crop_name}, uploaded on Agri AI, has now expired.\n"
            "This means buyers can no longer see your listing.\n\n"
            "Thank you for being a valued part of the Agri AI community.\n"
            "We are here to help you reach more buyers and get the best price for your produce.\n\n"
            "Warm regards,\n"
            "Team Agri AI\n"
            "AI-Enhanced Contract Farming and Farmer Advisory System\n"
        )
        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = from_addr
        msg['To'] = to_email
        msg.set_content(body)
        context = ssl.create_default_context()
        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                try:
                    server.starttls(context=context)
                except Exception:
                    pass
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        except Exception as e:
            print('send_crop_expired_email error:', e)

    try:
        smtp_host = smtp_host or os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(smtp_port or os.environ.get('SMTP_PORT', '587'))
        smtp_user = smtp_user or os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = smtp_password or os.environ.get('SMTP_PASSWORD')
        if smtp_password:
            smtp_password = smtp_password.replace(' ', '').strip()
        from_addr = os.environ.get('SMTP_FROM', smtp_user)
        _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr)
    except Exception as e:
        print('send_crop_expired_email outer error:', e)


def ensure_expiry_notifications_table():
    """Create a small table to record which crop expiry notifications have been sent.
    This prevents duplicate emails when the notifier runs repeatedly or the app restarts.
    """
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            create_sql = (
                "CREATE TABLE IF NOT EXISTS expiry_notifications ("
                "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                "crop_id BIGINT UNSIGNED NOT NULL,"
                "notified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "PRIMARY KEY (id),"
                "UNIQUE KEY uniq_crop (crop_id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )
            cur.execute(create_sql)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            print('ensure_expiry_notifications_table mysql error:', e)
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS expiry_notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    crop_id INTEGER NOT NULL UNIQUE,
                    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            print('ensure_expiry_notifications_table sqlite error:', e)


def ensure_deals_table():
    """Create a deals table to store buyer deals. Supports MySQL and SQLite."""
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            create_sql = (
                "CREATE TABLE IF NOT EXISTS deals ("
                "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                "buyer_id BIGINT UNSIGNED DEFAULT NULL,"
                "buyer_name VARCHAR(255) NOT NULL,"
                "buyer_phone VARCHAR(20) DEFAULT NULL,"
                "region VARCHAR(50) DEFAULT NULL,"
                "state VARCHAR(100) DEFAULT NULL,"
                "crop_name VARCHAR(255) NOT NULL,"
                "quantity_kg DECIMAL(12,3) NOT NULL DEFAULT 0.0,"
                "image_path VARCHAR(255) DEFAULT NULL,"
                "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "PRIMARY KEY (id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )
            cur.execute(create_sql)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            print('ensure_deals_table mysql error:', e)
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS deals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    buyer_id INTEGER,
                    buyer_name TEXT NOT NULL,
                    buyer_phone TEXT,
                    region TEXT,
                    state TEXT,
                    crop_name TEXT NOT NULL,
                    quantity_kg REAL NOT NULL DEFAULT 0.0,
                    image_path TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            print('ensure_deals_table sqlite error:', e)


def notify_expired_crops_once():
    """Run one pass: find crops whose expiry_date < today and which have not been notified yet.
    Send the expiry email (if an email can be resolved) and record the notification to avoid duplicates.
    """
    today_iso = datetime.date.today().isoformat()
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # Select expired crops that do not have a notification entry
            sql = ("SELECT id, seller_id, seller_phone, seller_name, crop_name FROM crops "
                   "WHERE expiry_date IS NOT NULL AND expiry_date < %s "
                   "AND id NOT IN (SELECT crop_id FROM expiry_notifications)")
            cur.execute(sql, (today_iso,))
            rows = cur.fetchall()
            for r in rows:
                crop_id, seller_id, seller_phone, seller_name, crop_name = (r[0], r[1] if len(r) > 1 else None, r[2] if len(r) > 2 else None, r[3] if len(r) > 3 else '', r[4] if len(r) > 4 else '')
                farmer_email = None
                # try seller_id lookup
                try:
                    if seller_id:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT email FROM farmer WHERE id=%s LIMIT 1', (seller_id,))
                        r2 = cur2.fetchone()
                        farmer_email = r2[0] if r2 else None
                        try: cur2.close()
                        except Exception: pass
                except Exception:
                    farmer_email = None
                # fallback to phone
                if not farmer_email and seller_phone:
                    try:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT email FROM farmer WHERE phone=%s LIMIT 1', (seller_phone,))
                        r2 = cur2.fetchone()
                        farmer_email = r2[0] if r2 else None
                        try: cur2.close()
                        except Exception: pass
                    except Exception:
                        farmer_email = None

                # send email and record notification if we have an address
                try:
                    if farmer_email:
                        send_crop_expired_email(farmer_email, seller_name or '', crop_name or 'your crop')
                    # record notification regardless (avoid repeats even if no email)
                    try:
                        cur.execute('INSERT INTO expiry_notifications (crop_id) VALUES (%s)', (crop_id,))
                        conn.commit()
                    except Exception:
                        # ignore unique insert errors or other issues
                        try:
                            conn.rollback()
                        except Exception:
                            pass
                except Exception as e:
                    print('notify_expired_crops_once send error:', e)

            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            print('notify_expired_crops_once mysql error:', e)
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            sql = ("SELECT id, seller_id, seller_phone, seller_name, crop_name FROM crops "
                   "WHERE expiry_date IS NOT NULL AND expiry_date < date('now') "
                   "AND id NOT IN (SELECT crop_id FROM expiry_notifications)")
            cur.execute(sql)
            rows = cur.fetchall()
            for r in rows:
                crop_id = r[0]
                seller_id = r[1] if len(r) > 1 else None
                seller_phone = r[2] if len(r) > 2 else None
                seller_name = r[3] if len(r) > 3 else ''
                crop_name = r[4] if len(r) > 4 else ''
                farmer_email = None
                try:
                    if seller_id:
                        s_conn = sqlite3.connect(db_path)
                        s_cur = s_conn.cursor()
                        s_cur.execute('SELECT email FROM farmer WHERE id=?', (seller_id,))
                        r2 = s_cur.fetchone()
                        farmer_email = r2[0] if r2 else None
                        try: s_cur.close(); s_conn.close()
                        except Exception: pass
                except Exception:
                    farmer_email = None
                if not farmer_email and seller_phone:
                    try:
                        s_conn = sqlite3.connect(db_path)
                        s_cur = s_conn.cursor()
                        s_cur.execute('SELECT email FROM farmer WHERE phone=? LIMIT 1', (seller_phone,))
                        r2 = s_cur.fetchone()
                        farmer_email = r2[0] if r2 else None
                        try: s_cur.close(); s_conn.close()
                        except Exception: pass
                    except Exception:
                        farmer_email = None

                try:
                    if farmer_email:
                        send_crop_expired_email(farmer_email, seller_name or '', crop_name or 'your crop')
                    # record notification
                    try:
                        cur.execute('INSERT INTO expiry_notifications (crop_id) VALUES (?)', (crop_id,))
                        conn.commit()
                    except Exception:
                        try:
                            conn.rollback()
                        except Exception:
                            pass
                except Exception as e:
                    print('notify_expired_crops_once sqlite send error:', e)

            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            print('notify_expired_crops_once sqlite error:', e)


def expiry_notifier_loop(interval_minutes=60):
    """Background loop to periodically run the notifier. interval_minutes is configurable via ENV EXPIRY_CHECK_INTERVAL_MINUTES."""
    try:
        env_iv = int(os.environ.get('EXPIRY_CHECK_INTERVAL_MINUTES', str(interval_minutes)))
    except Exception:
        env_iv = interval_minutes
    while True:
        try:
            notify_expired_crops_once()
        except Exception as e:
            print('expiry_notifier_loop error:', e)
        # sleep for configured interval
        try:
            time_to_sleep = max(10, env_iv * 60)
            import time
            time.sleep(time_to_sleep)
        except Exception:
            # if sleep fails for some reason, break the loop
            break


def start_expiry_notifier_thread():
    """Start the notifier daemon thread."""
    try:
        t = threading.Thread(target=expiry_notifier_loop, daemon=True)
        t.start()
    except Exception as e:
        print('start_expiry_notifier_thread error:', e)


@app.route('/db-health', methods=['GET'])
def db_health():
    """Simple debug endpoint to report DB driver and connection status."""
    info = {'driver': DB_DRIVER}
    if mysql is None:
        info['status'] = 'no_driver'
        return jsonify(info), 200

    # Attempt a quick connection
    try:
        cfg = {
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': int(os.environ.get('DB_PORT', '3306')),
            'user': os.environ.get('DB_USER', 'root'),
            'password': os.environ.get('DB_PASSWORD', ''),
            'database': os.environ.get('DB_NAME', 'agri_ai'),
        }
        conn = mysql.connect(**cfg)
        try:
            cur = get_cursor('mysql', conn)
            cur.execute('SELECT 1')
            try:
                cur.close()
            except Exception:
                pass
        finally:
            try:
                conn.close()
            except Exception:
                pass
        info['status'] = 'ok'
    except Exception as e:
        info['status'] = 'error'
        info['error'] = str(e)

    return jsonify(info), 200


@app.route('/images/<path:filename>', methods=['GET'])
def serve_image(filename):
    """Serve uploaded images from the uploads directory."""
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    # Prevent directory traversal
    safe_name = os.path.normpath(filename).replace('..', '')
    return send_from_directory(uploads_dir, safe_name)


@app.route('/my-crops', methods=['POST'])
def add_crop_listing():
    """Accept a crop listing and persist to crops table. Expects JSON with:
    seller_name, seller_email (optional), region, state, crop_name, quantity_kg, price_per_kg
    """
    # Support both JSON (image_base64) and multipart/form-data (file upload)
    # For multipart/form-data, values are in request.form and files in request.files
    data = request.get_json(silent=True) or {}
    # If form data present (multipart), merge it into data dict (strings)
    if request.form:
        try:
            # request.form is an ImmutableMultiDict; convert to regular dict
            for k in request.form.keys():
                data[k] = request.form.get(k)
        except Exception:
            pass

    seller_name = (data.get('seller_name') or '').strip()
    seller_phone = (data.get('seller_phone') or '').strip()
    # support either seller_email or email key from client
    seller_email = (data.get('seller_email') or data.get('email') or '').strip()
    region = (data.get('region') or '').strip()
    state = (data.get('state') or '').strip()
    crop_name = (data.get('crop_name') or '').strip()
    category = (data.get('category') or '').strip()
    # Defensive fallback: sometimes multipart/form-data or clients send alternate keys
    # Try request.values (combines args and form) and common alternate names
    if not category:
        try:
            alt = (request.values.get('category') or request.values.get('Category') or request.values.get('cat') or request.values.get('category[]') or request.values.get('category_name') or request.values.get('categoryName'))
            if alt:
                category = str(alt).strip()
        except Exception:
            pass
    expiry_date_str = (data.get('expiry_date') or '').strip() if isinstance(data, dict) else ''
    try:
        quantity_kg = float(data.get('quantity_kg') or 0)
    except Exception:
        return jsonify({'error': 'invalid_quantity'}), 400
    try:
        price_per_kg = float(data.get('price_per_kg') or 0)
    except Exception:
        return jsonify({'error': 'invalid_price'}), 400

    if not seller_name or not crop_name:
        return jsonify({'error': 'seller_name_and_crop_required'}), 400

    # category selection is required for farmer crop listings
    if not category:
        # Log helpful debug information to the server console to aid diagnosis
        try:
            print('add_crop_listing: missing category. data keys:', list(data.keys()) if isinstance(data, dict) else None)
            try:
                print('add_crop_listing: request.form keys:', list(request.form.keys()))
            except Exception:
                print('add_crop_listing: request.form not available')
            try:
                print('add_crop_listing: request.values keys:', list(request.values.keys()))
            except Exception:
                pass
        except Exception:
            pass
        return jsonify({'error': 'category_required'}), 400

    # If configured to use MySQL, require it and do not fall back to SQLite on errors.
    if os.environ.get('DB_USE', 'mysql').lower() == 'mysql':
        if mysql is None:
            return jsonify({'ok': False, 'error': 'mysql_driver_not_available'}), 500
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # accept optional seller_id to link to farmer/buyer table
            seller_id = data.get('seller_id')
            if seller_id:
                try:
                    seller_id = int(seller_id)
                except Exception:
                    seller_id = None

            # If seller_id not provided but phone is, try to resolve user id
            if not seller_id and seller_phone:
                try:
                    user_tbl, user_row = find_user_by_phone(seller_phone)
                    if user_row:
                        seller_id = user_row[0]
                except Exception:
                    seller_id = None

            # Build INSERT dynamically using only columns that actually exist in the MySQL crops table.
            # This avoids ProgrammingError 1054 when a column is missing.
            try:
                # get available columns for this table
                db_name = cfg.get('database')
                cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema=%s AND table_name=%s", (db_name, 'crops'))
                cols = [r[0] for r in cur.fetchall()]
            except Exception as e:
                # if information_schema query fails, surface the error
                raise

            insert_cols = []
            insert_vals = []
            # helper to append if column present
            def add_if_exists(col_name, val):
                if col_name in cols:
                    insert_cols.append(col_name)
                    insert_vals.append(val)

            add_if_exists('seller_id', seller_id if seller_id else None)
            add_if_exists('seller_name', seller_name)
            add_if_exists('seller_phone', seller_phone if seller_phone else None)
            add_if_exists('region', region if region else None)
            add_if_exists('state', state if state else None)
            add_if_exists('crop_name', crop_name)
            add_if_exists('quantity_kg', quantity_kg)
            add_if_exists('price_per_kg', price_per_kg)
            add_if_exists('category', category if category else None)
            # expiry_date: expect YYYY-MM-DD or empty
            expiry_val = None
            if expiry_date_str:
                try:
                    # validate date format
                    expiry_dt = datetime.date.fromisoformat(expiry_date_str)
                    expiry_val = expiry_dt.isoformat()
                except Exception:
                    expiry_val = None
            add_if_exists('expiry_date', expiry_val)
            # Prefer saving uploaded files to disk and storing path in DB when supported.
            image_path_val = None
            image_mime = None
            # If request contains files (multipart/form-data), save the first file field named 'image'
            if 'image' in request.files:
                try:
                    up = request.files['image']
                    if up and up.filename:
                        # sanitize filename via uuid
                        ext = os.path.splitext(up.filename)[1] or mimetypes.guess_extension(up.mimetype or '') or '.img'
                        fname = f"{int(datetime.datetime.utcnow().timestamp())}_{uuid.uuid4().hex}{ext}"
                        uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                        os.makedirs(uploads_dir, exist_ok=True)
                        dest = os.path.join(uploads_dir, fname)
                        up.save(dest)
                        image_path_val = fname
                        image_mime = up.mimetype
                except Exception:
                    image_path_val = None

            # If not multipart, check for base64 image in JSON (legacy path)
            img_b64 = None
            if not image_path_val:
                img_b64 = data.get('image_base64') if isinstance(data, dict) else None
                img_mime = data.get('image_mime') if isinstance(data, dict) else None
                if img_b64 and 'image_blob' in cols:
                    try:
                        if isinstance(img_b64, str) and img_b64.startswith('data:'):
                            # extract mime if present
                            try:
                                image_mime = img_b64.split(';',1)[0].split(':',1)[1]
                            except Exception:
                                image_mime = None
                            img_b64 = img_b64.split(',', 1)[1]
                        import base64
                        img_blob = base64.b64decode(img_b64)
                        # if DB supports image_path column prefer writing file and storing path
                        if 'image_path' in cols:
                            try:
                                uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                                os.makedirs(uploads_dir, exist_ok=True)
                                ext = mimetypes.guess_extension(image_mime or '') or '.png'
                                fname = f"{int(datetime.datetime.utcnow().timestamp())}_{uuid.uuid4().hex}{ext}"
                                dest = os.path.join(uploads_dir, fname)
                                with open(dest, 'wb') as fh:
                                    fh.write(img_blob)
                                image_path_val = fname
                            except Exception:
                                image_path_val = None
                        # Always add image_blob if DB column exists (back-compat)
                        add_if_exists('image_blob', img_blob)
                        add_if_exists('image_mime', image_mime if image_mime else None)
                    except Exception:
                        # ignore image decode errors
                        pass

            # store image_path if supported by table
            if image_path_val and 'image_path' in cols:
                add_if_exists('image_path', image_path_val)

            if not insert_cols:
                raise Exception('no_insertable_columns')

            placeholders = ','.join(['%s'] * len(insert_cols))
            cols_sql = ','.join([f"{c}" for c in insert_cols])
            insert_sql = f"INSERT INTO crops ({cols_sql}) VALUES ({placeholders})"
            cur.execute(insert_sql, tuple(insert_vals))
            conn.commit()
            # send crop-uploaded email asynchronously (if provided)
            try:
                if seller_email:
                    threading.Thread(target=send_crop_uploaded_email, args=(seller_email, seller_name, crop_name)).start()
            except Exception:
                pass

            # If expiry_date is already past, send expiry email immediately and record notification
            try:
                inserted_id = getattr(cur, 'lastrowid', None)
                today_iso = datetime.date.today().isoformat()
                try:
                    if expiry_val and str(expiry_val) < today_iso:
                        # try to resolve recipient: prefer provided seller_email, else lookup by seller_id or seller_phone
                        farmer_email = seller_email or None
                        if not farmer_email:
                            if seller_id:
                                try:
                                    cur2 = conn.cursor()
                                    cur2.execute('SELECT email FROM farmer WHERE id=%s LIMIT 1', (seller_id,))
                                    r2 = cur2.fetchone()
                                    farmer_email = r2[0] if r2 else None
                                    try: cur2.close()
                                    except Exception: pass
                                except Exception:
                                    farmer_email = None
                        if not farmer_email and seller_phone:
                            try:
                                cur2 = conn.cursor()
                                cur2.execute('SELECT email FROM farmer WHERE phone=%s LIMIT 1', (seller_phone,))
                                r2 = cur2.fetchone()
                                farmer_email = r2[0] if r2 else None
                                try: cur2.close()
                                except Exception: pass
                            except Exception:
                                farmer_email = None

                        # send expired email (non-blocking) if we have an address
                        try:
                            if farmer_email:
                                threading.Thread(target=send_crop_expired_email, args=(farmer_email, seller_name or '', crop_name or 'your crop')).start()
                        except Exception:
                            pass

                        # record notification to avoid duplicates (ignore errors)
                        try:
                            cur.execute('INSERT INTO expiry_notifications (crop_id) VALUES (%s)', (inserted_id,))
                            conn.commit()
                        except Exception:
                            try:
                                conn.rollback()
                            except Exception:
                                pass
                except Exception:
                    pass
            except Exception:
                pass

            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': True, 'stored': 'mysql'}), 200
        except Exception as e:
            print('MySQL insert crops error:', e)
            # when DB_USE is mysql we do not silently fall back to sqlite; report failure
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': 'mysql_insert_failed', 'detail': str(e)}), 500
    
    # Otherwise (DB_USE != 'mysql') use SQLite fallback
    # SQLite fallback: store in backend/users.sqlite3 as a crops table
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute('''
            CREATE TABLE IF NOT EXISTS crops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                seller_id INTEGER,
                seller_name TEXT NOT NULL,
                seller_phone TEXT,
                region TEXT,
                state TEXT,
                crop_name TEXT NOT NULL,
                category TEXT DEFAULT NULL,
                quantity_kg REAL NOT NULL DEFAULT 0.0,
                price_per_kg REAL NOT NULL DEFAULT 0.0,
                image_blob BLOB NULL,
                image_mime TEXT DEFAULT NULL,
                image_path TEXT DEFAULT NULL,
                expiry_date DATE DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        # Try to resolve seller_id for sqlite too
        seller_id_val = None
        try:
            seller_id_val = int(data.get('seller_id')) if data.get('seller_id') else None
        except Exception:
            seller_id_val = None
        if not seller_id_val and seller_phone:
            try:
                user_tbl, user_row = find_user_by_phone(seller_phone)
                if user_row:
                    seller_id_val = user_row[0]
            except Exception:
                seller_id_val = None

        # expiry_date support for sqlite insert
        expiry_date_val = None
        if isinstance(data, dict):
            expiry_date_val = data.get('expiry_date') or None
            if expiry_date_val == '':
                expiry_date_val = None

        if seller_id_val:
            sqlite_cur.execute('INSERT INTO crops (seller_id, seller_name, seller_phone, region, state, crop_name, category, quantity_kg, price_per_kg, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
                               (seller_id_val, seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, category if category else None, quantity_kg, price_per_kg, expiry_date_val))
        else:
            # include optional image for sqlite path if provided
            img_b64 = data.get('image_base64') if isinstance(data, dict) else None
            img_blob = None
            img_mime = None
            if img_b64:
                try:
                    if isinstance(img_b64, str) and img_b64.startswith('data:'):
                        img_mime = img_b64.split(';',1)[0].split(':',1)[1]
                        img_b64 = img_b64.split(',',1)[1]
                    import base64
                    img_blob = base64.b64decode(img_b64)
                except Exception:
                    img_blob = None
            if img_blob is not None:
                sqlite_cur.execute('INSERT INTO crops (seller_name, seller_phone, region, state, crop_name, category, quantity_kg, price_per_kg, image_blob, image_mime, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                                   (seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, category if category else None, quantity_kg, price_per_kg, img_blob, img_mime, expiry_date_val))
            else:
                sqlite_cur.execute('INSERT INTO crops (seller_name, seller_phone, region, state, crop_name, category, quantity_kg, price_per_kg, expiry_date) VALUES (?,?,?,?,?,?,?,?,?)',
                                   (seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, category if category else None, quantity_kg, price_per_kg, expiry_date_val))
        sqlite_conn.commit()
        # send crop-uploaded email asynchronously if provided
        try:
            if seller_email:
                threading.Thread(target=send_crop_uploaded_email, args=(seller_email, seller_name, crop_name)).start()
        except Exception:
            pass

        # If expiry_date is already past, send expired email immediately and record notification
        try:
            inserted_id = sqlite_cur.lastrowid
            today_iso = datetime.date.today().isoformat()
            try:
                if expiry_date_val and str(expiry_date_val) < today_iso:
                    farmer_email = seller_email or None
                    if not farmer_email and seller_id_val:
                        try:
                            s_conn = sqlite3.connect(db_path)
                            s_cur = s_conn.cursor()
                            s_cur.execute('SELECT email FROM farmer WHERE id=?', (seller_id_val,))
                            r2 = s_cur.fetchone()
                            farmer_email = r2[0] if r2 else None
                            try: s_cur.close(); s_conn.close()
                            except Exception: pass
                        except Exception:
                            farmer_email = None
                    if not farmer_email and seller_phone:
                        try:
                            s_conn = sqlite3.connect(db_path)
                            s_cur = s_conn.cursor()
                            s_cur.execute('SELECT email FROM farmer WHERE phone=? LIMIT 1', (seller_phone,))
                            r2 = s_cur.fetchone()
                            farmer_email = r2[0] if r2 else None
                            try: s_cur.close(); s_conn.close()
                            except Exception: pass
                        except Exception:
                            farmer_email = None

                    try:
                        if farmer_email:
                            threading.Thread(target=send_crop_expired_email, args=(farmer_email, seller_name or '', crop_name or 'your crop')).start()
                    except Exception:
                        pass

                    try:
                        sqlite_cur.execute('INSERT INTO expiry_notifications (crop_id) VALUES (?)', (inserted_id,))
                        sqlite_conn.commit()
                    except Exception:
                        try:
                            sqlite_conn.rollback()
                        except Exception:
                            pass
            except Exception:
                pass
        except Exception:
            pass

        try:
            sqlite_cur.close()
        except Exception:
            pass
        try:
            sqlite_conn.close()
        except Exception:
            pass
        return jsonify({'ok': True, 'stored': 'sqlite'}), 200
    except Exception as e:
        print('SQLite insert crops error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/deals', methods=['POST'])
def add_deal():
    """Accept a buyer deal and persist to MySQL deals table. This endpoint requires MySQL (DB_USE=mysql).
    Expects multipart/form-data with fields: buyer_name, buyer_phone, buyer_id (optional), region, state, crop_name, quantity_kg, and an 'image' file.
    """
    # Require MySQL per request
    if os.environ.get('DB_USE', 'mysql').lower() != 'mysql' or mysql is None:
        return jsonify({'ok': False, 'error': 'mysql_required'}), 500

    data = request.form.to_dict() if request.form else {}
    # allow JSON fallback
    if not data:
        data = request.get_json(silent=True) or {}

    buyer_name = (data.get('buyer_name') or data.get('seller_name') or '').strip()
    buyer_phone = (data.get('buyer_phone') or data.get('seller_phone') or '').strip()
    # support buyer_email key from client (MyDeals posts buyer_email)
    buyer_email = (data.get('buyer_email') or data.get('buyerEmail') or '').strip()
    buyer_id = data.get('buyer_id') or None
    region = (data.get('region') or '').strip()
    state = (data.get('state') or '').strip()
    crop_name = (data.get('crop_name') or '').strip()
    try:
        quantity_kg = float(data.get('quantity_kg') or 0)
    except Exception:
        return jsonify({'ok': False, 'error': 'invalid_quantity'}), 400

    if not buyer_name or not crop_name:
        return jsonify({'ok': False, 'error': 'buyer_name_and_crop_required'}), 400

    # Save image if provided
    image_path_val = None
    if 'image' in request.files:
        try:
            up = request.files['image']
            if up and up.filename:
                ext = os.path.splitext(up.filename)[1] or mimetypes.guess_extension(up.mimetype or '') or '.img'
                fname = f"{int(datetime.datetime.utcnow().timestamp())}_{uuid.uuid4().hex}{ext}"
                uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                os.makedirs(uploads_dir, exist_ok=True)
                dest = os.path.join(uploads_dir, fname)
                up.save(dest)
                image_path_val = fname
        except Exception:
            image_path_val = None

    # Insert into MySQL deals table
    try:
        cfg = {
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': int(os.environ.get('DB_PORT', '3306')),
            'user': os.environ.get('DB_USER', 'root'),
            'password': os.environ.get('DB_PASSWORD', ''),
            'database': os.environ.get('DB_NAME', 'agri_ai'),
        }
        conn = mysql.connect(**cfg)
        cur = conn.cursor()
        insert_sql = ("INSERT INTO deals (buyer_id,buyer_name,buyer_phone,region,state,crop_name,quantity_kg,image_path) "
                      "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)")
        cur.execute(insert_sql, (buyer_id if buyer_id else None, buyer_name, buyer_phone if buyer_phone else None, region if region else None, state if state else None, crop_name, quantity_kg, image_path_val if image_path_val else None))
        conn.commit()
        # After successful insert, send crop-uploaded notification email to buyer if an email was provided
        try:
            if buyer_email:
                threading.Thread(target=send_crop_uploaded_email, args=(buyer_email, buyer_name, crop_name), daemon=True).start()
        except Exception:
            # don't fail the request if email send scheduling fails
            pass
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('MySQL insert deal error:', e)
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': 'mysql_insert_failed', 'detail': str(e)}), 500


@app.route('/deals/list', methods=['GET'])
def list_deals():
    """Return recent deals. Optional query params: region, state, crop_name, buyer_id, buyer_phone"""
    region = (request.args.get('region') or '').strip()
    state = (request.args.get('state') or '').strip()
    crop_name = (request.args.get('crop_name') or '').strip()
    buyer_id_q = (request.args.get('buyer_id') or '').strip()
    buyer_phone_q = (request.args.get('buyer_phone') or '').strip()

    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            where = []
            params = []
            if region:
                where.append('region=%s'); params.append(region)
            if state:
                where.append('state=%s'); params.append(state)
            if crop_name:
                where.append('crop_name LIKE %s'); params.append('%' + crop_name + '%')

            if buyer_id_q:
                try:
                    where.append('buyer_id=%s'); params.append(int(buyer_id_q))
                except Exception:
                    pass
            elif buyer_phone_q:
                where.append('buyer_phone=%s'); params.append(buyer_phone_q)

            sql = 'SELECT id,buyer_id,buyer_name,buyer_phone,region,state,crop_name,quantity_kg,image_path,created_at FROM deals'
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += ' ORDER BY created_at DESC LIMIT 200'
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            result = []
            for r in rows:
                image_url = None
                try:
                    if r[8]:
                        image_url = request.host_url.rstrip('/') + '/images/' + str(r[8])
                except Exception:
                    image_url = None
                result.append({
                    'id': r[0], 'buyer_id': r[1], 'buyer_name': r[2], 'buyer_phone': r[3],
                    'region': r[4], 'state': r[5], 'crop_name': r[6], 'quantity_kg': float(r[7]) if r[7] is not None else None,
                    'image_url': image_url, 'created_at': str(r[9])
                })
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': True, 'deals': result}), 200
        except Exception as e:
            print('MySQL list deals error:', e)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': 'mysql_list_failed', 'detail': str(e)}), 500

    # SQLite fallback
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()
        sql = 'SELECT id,buyer_id,buyer_name,buyer_phone,region,state,crop_name,quantity_kg,image_path,created_at FROM deals'
        where = []
        params = []
        if region:
            where.append('region=?'); params.append(region)
        if state:
            where.append('state=?'); params.append(state)
        if crop_name:
            where.append('crop_name LIKE ?'); params.append('%' + crop_name + '%')
        if buyer_id_q:
            try:
                where.append('buyer_id=?'); params.append(int(buyer_id_q))
            except Exception:
                pass
        elif buyer_phone_q:
            where.append('buyer_phone=?'); params.append(buyer_phone_q)
        if where:
            sql += ' WHERE ' + ' AND '.join(where)
        sql += ' ORDER BY created_at DESC LIMIT 200'
        sqlite_cur.execute(sql, tuple(params))
        rows = sqlite_cur.fetchall()
        result = []
        for r in rows:
            image_url = None
            try:
                if r[8]:
                    image_url = request.host_url.rstrip('/') + '/images/' + str(r[8])
            except Exception:
                image_url = None
            result.append({'id': r[0], 'buyer_id': r[1], 'buyer_name': r[2], 'buyer_phone': r[3], 'region': r[4], 'state': r[5], 'crop_name': r[6], 'quantity_kg': float(r[7]) if r[7] is not None else None, 'image_url': image_url, 'created_at': str(r[9])})
        try:
            sqlite_cur.close()
        except Exception:
            pass
        try:
            sqlite_conn.close()
        except Exception:
            pass
        return jsonify({'ok': True, 'deals': result}), 200
    except Exception as e:
        print('SQLite list deals error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500



@app.route('/deals/<int:deal_id>', methods=['PATCH'])
def update_deal(deal_id):
    """Update fields of a deal. Allowed update: quantity_kg. Accepts buyer_id/buyer_phone in JSON body or query params for ownership verification."""
    data = request.get_json(silent=True) or {}
    # allow passing quantity via JSON body or querystring
    new_qty = data.get('quantity_kg') if 'quantity_kg' in data else request.args.get('quantity_kg')
    buyer_id_body = data.get('buyer_id') or request.args.get('buyer_id') or None
    buyer_phone_body = (data.get('buyer_phone') or request.args.get('buyer_phone') or '').strip()

    try:
        if new_qty is None:
            return jsonify({'ok': False, 'error': 'no_fields'}), 400
        new_qty_val = float(new_qty)
    except Exception:
        return jsonify({'ok': False, 'error': 'invalid_quantity'}), 400

    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # fetch existing owner
            cur.execute('SELECT buyer_id,buyer_phone FROM deals WHERE id=%s', (deal_id,))
            row = cur.fetchone()
            if not row:
                try: cur.close()
                except Exception: pass
                try: conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'not_found'}), 404
            existing_buyer_id, existing_buyer_phone = row[0], (row[1] if len(row) > 1 else None)

            # verify ownership if provided
            if buyer_id_body:
                try:
                    if existing_buyer_id is None or int(buyer_id_body) != int(existing_buyer_id):
                        try: cur.close()
                        except Exception: pass
                        try: conn.close()
                        except Exception: pass
                        return jsonify({'ok': False, 'error': 'not_authorized'}), 403
                except Exception:
                    try: cur.close()
                    except Exception: pass
                    try: conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'invalid_buyer_id'}), 400
            elif buyer_phone_body:
                if not existing_buyer_phone or str(buyer_phone_body) != str(existing_buyer_phone):
                    try: cur.close()
                    except Exception: pass
                    try: conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'not_authorized'}), 403

            cur.execute('UPDATE deals SET quantity_kg=%s WHERE id=%s', (new_qty_val, deal_id))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True}), 200
        except Exception as e:
            print('update_deal mysql error:', e)
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'mysql_update_failed', 'detail': str(e)}), 500

    # SQLite fallback
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute('SELECT buyer_id,buyer_phone FROM deals WHERE id=?', (deal_id,))
        row = sqlite_cur.fetchone()
        if not row:
            try: sqlite_cur.close()
            except Exception: pass
            try: sqlite_conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'not_found'}), 404
        existing_buyer_id, existing_buyer_phone = row[0], (row[1] if len(row) > 1 else None)

        if buyer_id_body:
            try:
                if existing_buyer_id is None or int(buyer_id_body) != int(existing_buyer_id):
                    try: sqlite_cur.close()
                    except Exception: pass
                    try: sqlite_conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'not_authorized'}), 403
            except Exception:
                try: sqlite_cur.close()
                except Exception: pass
                try: sqlite_conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'invalid_buyer_id'}), 400
        elif buyer_phone_body:
            if not existing_buyer_phone or str(buyer_phone_body) != str(existing_buyer_phone):
                try: sqlite_cur.close()
                except Exception: pass
                try: sqlite_conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'not_authorized'}), 403

        sqlite_cur.execute('UPDATE deals SET quantity_kg=? WHERE id=?', (new_qty_val, deal_id))
        sqlite_conn.commit()
        try: sqlite_cur.close()
        except Exception: pass
        try: sqlite_conn.close()
        except Exception: pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('update_deal sqlite error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/deals/<int:deal_id>', methods=['DELETE'])
def delete_deal(deal_id):
    """Delete a deal row. Accepts buyer_id/buyer_phone in JSON body or query params for ownership verification. Removes image file if present."""
    data = request.get_json(silent=True) or {}
    buyer_id_body = data.get('buyer_id') or request.args.get('buyer_id') or None
    buyer_phone_body = (data.get('buyer_phone') or request.args.get('buyer_phone') or '').strip()

    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            cur.execute('SELECT image_path,buyer_id,buyer_phone FROM deals WHERE id=%s', (deal_id,))
            row = cur.fetchone()
            if not row:
                try: cur.close()
                except Exception: pass
                try: conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'not_found'}), 404
            image_path = row[0] if row and len(row) > 0 else None
            existing_buyer_id = row[1] if row and len(row) > 1 else None
            existing_buyer_phone = row[2] if row and len(row) > 2 else None

            # verify owner
            if buyer_id_body:
                try:
                    if existing_buyer_id is None or int(buyer_id_body) != int(existing_buyer_id):
                        try: cur.close()
                        except Exception: pass
                        try: conn.close()
                        except Exception: pass
                        return jsonify({'ok': False, 'error': 'not_authorized'}), 403
                except Exception:
                    try: cur.close()
                    except Exception: pass
                    try: conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'invalid_buyer_id'}), 400
            elif buyer_phone_body:
                if not existing_buyer_phone or str(buyer_phone_body) != str(existing_buyer_phone):
                    try: cur.close()
                    except Exception: pass
                    try: conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'not_authorized'}), 403

            cur.execute('DELETE FROM deals WHERE id=%s', (deal_id,))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass

            # remove image file if present
            if image_path:
                try:
                    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                    fpath = os.path.join(uploads_dir, os.path.normpath(str(image_path)).replace('..',''))
                    if os.path.exists(fpath):
                        os.remove(fpath)
                except Exception:
                    pass

            return jsonify({'ok': True}), 200
        except Exception as e:
            print('delete_deal mysql error:', e)
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'mysql_delete_failed', 'detail': str(e)}), 500

    # SQLite fallback
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute('SELECT image_path,buyer_id,buyer_phone FROM deals WHERE id=?', (deal_id,))
        row = sqlite_cur.fetchone()
        if not row:
            try: sqlite_cur.close()
            except Exception: pass
            try: sqlite_conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'not_found'}), 404
        image_path = row[0] if row and len(row) > 0 else None
        existing_buyer_id = row[1] if row and len(row) > 1 else None
        existing_buyer_phone = row[2] if row and len(row) > 2 else None

        if buyer_id_body:
            try:
                if existing_buyer_id is None or int(buyer_id_body) != int(existing_buyer_id):
                    try: sqlite_cur.close()
                    except Exception: pass
                    try: sqlite_conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'not_authorized'}), 403
            except Exception:
                try: sqlite_cur.close()
                except Exception: pass
                try: sqlite_conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'invalid_buyer_id'}), 400
        elif buyer_phone_body:
            if not existing_buyer_phone or str(buyer_phone_body) != str(existing_buyer_phone):
                try: sqlite_cur.close()
                except Exception: pass
                try: sqlite_conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'not_authorized'}), 403

        sqlite_cur.execute('DELETE FROM deals WHERE id=?', (deal_id,))
        sqlite_conn.commit()
        try: sqlite_cur.close()
        except Exception: pass
        try: sqlite_conn.close()
        except Exception: pass

        if image_path:
            try:
                uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                fpath = os.path.join(uploads_dir, os.path.normpath(str(image_path)).replace('..',''))
                if os.path.exists(fpath):
                    os.remove(fpath)
            except Exception:
                pass

        return jsonify({'ok': True}), 200
    except Exception as e:
        print('delete_deal sqlite error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/my-crops/list', methods=['GET'])
def list_crop_listings():
    """Return recent crop listings. Optional query params: region, state, crop_name"""
    region = (request.args.get('region') or '').strip()
    state = (request.args.get('state') or '').strip()
    crop_name = (request.args.get('crop_name') or '').strip()
    seller_id_q = (request.args.get('seller_id') or '').strip()
    seller_phone_q = (request.args.get('seller_phone') or '').strip()

    # If configured to use MySQL, require it and do not fall back to SQLite.
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            where = []
            params = []
            if region:
                where.append('c.region=%s')
                params.append(region)
            if state:
                where.append('c.state=%s')
                params.append(state)
            if crop_name:
                where.append('c.crop_name LIKE %s')
                params.append('%' + crop_name + '%')

            # server-side filtering for logged-in user's listings
            if seller_id_q:
                try:
                    where.append('c.seller_id=%s')
                    params.append(int(seller_id_q))
                except Exception:
                    # ignore invalid id
                    pass
            elif seller_phone_q:
                where.append('c.seller_phone=%s')
                params.append(seller_phone_q)

            # Determine which columns we can safely select. Avoid selecting image_blob to prevent fetching raw binary.
            db_name = cfg.get('database')
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema=%s AND table_name=%s", (db_name, 'crops'))
            table_cols = {r[0] for r in cur.fetchall()}

            # Base columns we want to return (from crops table aliased as c)
            select_cols = ['id','seller_id','seller_name','seller_phone','region','state','crop_name','category','quantity_kg','price_per_kg','created_at']
            include_image_path = 'image_path' in table_cols
            if include_image_path:
                # place image_path before created_at for consistent mapping
                select_cols.insert(len(select_cols)-1, 'image_path')
            # include expiry_date if present
            include_expiry = 'expiry_date' in table_cols
            if include_expiry:
                # append expiry_date before created_at for consistency
                # find index of created_at and insert before it
                try:
                    idx = select_cols.index('created_at')
                    select_cols.insert(idx, 'expiry_date')
                except Exception:
                    select_cols.append('expiry_date')

            # We'll select crops columns prefixed with c. and also include farmer.address and farmer.email
            # so the frontend can display seller_address reliably.
            select_sql_parts = [f'c.{col}' for col in select_cols]
            # add farmer-derived fields with aliases
            select_sql_parts.append('farmer.address AS seller_address')
            select_sql_parts.append('farmer.email AS seller_email')
            select_sql_parts.append('farmer.region AS seller_region')
            select_sql_parts.append('farmer.state AS seller_state')
            col_names = list(select_cols) + ['seller_address', 'seller_email', 'seller_region', 'seller_state']

            sql = 'SELECT ' + ','.join(select_sql_parts) + ' FROM crops c LEFT JOIN farmer ON (c.seller_id = farmer.id OR RIGHT(REPLACE(c.seller_phone, "+", ""),10) = RIGHT(farmer.phone,10))'
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += ' ORDER BY c.created_at DESC LIMIT 200'
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            result = []
            for r in rows:
                # Map column names to row values to avoid index fragility
                rowmap = {col: r[idx] if idx < len(r) else None for idx, col in enumerate(col_names)}

                created_at = rowmap.get('created_at')
                created_day = created_month = created_year = None
                try:
                    if hasattr(created_at, 'day'):
                        created_day = created_at.day
                        created_month = created_at.month
                        created_year = created_at.year
                    else:
                        dt = datetime.datetime.fromisoformat(str(created_at))
                        created_day = dt.day; created_month = dt.month; created_year = dt.year
                except Exception:
                    created_day = created_month = created_year = None

                image_url = None
                try:
                    if include_image_path:
                        image_path = rowmap.get('image_path')
                        if image_path:
                            image_url = request.host_url.rstrip('/') + '/images/' + str(image_path)
                except Exception:
                    image_url = None

                result.append({
                    'id': rowmap.get('id'), 'seller_id': rowmap.get('seller_id'), 'seller_name': rowmap.get('seller_name'), 'seller_phone': rowmap.get('seller_phone'),
                    'region': rowmap.get('region'), 'state': rowmap.get('state'),
                    'created_day': created_day, 'created_month': created_month, 'created_year': created_year,
                    'crop_name': rowmap.get('crop_name'), 'category': rowmap.get('category'), 'quantity_kg': float(rowmap.get('quantity_kg')) if rowmap.get('quantity_kg') is not None else None, 'price_per_kg': float(rowmap.get('price_per_kg')) if rowmap.get('price_per_kg') is not None else None,
                    'image_url': image_url, 'expiry_date': rowmap.get('expiry_date'), 'is_expired': (True if rowmap.get('expiry_date') and str(rowmap.get('expiry_date')) < datetime.date.today().isoformat() else False), 'created_at': str(created_at),
                    'seller_email': rowmap.get('seller_email'), 'seller_address': rowmap.get('seller_address'), 'seller_region': rowmap.get('seller_region'), 'seller_state': rowmap.get('seller_state')
                })
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': True, 'crops': result}), 200
        except Exception as e:
            print('MySQL list crops error:', e)
            return jsonify({'ok': False, 'error': 'mysql_list_failed', 'detail': str(e)}), 500

    # SQLite fallback only when DB_USE != 'mysql'
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()

        # Avoid selecting large BLOB columns; prefer image_path when available
        # We'll probe PRAGMA table_info to check for image_path column in SQLite
        try:
            sqlite_cur.execute("PRAGMA table_info(crops)")
            cols_info = sqlite_cur.fetchall()
            sqlite_cols = {c[1] for c in cols_info}
        except Exception:
            sqlite_cols = set()

        base_select = 'id,seller_id,seller_name,seller_phone,region,state,crop_name,category,quantity_kg,price_per_kg'
        # include expiry_date if present
        if 'expiry_date' in sqlite_cols:
            base_select = base_select + ',expiry_date'
        if 'image_path' in sqlite_cols:
            sql = f'SELECT {base_select},image_path,created_at FROM crops'
        else:
            sql = f'SELECT {base_select},created_at FROM crops'
        where = []
        params = []
        if region:
            where.append('region=?'); params.append(region)
        if state:
            where.append('state=?'); params.append(state)
        if crop_name:
            where.append('crop_name LIKE ?'); params.append('%' + crop_name + '%')

        # server-side filtering for logged-in user's listings (sqlite path)
        if seller_id_q:
            try:
                where.append('seller_id=?')
                params.append(int(seller_id_q))
            except Exception:
                pass
        elif seller_phone_q:
            where.append('seller_phone=?')
            params.append(seller_phone_q)

        if where:
            sql += ' WHERE ' + ' AND '.join(where)
        sql += ' ORDER BY created_at DESC LIMIT 200'
        sqlite_cur.execute(sql, tuple(params))
        rows = sqlite_cur.fetchall()
        result = []
        for r in rows:
            # Build a mapping for columns based on whether image_path is present
            # Build rowmap dynamically based on columns selected to avoid index fragility
            # We know the order we selected: base_select (which may include expiry_date), optionally image_path, then created_at
            # Reconstruct mapping by index
            rowmap = {}
            idx = 0
            rowmap['id'] = r[idx]; idx += 1
            rowmap['seller_id'] = r[idx]; idx += 1
            rowmap['seller_name'] = r[idx]; idx += 1
            rowmap['seller_phone'] = r[idx]; idx += 1
            rowmap['region'] = r[idx]; idx += 1
            rowmap['state'] = r[idx]; idx += 1
            rowmap['crop_name'] = r[idx]; idx += 1
            rowmap['quantity_kg'] = r[idx]; idx += 1
            rowmap['price_per_kg'] = r[idx]; idx += 1
            if 'expiry_date' in sqlite_cols:
                rowmap['expiry_date'] = r[idx]; idx += 1
            if 'image_path' in sqlite_cols:
                rowmap['image_path'] = r[idx]; idx += 1
            # created_at should be next
            rowmap['created_at'] = r[idx] if idx < len(r) else None

            created_at = rowmap.get('created_at')
            created_day = created_month = created_year = None
            try:
                if hasattr(created_at, 'day'):
                    created_day = created_at.day
                    created_month = created_at.month
                    created_year = created_at.year
                else:
                    dt = datetime.datetime.fromisoformat(str(created_at))
                    created_day = dt.day; created_month = dt.month; created_year = dt.year
            except Exception:
                created_day = created_month = created_year = None

            image_url = None
            try:
                if 'image_path' in sqlite_cols:
                    image_path = rowmap.get('image_path')
                    if image_path:
                        image_url = request.host_url.rstrip('/') + '/images/' + str(image_path)
            except Exception:
                image_url = None

            is_expired = False
            try:
                if 'expiry_date' in rowmap and rowmap.get('expiry_date'):
                    is_expired = str(rowmap.get('expiry_date')) < datetime.date.today().isoformat()
            except Exception:
                is_expired = False

            # Try to fetch farmer contact/address/region/state details from farmer table for better frontend display
            seller_email = None
            seller_address = None
            seller_region = None
            seller_state = None
            try:
                # attempt to find farmer by id or phone
                fid = rowmap.get('seller_id')
                fphone = rowmap.get('seller_phone')
                sqlite_cur.execute('SELECT email,address,region,state FROM farmer WHERE id=? OR phone=? LIMIT 1', (fid, fphone))
                fr = sqlite_cur.fetchone()
                if fr:
                    seller_email = fr[0] if len(fr) > 0 else None
                    seller_address = fr[1] if len(fr) > 1 else None
                    seller_region = fr[2] if len(fr) > 2 else None
                    seller_state = fr[3] if len(fr) > 3 else None
            except Exception:
                seller_email = None
                seller_address = None
                seller_region = None
                seller_state = None

            result.append({'id': rowmap.get('id'), 'seller_id': rowmap.get('seller_id'), 'seller_name': rowmap.get('seller_name'), 'seller_phone': rowmap.get('seller_phone'), 'region': rowmap.get('region'), 'state': rowmap.get('state'), 'created_day': created_day, 'created_month': created_month, 'created_year': created_year, 'crop_name': rowmap.get('crop_name'), 'category': rowmap.get('category') if 'category' in rowmap else None, 'quantity_kg': float(rowmap.get('quantity_kg')) if rowmap.get('quantity_kg') is not None else None, 'price_per_kg': float(rowmap.get('price_per_kg')) if rowmap.get('price_per_kg') is not None else None, 'image_url': image_url, 'expiry_date': rowmap.get('expiry_date') if 'expiry_date' in rowmap else None, 'is_expired': is_expired, 'created_at': str(created_at), 'seller_email': seller_email, 'seller_address': seller_address, 'seller_region': seller_region, 'seller_state': seller_state})
        try:
            sqlite_cur.close()
        except Exception:
            pass
        try:
            sqlite_conn.close()
        except Exception:
            pass
        return jsonify({'ok': True, 'crops': result}), 200
    except Exception as e:
        print('SQLite list crops error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/my-crops/<int:crop_id>', methods=['DELETE'])
def delete_crop(crop_id):
    """Delete a crop by id. Removes image file from disk if present."""
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # try to get image_path, expiry_date, seller_id, seller_phone, seller_name if present
            try:
                cur.execute('SELECT image_path, expiry_date, seller_id, seller_phone, seller_name FROM crops WHERE id=%s', (crop_id,))
                row = cur.fetchone()
                image_path = row[0] if row else None
                expiry_date = row[1] if row and len(row) > 1 else None
                seller_id = row[2] if row and len(row) > 2 else None
                seller_phone = row[3] if row and len(row) > 3 else None
                seller_name = row[4] if row and len(row) > 4 else None
            except Exception:
                image_path = None; expiry_date = None; seller_id = None; seller_phone = None; seller_name = None
            cur.execute('DELETE FROM crops WHERE id=%s', (crop_id,))
            conn.commit()
            # We no longer send expiry emails on deletion. Expiry emails are sent when
            # a crop actually becomes expired (by the notifier) or immediately at upload
            # if the expiry_date is already in the past.
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            # remove file if exists
            if image_path:
                try:
                    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                    fpath = os.path.join(uploads_dir, os.path.normpath(str(image_path)).replace('..',''))
                    if os.path.exists(fpath):
                        os.remove(fpath)
                except Exception:
                    pass
            return jsonify({'ok': True}), 200
        except Exception as e:
            print('delete_crop mysql error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            sqlite_conn = sqlite3.connect(db_path)
            sqlite_cur = sqlite_conn.cursor()
            sqlite_cur.execute('SELECT image_path, expiry_date, seller_id, seller_phone, seller_name FROM crops WHERE id=?', (crop_id,))
            row = sqlite_cur.fetchone()
            image_path = row[0] if row else None
            expiry_date = row[1] if row and len(row) > 1 else None
            seller_id = row[2] if row and len(row) > 2 else None
            seller_phone = row[3] if row and len(row) > 3 else None
            seller_name = row[4] if row and len(row) > 4 else None
            sqlite_cur.execute('DELETE FROM crops WHERE id=?', (crop_id,))
            sqlite_conn.commit()
            # We no longer send expiry emails on deletion. Expiry emails are sent when
            # a crop actually becomes expired (by the notifier) or immediately at upload
            # if the expiry_date is already in the past.
            try:
                sqlite_cur.close()
            except Exception:
                pass
            try:
                sqlite_conn.close()
            except Exception:
                pass
            if image_path:
                try:
                    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                    fpath = os.path.join(uploads_dir, os.path.normpath(str(image_path)).replace('..',''))
                    if os.path.exists(fpath):
                        os.remove(fpath)
                except Exception:
                    pass
            return jsonify({'ok': True}), 200
        except Exception as e:
            print('delete_crop sqlite error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/my-crops/<int:crop_id>', methods=['PATCH'])
def update_crop(crop_id):
    """Update certain fields of a crop listing. Allowed updates: price_per_kg, seller_phone, quantity_kg (only decrease)."""
    data = request.get_json() or {}
    price = data.get('price_per_kg')
    seller_phone = data.get('seller_phone')
    new_qty = data.get('quantity_kg')

    # parse numeric inputs
    parsed_price = None
    parsed_qty = None
    try:
        if price is not None and price != '':
            parsed_price = float(price)
            if parsed_price < 0:
                return jsonify({'ok': False, 'error': 'invalid_price'}), 400
    except Exception:
        return jsonify({'ok': False, 'error': 'invalid_price'}), 400
    try:
        if new_qty is not None and new_qty != '':
            parsed_qty = float(new_qty)
            if parsed_qty < 0:
                return jsonify({'ok': False, 'error': 'invalid_quantity'}), 400
    except Exception:
        return jsonify({'ok': False, 'error': 'invalid_quantity'}), 400

    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # fetch current quantity to enforce only-decrease rule
            cur.execute('SELECT quantity_kg FROM crops WHERE id=%s', (crop_id,))
            row = cur.fetchone()
            if not row:
                try:
                    cur.close()
                except Exception:
                    pass
                try:
                    conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'not_found'}), 404
            current_qty = float(row[0]) if row[0] is not None else None

            # enforce quantity decrease only
            if parsed_qty is not None and current_qty is not None and parsed_qty > current_qty:
                try:
                    cur.close()
                except Exception:
                    pass
                try:
                    conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'cannot_increase_quantity'}), 400

            # build update statement dynamically
            updates = []
            params = []
            if parsed_price is not None:
                updates.append('price_per_kg=%s')
                params.append(parsed_price)
            if seller_phone is not None:
                updates.append('seller_phone=%s')
                params.append(seller_phone)
            if parsed_qty is not None:
                updates.append('quantity_kg=%s')
                params.append(parsed_qty)

            if not updates:
                try:
                    cur.close()
                except Exception:
                    pass
                try:
                    conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'no_fields'}), 400

            params.append(crop_id)
            sql = 'UPDATE crops SET ' + ','.join(updates) + ' WHERE id=%s'
            cur.execute(sql, tuple(params))
            conn.commit()
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': True}), 200
        except Exception as e:
            print('update_crop mysql error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            sqlite_conn = sqlite3.connect(db_path)
            sqlite_cur = sqlite_conn.cursor()
            sqlite_cur.execute('SELECT quantity_kg FROM crops WHERE id=?', (crop_id,))
            row = sqlite_cur.fetchone()
            if not row:
                try:
                    sqlite_cur.close()
                except Exception:
                    pass
                try:
                    sqlite_conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'not_found'}), 404
            current_qty = float(row[0]) if row[0] is not None else None
            if parsed_qty is not None and current_qty is not None and parsed_qty > current_qty:
                try:
                    sqlite_cur.close()
                except Exception:
                    pass
                try:
                    sqlite_conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'cannot_increase_quantity'}), 400

            updates = []
            params = []
            if parsed_price is not None:
                updates.append('price_per_kg=?')
                params.append(parsed_price)
            if seller_phone is not None:
                updates.append('seller_phone=?')
                params.append(seller_phone)
            if parsed_qty is not None:
                updates.append('quantity_kg=?')
                params.append(parsed_qty)

            if not updates:
                try:
                    sqlite_cur.close()
                except Exception:
                    pass
                try:
                    sqlite_conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'no_fields'}), 400

            params.append(crop_id)
            sql = 'UPDATE crops SET ' + ','.join(updates) + ' WHERE id=?'
            sqlite_cur.execute(sql, tuple(params))
            sqlite_conn.commit()
            try:
                sqlite_cur.close()
            except Exception:
                pass
            try:
                sqlite_conn.close()
            except Exception:
                pass
            return jsonify({'ok': True}), 200
        except Exception as e:
            print('update_crop sqlite error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/ai/groq', methods=['POST'])
def ai_groq():
    data = request.get_json() or {}
    q = (data.get('q') or '').strip()
    if not q:
        return jsonify({'error': 'query_required'}), 400

    # Configuration: either full endpoint or project+dataset
    groq_endpoint = os.environ.get('GROQ_ENDPOINT')
    groq_project = os.environ.get('GROQ_PROJECT')
    groq_dataset = os.environ.get('GROQ_DATASET')
    groq_key = os.environ.get('GROQ_API_KEY')

    if groq_endpoint:
        url = groq_endpoint.rstrip('/') + '?query=' + urllib.parse.quote(q)
    elif groq_project and groq_dataset:
        url = f"https://{groq_project}.api.sanity.io/v1/data/query/{groq_dataset}?query=" + urllib.parse.quote(q)
    else:
        return jsonify({'error': 'no_groq_config'}), 400

    headers = {'Accept': 'application/json'}
    if groq_key:
        headers['Authorization'] = f'Bearer {groq_key}'

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        # Return the raw JSON from GROQ provider under 'result' key
        return jsonify({'result': resp.json()}), 200
    except Exception as e:
        print('ai_groq error:', e)
        return jsonify({'error': 'groq_query_failed', 'detail': str(e)}), 500


@app.route('/email/send-test', methods=['POST'])
def send_test_email():
    data = request.get_json() or {}
    to_email = (data.get('to') or '').strip()
    if not to_email:
        return jsonify({'error': 'to_required'}), 400
    try:
        # Use same send_thankyou_email helper
        send_thankyou_email(to_email, 'Friend', '')
        return jsonify({'success': True}), 200
    except Exception as e:
        print('send_test_email error:', e)
        return jsonify({'error': 'send_failed', 'detail': str(e)}), 500


@app.route('/email/send-crop-test', methods=['POST'])
def send_crop_test_email():
    """Synchronous test endpoint to send the crop-uploaded email and return any SMTP errors.
    POST JSON: {"to": "recipient@example.com", "farmer_name": "Name", "crop_name": "Crop"}
    """
    data = request.get_json() or {}
    to_email = (data.get('to') or '').strip()
    farmer_name = (data.get('farmer_name') or '').strip()
    crop_name = (data.get('crop_name') or '').strip()
    if not to_email or not crop_name:
        return jsonify({'error': 'to_and_crop_required'}), 400
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        from_addr = os.environ.get('SMTP_FROM', smtp_user)

        if not smtp_password:
            return jsonify({'ok': False, 'error': 'SMTP_PASSWORD_not_set'}), 400

        subj = '🌾 New Crop Uploaded Successfully on Agri AI'
        body = (
            f"Dear {farmer_name or ''},\n\n"
            "Namaste! 🙏\n\n"
            f"We’re happy to inform you that your crop {crop_name} has been successfully uploaded on Agri AI.\n"
            "Your crop is now visible to interested buyers and other farmers across the platform.\n\n"
            "Our team will review your submission to ensure all details meet the quality standards. You’ll receive another update once your crop listing is approved.\n\n"
            "Thank you for using Agri AI — empowering farmers with digital innovation for a smarter future in agriculture!\n\n"
            "If you have any questions or need help, feel free to reach us at support@agriai.com.\n\n"
            "Warm regards,\n"
            "Team Agri AI\n"
            "Smart Farming, Simple Solutions 🌱\n"
        )

        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = from_addr
        msg['To'] = to_email
        msg.set_content(body)

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            try:
                server.starttls(context=context)
            except Exception:
                pass
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return jsonify({'ok': True}), 200
    except Exception as e:
        print('send_crop_test_email error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({'error': 'email_and_password_required'}), 400

    # search for user by email across role tables
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        for tbl in ('farmer', 'buyer', 'admin'):
            if kind == 'mysql':
                cur.execute(f"SELECT id, name, phone, email, aadhar, password_hash, region, state, address FROM {tbl} WHERE email=%s LIMIT 1", (email,))
            else:
                cur.execute(f"SELECT id, name, phone, email, aadhar, password_hash, region, state, address FROM {tbl} WHERE email=? LIMIT 1", (email,))
            row = cur.fetchone()
            if row:
                # password_hash stored as utf-8 str
                try:
                    stored = row[5]
                    if isinstance(stored, str):
                        stored_bytes = stored.encode('utf-8')
                    else:
                        stored_bytes = stored
                    ok = bcrypt.checkpw(password.encode('utf-8'), stored_bytes)
                except Exception as e:
                    print('bcrypt check error:', e)
                    ok = False
                if ok:
                    # success — include basic profile fields (id, name, phone, email, aadhar, region/state/address)
                    try:
                        cur.close()
                        conn.close()
                    except Exception:
                        pass
                    user = {
                        'id': row[0],
                        'name': row[1],
                        'phone': row[2],
                        'email': row[3],
                        'aadhar': row[4],
                        'region': row[6] if len(row) > 6 else None,
                        'state': row[7] if len(row) > 7 else None,
                        'address': row[8] if len(row) > 8 else None
                    }
                    return jsonify({'success': True, 'role': tbl, 'user': user}), 200
                else:
                    try:
                        cur.close()
                        conn.close()
                    except Exception:
                        pass
                    return jsonify({'error': 'invalid_credentials'}), 401
        cur.close()
    except Exception as e:
        print('login query error:', e)
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return jsonify({'error': 'not_registered'}), 404


@app.route('/admin/debug-crops', methods=['GET'])
def admin_debug_crops():
    """Debug endpoint: return which DB the app is using and a preview of recent crops rows.
    Use this to confirm whether the backend is connected to the same MySQL instance phpMyAdmin shows.
    """
    info = {'driver': DB_DRIVER}
    # If MySQL driver available and configured, report server variables and a sample of crops
    if mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql':
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', '127.0.0.1'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            info['mysql_cfg'] = cfg
            conn = mysql.connect(host=cfg['host'], port=cfg['port'], user=os.environ.get('DB_USER','root'), password=os.environ.get('DB_PASSWORD',''), database=cfg['database'])
            cur = get_cursor('mysql', conn)
            # server info
            try:
                cur.execute('SELECT @@hostname AS host, @@port AS port, CURRENT_USER() AS current_user')
                sv = cur.fetchone()
                info['server'] = {'host': sv[0] if sv else None, 'port': sv[1] if sv else None, 'current_user': sv[2] if sv else None}
            except Exception:
                info['server'] = None
            # crops preview
            try:
                cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,created_at FROM crops ORDER BY created_at DESC LIMIT 10')
                rows = cur.fetchall()
                info['crops_preview'] = []
                for r in rows:
                    info['crops_preview'].append({'id': r[0], 'seller_id': r[1], 'seller_name': r[2], 'seller_phone': r[3], 'crop_name': r[4], 'quantity_kg': float(r[5]) if r[5] is not None else None, 'price_per_kg': float(r[6]) if r[6] is not None else None, 'created_at': str(r[7])})
            except Exception as e:
                info['crops_preview_error'] = str(e)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            info['mysql_connect_error'] = str(e)
    else:
        # Report SQLite crops
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            sqlite_conn = sqlite3.connect(db_path)
            sqlite_cur = sqlite_conn.cursor()
            sqlite_cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,created_at FROM crops ORDER BY created_at DESC LIMIT 10')
            rows = sqlite_cur.fetchall()
            info['crops_preview'] = []
            for r in rows:
                info['crops_preview'].append({'id': r[0], 'seller_id': r[1], 'seller_name': r[2], 'seller_phone': r[3], 'crop_name': r[4], 'quantity_kg': float(r[5]) if r[5] is not None else None, 'price_per_kg': float(r[6]) if r[6] is not None else None, 'created_at': str(r[7])})
            sqlite_cur.close(); sqlite_conn.close()
        except Exception as e:
            info['sqlite_error'] = str(e)

    return jsonify(info), 200


@app.route('/admin/debug-farmers', methods=['GET'])
def admin_debug_farmers():
    """Return counts and small samples from farmer and crops tables for diagnostics."""
    info = {'driver': DB_DRIVER}
    if mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql':
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', '127.0.0.1'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(host=cfg['host'], port=cfg['port'], user=os.environ.get('DB_USER','root'), password=os.environ.get('DB_PASSWORD',''), database=cfg['database'])
            cur = get_cursor('mysql', conn)
            try:
                cur.execute('SELECT COUNT(*) FROM farmer')
                info['farmer_count'] = cur.fetchone()[0]
            except Exception as e:
                info['farmer_count_error'] = str(e)
            try:
                cur.execute('SELECT COUNT(*) FROM crops')
                info['crops_count'] = cur.fetchone()[0]
            except Exception as e:
                info['crops_count_error'] = str(e)

            try:
                cur.execute('SELECT id,name,phone,region,state,address,created_at FROM farmer ORDER BY created_at DESC LIMIT 10')
                rows = cur.fetchall()
                info['farmer_sample'] = []
                for r in rows:
                    info['farmer_sample'].append({'id': r[0], 'name': r[1], 'phone': r[2], 'region': r[3], 'state': r[4], 'address': r[5], 'created_at': str(r[6])})
            except Exception as e:
                info['farmer_sample_error'] = str(e)

            try:
                cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,created_at FROM crops ORDER BY created_at DESC LIMIT 10')
                rows = cur.fetchall()
                info['crops_sample'] = []
                for r in rows:
                    info['crops_sample'].append({'id': r[0], 'seller_id': r[1], 'seller_name': r[2], 'seller_phone': r[3], 'crop_name': r[4], 'quantity_kg': float(r[5]) if r[5] is not None else None, 'price_per_kg': float(r[6]) if r[6] is not None else None, 'created_at': str(r[7])})
            except Exception as e:
                info['crops_sample_error'] = str(e)

            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
        except Exception as e:
            info['mysql_connect_error'] = str(e)
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            sqlite_conn = sqlite3.connect(db_path)
            sqlite_cur = sqlite_conn.cursor()
            sqlite_cur.execute('SELECT COUNT(*) FROM farmer')
            info['farmer_count'] = sqlite_cur.fetchone()[0]
            sqlite_cur.execute('SELECT COUNT(*) FROM crops')
            info['crops_count'] = sqlite_cur.fetchone()[0]
            sqlite_cur.execute('SELECT id,name,phone,region,state,address,created_at FROM farmer ORDER BY created_at DESC LIMIT 10')
            info['farmer_sample'] = [{'id': r[0], 'name': r[1], 'phone': r[2], 'region': r[3], 'state': r[4], 'address': r[5], 'created_at': str(r[6])} for r in sqlite_cur.fetchall()]
            sqlite_cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,created_at FROM crops ORDER BY created_at DESC LIMIT 10')
            info['crops_sample'] = [{'id': r[0], 'seller_id': r[1], 'seller_name': r[2], 'seller_phone': r[3], 'crop_name': r[4], 'quantity_kg': float(r[5]) if r[5] is not None else None, 'price_per_kg': float(r[6]) if r[6] is not None else None, 'created_at': str(r[7])} for r in sqlite_cur.fetchall()]
            sqlite_cur.close(); sqlite_conn.close()
        except Exception as e:
            info['sqlite_error'] = str(e)

    return jsonify(info), 200


@app.route('/farmers/search', methods=['GET'])
def farmers_search():
    """Search farmers by region, state and/or crop. Any combination allowed."""
    region = (request.args.get('region') or '').strip()
    state = (request.args.get('state') or '').strip()
    crop = (request.args.get('crop') or '').strip()
    limit = int(request.args.get('limit') or 50)

    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    results = []
    if use_mysql:
        try:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = get_cursor('mysql', conn)

            where = []
            params = []
            if region:
                where.append('region=%s')
                params.append(region)
            if state:
                where.append('state=%s')
                params.append(state)

            crop_clause = ''
            if crop:
                # If there are existing WHERE conditions, use AND EXISTS; otherwise start a WHERE EXISTS
                if where:
                    crop_clause = ' AND EXISTS (SELECT 1 FROM crops c WHERE (c.seller_id = farmer.id OR RIGHT(REPLACE(c.seller_phone, "+", ""),10) = RIGHT(farmer.phone,10)) AND c.crop_name LIKE %s)'
                else:
                    crop_clause = ' WHERE EXISTS (SELECT 1 FROM crops c WHERE (c.seller_id = farmer.id OR RIGHT(REPLACE(c.seller_phone, "+", ""),10) = RIGHT(farmer.phone,10)) AND c.crop_name LIKE %s)'
                params.append('%' + crop + '%')

            sql = 'SELECT id,name,phone,email,region,state,address FROM farmer'
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += crop_clause
            sql += ' ORDER BY name ASC LIMIT %s'
            params.append(limit)

            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            for r in rows:
                farmer = {'id': r[0], 'name': r[1], 'phone': r[2], 'email': r[3], 'region': (r[4] or ''), 'state': (r[5] or ''), 'address': (r[6] if len(r) > 6 else None)}
                try:
                    cur2 = get_cursor('mysql', conn)
                    cur2.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg FROM crops WHERE (seller_id=%s OR RIGHT(REPLACE(seller_phone, "+", ""),10) = RIGHT(%s,10)) ORDER BY created_at DESC LIMIT 3', (farmer['id'], farmer['phone']))
                    crops_rows = cur2.fetchall()
                    farmer['crop_samples'] = []
                    for cr in crops_rows:
                        farmer['crop_samples'].append({'id': cr[0], 'seller_id': cr[1], 'seller_name': cr[2], 'seller_phone': cr[3], 'crop_name': cr[4], 'quantity_kg': float(cr[5]) if cr[5] is not None else None, 'price_per_kg': float(cr[6]) if cr[6] is not None else None})
                    try:
                        cur2.close()
                    except Exception:
                        pass
                except Exception:
                    farmer['crop_samples'] = []

                results.append(farmer)

            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': True, 'farmers': results}), 200
        except Exception as e:
            print('farmers_search mysql error:', e)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': 'mysql_search_failed', 'detail': str(e)}), 500

    # SQLite fallback
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()
        where = []
        params = []
        if region:
            where.append('region=?'); params.append(region)
        if state:
            where.append('state=?'); params.append(state)
        sql = 'SELECT id,name,phone,email,region,state,address FROM farmer'
        if where:
            sql += ' WHERE ' + ' AND '.join(where)
        sqlite_cur.execute(sql, tuple(params))
        rows = sqlite_cur.fetchall()
        for r in rows:
            farmer = {'id': r[0], 'name': r[1], 'phone': r[2], 'email': r[3], 'region': (r[4] or ''), 'state': (r[5] or ''), 'address': (r[6] if len(r) > 6 else None)}
            sqlite_cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg FROM crops WHERE seller_id=? OR seller_phone=? ORDER BY created_at DESC LIMIT 3', (farmer['id'], farmer['phone']))
            crops_rows = sqlite_cur.fetchall()
            farmer['crop_samples'] = [{'id': cr[0], 'seller_id': cr[1], 'seller_name': cr[2], 'seller_phone': cr[3], 'crop_name': cr[4], 'quantity_kg': float(cr[5]) if cr[5] is not None else None, 'price_per_kg': float(cr[6]) if cr[6] is not None else None} for cr in crops_rows]
            results.append(farmer)
        sqlite_cur.close(); sqlite_conn.close()
        return jsonify({'ok': True, 'farmers': results}), 200
    except Exception as e:
        print('farmers_search sqlite error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/profile/get', methods=['POST'])
def profile_get():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip()
    phone = (data.get('phone') or '').strip()
    if not email and not phone:
        return jsonify({'error': 'email_or_phone_required'}), 400

    tbl, row = (None, None)
    if email:
        tbl, row = find_user_by_email(email)
    if not row and phone:
        tbl, row = find_user_by_phone(phone)
    if not row:
        return jsonify({'error': 'not_found'}), 404

    # row: id,name,phone,email,aadhar,password_hash,region,state,address
    user = {
        'role': tbl,
        'id': row[0],
        'name': row[1],
        'phone': row[2],
        'email': row[3],
        'aadhar': row[4],
        'region': row[6] if len(row) > 6 else None,
        'state': row[7] if len(row) > 7 else None,
        'address': row[8] if len(row) > 8 else None
    }
    return jsonify({'user': user}), 200


@app.route('/states/list', methods=['GET'])
def states_list():
    """Return distinct state names present in the farmer table.
    This supports both MySQL and SQLite backends.
    Response: { ok: True, states: [ 'Karnataka', 'Punjab', ... ] }
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        try:
            if kind == 'mysql':
                cur.execute("SELECT DISTINCT state FROM farmer WHERE state IS NOT NULL AND state <> '' ORDER BY state")
                rows = cur.fetchall()
                states = [r[0] for r in rows if r and r[0]]
            else:
                cur.execute("SELECT DISTINCT state FROM farmer WHERE state IS NOT NULL AND state <> '' ORDER BY state")
                rows = cur.fetchall()
                states = [r[0] for r in rows if r and r[0]]
        except Exception as e:
            print('states_list query error:', e)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': str(e)}), 500
        try:
            cur.close()
        except Exception:
            pass
    except Exception as e:
        print('states_list error:', e)
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

    # Normalize/sanitize: title-case strings
    cleaned = []
    for s in states:
        try:
            if isinstance(s, str):
                ss = s.strip()
                if ss:
                    cleaned.append(ss.title())
        except Exception:
            continue

    return jsonify({'ok': True, 'states': cleaned}), 200


@app.route('/regions/list', methods=['GET'])
def regions_list():
    """Return distinct region names present in the farmer table.
    Response: { ok: True, regions: [ 'North', 'South', ... ] }
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        try:
            if kind == 'mysql':
                cur.execute("SELECT DISTINCT region FROM farmer WHERE region IS NOT NULL AND region <> '' ORDER BY region")
                rows = cur.fetchall()
                regions = [r[0] for r in rows if r and r[0]]
            else:
                cur.execute("SELECT DISTINCT region FROM farmer WHERE region IS NOT NULL AND region <> '' ORDER BY region")
                rows = cur.fetchall()
                regions = [r[0] for r in rows if r and r[0]]
        except Exception as e:
            print('regions_list query error:', e)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': str(e)}), 500
        try:
            cur.close()
        except Exception:
            pass
    except Exception as e:
        print('regions_list error:', e)
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

    cleaned = []
    for s in regions:
        try:
            if isinstance(s, str):
                ss = s.strip()
                if ss:
                    cleaned.append(ss.title())
        except Exception:
            continue

    return jsonify({'ok': True, 'regions': cleaned}), 200


@app.route('/crops/names', methods=['GET'])
def crops_names():
    """Return distinct crop names present in the crops table (MySQL and SQLite supported).
    Response: { ok: True, crops: [ 'Rice', 'Maize', ... ] }
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        try:
            # Exclude crop names whose listings are expired. A crop is considered expired if expiry_date < today.
            if kind == 'mysql':
                today_iso = datetime.date.today().isoformat()
                sql = ("SELECT DISTINCT crop_name FROM crops WHERE crop_name IS NOT NULL AND crop_name <> '' "
                       "AND (expiry_date IS NULL OR expiry_date >= %s) ORDER BY crop_name")
                cur.execute(sql, (today_iso,))
                rows = cur.fetchall()
                names = [r[0] for r in rows if r and r[0]]
            else:
                # SQLite: use date('now') for current date comparison
                sql = ("SELECT DISTINCT crop_name FROM crops WHERE crop_name IS NOT NULL AND crop_name <> '' "
                       "AND (expiry_date IS NULL OR expiry_date >= date('now')) ORDER BY crop_name")
                cur.execute(sql)
                rows = cur.fetchall()
                names = [r[0] for r in rows if r and r[0]]
        except Exception as e:
            print('crops_names query error:', e)
            try:
                cur.close()
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': str(e)}), 500
        try:
            cur.close()
        except Exception:
            pass
    except Exception as e:
        print('crops_names error:', e)
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass

    # Normalize: strip and title-case
    cleaned = []
    for s in names:
        try:
            if isinstance(s, str):
                ss = s.strip()
                if ss:
                    cleaned.append(ss)
        except Exception:
            continue

    # Remove duplicates while preserving order
    seen = set()
    ordered = []
    for v in cleaned:
        if v not in seen:
            seen.add(v)
            ordered.append(v)

    return jsonify({'ok': True, 'crops': ordered}), 200


@app.route('/profile/update', methods=['POST'])
def profile_update():
    data = request.get_json() or {}
    # Allow changing email: client should send original_email (current) and email (new)
    original_email = (data.get('original_email') or '').strip()
    original_phone = (data.get('original_phone') or '').strip()
    email = (data.get('email') or '').strip()
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    aadhar = (data.get('aadhar') or '').strip()
    region = (data.get('region') or '').strip()
    state = (data.get('state') or '').strip()
    address = (data.get('address') or '').strip()

    # original_email or original_phone is required to identify the record to update; if not provided, fall back
    if not original_email and original_phone:
        # nothing to do, we'll use phone
        pass
    if not original_email and not original_phone:
        # try to fall back to email field if provided
        original_email = email
    if not original_email and not original_phone:
        return jsonify({'error': 'original_email_or_phone_required'}), 400
    if not name:
        return jsonify({'error': 'name_required'}), 400
    if not phone or not phone.isdigit() or len(phone) != 10:
        return jsonify({'error': 'invalid_phone'}), 400
    if not aadhar or not aadhar.isdigit() or len(aadhar) != 12:
        return jsonify({'error': 'invalid_aadhar'}), 400

    # address required now
    if not address:
        return jsonify({'error': 'address_required'}), 400

    # Normalize and validate region/state if provided
    if region:
        region_norm = region.strip().lower()
        if region_norm not in ('north', 'south', 'east', 'west'):
            return jsonify({'error': 'invalid_region'}), 400
        # store title case
        region = region_norm.title()
    else:
        region = None

    if state:
        # basic validation: letters and spaces, min length 2
        if len(state) < 2 or not re.match(r'^[A-Za-z\s]+$', state):
            return jsonify({'error': 'invalid_state'}), 400
        state = state.title()
    else:
        state = None

    # Find existing user by original_email or original_phone
    tbl, row = (None, None)
    if original_email:
        tbl, row = find_user_by_email(original_email)
    if not row and original_phone:
        tbl, row = find_user_by_phone(original_phone)
    if not row:
        return jsonify({'error': 'not_found'}), 404
    user_id = row[0]

    # If the email is being changed, ensure new email isn't used by another user
    if email and email != original_email:
        other_tbl, other_row = find_user_by_email(email)
        if other_row:
            return jsonify({'error': 'email_in_use'}), 400

    # Check uniqueness excluding this user
    if identifier_exists_excluding(tbl, user_id, phone=phone):
        return jsonify({'error': 'phone_exists'}), 400
    if identifier_exists_excluding(tbl, user_id, aadhar=aadhar):
        return jsonify({'error': 'aadhar_exists'}), 400

    ok = update_user(tbl, user_id, name, phone, email, aadhar, region=region, state=state, address=address)
    if not ok:
        return jsonify({'error': 'update_failed'}), 500

    return jsonify({'success': True}), 200


if __name__ == '__main__':
    init_contact_excel()
    init_register_excel()
    # Try to ensure MySQL schema if possible (useful when XAMPP is available)
    # If application is configured to use MySQL only, fail fast when driver/connection isn't available
    if os.environ.get('DB_USE', 'mysql').lower() == 'mysql':
        if mysql is None:
            print('Fatal: DB_USE=mysql but no MySQL driver is installed. Install mysql-connector-python or pymysql, then retry.')
            raise SystemExit(1)
    try:
        ensure_mysql_schema()
    except Exception as e:
        print('ensure_mysql_schema error:', e)
    # Ensure deals table exists (MySQL and SQLite fallback)
    try:
        ensure_deals_table()
    except Exception as e:
        print('ensure_deals_table error:', e)
    # Ensure expiry notifications table exists and start background notifier
    try:
        ensure_expiry_notifications_table()
        start_expiry_notifier_thread()
        print('Expiry notifier started.')
    except Exception as e:
        print('Failed to start expiry notifier:', e)
    app.run(debug=True)
