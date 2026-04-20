# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask import send_from_directory
import openpyxl
import os
import re
import requests
from flask_cors import CORS
import datetime
import json
import time
import threading
import sqlite3
import mysql.connector as mysql
import smtplib
import ssl
from email.message import EmailMessage
from dotenv import load_dotenv
import uuid
import mimetypes
 
# Load environment variables from .env file
load_dotenv()


def send_farmer_purchase_email(to_email, farmer_name='', crop_name='', variety='', quantity='', total_price=0, buyer_name='', lang='en'):
    try:
        en_body = f"""
Dear {buyer_name},

* Crop Name: {crop_name}
* Variety: {variety}
* Quantity Sold: {quantity}
* Total Price: ₹{float(total_price or 0):.2f}

The buyer has completed the purchase, and you may now proceed with the next steps as per the agreed terms. You can view complete transaction details and records from the “Notification” section of your account.

If any coordination, verification, or support is required, our team will reach out to you.
For any questions or assistance, please feel free to reach out to us using the “Contact Us” section on the platform.

Thank you for choosing AgriAI – an AI-Enhanced Contract Farming and Farmer Advisory System. We are proud to support you in connecting with buyers and ensuring smooth, transparent transactions.

Warm regards,
The AgriAI Team
AI-Enhanced Contract Farming and Farmer Advisory System
"""

        hi_body = f"""
प्रिय {farmer_name},

बधाई हो! 🎉

हमें यह बताते हुए खुशी हो रही है कि आपकी फसल को AgriAI पर एक खरीदार द्वारा सफलतापूर्वक खरीदा गया है। लेन-देन की पुष्टि हो चुकी है और उससे संबंधित सभी विवरण हमारे प्लेटफ़ॉर्म पर सुरक्षित रूप से दर्ज कर लिए गए हैं।

**बिक्री विवरण:**

* फसल का नाम: {crop_name}
* किस्म: {variety}
* बेची गई मात्रा: {quantity}
* खरीदार का नाम: {buyer_name}

खरीदार द्वारा खरीद पूरी कर ली गई है और अब आप सहमत शर्तों के अनुसार अगले चरणों की प्रक्रिया शुरू कर सकते हैं। आप अपने खाते के “Notification” (सूचनाएँ) अनुभाग से पूरा लेन-देन विवरण और रिकॉर्ड देख सकते हैं।

यदि किसी प्रकार के समन्वय, सत्यापन या सहायता की आवश्यकता होगी, तो हमारी टीम आपसे संपर्क करेगी।
किसी भी प्रश्न या सहायता के लिए, कृपया हमारे प्लेटफ़ॉर्म के “Contact Us” (संपर्क करें) अनुभाग के माध्यम से हमसे संपर्क करें।

AgriAI – एक एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली को चुनने के लिए धन्यवाद। हमें आपको खरीदारों से जोड़ने और सुचारु व पारदर्शी लेन-देन सुनिश्चित करने में सहयोग करने पर गर्व है।

सादर,
AgriAI टीम
एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली
"""

        kn_body = f"""
ಪ್ರಿಯ {farmer_name},

ಅಭಿನಂದನೆಗಳು! 🎉

ನಿಮ್ಮ ಬೆಳೆಯನ್ನು AgriAI ನಲ್ಲಿ ಖರೀದಿದಾರರು ಯಶಸ್ವಿಯಾಗಿ ಖರೀದಿಸಿದ್ದಾರೆ ಎಂಬುದನ್ನು ತಿಳಿಸಲು ನಮಗೆ ಸಂತೋಷವಾಗಿದೆ. ಈ ವ್ಯವಹಾರವನ್ನು ದೃಢೀಕರಿಸಲಾಗಿದ್ದು, ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ.

**ಮಾರಾಟದ ವಿವರಗಳು:**

* ಬೆಳೆ ಹೆಸರು: {crop_name}
* ಜಾತಿ: {variety}
* ಮಾರಾಟವಾದ ಪ್ರಮಾಣ: {quantity}
* ಖರೀದಿದಾರರ ಹೆಸರು: {buyer_name}

ಖರೀದಿದಾರರು ಖರೀದಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದು, ನೀವು ಒಪ್ಪಿಗೆಯಾದ ಷರತ್ತುಗಳ ಪ್ರಕಾರ ಮುಂದಿನ ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳಬಹುದು. ನಿಮ್ಮ ಖಾತೆಯ "Notification" (ಅಧಿಸೂಚನೆಗಳು) ವಿಭಾಗದಿಂದ ಸಂಪೂರ್ಣ ವ್ಯವಹಾರ ವಿವರಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು.
ಯಾವುದೇ ಸಮನ್ವಯ, ಪರಿಶೀಲನೆ ಅಥವಾ ಸಹಾಯ ಅಗತ್ಯವಿದ್ದರೆ, ನಮ್ಮ ತಂಡವು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.
ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ಸಹಾಯಕ್ಕಾಗಿ, ದಯವಿಟ್ಟು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ಇರುವ “Contact Us” (ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ) ವಿಭಾಗದ ಮೂಲಕ մերನ್ನು ಸಂಪರ್ಕಿಸಿ.

AgriAI – ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ ಅನ್ನು ಆಯ್ಕೆ ಮಾಡಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ಖರೀದಿದಾರರೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ ಸುಗಮ ಹಾಗೂ ಪಾರದರ್ಶಕ ವ್ಯವಹಾರಗಳನ್ನು ಖಚಿತಪಡಿಸಲು ನಾವು ಹೆಮ್ಮೆಪಡುತ್ತೇವೆ.
ಹೃತ್ಪೂರ್ವಕ ವಂದನೆಗಳೊಂದಿಗೆ,
AgriAI ತಂಡ
ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ
"""

        subj_map = {'en': 'Your Crop Has Been Successfully Sold on AgriAI', 'hi': 'AgriAI पर आपकी फसल सफलतापूर्वक खरीदी गई है', 'kn': 'AgriAI ನಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆ ಯಶಸ್ವಿಯಾಗಿ ಖರೀದಿಸಲಾಗಿದೆ'}
        chosen = (lang or 'en').lower()[:2]
        subject = subj_map.get(chosen, subj_map['en'])

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = to_email
        if chosen == 'hi':
            msg.set_content(hi_body)
        elif chosen == 'kn':
            msg.set_content(kn_body)
        else:
            msg.set_content(en_body)

        context = ssl.create_default_context()
        try:
            with smtplib.SMTP('smtp.gmail.com', 587, timeout=20) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            print('send_farmer_purchase_email error:', e)
            return False
    except Exception as e:
        print('send_farmer_purchase_email outer error:', e)
        return False

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

# ✅ Health check endpoint for diagnostics
@app.route('/health', methods=['GET', 'POST'])
def health_check():
    """Returns 200 OK if backend is running"""
    return jsonify({"status": "OK", "message": "Backend is running!", "api_base": "http://127.0.0.1:5000"}), 200

# Simple in-memory OTP store for email verification (email -> { otp, expires_at, purpose })
OTP_STORE = {}
OTP_TTL_SECONDS = 10 * 60  # 10 minutes


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
                    "lang VARCHAR(10) DEFAULT 'en',"
                    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                    "PRIMARY KEY (id)"
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                )
                cur.execute(sql)
            # ensure existing tables have the two new columns
            for tbl in ('farmer', 'buyer', 'admin'):
                try:
                    cur.execute(f"ALTER TABLE `{tbl}` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) DEFAULT NULL")
                except Exception:
                    pass
                try:
                    cur.execute(f"ALTER TABLE `{tbl}` ADD COLUMN IF NOT EXISTS `lang` VARCHAR(10) DEFAULT 'en'")
                except Exception:
                    pass
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
                        lang TEXT DEFAULT 'en',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
            # sqlite cannot use ADD COLUMN IF NOT EXISTS; try/except instead
            for tbl in ('farmer', 'buyer', 'admin'):
                try:
                    cur.execute(f"ALTER TABLE {tbl} ADD COLUMN address TEXT")
                except Exception:
                    pass
                try:
                    cur.execute(f"ALTER TABLE {tbl} ADD COLUMN lang TEXT DEFAULT 'en'")
                except Exception:
                    pass
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


def insert_user(role, name, phone, email, aadhar, password_hash, region=None, state=None, address=None, lang=None):
    """Insert user into the given role table including optional region/state and language."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        if kind == 'mysql':
            cur.execute(
                f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state, address, lang) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None, address if address else None, lang if lang else None)
            )
            conn.commit()
            try:
                cur.close()
            except Exception:
                pass
        else:
            cur.execute(
                f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state, address, lang) VALUES (?,?,?,?,?,?,?,?,?)",
                (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None, address if address else None, lang if lang else None)
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
    Row columns: id,name,phone,email,aadhar,password_hash,region,state,address,lang
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        for tbl in ('farmer', 'buyer', 'admin'):
            try:
                if kind == 'mysql':
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address,lang FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                else:
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address,lang FROM {tbl} WHERE email=? LIMIT 1", (email,))
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
    Row columns: id,name,phone,email,aadhar,password_hash,region,state,address,lang
    """
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        for tbl in ('farmer', 'buyer', 'admin'):
            try:
                if kind == 'mysql':
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address,lang FROM {tbl} WHERE phone=%s LIMIT 1", (phone,))
                else:
                    cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,region,state,address,lang FROM {tbl} WHERE phone=? LIMIT 1", (phone,))
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


def update_user(role, user_id, name, phone, email, aadhar, region=None, state=None, address=None, lang=None):
    """Update a user's basic fields by id including optional region/state and language."""
    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        if kind == 'mysql':
            cur.execute(f"UPDATE {role} SET name=%s, phone=%s, email=%s, aadhar=%s, region=%s, state=%s, address=%s, lang=%s WHERE id=%s", (name, phone, email if email else None, aadhar, region if region else None, state if state else None, address if address else None, lang if lang else None, user_id))
        else:
            cur.execute(f"UPDATE {role} SET name=?, phone=?, email=?, aadhar=?, region=?, state=?, address=?, lang=? WHERE id=?", (name, phone, email if email else None, aadhar, region if region else None, state if state else None, address if address else None, lang if lang else None, user_id))
        
        # If updating a farmer and state or region is provided, update the crops table as well
        if role == 'farmer' and (state is not None or region is not None):
            update_fields = []
            update_values = []
            if state is not None:
                update_fields.append("state=%s" if kind == 'mysql' else "state=?")
                update_values.append(state)
            if region is not None:
                update_fields.append("region=%s" if kind == 'mysql' else "region=?")
                update_values.append(region)
            update_values.append(user_id)
            if update_fields:
                cur.execute(f"UPDATE crops SET {', '.join(update_fields)} WHERE seller_id={'%s' if kind == 'mysql' else '?'}", update_values)
        
        # If updating a buyer and state, region, or address is provided, update the deals table as well
        if role == 'buyer' and (state is not None or region is not None or address is not None):
            update_fields = []
            update_values = []
            if state is not None:
                update_fields.append("state=%s" if kind == 'mysql' else "state=?")
                update_values.append(state)
            if region is not None:
                update_fields.append("region=%s" if kind == 'mysql' else "region=?")
                update_values.append(region)
            if address is not None:
                update_fields.append("address=%s" if kind == 'mysql' else "address=?")
                update_values.append(address)
            update_values.append(user_id)
            if update_fields:
                cur.execute(f"UPDATE deals SET {', '.join(update_fields)} WHERE buyer_id={'%s' if kind == 'mysql' else '?'}", update_values)
        
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
    language = (data.get('language') or 'en').strip()
    if language not in ('en', 'hi', 'kn'):
        # fall back to english if unsupported
        language = 'en'
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
                insert_sql = ("INSERT INTO contacts (first_name, last_name, phone, email, language, message, source)"
                              " VALUES (%s, %s, %s, %s, %s, %s, %s)")
                cursor.execute(insert_sql, (first, last, phone, email if email else None, language, message, 'web'))
                conn.commit()
                # If email provided, send a thank-you email asynchronously
                if email:
                    def send_async():
                        try:
                            send_thankyou_email(email, first, last, language)
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
                language TEXT NOT NULL DEFAULT 'en',
                message TEXT NOT NULL,
                source TEXT DEFAULT 'web',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        sqlite_cursor.execute(
            'INSERT INTO contacts (first_name, last_name, phone, email, language, message, source) VALUES (?,?,?,?,?,?,?)',
            (first, last, phone, email if email else None, language, message, 'web')
        )
        sqlite_conn.commit()
        # If an email address was provided, send a thank-you email asynchronously
        if email:
            def send_async():
                try:
                    send_thankyou_email(email, first, last, language)
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
    # optional language preference from client (form sends 'lang')
    lang = (data.get('lang') or data.get('language') or '').strip().lower() or None
    if lang and lang not in ('en', 'hi', 'kn'):
        lang = None
    # optional language preference from client (form sends 'lang')
    lang = (data.get('lang') or data.get('language') or '').strip().lower() or None
    if lang and lang not in ('en', 'hi', 'kn'):
        lang = None
    lang = (data.get('lang') or data.get('language') or '').strip().lower() or None
    if lang and lang not in ('en', 'hi', 'kn'):
        lang = None
    lang = (data.get('lang') or data.get('language') or '').strip().lower() or None
    if lang and lang not in ('en', 'hi', 'kn'):
        lang = None
    lang = (data.get('lang') or data.get('language') or '').strip().lower() or None
    if lang and lang not in ('en', 'hi', 'kn'):
        lang = None

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
    ok = insert_user(role_map[role], name, phone, email, aadhar, hashed, region=region or None, state=state or None, address=address or None, lang=lang)
    if not ok:
        return jsonify({'error': 'failed_to_store'}), 500

    # Send welcome email if provided, using selected language when available
    if email:
        try:
            # Determine requested language from client (data comes from JSON body)
            language_raw = (data.get('language') or data.get('lang') or '').strip().lower()
            if language_raw in ('hi', 'hindi'):
                lang_code = 'hi'
            elif language_raw in ('kn', 'kannada'):
                lang_code = 'kn'
            else:
                lang_code = 'en'

            # Use agriai.team7@gmail.com as sender; credentials should be in env vars
            smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
            smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
            smtp_port = int(os.environ.get('SMTP_PORT', '587'))
            smtp_password = os.environ.get('SMTP_PASSWORD')
            if smtp_password:
                smtp_password = smtp_password.replace(' ', '').strip()
            # Send using configured SMTP (if credentials missing, send_welcome_email will skip safely)
            send_welcome_email(email, name, '', lang=lang_code, smtp_host=smtp_host, smtp_port=smtp_port, smtp_user=smtp_user, smtp_password=smtp_password)
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


@app.route('/auth/send-otp', methods=['POST'])
def send_otp():
    """Send a one-time numeric OTP to the supplied email for a purpose (e.g. contract-signature)."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip()
        purpose = (data.get('purpose') or 'general').strip()
        if not email:
            return jsonify({'ok': False, 'error': 'email_required'}), 400

        # Generate 6-digit OTP
        import random
        otp = f"{random.randint(0, 999999):06d}"
        expires_at = int(time.time()) + OTP_TTL_SECONDS
        OTP_STORE[email.lower()] = { 'otp': otp, 'expires_at': expires_at, 'purpose': purpose }

        # DEBUG: Print OTP for testing
        print(f"DEBUG: OTP for {email} (purpose: {purpose}): {otp}")

        # Send email (simple plaintext)
        try:
            smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
            smtp_port = int(os.environ.get('SMTP_PORT', '587'))
            smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            from_addr = os.environ.get('SMTP_FROM', smtp_user)

            msg = EmailMessage()
            msg['Subject'] = f'Your AgriAI verification code'
            msg['From'] = from_addr
            msg['To'] = email
            msg.set_content(f"Your verification code is: {otp}\nThis code is valid for {OTP_TTL_SECONDS // 60} minutes.\nPurpose: {purpose}")

            context = ssl.create_default_context()
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                try:
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                except Exception:
                    pass
                if smtp_password:
                    try:
                        server.login(smtp_user, smtp_password)
                    except Exception as e:
                        print('SMTP login failed for OTP send:', e)
                try:
                    server.send_message(msg)
                except Exception as e:
                    print('SMTP send failed for OTP:', e)
        except Exception as e:
            print('Error sending OTP email (non-fatal):', e)

        # DEBUG: Include OTP in response for testing
        response = {'ok': True, 'message': 'otp_sent'}
        if os.environ.get('FLASK_ENV') == 'development':
            response['debug_otp'] = otp
        return jsonify(response), 200
    except Exception as e:
        print('send_otp error:', e)
        return jsonify({'ok': False, 'error': 'internal_error'}), 500


@app.route('/auth/check-email', methods=['POST'])
def check_email():
    """Check whether an email is already registered (farmer/buyer/admin).

    Returns ok:true and exists:true if already registered.
    """
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'ok': False, 'error': 'email_required'}), 400

        tbl, row = find_user_by_email(email)
        if row:
            return jsonify({'ok': True, 'exists': True, 'role': tbl, 'message': 'Email already registered.'}), 200

        return jsonify({'ok': True, 'exists': False}), 200
    except Exception as e:
        print('check_email error:', e)
        return jsonify({'ok': False, 'error': 'internal_error'}), 500


@app.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    """Verify an OTP previously sent to an email. Returns ok:true on success."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        otp = (data.get('otp') or '').strip()
        purpose = (data.get('purpose') or 'general').strip()

        if not email or not otp:
            return jsonify({'ok': False, 'error': 'email_and_otp_required'}), 400

        row = OTP_STORE.get(email)
        if not row:
            return jsonify({'ok': False, 'error': 'no_otp_found'}), 404

        now = int(time.time())
        if now > row.get('expires_at', 0):
            try:
                del OTP_STORE[email]
            except Exception:
                pass
            return jsonify({'ok': False, 'error': 'otp_expired'}), 400

        if row.get('purpose') != purpose:
            return jsonify({'ok': False, 'error': 'invalid_purpose'}), 400

        if otp != row.get('otp'):
            return jsonify({'ok': False, 'error': 'invalid_otp'}), 400

        # On success, consume the OTP and return ok
        try:
            del OTP_STORE[email]
        except Exception:
            pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('verify_otp error:', e)
        return jsonify({'ok': False, 'error': 'internal_error'}), 500


@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """Reset password for a user after OTP verification."""
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()

        if not email or not password:
            return jsonify({'ok': False, 'error': 'email_and_password_required'}), 400

        if len(password) < 4:
            return jsonify({'ok': False, 'error': 'password_too_short'}), 400

        # Find user by email
        tbl, row = find_user_by_email(email)
        if not row:
            return jsonify({'ok': False, 'error': 'user_not_found'}), 404

        user_id = row[0]

        # Hash the new password
        try:
            pw_bytes = password.encode('utf-8')
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(pw_bytes, salt).decode('utf-8')
        except Exception as e:
            print('Password hashing failed:', e)
            return jsonify({'ok': False, 'error': 'internal_error'}), 500

        # Update password in the database
        kind, conn = get_db_connection()
        try:
            if kind == 'mysql':
                cur = get_cursor(kind, conn)
                cur.execute(f"UPDATE {tbl} SET password_hash=%s WHERE id=%s", (hashed, user_id))
                conn.commit()
            else:
                cur = get_cursor(kind, conn)
                cur.execute(f"UPDATE {tbl} SET password_hash=? WHERE id=?", (hashed, user_id))
                conn.commit()
            conn.close()
        except Exception as e:
            print('Password update failed:', e)
            return jsonify({'ok': False, 'error': 'update_failed'}), 500

        return jsonify({'ok': True, 'message': 'password_reset_success'}), 200
    except Exception as e:
        print('reset_password error:', e)
        return jsonify({'ok': False, 'error': 'internal_error'}), 500


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
                        "lang VARCHAR(10) DEFAULT 'en',"
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
                            lang TEXT,
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


    def insert_user(role, name, phone, email, aadhar, password_hash, region=None, state=None, address=None, lang=None):
        """Insert user into the given role table including region/state/address/lang."""
        kind, conn = get_db_connection()
        try:
            cur = conn.cursor()
            if kind == 'mysql':
                cur.execute(
                    f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state, address, lang) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None, address if address else None, lang if lang else None)
                )
                conn.commit()
                cur.close()
            else:
                cur.execute(
                    f"INSERT INTO {role} (name, phone, email, aadhar, password_hash, region, state, address, lang) VALUES (?,?,?,?,?,?,?,?,?)",
                    (name, phone, email if email else None, aadhar, password_hash, region if region else None, state if state else None, address if address else None, lang if lang else None)
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
                    "variety VARCHAR(255) DEFAULT NULL,"
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


def send_thankyou_email(to_email, first, last, language='en'):
    """Send a localized thank-you email to the contact if SMTP is configured.
    language: 'en' | 'hi' | 'kn' (defaults to 'en')
    """
    # Normalize language
    lang = (language or 'en').strip().lower()
    if lang not in ('en', 'hi', 'kn'):
        lang = 'en'

    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        if not smtp_host or not smtp_user or not smtp_password:
            print('SMTP not configured; skipping email send.')
            return

        display_name = (first.strip() or 'Friend')

        if lang == 'hi':
            subj = 'AgriAI (एग्रीएआई) से संपर्क करने के लिए धन्यवाद'
            body = (
                f"प्रिय {display_name},\n\n"
                "AgriAI (एग्रीएआई) से संपर्क करने के लिए धन्यवाद!\n"
                "हमें आपका संदेश प्राप्त हो गया है और हमारे प्लेटफ़ॉर्म में आपकी रुचि की हम सराहना करते हैं। हमारी टीम आपके प्रश्न की समीक्षा करेगी और शीघ्र ही आपसे संपर्क करेगी।\n\n"
                "सादर,\n"
                "AgriAI (एग्रीएआई) टीम\n"
                "एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली\n"
            )
        elif lang == 'kn':
            subj = 'AgriAI (ಅಗ್ರಿಏಐ) ಅನ್ನು ಸಂಪರ್ಕಿಸಿದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು'
            body = (
                f"ಪ್ರಿಯ {display_name},\n\n"
                "AgriAI (ಅಗ್ರಿಏಐ) ಅನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!\n"
                "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ನಾವು ಸ್ವೀಕರಿಸಿದ್ದೇವೆ ಮತ್ತು ನಮ್ಮ ವೇದಿಕೆಯ ಮೇಲಿನ ನಿಮ್ಮ ಆಸಕ್ತಿಗೆ ನಾವು ಹೃತ್ಪೂರ್ವಕವಾಗಿ ಕೃತಜ್ಞರಾಗಿದ್ದೇವೆ. ನಮ್ಮ ತಂಡವು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.\n\n"
                "ಹೃತ್ಪೂರ್ವಕ ವಂದನೆಗಳೊಂದಿಗೆ,\n"
                "AgriAI (ಅಗ್ರಿಏಐ) ತಂಡ\n"
                "ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ\n"
            )
        else:
            subj = 'Thank You for Contacting AgriAI'
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
        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                try:
                    server.starttls(context=context)
                except Exception:
                    pass
                if smtp_password:
                    try:
                        server.login(smtp_user, smtp_password)
                    except Exception:
                        pass
                server.send_message(msg)
        except Exception as e:
            print('SMTP send error in send_thankyou_email:', e)

    # Backwards-compatible: try to get SMTP settings from env if not provided
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        if smtp_password:
            smtp_password = smtp_password.replace(' ', '').strip()
        from_addr = os.environ.get('SMTP_FROM', smtp_user)
        _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr)
    except Exception as e:
        print('send_thankyou_email error:', e)


def send_buyer_deal_uploaded_email(to_email, buyer_name, crop_name, variety=None, quantity_kg=None, delivery_date=None, lang='en', smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Send a localized buyer notification when a deal is uploaded.
    Parameters: to_email, buyer_name, crop_name, optional variety, quantity_kg, delivery_date (YYYY-MM-DD), and lang ('en'|'hi'|'kn').
    Uses SMTP env overrides if explicit smtp params are not provided.
    """
    # Normalize language
    code = (lang or 'en').strip().lower()
    if code not in ('en', 'hi', 'kn'):
        code = 'en'

    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        import smtplib, ssl
        display_name = (buyer_name or '').strip() or 'Friend'

        # Prepare human-friendly values
        var_txt = variety or 'N/A'
        qty_txt = str(quantity_kg) if quantity_kg is not None and quantity_kg != '' else 'N/A'
        dd_txt = delivery_date or 'N/A'

        if code == 'hi':
            subj = 'आपका डील सफलतापूर्वक अपलोड हो गया — AgriAI'
            body = (
                f"प्रिय {display_name},\n\n"
                "AgriAI में आपका डील सफलतापूर्वक अपलोड कर दिया गया है। हमारी प्रणाली अब विवरणों को संसाधित कर रही है और यह संबंधित किसानों के लिए दिखाई देगा।\n\n"
                "डील हाइलाइट्स:\n\n"
                f"- फ़सल का नाम: {crop_name}\n"
                f"- किस्म/विविधता: {var_txt}\n"
                f"- मात्रा: {qty_txt}\n"
                f"- डिलीवरी तिथि: {dd_txt}\n\n"
                "यदि किसी सत्यापन या स्पष्टीकरण की आवश्यकता होगी, तो हमारी टीम शीघ्र ही आपसे संपर्क करेगी। किसी भी प्रश्न या सहायता के लिए कृपया प्लेटफ़ॉर्म पर “Contact Us” (संपर्क करें) सेक्शन का उपयोग करें।\n\n"
                "धन्यवाद,\n"
                "AgriAI टीम\n"
                "एआई-समर्थित अनुबंध खेती और किसान परामर्श प्रणाली\n"
            )
        elif code == 'kn':
            subj = 'ನಿಮ್ಮ ಡೀಲ್ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ — AgriAI'
            body = (
                f"ಪ್ರಿಯ {display_name},\n\n"
                "ನಿಮ್ಮ ಡೀಲ್ AgriAI ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ. ನಮ್ಮ ವ್ಯವಸ್ಥೆ ಈಗ ವಿವರಗಳನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತಿದೆ ಮತ್ತು ಇದು ಸಂಬಂಧಿತ ರೈತರಿಗೆ ಲಭ್ಯವಾಗಲಿದ್ದು ಪರಿಶೀಲನೆಗೆ ನೀಡಲ್ಪಡುತ್ತದೆ.\n\n"
                "ಡೀಲ್ ಹೈಲೈಟ್ಸ್:\n\n"
                f"- ಬೆಳೆ ಹೆಸರು: {crop_name}\n"
                f"- ವೈವಿಧ್ಯ/ವೆರೈಟಿ: {var_txt}\n"
                f"- ಪ್ರಮಾಣ: {qty_txt}\n"
                f"- ವಿತರಣಾ ದಿನಾಂಕ: {dd_txt}\n\n"
                "ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳು, ನವೀಕರಣಗಳು ಅಥವಾ ಸಹಾಯಕ್ಕಾಗಿ, ದಯವಿಟ್ಟು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ಇರುವ “Contact Us” (ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ) ವಿಭಾಗದ ಮೂಲಕ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.\n\n"
                "AgriAI – ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ ಅನ್ನು ಆಯ್ಕೆ ಮಾಡಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ನಂಬಿಕೆಯನ್ನು ನಾವು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತೇವೆ ಮತ್ತು ಯಶಸ್ವಿ ಸಹಕಾರವನ್ನು ಸುಗಮಗೊಳಿಸಲು ಎದುರುನೋಡುತ್ತಿದ್ದೇವೆ.\n\n"
                "ಧನ್ಯವಾದಗಳು,\n"
                "AgriAI ತಂಡ\n"
                "ಎಐ-ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ\n"
            )
        else:
            subj = 'Your deal was uploaded successfully — AgriAI'
            body = (
                f"Dear {display_name},\n\n"
                "Thank you for submitting your deal on AgriAI!\n\n"
                "We are pleased to inform you that your deal has been successfully uploaded on our platform. Our system is now processing the details, and the deal will be made available to relevant farmers for review and engagement.\n\n"
                "Deal Highlights:\n\n"
                f"- Crop Name: {crop_name}\n"
                f"- Variety: {var_txt}\n"
                f"- Quantity: {qty_txt}\n"
                f"- Delivery Date: {dd_txt}\n\n"
                "If any additional verification or clarification is required, our team will contact you shortly. For any questions, updates, or support, please feel free to reach out to us using the 'Contact Us' section on the platform.\n\n"
                "Thank you for choosing AgriAI — an AI-Enhanced Contract Farming and Farmer Advisory System. We appreciate your trust and look forward to facilitating a successful collaboration.\n\n"
                "Warm regards,\n"
                "AgriAI Team\n"
                "AI-Enhanced Contract Farming and Farmer Advisory System\n"
            )

        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = from_addr
        msg['To'] = to_email
        msg.set_content(body)
        context = ssl.create_default_context()
        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                try:
                    server.starttls(context=context)
                except Exception:
                    pass
                if smtp_password:
                    try:
                        server.login(smtp_user, smtp_password)
                    except Exception:
                        pass
                server.send_message(msg)
        except Exception as e:
            print('SMTP send error in send_buyer_deal_uploaded_email:', e)

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
        print('send_buyer_deal_uploaded_email error:', e)

def send_welcome_email(to_email, first, last, lang='en', smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Send the welcome email to a newly registered user. Supports explicit SMTP params and
    localized templates for English (`en`), Hindi (`hi`) and Kannada (`kn`)."""
    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr, lang):
        if not smtp_host or not smtp_user or not smtp_password or not to_email:
            print('SMTP not configured for welcome email; skipping send.')
            return
        display_name = first.strip() or 'Friend'
        # Normalize language code
        code = (lang or 'en').strip().lower()
        if code in ('hi', 'hindi'):
            subj = 'AgriAI में आपका स्वागत है! 🌱'
            body = (
                f"प्रिय {display_name},\n\n"
                "**AgriAI** में आपका स्वागत है! 🌱\n\n"
                "हमारे प्लेटफ़ॉर्म पर पंजीकरण करने के लिए धन्यवाद। हमें खुशी है कि आप AgriAI – एक एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली से जुड़ गए हैं, जिसे किसानों को स्मार्ट, डेटा-आधारित सुझाव और सेवाएँ प्रदान करने के लिए डिज़ाइन किया गया है।\n\n"
                "आपका खाता सफलतापूर्वक बना दिया गया है। अब आप लॉग इन कर सकते हैं और निम्नलिखित सुविधाओं का लाभ उठा सकते हैं:\n\n"
                "- एआई-आधारित किसान परामर्श सेवाएँ\n"
                "- अनुबंध खेती सहायता\n"
                "- फसल और बाज़ार संबंधी जानकारी\n"
                "- व्यक्तिगत कृषि सिफारिशें\n\n"
                "यदि आपके कोई प्रश्न हों या आपको किसी सहायता की आवश्यकता हो, तो कृपया हमारे प्लेटफ़ॉर्म के “Contact Us” (संपर्क करें) अनुभाग के माध्यम से हमसे संपर्क करें। हमारी टीम आपकी सहायता करने में प्रसन्न होगी।\n\n"
                "सादर,\n"
                "AgriAI टीम\n"
                "एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली\n"
            )
        elif code in ('kn', 'kannada'):
            subj = 'AgriAI ಗೆ ಸ್ವಾಗತ! 🌱'
            body = (
                f"ಪ್ರಿಯ {display_name},\n\n"
                "**AgriAI** ಗೆ ಸ್ವಾಗತ! 🌱\n\n"
                "ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. AgriAI – ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ ಯ ಭಾಗವಾಗಿರುವುದಕ್ಕೆ ನಾವು ಸಂತೋಷಪಡುತ್ತೇವೆ. ಇದು ರೈತರಿಗೆ ಬುದ್ಧಿವಂತ, ಡೇಟಾ ಆಧಾರಿತ ಮಾಹಿತಿ ಮತ್ತು ಸೇವೆಗಳನ್ನು ಒದಗಿಸಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.\n\n"
                "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ. ಈಗ ನೀವು ಲಾಗಿನ್ ಮಾಡಿ ಕೆಳಗಿನ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಬಹುದು:\n\n"
                "- ಎಐ ಆಧಾರಿತ ರೈತ ಸಲಹಾ ಸೇವೆಗಳು\n"
                "- ಒಪ್ಪಂದ ಕೃಷಿ ಸಹಾಯ\n"
                "- ಬೆಳೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿಗಳು\n"
                "- ವೈಯಕ್ತಿಕ ಕೃಷಿ ಶಿಫಾರಸುಗಳು\n\n"
                "ಯಾವುದಾದರೂ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ಅಥವಾ ಸಹಾಯ ಬೇಕಾದರೆ, ದಯವಿಟ್ಟು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿರುವ “Contact Us” (ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ) ವಿಭಾಗದ ಮೂಲಕ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ. ನಮ್ಮ ತಂಡವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಂತೋಷಪಡುತ್ತದೆ.\n\n"
                "ಧನ್ಯವಾದಗಳು,\n"
                "AgriAI ತಂಡ\n"
                "ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ\n"
            )
        else:
            subj = 'Welcome to AgriAI! 🌱'
            body = (
                f"Dear {display_name},\n\n"
                "Welcome to AgriAI! 🌱\n\n"
                "Thank you for registering on our platform. We are excited to have you join AgriAI — an AI-Enhanced Contract Farming and Farmer Advisory System, designed to support farmers with smart, data-driven insights and services.\n\n"
                "Your account has been successfully created. You can now log in and start exploring features such as:\n\n"
                "- AI-based farmer advisory services\n"
                "- Contract farming assistance\n"
                "- Crop and market insights\n"
                "- Personalized agricultural recommendations\n\n"
                "If you have any questions or need assistance, please feel free to reach out to us using the ‘Contact Us’ section on our platform. Our team will be happy to assist you.\n\n"
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
        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                try:
                    server.starttls(context=context)
                except Exception:
                    pass
                if smtp_password:
                    server.login(smtp_user, smtp_password)
                server.send_message(msg)
        except Exception as e:
            print('send_welcome_email send error:', e)

    try:
        smtp_host = smtp_host or os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(smtp_port or os.environ.get('SMTP_PORT', '587'))
        smtp_user = smtp_user or os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
        smtp_password = smtp_password or os.environ.get('SMTP_PASSWORD')
        if smtp_password:
            smtp_password = smtp_password.replace(' ', '').strip()
        from_addr = os.environ.get('SMTP_FROM', smtp_user)
        _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr, lang)
    except Exception as e:
        print('send_welcome_email error:', e)


def send_crop_uploaded_email(to_email, farmer_name, crop_name, variety=None, quantity=None, price=None, lang='en', smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Send the crop-uploaded notification email using configured SMTP settings.
    Supports English ('en'), Hindi ('hi') and Kannada ('kn'). Defaults to agriai.team7@gmail.com as sender.
    """
    def _send(smtp_host, smtp_port, smtp_user, smtp_password, from_addr):
        if not smtp_host or not smtp_user or not smtp_password or not to_email:
            print('SMTP or recipient missing; skipping crop uploaded email send.')
            return
        # build localized subject and body
        subject_en = 'Your Crop Has Been Successfully Uploaded on AgriAI🌾'
        # English body (user-provided expanded template)
        body_en = (
            f"Dear {farmer_name or ''},\n\n"
            "Thank you for uploading your crop details on AgriAI! 🌾\n\n"
            "We are pleased to inform you that your crop has been successfully uploaded on our platform. The details are now under review and will be made visible to interested buyers for discovery and engagement.\n\n"
            "Crop Details:\n\n"
            f"- Crop Name: {crop_name or ''}\n"
            f"- Variety: {variety or 'N/A'}\n"
            f"- Quantity Available: {quantity or 'N/A'}\n"
            f"- Price: {price or 'N/A'}\n\n"
            "Once buyers show interest or place orders, you will be notified immediately through the platform.\n\n"
            "If any additional verification or clarification is required, our team will contact you shortly.\n"
            "For any questions or assistance, please feel free to reach out to us using the “Contact Us” section on the platform.\n\n"
            "Thank you for choosing AgriAI – an AI-Enhanced Contract Farming and Farmer Advisory System. We look forward to supporting you in connecting with buyers and achieving better outcomes for your produce.\n\n"
            "Warm regards,\n"
            "The AgriAI Team\n"
            "AI-Enhanced Contract Farming and Farmer Advisory System\n"
        )

        # Hindi translation
        body_hi = (
            f"प्रिय {farmer_name or ''},\n\n"
            "AgriAI पर अपनी फसल का विवरण अपलोड करने के लिए धन्यवाद!🌾\n\n"
            "हमें यह बताते हुए खुशी हो रही है कि आपकी फसल हमारे प्लेटफ़ॉर्म पर सफलतापूर्वक अपलोड कर दी गई है। विवरण अब समीक्षा के अंतर्गत हैं और इच्छुक खरीदारों के लिए खोज और सहभागिता हेतु उपलब्ध कराए जाएंगे।\n\n"
            "फसल विवरण:\n\n"
            f"- फसल का नाम: {crop_name or ''}\n"
            f"- वेरायटी: {variety or 'N/A'}\n"
            f"- उपलब्ध मात्रा: {quantity or 'N/A'}\n"
            f"- मूल्य: {price or 'N/A'}\n\n"
            "जब भी कोई खरीदार रुचि दिखाता है या ऑर्डर देता है, तो आपको प्लेटफ़ॉर्म के माध्यम से तुरंत सूचित किया जाएगा।\n\n"
            "यदि किसी अतिरिक्त सत्यापन या स्पष्टीकरण की आवश्यकता होगी, तो हमारी टीम शीघ्र ही आपसे संपर्क करेगी।\n\n"
            "किसी भी प्रश्न या सहायता के लिए, कृपया हमारे प्लेटफ़ॉर्म के “Contact Us” (संपर्क करें) अनुभाग के माध्यम से हमसे संपर्क करें।\n\n"
            "AgriAI – एक एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली को चुनने के लिए धन्यवाद। हम आपको खरीदारों से जोड़ने और आपकी उपज के लिए बेहतर परिणाम प्राप्त करने में सहयोग करने के लिए तत्पर हैं।\n\n"
            "AgriAI चुनने के लिए धन्यवाद।\n\n"
            "सादर,\n"
            "AgriAI टीम\n"
            "एआई-सक्षम अनुबंध खेती और किसान परामर्श प्रणाली\n"
        )

        # Kannada translation
        body_kn = (
            f"ಪ್ರಿಯ {farmer_name or ''},\n\n"
            "AgriAI ನಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆ ವಿವರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!🌾\n\n"
            "ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ ಎಂಬುದನ್ನು ತಿಳಿಸಲು ನಮಗೆ ಸಂತೋಷವಾಗಿದೆ. ಈ ವಿವರಗಳು ಈಗ ಪರಿಶೀಲನೆಯಲ್ಲಿದ್ದು, ಆಸಕ್ತ ಖರೀದಿದಾರರಿಗೆ ಹುಡುಕಾಟ ಮತ್ತು ಭಾಗವಹಿಸುವಿಕೆಗೆ ಲಭ್ಯವಾಗುತ್ತವೆ.\n\n"
            "ಬೆಳೆ ವಿವರಗಳು:\n\n"
            f"- ಬೆಳೆ ಹೆಸರು: {crop_name or ''}\n"
            f"- ವೈವಿಧ್ಯ: {variety or 'N/A'}\n"
            f"- ಲಭ್ಯ ಪ್ರಮಾಣ: {quantity or 'N/A'}\n"
            f"- ಬೆಲೆ: {price or 'N/A'}\n\n"
            "ಯಾವುದೇ ಖರೀದಿದಾರರು ಆಸಕ್ತಿ ತೋರಿಸಿದಾಗ ಅಥವಾ ಆರ್ಡರ್ ನೀಡಿದಾಗ, ನಿಮಗೆ ವೇದಿಕೆಯ ಮೂಲಕ ತಕ್ಷಣ ಮಾಹಿತಿ ನೀಡಲಾಗುತ್ತದೆ.\n\n"
            "ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಪರಿಶೀಲನೆ ಅಥವಾ ಸ್ಪಷ್ಟೀಕರಣ ಅಗತ್ಯವಿದ್ದರೆ, ನಮ್ಮ ತಂಡವು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.\n"
            "ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ಸಹಾಯಕ್ಕಾಗಿ, ದಯವಿಟ್ಟು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ಇರುವ “Contact Us” (ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ) ವಿಭಾಗದ ಮೂಲಕ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.\n\n"
            "AgriAI – ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ ಅನ್ನು ಆಯ್ಕೆ ಮಾಡಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ಖರೀದಿದಾರರೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ ನಿಮ್ಮ ಉತ್ಪನ್ನಕ್ಕೆ ಉತ್ತಮ ಫಲಿತಾಂಶಗಳನ್ನು ಸಾಧಿಸಲು ನಾವು ನಿಮ್ಮನ್ನು ಬೆಂಬಲಿಸಲು ಎದುರುನೋಡುತ್ತಿದ್ದೇವೆ.\n\n"
            "ಹೃತ್ಪೂರ್ವಕ ವಂದನೆಗಳೊಂದಿಗೆ,\n"
            "AgriAI ತಂಡ\n"
            "ಎಐ ಆಧಾರಿತ ಒಪ್ಪಂದ ಕೃಷಿ ಮತ್ತು ರೈತ ಸಲಹಾ ವ್ಯವಸ್ಥೆ\n"
        )

        subject_hi = 'AgriAI पर आपकी फसल सफलतापूर्वक अपलोड की गई🌾'
        subject_kn = 'AgriAI ನಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ🌾'
        subj = subject_en
        if lang and str(lang).lower().startswith('hi'):
            subj = subject_hi
            body = body_hi
        elif lang and str(lang).lower().startswith('kn'):
            subj = subject_kn
            body = body_kn
        else:
            body = body_en

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
                if smtp_password:
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


def ensure_purchase_notifications_table():
    """Create notifications table to deliver purchase alerts to farmers."""
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
            cur.execute(
                "CREATE TABLE IF NOT EXISTS purchase_notifications ("
                "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                "farmer_id BIGINT NULL,"
                "farmer_phone VARCHAR(32) NULL,"
                "crop_id BIGINT NULL,"
                "crop_name VARCHAR(255) NULL,"
                "variety VARCHAR(255) DEFAULT NULL,"
                "quantity_kg DECIMAL(12,3) NULL,"
                "buyer_name VARCHAR(255) NULL,"
                "buyer_email VARCHAR(255) NULL,"
                "buyer_phone VARCHAR(32) NULL,"
                "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "is_read TINYINT(1) NOT NULL DEFAULT 0,"
                "PRIMARY KEY (id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_purchase_notifications_table mysql error:', e)
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS purchase_notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    farmer_id INTEGER,
                    farmer_phone TEXT,
                    crop_id INTEGER,
                    crop_name TEXT,
                    variety TEXT,
                    quantity_kg REAL,
                    buyer_name TEXT,
                    buyer_email TEXT,
                    buyer_phone TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_read INTEGER NOT NULL DEFAULT 0
                )
            ''')
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_purchase_notifications_table sqlite error:', e)


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
                "crop_id BIGINT UNSIGNED DEFAULT NULL,"
                "buyer_id BIGINT UNSIGNED DEFAULT NULL,"
                "buyer_name VARCHAR(255) NOT NULL,"
                "buyer_phone VARCHAR(20) DEFAULT NULL,"
                "region VARCHAR(50) DEFAULT NULL,"
                "state VARCHAR(100) DEFAULT NULL,"
                "address VARCHAR(255) DEFAULT NULL,"
                "category VARCHAR(100) DEFAULT NULL,"
                "crop_name VARCHAR(255) NOT NULL,"
                "variety VARCHAR(255) DEFAULT NULL,"
                "quantity_kg DECIMAL(12,3) NOT NULL DEFAULT 0.0,"
                "image_path VARCHAR(255) DEFAULT NULL,"
                "delivery_date DATE DEFAULT NULL,"
                "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "PRIMARY KEY (id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )
            cur.execute(create_sql)
            # If the table already existed prior to this change, attempt to add missing columns
            try:
                try:
                    cur.execute("ALTER TABLE deals ADD COLUMN crop_id BIGINT UNSIGNED DEFAULT NULL")
                except Exception:
                    pass
                try:
                    cur.execute("ALTER TABLE deals ADD COLUMN category VARCHAR(100) DEFAULT NULL")
                except Exception:
                    pass
                try:
                    cur.execute("ALTER TABLE deals ADD COLUMN variety VARCHAR(255) DEFAULT NULL")
                except Exception:
                    pass
                try:
                    cur.execute("ALTER TABLE deals ADD COLUMN image_path VARCHAR(255) DEFAULT NULL")
                except Exception:
                    pass
                try:
                    cur.execute("ALTER TABLE deals ADD COLUMN delivery_date DATE DEFAULT NULL")
                except Exception:
                    pass
                try:
                    cur.execute("ALTER TABLE deals ADD COLUMN address VARCHAR(255) DEFAULT NULL")
                except Exception:
                    pass
            except Exception:
                # ignore alter errors
                pass
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
                    crop_id INTEGER,
                    buyer_id INTEGER,
                    buyer_name TEXT NOT NULL,
                    buyer_phone TEXT,
                    region TEXT,
                    state TEXT,
                    address TEXT,
                    category TEXT,
                    crop_name TEXT NOT NULL,
                    variety TEXT,
                    quantity_kg REAL NOT NULL DEFAULT 0.0,
                    image_path TEXT DEFAULT NULL,
                    delivery_date DATE DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            # SQLite: add missing columns if table pre-existed
            try:
                cur.execute("PRAGMA table_info('deals')")
                cols = [r[1] for r in cur.fetchall()]
                if 'crop_id' not in cols:
                    try:
                        cur.execute("ALTER TABLE deals ADD COLUMN crop_id INTEGER")
                    except Exception:
                        pass
                if 'category' not in cols:
                    try:
                        cur.execute("ALTER TABLE deals ADD COLUMN category TEXT")
                    except Exception:
                        pass
                if 'variety' not in cols:
                    try:
                        cur.execute("ALTER TABLE deals ADD COLUMN variety TEXT")
                    except Exception:
                        pass
                if 'image_path' not in cols:
                    try:
                        cur.execute("ALTER TABLE deals ADD COLUMN image_path TEXT")
                    except Exception:
                        pass
                if 'delivery_date' not in cols:
                    try:
                        cur.execute("ALTER TABLE deals ADD COLUMN delivery_date DATE")
                    except Exception:
                        pass
                if 'address' not in cols:
                    try:
                        cur.execute("ALTER TABLE deals ADD COLUMN address TEXT")
                    except Exception:
                        pass
                conn.commit()
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
        except Exception as e:
            print('ensure_deals_table sqlite error:', e)



def ensure_contracts_table():
    """Ensure the `contracts` table exists in MySQL (primary) or SQLite (fallback)."""
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
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS contracts (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  contract_number VARCHAR(100) NOT NULL,
                  farmer_id BIGINT UNSIGNED DEFAULT NULL,
                  farmer_name VARCHAR(255) DEFAULT NULL,
                  farmer_address VARCHAR(500) DEFAULT NULL,
                  farmer_state VARCHAR(100) DEFAULT NULL,
                  buyer_id BIGINT UNSIGNED DEFAULT NULL,
                  buyer_name VARCHAR(255) DEFAULT NULL,
                  buyer_address VARCHAR(500) DEFAULT NULL,
                  buyer_state VARCHAR(100) DEFAULT NULL,
                  crop_name VARCHAR(255) NOT NULL,
                  variety VARCHAR(255) DEFAULT NULL,
                  quantity_kg DECIMAL(12,3) NOT NULL,
                  price_per_kg DECIMAL(12,3) NOT NULL,
                  amount DECIMAL(12,2) DEFAULT NULL,
                  contract_nature VARCHAR(100) DEFAULT 'post-harvest',
                  contract_duration VARCHAR(100) DEFAULT 'one-time',
                  start_date DATE DEFAULT NULL,
                  end_date DATE DEFAULT NULL,
                  duration INT DEFAULT 0,
                  farmer_platform_fee DECIMAL(12,2) DEFAULT 0,
                  farmer_gst DECIMAL(12,2) DEFAULT 0,
                  buyer_platform_fee DECIMAL(12,2) DEFAULT 0,
                  buyer_gst DECIMAL(12,2) DEFAULT 0,
                  delivery_cost VARCHAR(255) DEFAULT NULL,
                  status VARCHAR(50) DEFAULT 'pending',
                  signature_method VARCHAR(100) DEFAULT NULL,
                  signature_timestamp DATETIME DEFAULT NULL,
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  INDEX idx_farmer_id (farmer_id),
                  INDEX idx_buyer_id (buyer_id),
                  INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """
            )
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_contracts_table mysql error:', e)
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS contracts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    contract_number TEXT NOT NULL,
                    farmer_id INTEGER DEFAULT NULL,
                    farmer_name TEXT DEFAULT NULL,
                    farmer_address TEXT DEFAULT NULL,
                    farmer_state TEXT DEFAULT NULL,
                    buyer_id INTEGER DEFAULT NULL,
                    buyer_name TEXT DEFAULT NULL,
                    buyer_address TEXT DEFAULT NULL,
                    buyer_state TEXT DEFAULT NULL,
                    crop_name TEXT NOT NULL,
                    variety TEXT DEFAULT NULL,
                    quantity_kg REAL NOT NULL,
                    price_per_kg REAL NOT NULL,
                    amount REAL DEFAULT NULL,
                    contract_nature TEXT DEFAULT 'post-harvest',
                    contract_duration TEXT DEFAULT 'one-time',
                    start_date DATE DEFAULT NULL,
                    end_date DATE DEFAULT NULL,
                    duration INTEGER DEFAULT 0,
                    farmer_platform_fee REAL DEFAULT 0,
                    farmer_gst REAL DEFAULT 0,
                    buyer_platform_fee REAL DEFAULT 0,
                    buyer_gst REAL DEFAULT 0,
                    delivery_cost TEXT DEFAULT NULL,
                    status TEXT DEFAULT 'pending',
                    signature_method TEXT DEFAULT NULL,
                    signature_timestamp DATETIME DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_contracts_table sqlite error:', e)


def ensure_cart_table():
    """Create cart table to persist per-user cart items."""
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
            cur.execute(
                "CREATE TABLE IF NOT EXISTS cart ("
                "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                "user_type VARCHAR(16) NOT NULL DEFAULT 'buyer',"
                "user_id BIGINT NULL,"
                "buyer_id BIGINT NULL,"
                "user_phone VARCHAR(32) DEFAULT NULL,"
                "crop_id BIGINT NULL,"
                "crop_name VARCHAR(255) DEFAULT NULL,"
                "variety VARCHAR(255) DEFAULT NULL,"
                "quantity_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,"
                "price_per_kg DECIMAL(12,3) DEFAULT NULL,"
                "image_path VARCHAR(255) DEFAULT NULL,"
                "added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "PRIMARY KEY (id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_cart_table mysql error:', e)
        # Also ensure buyer-specific cart table exists
        try:
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            cur.execute(
                "CREATE TABLE IF NOT EXISTS cart_b ("
                "id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"
                "user_type VARCHAR(16) NOT NULL DEFAULT 'buyer',"
                "user_id BIGINT NULL,"
                "buyer_id BIGINT NULL,"
                "user_phone VARCHAR(32) DEFAULT NULL,"
                "crop_id BIGINT NULL,"
                "crop_name VARCHAR(255) DEFAULT NULL,"
                "variety VARCHAR(255) DEFAULT NULL,"
                "quantity_kg DECIMAL(12,3) NOT NULL DEFAULT 0.000,"
                "price_per_kg DECIMAL(12,3) DEFAULT NULL,"
                "image_path VARCHAR(255) DEFAULT NULL,"
                "total_quantity DECIMAL(12,3) DEFAULT 0.000,"
                "total_price DECIMAL(12,2) DEFAULT 0.00,"
                "added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "PRIMARY KEY (id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_cart_b_table mysql error:', e)
        # Ensure cart has total_quantity and total_price columns (idempotent on MySQL 8+)
        try:
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            try:
                    cur.execute("ALTER TABLE cart ADD COLUMN IF NOT EXISTS total_quantity DECIMAL(12,3) DEFAULT 0.000")
            except Exception:
                pass
            try:
                cur.execute("ALTER TABLE cart ADD COLUMN IF NOT EXISTS total_price DECIMAL(12,2) DEFAULT 0.00")
            except Exception:
                pass
                try:
                    cur.execute("ALTER TABLE cart ADD COLUMN IF NOT EXISTS buyer_id BIGINT NULL")
                except Exception:
                    pass
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception:
            pass

        # Migrate any non-farmer rows from `cart` into `cart_b` (idempotent)
        try:
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            try:
                # Insert non-farmer rows into cart_b using available fields; compute totals if missing
                cur.execute(
                    "INSERT IGNORE INTO cart_b (user_type,user_id,user_phone,crop_id,crop_name,variety,quantity_kg,price_per_kg,image_path,total_quantity,total_price,added_at) "
                    "SELECT user_type,user_id,user_phone,crop_id,crop_name,variety,quantity_kg,price_per_kg,image_path,COALESCE(total_quantity,quantity_kg),COALESCE(total_price,ROUND(quantity_kg*COALESCE(price_per_kg,0),2)),added_at "
                    "FROM cart WHERE user_type IS NULL OR LOWER(user_type) != 'farmer'"
                )
                cur.execute("DELETE FROM cart WHERE user_type IS NULL OR LOWER(user_type) != 'farmer'")
                conn.commit()
            except Exception:
                try: conn.rollback()
                except Exception: pass
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception:
            pass
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS cart (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_type TEXT NOT NULL DEFAULT 'buyer',
                    user_id INTEGER,
                    buyer_id INTEGER,
                    user_phone TEXT,
                    crop_id INTEGER,
                    crop_name TEXT,
                    variety TEXT,
                    quantity_kg REAL NOT NULL DEFAULT 0.0,
                    price_per_kg REAL,
                    image_path TEXT,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_cart_table sqlite error:', e)
        # Also ensure buyer-specific cart_b table exists in sqlite
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS cart_b (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_type TEXT NOT NULL DEFAULT 'buyer',
                    user_id INTEGER,
                    buyer_id INTEGER,
                    user_phone TEXT,
                    crop_id INTEGER,
                    crop_name TEXT,
                    variety TEXT,
                    quantity_kg REAL NOT NULL DEFAULT 0.0,
                    price_per_kg REAL,
                    image_path TEXT,
                    total_quantity REAL DEFAULT 0.0,
                    total_price REAL DEFAULT 0.0,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception as e:
            print('ensure_cart_b_table sqlite error:', e)
        # Ensure cart has total_quantity and total_price columns in sqlite (best-effort)
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            try:
                cur.execute('ALTER TABLE cart ADD COLUMN total_quantity REAL DEFAULT 0.0')
            except Exception:
                pass
            try:
                cur.execute('ALTER TABLE cart ADD COLUMN total_price REAL DEFAULT 0.0')
            except Exception:
                pass
            try:
                cur.execute('ALTER TABLE cart ADD COLUMN buyer_id INTEGER')
            except Exception:
                pass
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception:
            pass

        # Migrate non-farmer rows from cart to cart_b in sqlite (idempotent)
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            try:
                cur.execute("INSERT OR IGNORE INTO cart_b (user_type,user_id,user_phone,crop_id,crop_name,variety,quantity_kg,price_per_kg,image_path,total_quantity,total_price,added_at) "
                            "SELECT user_type,user_id,user_phone,crop_id,crop_name,variety,quantity_kg,price_per_kg,image_path,COALESCE(total_quantity,quantity_kg),COALESCE(total_price,ROUND(quantity_kg*COALESCE(price_per_kg,0),2)),added_at "
                            "FROM cart WHERE user_type IS NULL OR LOWER(user_type) != 'farmer'")
                cur.execute("DELETE FROM cart WHERE user_type IS NULL OR LOWER(user_type) != 'farmer'")
                conn.commit()
            except Exception:
                try: conn.rollback()
                except Exception: pass
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        except Exception:
            pass


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


@app.route('/notifications/purchase', methods=['POST'])
def create_purchase_notifications():
    """Create purchase notifications for farmers from a buyer checkout.
    Expects JSON: { buyer: {name,email,phone}, items: [ { id (crop_id), crop_name, order_quantity } ] }
    """
    ensure_purchase_notifications_table()
    data = request.get_json(silent=True) or {}
    # Debug: log incoming contract-submitted payload to a file for diagnostics
    try:
        dbg_path = os.path.join(os.path.dirname(__file__), 'contract_requests.log')
        with open(dbg_path, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.datetime.utcnow().isoformat()} {request.remote_addr} {str(data)}\n")
    except Exception:
        pass
    # Log incoming request for debugging
    try:
        dbg_path = os.path.join(os.path.dirname(__file__), 'contract_requests.log')
        with open(dbg_path, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.datetime.utcnow().isoformat()} {request.remote_addr} {str(data)}\n")
    except Exception:
        pass

    buyer = data.get('buyer') or {}
    items = data.get('items') or []
    invoice_id = (data.get('invoice_id') or data.get('invoice') or buyer.get('invoice_id') or None)
    if not isinstance(items, list) or not items:
        return jsonify({'ok': False, 'error': 'items_required'}), 400

    # Resolve farmer per crop via crops table
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    inserted = 0
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
            for it in items:
                try:
                    crop_id = int(it.get('id')) if it.get('id') is not None else None
                except Exception:
                    crop_id = None
                crop_name = (it.get('crop_name') or '').strip()
                qty = None
                try:
                    qty = float(it.get('order_quantity') or 0)
                except Exception:
                    qty = None
                farmer_id = None
                farmer_phone = None
                if crop_id:
                    try:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT seller_id, seller_phone, variety FROM crops WHERE id=%s LIMIT 1', (crop_id,))
                        r = cur2.fetchone()
                        farmer_id = r[0] if r else None
                        farmer_phone = r[1] if r else None
                        variety_val = r[2] if r and len(r) > 2 else None
                        try: cur2.close()
                        except Exception: pass
                    except Exception:
                        farmer_id = None
                        variety_val = None
                # prefer variety from crops table; fallback to provided item variety
                try:
                    if not variety_val:
                        variety_val = (it.get('variety') or it.get('Variety') or '').strip() or None
                except Exception:
                    variety_val = None

                cur.execute(
                    'INSERT INTO purchase_notifications (farmer_id, farmer_phone, crop_id, crop_name, variety, quantity_kg, buyer_name, buyer_email, buyer_phone) '
                    'VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                    (
                        farmer_id if farmer_id else None,
                        farmer_phone if farmer_phone else None,
                        crop_id if crop_id else None,
                        crop_name if crop_name else None,
                        variety_val,
                        qty if qty is not None else None,
                        (buyer.get('name') or None),
                        (buyer.get('email') or None),
                        (buyer.get('phone') or None),
                    )
                )
                # attempt to notify the farmer via email (best-effort)
                try:
                    farmer_email = None
                    farmer_name = None
                    farmer_lang = None
                    if farmer_id:
                        try:
                            cur2 = conn.cursor()
                            # try to select email,name and optionally lang (if column exists)
                            try:
                                cur2.execute('SELECT email,name,lang FROM farmer WHERE id=%s LIMIT 1', (farmer_id,))
                                r2 = cur2.fetchone()
                                if r2:
                                    farmer_email = r2[0]
                                    farmer_name = r2[1] if len(r2) > 1 else None
                                    farmer_lang = r2[2] if len(r2) > 2 else None
                            except Exception:
                                try:
                                    cur2.execute('SELECT email,name FROM farmer WHERE id=%s LIMIT 1', (farmer_id,))
                                    r2 = cur2.fetchone()
                                    if r2:
                                        farmer_email = r2[0]
                                        farmer_name = r2[1] if len(r2) > 1 else None
                                except Exception:
                                    pass
                            try: cur2.close()
                            except Exception: pass
                        except Exception:
                            pass
                    # fallback to farmer_phone lookup
                    if not farmer_email and farmer_phone:
                        try:
                            cur2 = conn.cursor()
                            try:
                                cur2.execute('SELECT email,name,lang FROM farmer WHERE phone=%s LIMIT 1', (farmer_phone,))
                                r2 = cur2.fetchone()
                                if r2:
                                    farmer_email = r2[0]
                                    farmer_name = r2[1] if len(r2) > 1 else None
                                    farmer_lang = r2[2] if len(r2) > 2 else None
                            except Exception:
                                try:
                                    cur2.execute('SELECT email,name FROM farmer WHERE phone=%s LIMIT 1', (farmer_phone,))
                                    r2 = cur2.fetchone()
                                    if r2:
                                        farmer_email = r2[0]
                                        farmer_name = r2[1] if len(r2) > 1 else None
                                except Exception:
                                    pass
                            try: cur2.close()
                            except Exception: pass
                        except Exception:
                            pass
                    # determine language
                    _lang = (farmer_lang or '').strip().lower() or None
                    if not _lang:
                        _lang = 'en'
                    # spawn email send thread if address available
                    if farmer_email:
                        try:
                            # compute per-item total if available; prefer grand total from buyer_orders when invoice_id present
                            total_val = None
                            try:
                                # prefer incoming totals if provided by the buyer/frontend
                                try:
                                    item_totals = it.get('totals') if isinstance(it, dict) else None
                                except Exception:
                                    item_totals = None
                                top_totals = None
                                try:
                                    top_totals = data.get('totals') if isinstance(data, dict) else None
                                except Exception:
                                    top_totals = None
                                if item_totals and (isinstance(item_totals, dict) and (item_totals.get('grand_total') is not None or item_totals.get('grandTotal') is not None)):
                                    total_val = float(item_totals.get('grand_total') or item_totals.get('grandTotal'))
                                elif top_totals and isinstance(top_totals, dict):
                                    # top-level totals may be a mapping by farmer_id or a single totals object
                                    try:
                                        # try farmer-specific entry
                                        tentry = top_totals.get(str(farmer_id)) or top_totals.get(farmer_id)
                                        if tentry and isinstance(tentry, dict) and (tentry.get('grand_total') is not None or tentry.get('grandTotal') is not None):
                                            total_val = float(tentry.get('grand_total') or tentry.get('grandTotal'))
                                        elif top_totals.get('grand_total') is not None or top_totals.get('grandTotal') is not None:
                                            total_val = float(top_totals.get('grand_total') or top_totals.get('grandTotal'))
                                    except Exception:
                                        pass
                                # try to fetch grand total for this invoice and farmer (MySQL)
                                if total_val is None and invoice_id and farmer_id:
                                    try:
                                        cur2 = conn.cursor()
                                        cur2.execute('SELECT crop_name, quantity_kg, price_per_kg, total FROM buyer_orders WHERE invoice_id=%s AND farmer_id=%s', (invoice_id, farmer_id))
                                        rows_bo = cur2.fetchall()
                                        net_sum = None
                                        if rows_bo:
                                            net_sum = 0.0
                                            for brow in rows_bo:
                                                try:
                                                    b_crop = (brow[0] or '')
                                                    b_qty = float(brow[1] or 0)
                                                    b_price = float(brow[2] or 0)
                                                    b_total = float(brow[3] or (b_qty * b_price))
                                                    # determine rates similar to frontend computeNetAmount
                                                    cat_l = ''
                                                    nm = (b_crop or '').lower()
                                                    gstRate = 0
                                                    commissionRate = 8
                                                    if 'masala' in nm or 'masalas' in nm:
                                                        gstRate = 5; commissionRate = 15
                                                    elif 'fruit' in nm or 'vegetable' in nm:
                                                        gstRate = 0; commissionRate = 12
                                                    elif 'crop' in nm or 'crops' in nm:
                                                        gstRate = 0; commissionRate = 8
                                                    else:
                                                        if 'masala' in nm:
                                                            gstRate = 5; commissionRate = 15
                                                        elif 'fruit' in nm or 'vegetable' in nm:
                                                            gstRate = 0; commissionRate = 12
                                                        else:
                                                            gstRate = 0; commissionRate = 8
                                                    gstAmt = (b_total * gstRate) / 100
                                                    platformFee = (b_total * commissionRate) / 100
                                                    net = b_total - gstAmt - platformFee
                                                    net_sum += net
                                                except Exception:
                                                    continue
                                        if net_sum is not None:
                                            total_val = float(net_sum)
                                        try: cur2.close()
                                        except Exception: pass
                                    except Exception:
                                        try:
                                            cur2.close()
                                        except Exception:
                                            pass
                                # fallback to item-level totals
                                if total_val is None:
                                    total_val = it.get('total') if isinstance(it.get('total'), (int, float)) or (it.get('total') and str(it.get('total')).strip()) else None
                                    if not total_val:
                                        total_val = it.get('total_price') or it.get('price')
                                    if not total_val:
                                        total_val = float(it.get('price_per_kg') or 0) * float(qty or 0)
                            except Exception:
                                try:
                                    total_val = float(it.get('total') or 0)
                                except Exception:
                                    total_val = 0
                            threading.Thread(target=send_farmer_purchase_email, args=(farmer_email, farmer_name or '', crop_name, variety_val or '', qty, total_val, (buyer.get('name') or ''), _lang)).start()
                        except Exception:
                            pass
                except Exception:
                    pass
                inserted += 1
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            # After inserting notifications, attempt to send buyer confirmation email (best-effort)
            try:
                buyer_email = (buyer.get('email') or '').strip()
                if buyer_email:
                    # collect totals
                    try:
                        total_price = 0.0
                        for it in items:
                            try:
                                total_price += float(it.get('total') or (float(it.get('price_per_kg') or 0) * float(it.get('order_quantity') or 0)))
                            except Exception:
                                pass
                    except Exception:
                        total_price = None
                    # determine preferred language (header > request top-level > buyer object > query param > default)
                    lang = (
                        request.headers.get('Agri-Lang') or request.headers.get('agri-lang') or
                        data.get('lang') or data.get('language') or
                        buyer.get('lang') or buyer.get('language') or
                        request.args.get('lang') or 'en'
                    )
                    invoice_id = (data.get('invoice_id') or data.get('invoice') or buyer.get('invoice_id') or None)
                    threading.Thread(target=send_purchase_email, args=(buyer_email, buyer.get('name') or '', items, total_price, lang, invoice_id)).start()
            except Exception:
                pass
            return jsonify({'ok': True, 'inserted': inserted}), 200
        except Exception as e:
            print('create_purchase_notifications mysql error:', e)
            return jsonify({'ok': False, 'error': 'mysql_failed', 'detail': str(e)}), 500
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            for it in items:
                try:
                    crop_id = int(it.get('id')) if it.get('id') is not None else None
                except Exception:
                    crop_id = None
                crop_name = (it.get('crop_name') or '').strip()
                qty = None
                try:
                    qty = float(it.get('order_quantity') or 0)
                except Exception:
                    qty = None
                farmer_id = None
                farmer_phone = None
                if crop_id:
                    try:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT seller_id, seller_phone, variety FROM crops WHERE id=? LIMIT 1', (crop_id,))
                        r = cur2.fetchone()
                        farmer_id = r[0] if r else None
                        farmer_phone = r[1] if r else None
                        variety_val = r[2] if r and len(r) > 2 else None
                        try: cur2.close()
                        except Exception: pass
                    except Exception:
                        farmer_id = None
                        variety_val = None
                try:
                    if not variety_val:
                        variety_val = (it.get('variety') or it.get('Variety') or '').strip() or None
                except Exception:
                    variety_val = None

                cur.execute(
                    'INSERT INTO purchase_notifications (farmer_id, farmer_phone, crop_id, crop_name, variety, quantity_kg, buyer_name, buyer_email, buyer_phone) '
                    'VALUES (?,?,?,?,?,?,?,?,?)',
                    (
                        farmer_id,
                        farmer_phone,
                        crop_id,
                        crop_name if crop_name else None,
                        variety_val,
                        qty,
                        (buyer.get('name') or None),
                        (buyer.get('email') or None),
                        (buyer.get('phone') or None),
                    )
                )
                # attempt to notify the farmer via email (best-effort)
                try:
                    farmer_email = None
                    farmer_name = None
                    farmer_lang = None
                    if farmer_id:
                        try:
                            s_conn = sqlite3.connect(db_path)
                            s_cur = s_conn.cursor()
                            try:
                                s_cur.execute('SELECT email,name,lang FROM farmer WHERE id=?', (farmer_id,))
                                r2 = s_cur.fetchone()
                                if r2:
                                    farmer_email = r2[0]
                                    farmer_name = r2[1] if len(r2) > 1 else None
                                    farmer_lang = r2[2] if len(r2) > 2 else None
                            except Exception:
                                try:
                                    s_cur.execute('SELECT email,name FROM farmer WHERE id=?', (farmer_id,))
                                    r2 = s_cur.fetchone()
                                    if r2:
                                        farmer_email = r2[0]
                                        farmer_name = r2[1] if len(r2) > 1 else None
                                except Exception:
                                    pass
                            try: s_cur.close(); s_conn.close()
                            except Exception: pass
                        except Exception:
                            pass
                    if not farmer_email and farmer_phone:
                        try:
                            s_conn = sqlite3.connect(db_path)
                            s_cur = s_conn.cursor()
                            try:
                                s_cur.execute('SELECT email,name,lang FROM farmer WHERE phone=?', (farmer_phone,))
                                r2 = s_cur.fetchone()
                                if r2:
                                    farmer_email = r2[0]
                                    farmer_name = r2[1] if len(r2) > 1 else None
                                    farmer_lang = r2[2] if len(r2) > 2 else None
                            except Exception:
                                try:
                                    s_cur.execute('SELECT email,name FROM farmer WHERE phone=?', (farmer_phone,))
                                    r2 = s_cur.fetchone()
                                    if r2:
                                        farmer_email = r2[0]
                                        farmer_name = r2[1] if len(r2) > 1 else None
                                except Exception:
                                    pass
                            try: s_cur.close(); s_conn.close()
                            except Exception: pass
                        except Exception:
                            pass
                    _lang = (farmer_lang or '').strip().lower() or None
                    if not _lang:
                        _lang = 'en'
                    if farmer_email:
                        try:
                            # compute per-item total if available (sqlite branch)
                            total_val = None
                            try:
                                # prefer incoming totals if provided by the buyer/frontend
                                try:
                                    item_totals = it.get('totals') if isinstance(it, dict) else None
                                except Exception:
                                    item_totals = None
                                top_totals = None
                                try:
                                    top_totals = data.get('totals') if isinstance(data, dict) else None
                                except Exception:
                                    top_totals = None
                                if item_totals and (isinstance(item_totals, dict) and (item_totals.get('grand_total') is not None or item_totals.get('grandTotal') is not None)):
                                    total_val = float(item_totals.get('grand_total') or item_totals.get('grandTotal'))
                                elif top_totals and isinstance(top_totals, dict):
                                    try:
                                        tentry = top_totals.get(str(farmer_id)) or top_totals.get(farmer_id)
                                        if tentry and isinstance(tentry, dict) and (tentry.get('grand_total') is not None or tentry.get('grandTotal') is not None):
                                            total_val = float(tentry.get('grand_total') or tentry.get('grandTotal'))
                                        elif top_totals.get('grand_total') is not None or top_totals.get('grandTotal') is not None:
                                            total_val = float(top_totals.get('grand_total') or top_totals.get('grandTotal'))
                                    except Exception:
                                        pass
                                # try to fetch grand total for this invoice and farmer (sqlite branch may have buyer_orders table)
                                if total_val is None and invoice_id and farmer_id:
                                    try:
                                        s_conn2 = sqlite3.connect(db_path)
                                        s_cur2 = s_conn2.cursor()
                                        try:
                                            s_cur2.execute('SELECT crop_name, quantity_kg, price_per_kg, total FROM buyer_orders WHERE invoice_id=? AND farmer_id=?', (invoice_id, farmer_id))
                                            rows_bo = s_cur2.fetchall()
                                            net_sum = None
                                            if rows_bo:
                                                net_sum = 0.0
                                                for brow in rows_bo:
                                                    try:
                                                        b_crop = (brow[0] or '')
                                                        b_qty = float(brow[1] or 0)
                                                        b_price = float(brow[2] or 0)
                                                        b_total = float(brow[3] or (b_qty * b_price))
                                                        nm = (b_crop or '').lower()
                                                        gstRate = 0
                                                        commissionRate = 8
                                                        if 'masala' in nm or 'masalas' in nm:
                                                            gstRate = 5; commissionRate = 15
                                                        elif 'fruit' in nm or 'vegetable' in nm:
                                                            gstRate = 0; commissionRate = 12
                                                        elif 'crop' in nm or 'crops' in nm:
                                                            gstRate = 0; commissionRate = 8
                                                        else:
                                                            if 'masala' in nm:
                                                                gstRate = 5; commissionRate = 15
                                                            elif 'fruit' in nm or 'vegetable' in nm:
                                                                gstRate = 0; commissionRate = 12
                                                            else:
                                                                gstRate = 0; commissionRate = 8
                                                        gstAmt = (b_total * gstRate) / 100
                                                        platformFee = (b_total * commissionRate) / 100
                                                        net = b_total - gstAmt - platformFee
                                                        net_sum += net
                                                    except Exception:
                                                        continue
                                            if net_sum is not None:
                                                total_val = float(net_sum)
                                        except Exception:
                                            pass
                                        try: s_cur2.close(); s_conn2.close()
                                        except Exception:
                                            pass
                                    except Exception:
                                        pass
                                # fallback to item-level totals
                                if total_val is None:
                                    total_val = it.get('total') if isinstance(it.get('total'), (int, float)) or (it.get('total') and str(it.get('total')).strip()) else None
                                    if not total_val:
                                        total_val = it.get('total_price') or it.get('price')
                                    if not total_val:
                                        total_val = float(it.get('price_per_kg') or 0) * float(qty or 0)
                            except Exception:
                                try:
                                    total_val = float(it.get('total') or 0)
                                except Exception:
                                    total_val = 0
                            threading.Thread(target=send_farmer_purchase_email, args=(farmer_email, farmer_name or '', crop_name, variety_val or '', qty, total_val, (buyer.get('name') or ''), _lang)).start()
                        except Exception:
                            pass
                except Exception:
                    pass
                inserted += 1
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            # After inserting notifications, attempt to send buyer confirmation email (best-effort)
            try:
                buyer_email = (buyer.get('email') or '').strip()
                if buyer_email:
                    try:
                        total_price = 0.0
                        for it in items:
                            try:
                                total_price += float(it.get('total') or (float(it.get('price_per_kg') or 0) * float(it.get('order_quantity') or 0)))
                            except Exception:
                                pass
                    except Exception:
                        total_price = None
                    lang = (
                        request.headers.get('Agri-Lang') or request.headers.get('agri-lang') or
                        data.get('lang') or data.get('language') or
                        buyer.get('lang') or buyer.get('language') or
                        request.args.get('lang') or 'en'
                    )
                    invoice_id = (data.get('invoice_id') or data.get('invoice') or buyer.get('invoice_id') or None)
                    threading.Thread(target=send_purchase_email, args=(buyer_email, buyer.get('name') or '', items, total_price, lang, invoice_id)).start()
            except Exception:
                pass
            return jsonify({'ok': True, 'inserted': inserted}), 200
        except Exception as e:
            print('create_purchase_notifications sqlite error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/notifications/list', methods=['GET'])
def list_purchase_notifications():
    """List notifications for a farmer from contract_b table or buyer from contracts table. Query: farmer_id, farmer_phone, or buyer_id"""
    farmer_id_q = (request.args.get('farmer_id') or '').strip()
    farmer_phone_q = (request.args.get('farmer_phone') or '').strip()
    buyer_id_q = (request.args.get('buyer_id') or '').strip()
    unread_only = (request.args.get('unread_only') or '').strip() in ('1', 'true', 'yes')
    
    # Debug logging
    try:
        with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
            f.write(f"{datetime.datetime.utcnow().isoformat()} NOTIF_LIST farmer_id={farmer_id_q} phone={farmer_phone_q} buyer_id={buyer_id_q}\n")
    except:
        pass
    
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
            cur = conn.cursor(dictionary=True) if hasattr(mysql, 'connect') else conn.cursor()
            
            if buyer_id_q:
                # For buyers, fetch from contracts table
                where = []
                params = []
                if buyer_id_q:
                    where.append('buyer_id=%s'); params.append(int(buyer_id_q) if buyer_id_q.isdigit() else buyer_id_q)
                # Fetch from contracts table
                # Ensure is_read column exists in contracts table
                try:
                    cur.execute("ALTER TABLE contracts ADD COLUMN is_read INT DEFAULT 0")
                    conn.commit()
                except:
                    pass  # Column probably already exists
                
                sql = 'SELECT contract_number, farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state, crop_name, variety, quantity_kg, price_per_kg, amount, farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status, start_date, end_date, contract_nature, contract_duration, COALESCE(created_at, updated_at) as created_at, COALESCE(is_read, 0) as is_read FROM contracts'
                where.append("status NOT IN ('rejected', 'declined', 'cancelled')")
                if where:
                    sql += ' WHERE ' + ' AND '.join(where)
                sql += ' ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 100'
                
                # Debug logging
                try:
                    with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                        f.write(f"  BUYER SQL: {sql} PARAMS: {params}\n")
                except:
                    pass
                
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()
                
                # Debug logging
                try:
                    with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                        f.write(f"  BUYER ROWS_COUNT: {len(rows)}\n")
                except:
                    pass
                
                # normalize
                for r in rows:
                    if isinstance(r, dict):
                        results.append({
                            'id': r.get('contract_number'),  # Use contract_number as id for buyers
                            'contract_number': r.get('contract_number'),
                            'farmer_id': r.get('farmer_id'),
                            'farmer_name': r.get('farmer_name'),
                            'farmer_state': r.get('farmer_state'),
                            'crop_name': r.get('crop_name'),
                            'variety': r.get('variety'),
                            'quantity_kg': r.get('quantity_kg'),
                            'price_per_kg': r.get('price_per_kg'),
                            'amount': r.get('amount'),
                            'buyer_name': r.get('buyer_name'),
                            'buyer_id': r.get('buyer_id'),
                            'buyer_state': r.get('buyer_state'),
                            'created_at': r.get('created_at'),
                            'start_date': r.get('start_date'),
                            'end_date': r.get('end_date'),
                            'contract_nature': r.get('contract_nature'),
                            'contract_duration': r.get('contract_duration'),
                            'farmer_platform_fee': r.get('farmer_platform_fee'),
                            'farmer_gst': r.get('farmer_gst'),
                            'buyer_platform_fee': r.get('buyer_platform_fee'),
                            'buyer_gst': r.get('buyer_gst'),
                            'status': r.get('status'),
                            'is_read': r.get('is_read', 0),
                            'farmer_total': r.get('farmer_total', 0),
                            'buyer_total': r.get('buyer_total', 0)
                        })
                    else:
                        # Handle tuple case
                        results.append({
                            'id': r[0], 'contract_number': r[0], 'farmer_id': r[1], 'farmer_name': r[2], 'farmer_state': r[3], 'crop_name': r[4], 'variety': r[5], 'quantity_kg': r[6],
                            'price_per_kg': r[7], 'amount': r[8], 'buyer_name': r[9], 'buyer_id': r[10], 'buyer_state': r[11], 'created_at': r[24], 'start_date': r[21], 'end_date': r[22],
                            'contract_nature': r[19], 'contract_duration': r[20], 'farmer_platform_fee': r[9], 'farmer_gst': r[10], 'buyer_platform_fee': r[11], 'buyer_gst': r[12], 'status': r[18], 'is_read': r[25], 'farmer_total': r[17], 'buyer_total': r[16]
                        })
            else:
                # For farmers, existing logic for contract_b
                # First check if table exists
                cur.execute("SHOW TABLES LIKE 'contract_b'")
                table_exists = cur.fetchone() is not None
                if not table_exists:
                        # Create contract_b table if it doesn't exist
                        cur.execute('''
                        CREATE TABLE IF NOT EXISTS contract_b (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            contract_number VARCHAR(100) UNIQUE,
                            farmer_id INT,
                            farmer_name VARCHAR(255),
                            farmer_address VARCHAR(255),
                            farmer_state VARCHAR(100),
                            buyer_id INT,
                            buyer_name VARCHAR(255),
                            buyer_address VARCHAR(255),
                            buyer_state VARCHAR(100),
                            crop_name VARCHAR(255),
                            variety VARCHAR(255),
                            quantity_kg FLOAT,
                            price_per_kg FLOAT,
                            amount FLOAT,
                            contract_nature VARCHAR(100),
                            contract_duration VARCHAR(100),
                            start_date DATE,
                            end_date DATE,
                            duration INT,
                            farmer_platform_fee FLOAT DEFAULT 0,
                            farmer_gst FLOAT DEFAULT 0,
                            buyer_platform_fee FLOAT DEFAULT 0,
                            buyer_gst FLOAT DEFAULT 0,
                            buyer_total FLOAT,
                            farmer_total FLOAT,
                            delivery_cost VARCHAR(255),
                            status VARCHAR(50) DEFAULT 'pending',
                            sender VARCHAR(50),
                            signature_method VARCHAR(255),
                            signature_timestamp DATETIME,
                            farmer_signed_date VARCHAR(100),
                            farmer_signature_method VARCHAR(255),
                            farmer_signature_timestamp DATETIME,
                            `read` INT DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                    ''')
                        conn.commit()
                else:
                    # Table exists, try to add missing columns
                    try:
                        cur.execute("ALTER TABLE contract_b ADD COLUMN `read` INT DEFAULT 0")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
                    
                        # Add farmer signature columns if missing
                        try:
                            cur.execute("ALTER TABLE contract_b ADD COLUMN farmer_signed_date VARCHAR(100)")
                            conn.commit()
                        except:
                            pass  # Column probably already exists
                        
                        try:
                            cur.execute("ALTER TABLE contract_b ADD COLUMN farmer_signature_method VARCHAR(255)")
                            conn.commit()
                        except:
                            pass  # Column probably already exists
                        
                        try:
                            cur.execute("ALTER TABLE contract_b ADD COLUMN farmer_signature_timestamp DATETIME")
                            conn.commit()
                        except:
                            pass  # Column probably already exists
                
                    where = []
                    params = []
                    if farmer_id_q:
                        where.append('farmer_id=%s'); params.append(int(farmer_id_q) if farmer_id_q.isdigit() else farmer_id_q)
                    if farmer_phone_q:
                        where.append('farmer_id IN (SELECT id FROM farmer WHERE phone=%s)'); params.append(farmer_phone_q)
                    # Fetch ONLY from contract_b table with status filter
                    sql = 'SELECT id, contract_number, farmer_id, farmer_name, farmer_address, farmer_state, crop_name, variety, quantity_kg, price_per_kg, amount, buyer_name, buyer_id, buyer_address, buyer_state, start_date, end_date, duration, contract_nature, contract_duration, farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, status, COALESCE(`read`, 0) as is_read, sender, farmer_total FROM contract_b'
                    where.append("status NOT IN ('rejected', 'declined', 'cancelled')")
                    if where:
                        sql += ' WHERE ' + ' AND '.join(where)
                    sql += ' ORDER BY id DESC LIMIT 100'
                    
                    # Debug logging
                    try:
                        with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                            f.write(f"  SQL: {sql} PARAMS: {params}\n")
                    except:
                        pass
                    
                    cur.execute(sql, tuple(params))
                    rows = cur.fetchall()
                    
                    # Debug logging
                    try:
                        with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                            f.write(f"  ROWS_COUNT: {len(rows)}\n")
                    except:
                        pass
                    
                    # normalize
                    for r in rows:
                        if isinstance(r, dict):
                            results.append({
                                'id': r.get('id'),
                                'contract_number': r.get('contract_number'),
                                'farmer_id': r.get('farmer_id'),
                                'farmer_name': r.get('farmer_name'),
                                'farmer_address': r.get('farmer_address'),
                                'farmer_state': r.get('farmer_state'),
                                'crop_name': r.get('crop_name'),
                                'variety': r.get('variety'),
                                'quantity_kg': r.get('quantity_kg'),
                                'price_per_kg': r.get('price_per_kg'),
                                'amount': r.get('amount'),
                                'buyer_name': r.get('buyer_name'),
                                'buyer_id': r.get('buyer_id'),
                                'buyer_address': r.get('buyer_address'),
                                'buyer_state': r.get('buyer_state'),
                                'created_at': r.get('start_date'),
                                'start_date': r.get('start_date'),
                                'end_date': r.get('end_date'),
                                'duration': r.get('duration'),
                                'contract_nature': r.get('contract_nature'),
                                'contract_duration': r.get('contract_duration'),
                                'farmer_platform_fee': r.get('farmer_platform_fee'),
                                'farmer_gst': r.get('farmer_gst'),
                                'buyer_platform_fee': r.get('buyer_platform_fee'),
                                'buyer_gst': r.get('buyer_gst'),
                                'status': r.get('status'),
                                'sender': r.get('sender', 'buyer'),
                                'is_read': r.get('is_read', 0),
                                'farmer_total': r.get('farmer_total', 0)
                            })
                        else:
                            results.append({
                                'id': r[0], 'contract_number': r[1], 'farmer_id': r[2], 'farmer_name': r[3], 'farmer_address': r[4], 'farmer_state': r[5], 'crop_name': r[6], 'variety': r[7], 'quantity_kg': r[8],
                                'price_per_kg': r[9], 'amount': r[10], 'buyer_name': r[11], 'buyer_id': r[12], 'buyer_address': r[13], 'buyer_state': r[14], 'created_at': r[15], 'start_date': r[15], 'end_date': r[16], 'duration': r[17],
                                'contract_nature': r[18], 'contract_duration': r[19], 'farmer_platform_fee': r[20], 'farmer_gst': r[21], 'buyer_platform_fee': r[22], 'buyer_gst': r[23], 'status': r[24], 'is_read': r[25], 'sender': r[26], 'farmer_total': r[27]
                            })
            
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'notifications': results}), 200
        except Exception as e:
            print('list_notifications mysql error:', e)
            try:
                with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                    f.write(f"  ERROR: {str(e)}\n")
            except:
                pass
            # If query fails, return empty results instead of falling back to old contracts table
            return jsonify({'ok': True, 'notifications': results}), 200
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            
            # Ensure contract_b table exists with read column
            try:
                # First check if table exists
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='contract_b'")
                table_exists = cur.fetchone() is not None
                if not table_exists:
                    # Create contract_b table if it doesn't exist
                    cur.execute('''
                        CREATE TABLE IF NOT EXISTS contract_b (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            contract_number TEXT UNIQUE,
                            farmer_id INTEGER,
                            farmer_name TEXT,
                            farmer_address TEXT,
                            farmer_state TEXT,
                            buyer_id INTEGER,
                            buyer_name TEXT,
                            buyer_address TEXT,
                            buyer_state TEXT,
                            crop_name TEXT,
                            variety TEXT,
                            quantity_kg REAL,
                            price_per_kg REAL,
                            amount REAL,
                            contract_nature TEXT,
                            contract_duration TEXT,
                            start_date DATE,
                            end_date DATE,
                            duration INTEGER,
                            farmer_platform_fee REAL DEFAULT 0,
                            farmer_gst REAL DEFAULT 0,
                            buyer_platform_fee REAL DEFAULT 0,
                            buyer_gst REAL DEFAULT 0,
                            buyer_total REAL,
                            farmer_total REAL,
                            delivery_cost TEXT,
                            status TEXT DEFAULT 'pending',
                            sender TEXT,
                            signature_method TEXT,
                            signature_timestamp DATETIME,
                            farmer_signed_date TEXT,
                            farmer_signature_method TEXT,
                            farmer_signature_timestamp DATETIME,
                            `read` INTEGER DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    ''')
                    conn.commit()
                else:
                    # Table exists, try to add missing columns
                    try:
                        cur.execute("ALTER TABLE contract_b ADD COLUMN `read` INTEGER DEFAULT 0")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
                    
                    # Add farmer signature columns if missing
                    try:
                        cur.execute("ALTER TABLE contract_b ADD COLUMN farmer_signed_date TEXT")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
                    
                    try:
                        cur.execute("ALTER TABLE contract_b ADD COLUMN farmer_signature_method TEXT")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
                    
                    try:
                        cur.execute("ALTER TABLE contract_b ADD COLUMN farmer_signature_timestamp DATETIME")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
            except Exception as col_err:
                try:
                    conn.rollback()
                except:
                    pass
                print(f"Error ensuring contract_b table (SQLite): {col_err}")
            
            where = []
            params = []
            if farmer_id_q:
                where.append('farmer_id=?'); params.append(int(farmer_id_q) if farmer_id_q.isdigit() else farmer_id_q)
            if farmer_phone_q:
                where.append('farmer_id IN (SELECT id FROM farmer WHERE phone=?)'); params.append(farmer_phone_q)
            # Fetch ONLY from contract_b table with status filter
            sql = 'SELECT id, contract_number, farmer_id, farmer_name, crop_name, variety, quantity_kg, buyer_name, buyer_id, start_date, status, COALESCE([read], 0) as is_read, sender, farmer_total FROM contract_b'
            where.append("status NOT IN ('rejected', 'declined', 'cancelled')")
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += ' ORDER BY id DESC LIMIT 100'
            
            # Debug logging
            try:
                with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                    f.write(f"  SQL: {sql} PARAMS: {params}\n")
            except:
                pass
            
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            
            # Debug logging
            try:
                with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                    f.write(f"  ROWS_COUNT: {len(rows)}\n")
            except:
                pass
            
            for r in rows:
                results.append({
                    'id': r[0], 'contract_number': r[1], 'farmer_id': r[2], 'farmer_name': r[3], 'crop_name': r[4], 'variety': r[5], 'quantity_kg': r[6],
                    'buyer_name': r[7], 'buyer_id': r[8], 'created_at': r[9], 'status': r[10], 'is_read': r[11], 'sender': r[12], 'farmer_total': r[13]
                })
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'notifications': results}), 200
        except Exception as e:
            print('list_notifications sqlite error:', e)
            try:
                with open(os.path.join(os.path.dirname(__file__), 'notifications_list.log'), 'a', encoding='utf-8') as f:
                    f.write(f"  ERROR: {str(e)}\n")
            except:
                pass
            # If query fails, return empty results instead of falling back to old contracts table
            return jsonify({'ok': True, 'notifications': results}), 200


@app.route('/notifications/mark-read', methods=['POST'])
def mark_notifications_read():
    """Mark notifications/contracts as read based on user role. JSON: { ids: [...], user_role: 'buyer'|'farmer', buyer_id: ..., farmer_id: ... }"""
    ensure_purchase_notifications_table()
    data = request.get_json(silent=True) or {}
    ids = data.get('ids') or []
    user_role = data.get('user_role', '').strip()
    buyer_id = data.get('buyer_id')
    farmer_id = data.get('farmer_id')
    
    if not isinstance(ids, list) or not ids:
        return jsonify({'ok': False, 'error': 'ids_required'}), 400
    
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    try:
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            
            if user_role == 'buyer' and buyer_id:
                # For buyers, mark contracts as read in contracts table
                try:
                    # Ensure is_read column exists in contracts table
                    try:
                        cur.execute("ALTER TABLE contracts ADD COLUMN is_read INT DEFAULT 0")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
                    
                    in_clause = ','.join(['%s'] * len(ids))
                    cur.execute(f'UPDATE contracts SET is_read=1 WHERE contract_number IN ({in_clause}) AND buyer_id=%s', tuple(ids) + (buyer_id,))
                    conn.commit()
                except Exception as e:
                    print(f"Error marking buyer contracts as read: {e}")
                    try:
                        conn.rollback()
                    except:
                        pass
            elif user_role == 'farmer' and farmer_id:
                # For farmers, mark contracts as read in contract_b table
                try:
                    in_clause = ','.join(['%s'] * len(ids))
                    cur.execute(f'UPDATE contract_b SET `read`=1 WHERE id IN ({in_clause}) AND farmer_id=%s', tuple(ids) + (farmer_id,))
                    conn.commit()
                except Exception as e:
                    print(f"Error marking farmer contracts as read: {e}")
                    try:
                        conn.rollback()
                    except:
                        pass
            
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            
            if user_role == 'buyer' and buyer_id:
                # For buyers, mark contracts as read in contracts table
                try:
                    # Ensure is_read column exists in contracts table
                    try:
                        cur.execute("ALTER TABLE contracts ADD COLUMN is_read INTEGER DEFAULT 0")
                        conn.commit()
                    except:
                        pass  # Column probably already exists
                    
                    in_clause = ','.join(['?'] * len(ids))
                    cur.execute(f'UPDATE contracts SET is_read=1 WHERE contract_number IN ({in_clause}) AND buyer_id=?', tuple(ids) + (buyer_id,))
                    conn.commit()
                except Exception as e:
                    print(f"Error marking buyer contracts as read (SQLite): {e}")
                    try:
                        conn.rollback()
                    except:
                        pass
            elif user_role == 'farmer' and farmer_id:
                # For farmers, mark contracts as read in contract_b table
                try:
                    in_clause = ','.join(['?'] * len(ids))
                    cur.execute(f'UPDATE contract_b SET `read`=1 WHERE id IN ({in_clause}) AND farmer_id=?', tuple(ids) + (farmer_id,))
                    conn.commit()
                except Exception as e:
                    print(f"Error marking farmer contracts as read (SQLite): {e}")
                    try:
                        conn.rollback()
                    except:
                        pass
            
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('mark_notifications_read error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/notifications/contract-submitted', methods=['POST'])
def create_contract_record():
    """DEPRECATED: This endpoint is no longer used. 
    All contracts should be saved via /contracts/save endpoint instead.
    Kept for backward compatibility - returns mock success.
    """
    # Just return success without doing anything
    contract_number = f"CNT{int(datetime.datetime.now().timestamp())}"
    return jsonify({'ok': True, 'contract_number': contract_number}), 200


@app.route('/farmer/contracts', methods=['GET'])
def farmer_contracts():
    """Return contract rows from `contracts` table for the given farmer id or email.
    Query params: farmer_id (int) or farmer_email (string). Returns JSON list.
    """
    try:
        farmer_id = request.args.get('farmer_id') or request.args.get('id') or None
        farmer_email = request.args.get('farmer_email') or request.args.get('email') or None
        if not farmer_id and not farmer_email:
            return jsonify({'ok': False, 'error': 'farmer_id_or_email_required'}), 400

        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        rows = []
        try:
            print(f"🔍 farmer_contracts: farmer_id={farmer_id}, farmer_email={farmer_email}")
            
            if kind == 'mysql':
                if farmer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety, price_per_kg,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status,
                               start_date, end_date, contract_nature, contract_duration
                        FROM contracts 
                        WHERE farmer_id=%s 
                        ORDER BY updated_at DESC
                    ''', (int(farmer_id),))
                else:
                    cur.execute('''
                        SELECT c.farmer_id, c.farmer_name, c.farmer_state, c.buyer_id, c.buyer_name, c.buyer_state,
                               c.quantity_kg, c.amount, c.contract_number, c.updated_at as created_at, c.crop_name, c.variety, c.price_per_kg,
                               c.farmer_platform_fee, c.farmer_gst, c.buyer_platform_fee, c.buyer_gst, c.buyer_total, c.farmer_total, c.delivery_cost, c.status,
                               c.start_date, c.end_date, c.contract_nature, c.contract_duration
                        FROM contracts c
                        WHERE c.farmer_id IN (SELECT id FROM farmer WHERE email=%s LIMIT 1)
                        ORDER BY c.updated_at DESC
                    ''', (farmer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   MySQL found {len(fetched)} rows")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            else:
                if farmer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety, price_per_kg,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status,
                               start_date, end_date, contract_nature, contract_duration
                        FROM contracts 
                        WHERE farmer_id=? 
                        ORDER BY updated_at DESC
                    ''', (int(farmer_id),))
                else:
                    cur.execute('''
                        SELECT c.farmer_id, c.farmer_name, c.farmer_state, c.buyer_id, c.buyer_name, c.buyer_state,
                               c.quantity_kg, c.amount, c.contract_number, c.updated_at as created_at, c.crop_name, c.variety, c.price_per_kg,
                               c.farmer_platform_fee, c.farmer_gst, c.buyer_platform_fee, c.buyer_gst, c.buyer_total, c.farmer_total, c.delivery_cost, c.status,
                               c.start_date, c.end_date, c.contract_nature, c.contract_duration
                        FROM contracts c
                        WHERE c.farmer_id IN (SELECT id FROM farmer WHERE email=? LIMIT 1)
                        ORDER BY c.updated_at DESC
                    ''', (farmer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   SQLite found {len(fetched)} rows")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            
            print(f"✅ farmer_contracts returning {len(rows)} contracts")
            for r in rows:
                print(f"   - {r.get('contract_number', 'UNKNOWN')} (farmer_id={r.get('farmer_id')})")
                
        finally:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass

        return jsonify({'ok': True, 'contracts': rows}), 200
    except Exception as e:
        print(f'❌ farmer_contracts error: {e}')
        import traceback
        traceback.print_exc()
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/farmer/contracts-b', methods=['GET'])
def farmer_contracts_b():
    """Return contract rows from `contract_b` table for the given farmer id with status IN ('accepted', 'rejected').
    Query params: farmer_id (int) or farmer_email (string). Returns JSON list.
    """
    try:
        farmer_id = request.args.get('farmer_id') or request.args.get('id') or None
        farmer_email = request.args.get('farmer_email') or request.args.get('email') or None
        if not farmer_id and not farmer_email:
            return jsonify({'ok': False, 'error': 'farmer_id_or_email_required'}), 400

        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        rows = []
        try:
            print(f"🔍 farmer_contracts_b: farmer_id={farmer_id}, farmer_email={farmer_email}")
            
            if kind == 'mysql':
                if farmer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status, sender
                        FROM contract_b 
                        WHERE farmer_id=%s AND status IN ('accepted', 'rejected')
                        ORDER BY updated_at DESC
                    ''', (int(farmer_id),))
                else:
                    cur.execute('''
                        SELECT cb.farmer_id, cb.farmer_name, cb.farmer_state, cb.buyer_id, cb.buyer_name, cb.buyer_state,
                               cb.quantity_kg, cb.amount, cb.contract_number, cb.updated_at as created_at, cb.crop_name, cb.variety,
                               cb.farmer_platform_fee, cb.farmer_gst, cb.buyer_platform_fee, cb.buyer_gst, cb.buyer_total, cb.farmer_total, cb.delivery_cost, cb.status, cb.sender
                        FROM contract_b cb
                        WHERE cb.farmer_id IN (SELECT id FROM farmer WHERE email=%s LIMIT 1) AND cb.status IN ('accepted', 'rejected')
                        ORDER BY cb.updated_at DESC
                    ''', (farmer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   MySQL found {len(fetched)} rows from contract_b")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            else:
                if farmer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status, sender
                        FROM contract_b 
                        WHERE farmer_id=? AND status IN ('accepted', 'rejected')
                        ORDER BY updated_at DESC
                    ''', (int(farmer_id),))
                else:
                    cur.execute('''
                        SELECT cb.farmer_id, cb.farmer_name, cb.farmer_state, cb.buyer_id, cb.buyer_name, cb.buyer_state,
                               cb.quantity_kg, cb.amount, cb.contract_number, cb.updated_at as created_at, cb.crop_name, cb.variety,
                               cb.farmer_platform_fee, cb.farmer_gst, cb.buyer_platform_fee, cb.buyer_gst, cb.buyer_total, cb.farmer_total, cb.delivery_cost, cb.status, cb.sender
                        FROM contract_b cb
                        WHERE cb.farmer_id IN (SELECT id FROM farmer WHERE email=? LIMIT 1) AND cb.status IN ('accepted', 'rejected')
                        ORDER BY cb.updated_at DESC
                    ''', (farmer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   SQLite found {len(fetched)} rows from contract_b")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            
            print(f"✅ farmer_contracts_b returning {len(rows)} contracts with status IN ('accepted', 'rejected')")
            for r in rows:
                print(f"   - {r.get('contract_number', 'UNKNOWN')} (status={r.get('status')}, farmer_id={r.get('farmer_id')})")
                
        finally:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass

        return jsonify({'ok': True, 'contracts': rows}), 200
    except Exception as e:
        print(f'❌ farmer_contracts_b error: {e}')
        import traceback
        traceback.print_exc()
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/contracts/get/<contract_number>', methods=['GET'])
def get_contract(contract_number):
    """Fetch a single contract by contract_number from the contract_b table."""
    try:
        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        try:
            # Log the search attempt
            print(f"🔍 get_contract: Looking for contract_number='{contract_number}' (type={type(contract_number).__name__})")
            
            if kind == 'mysql':
                cur.execute('SELECT * FROM contract_b WHERE contract_number = %s LIMIT 1', (contract_number,))
            else:
                cur.execute('SELECT * FROM contract_b WHERE contract_number = ? LIMIT 1', (contract_number,))
            
            cols = [d[0] for d in cur.description]
            row = cur.fetchone()
            
            # If not found in contract_b, fall back to contracts table for buyer-side contract rows
            if not row:
                print(f"⚠️ get_contract: No contract_b row for '{contract_number}', falling back to contracts table")
                if kind == 'mysql':
                    cur.execute('SELECT * FROM contracts WHERE contract_number = %s LIMIT 1', (contract_number,))
                else:
                    cur.execute('SELECT * FROM contracts WHERE contract_number = ? LIMIT 1', (contract_number,))
                cols = [d[0] for d in cur.description]
                row = cur.fetchone()
            
            # Log result
            if not row:
                print(f"❌ get_contract: No contract found for '{contract_number}'")
                # Try to see what contracts exist
                try:
                    if kind == 'mysql':
                        cur.execute('SELECT contract_number FROM contract_b LIMIT 5')
                    else:
                        cur.execute('SELECT contract_number FROM contract_b LIMIT 5')
                    all_contracts = [r[0] for r in cur.fetchall()]
                    print(f"   Available contract_b rows: {all_contracts}")
                except Exception as e:
                    print(f"   Error listing contract_b rows: {e}")
                try:
                    if kind == 'mysql':
                        cur.execute('SELECT contract_number FROM contracts LIMIT 5')
                    else:
                        cur.execute('SELECT contract_number FROM contracts LIMIT 5')
                    all_contracts = [r[0] for r in cur.fetchall()]
                    print(f"   Available contracts rows: {all_contracts}")
                except Exception as e:
                    print(f"   Error listing contracts rows: {e}")
                
                return jsonify({'ok': False, 'error': 'contract_not_found'}), 404
            
            contract = dict(zip(cols, row))
            print(f"✅ get_contract: Found contract {contract_number}")
            return jsonify({'ok': True, 'contract': contract}), 200
        finally:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
    except Exception as e:
        print(f'❌ get_contract error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/buyer/contracts', methods=['GET'])
def buyer_contracts():
    """Return contract rows from `contracts` table for the given buyer id or email.
    Query params: buyer_id (int) or buyer_email (string). Returns JSON list.
    """
    try:
        buyer_id = request.args.get('buyer_id') or request.args.get('id') or None
        buyer_email = request.args.get('buyer_email') or request.args.get('email') or None
        if not buyer_id and not buyer_email:
            return jsonify({'ok': False, 'error': 'buyer_id_or_email_required'}), 400

        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        rows = []
        try:
            print(f"🔍 buyer_contracts: buyer_id={buyer_id}, buyer_email={buyer_email}")
            
            if kind == 'mysql':
                if buyer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety, price_per_kg,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status,
                               start_date, end_date, contract_nature, contract_duration
                        FROM contracts 
                        WHERE buyer_id=%s
                        ORDER BY updated_at DESC
                    ''', (int(buyer_id),))
                else:
                    cur.execute('''
                        SELECT c.farmer_id, c.farmer_name, c.farmer_state, c.buyer_id, c.buyer_name, c.buyer_state,
                               c.quantity_kg, c.amount, c.contract_number, c.updated_at as created_at, c.crop_name, c.variety, c.price_per_kg,
                               c.farmer_platform_fee, c.farmer_gst, c.buyer_platform_fee, c.buyer_gst, c.buyer_total, c.farmer_total, c.delivery_cost, c.status,
                               c.start_date, c.end_date, c.contract_nature, c.contract_duration
                        FROM contracts c
                        WHERE c.buyer_id IN (SELECT id FROM buyer WHERE email=%s LIMIT 1)
                        ORDER BY c.updated_at DESC
                    ''', (buyer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   MySQL found {len(fetched)} rows from contracts")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            else:
                if buyer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety, price_per_kg,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status,
                               start_date, end_date, contract_nature, contract_duration
                        FROM contracts 
                        WHERE buyer_id=?
                        ORDER BY updated_at DESC
                    ''', (int(buyer_id),))
                else:
                    cur.execute('''
                        SELECT c.farmer_id, c.farmer_name, c.farmer_state, c.buyer_id, c.buyer_name, c.buyer_state,
                               c.quantity_kg, c.amount, c.contract_number, c.updated_at as created_at, c.crop_name, c.variety, c.price_per_kg,
                               c.farmer_platform_fee, c.farmer_gst, c.buyer_platform_fee, c.buyer_gst, c.buyer_total, c.farmer_total, c.delivery_cost, c.status,
                               c.start_date, c.end_date, c.contract_nature, c.contract_duration
                        FROM contracts c
                        WHERE c.buyer_id IN (SELECT id FROM buyer WHERE email=? LIMIT 1)
                        ORDER BY c.updated_at DESC
                    ''', (buyer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   SQLite found {len(fetched)} rows from contracts")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            
            print(f"✅ buyer_contracts returning {len(rows)} contracts")
            for r in rows:
                print(f"   - {r.get('contract_number', 'UNKNOWN')} (buyer_id={r.get('buyer_id')})")
                
        finally:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass

        return jsonify({'ok': True, 'contracts': rows}), 200
    except Exception as e:
        print(f'❌ buyer_contracts error: {e}')
        import traceback
        traceback.print_exc()
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/buyer/contracts-b', methods=['GET'])
def buyer_contracts_b():
    """Return contract rows from `contract_b` table for the given buyer id with status IN ('pending', 'accepted', 'rejected').
    Query params: buyer_id (int) or buyer_email (string). Returns JSON list.
    """
    try:
        buyer_id = request.args.get('buyer_id') or request.args.get('id') or None
        buyer_email = request.args.get('buyer_email') or request.args.get('email') or None
        if not buyer_id and not buyer_email:
            return jsonify({'ok': False, 'error': 'buyer_id_or_email_required'}), 400

        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        rows = []
        try:
            print(f"🔍 buyer_contracts_b: buyer_id={buyer_id}, buyer_email={buyer_email}")
            
            if kind == 'mysql':
                if buyer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status, sender
                        FROM contract_b 
                        WHERE buyer_id=%s AND status IN ('pending', 'accepted', 'rejected')
                        ORDER BY updated_at DESC
                    ''', (int(buyer_id),))
                else:
                    cur.execute('''
                        SELECT cb.farmer_id, cb.farmer_name, cb.farmer_state, cb.buyer_id, cb.buyer_name, cb.buyer_state,
                               cb.quantity_kg, cb.amount, cb.contract_number, cb.updated_at as created_at, cb.crop_name, cb.variety,
                               cb.farmer_platform_fee, cb.farmer_gst, cb.buyer_platform_fee, cb.buyer_gst, cb.buyer_total, cb.farmer_total, cb.delivery_cost, cb.status, cb.sender
                        FROM contract_b cb
                        WHERE cb.buyer_id IN (SELECT id FROM buyer WHERE email=%s LIMIT 1) AND cb.status IN ('pending', 'accepted', 'rejected')
                        ORDER BY cb.updated_at DESC
                    ''', (buyer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   MySQL found {len(fetched)} rows from contract_b")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            else:
                if buyer_id:
                    cur.execute('''
                        SELECT farmer_id, farmer_name, farmer_state, buyer_id, buyer_name, buyer_state,
                               quantity_kg, amount, contract_number, updated_at as created_at, crop_name, variety,
                               farmer_platform_fee, farmer_gst, buyer_platform_fee, buyer_gst, buyer_total, farmer_total, delivery_cost, status, sender
                        FROM contract_b 
                        WHERE buyer_id=? AND status IN ('pending', 'accepted', 'rejected')
                        ORDER BY updated_at DESC
                    ''', (int(buyer_id),))
                else:
                    cur.execute('''
                        SELECT cb.farmer_id, cb.farmer_name, cb.farmer_state, cb.buyer_id, cb.buyer_name, cb.buyer_state,
                               cb.quantity_kg, cb.amount, cb.contract_number, cb.updated_at as created_at, cb.crop_name, cb.variety,
                               cb.farmer_platform_fee, cb.farmer_gst, cb.buyer_platform_fee, cb.buyer_gst, cb.buyer_total, cb.farmer_total, cb.delivery_cost, cb.status, cb.sender
                        FROM contract_b cb
                        WHERE cb.buyer_id IN (SELECT id FROM buyer WHERE email=? LIMIT 1) AND cb.status IN ('pending', 'accepted', 'rejected')
                        ORDER BY cb.updated_at DESC
                    ''', (buyer_email,))
                cols = [d[0] for d in cur.description]
                fetched = cur.fetchall()
                print(f"   SQLite found {len(fetched)} rows from contract_b")
                for r in fetched:
                    rows.append(dict(zip(cols, r)))
            
            print(f"✅ buyer_contracts_b returning {len(rows)} contracts with status IN ('pending', 'accepted', 'rejected')")
            for r in rows:
                print(f"   - {r.get('contract_number', 'UNKNOWN')} (status={r.get('status')}, buyer_id={r.get('buyer_id')})")
                
        finally:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass

        return jsonify({'ok': True, 'contracts': rows}), 200
    except Exception as e:
        print(f'❌ buyer_contracts_b error: {e}')
        import traceback
        traceback.print_exc()
        try:
            cur.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/contracts/accept', methods=['POST'])
def accept_contract():
    """Mark an existing contract as accepted/rejected in contract_b table.
    Expects JSON body with:
    - contract_number (string) 
    - status (optional, 'accepted' or 'rejected', defaults to 'accepted')
    - buyer_id (optional, for buyer acceptance)
    - farmer_id (optional, for farmer acceptance/rejection)
    - signature_data (optional, for buyer signature)
    - farmer_signature_data (optional, for farmer signature)
    """
    data = request.get_json(silent=True) or {}
    contract_number = (data.get('contract_number') or '').strip()
    
    if not contract_number:
        return jsonify({'ok': False, 'error': 'contract_number_required'}), 400

    kind, conn = get_db_connection()
    cur = get_cursor(kind, conn)
    try:
        print(f"🔧 accept_contract called: contract_number={contract_number}, data={data}")
        
        # Determine status to set
        status_to_set = 'accepted'
        req_status = (data.get('status') or '').strip().lower()
        if req_status in ('accepted', 'rejected'):
            status_to_set = req_status
        
        # Check if this is a farmer action (has farmer_id) or buyer action (has buyer_id)
        is_farmer_action = bool(data.get('farmer_id'))
        is_buyer_action = bool(data.get('buyer_id'))
        
        # Get buyer signature data
        buyer_sig = data.get('signature_data') or {}
        buyer_sig_method = buyer_sig.get('signature_method')
        buyer_sig_timestamp = buyer_sig.get('signature_timestamp')
        
        # Get farmer signature data
        farmer_sig = data.get('farmer_signature_data') or {}
        farmer_name_signed = farmer_sig.get('farmer_name')
        farmer_signed_date = farmer_sig.get('farmer_signed_date')
        farmer_sig_method = farmer_sig.get('signature_method')
        farmer_sig_timestamp = farmer_sig.get('signature_timestamp')
        
        # Fetch current contract status and restoration details before changing status
        old_status = None
        restore_source = None
        try:
            if kind == 'mysql':
                cur.execute("SELECT status, farmer_id, crop_name, variety, quantity_kg FROM contract_b WHERE contract_number=%s LIMIT 1", (contract_number,))
            else:
                cur.execute("SELECT status, farmer_id, crop_name, variety, quantity_kg FROM contract_b WHERE contract_number=? LIMIT 1", (contract_number,))
            restore_source = cur.fetchone()
            if restore_source:
                old_status = restore_source[0]
        except Exception as e:
            print(f"⚠️ accept_contract: failed to fetch contract_b current status for {contract_number}: {e}")
            restore_source = None
            old_status = None

        print(f"📝 Action type - is_farmer: {is_farmer_action}, is_buyer: {is_buyer_action}")
        print(f"📝 Signature data - buyer: {buyer_sig}, farmer: {farmer_sig}, status: {status_to_set}")
        
        # For buyer actions, ensure both tables exist; for farmer actions, ensure contract_b exists
        if is_buyer_action:
            ensure_contracts_table()
        
        # Update contract_b table with new status and signature info (attempt for both farmer and buyer)
        contract_b_updated = False
        if kind == 'mysql':
            if is_farmer_action:
                # Farmer action (acceptance or rejection)
                if farmer_name_signed:
                    # Farmer acceptance - update farmer signature fields
                    cur.execute(
                        """
                        UPDATE contract_b
                        SET status=%s, 
                            farmer_signature_method=%s, 
                            farmer_signature_timestamp=%s,
                            farmer_signed_date=%s
                        WHERE contract_number=%s
                        """,
                        (status_to_set, farmer_sig_method, farmer_sig_timestamp, farmer_signed_date, contract_number)
                    )
                else:
                    # Farmer rejection - just update status, no signature
                    cur.execute(
                        """
                        UPDATE contract_b
                        SET status=%s
                        WHERE contract_number=%s
                        """,
                        (status_to_set, contract_number)
                    )
                contract_b_updated = cur.rowcount > 0
            else:
                # Buyer action - try to update contract_b if it exists
                cur.execute(
                    """
                    UPDATE contract_b
                    SET status=%s, 
                        signature_method=%s, 
                        signature_timestamp=%s
                    WHERE contract_number=%s
                    """,
                    (status_to_set, buyer_sig_method, buyer_sig_timestamp, contract_number)
                )
                contract_b_updated = cur.rowcount > 0
                if contract_b_updated:
                    print(f"✅ Updated contract_b for buyer action on {contract_number}")
                else:
                    print(f"⚠️ contract_b not found for buyer action {contract_number} - this is OK, will update contracts table only")
        else:
            if is_farmer_action:
                # Farmer action (acceptance or rejection)
                if farmer_name_signed:
                    # Farmer acceptance - update farmer signature fields
                    cur.execute(
                        """
                        UPDATE contract_b
                        SET status=?, 
                            farmer_signature_method=?, 
                            farmer_signature_timestamp=?,
                            farmer_signed_date=?
                        WHERE contract_number=?
                        """,
                        (status_to_set, farmer_sig_method, farmer_sig_timestamp, farmer_signed_date, contract_number)
                    )
                else:
                    # Farmer rejection - just update status, no signature
                    cur.execute(
                        """
                        UPDATE contract_b
                        SET status=?
                        WHERE contract_number=?
                        """,
                        (status_to_set, contract_number)
                    )
                contract_b_updated = cur.rowcount > 0
            else:
                # Buyer action - try to update contract_b if it exists
                cur.execute(
                    """
                    UPDATE contract_b
                    SET status=?, 
                        signature_method=?, 
                        signature_timestamp=?
                    WHERE contract_number=?
                    """,
                    (status_to_set, buyer_sig_method, buyer_sig_timestamp, contract_number)
                )
                contract_b_updated = cur.rowcount > 0
                if contract_b_updated:
                    print(f"✅ Updated contract_b for buyer action on {contract_number}")
                else:
                    print(f"⚠️ contract_b not found for buyer action {contract_number} - this is OK, will update contracts table only")
        
        # For buyer actions, also update the contracts table
        contracts_updated = False
        if is_buyer_action:
            ensure_contracts_table()
            if kind == 'mysql':
                cur.execute(
                    """
                    UPDATE contracts
                    SET status=%s
                    WHERE contract_number=%s
                    """,
                    (status_to_set, contract_number)
                )
            else:
                cur.execute(
                    """
                    UPDATE contracts
                    SET status=?
                    WHERE contract_number=?
                    """,
                    (status_to_set, contract_number)
                )
            contracts_updated = cur.rowcount > 0
            print(f"✅ Updated contracts table for buyer action on {contract_number}, rows affected: {cur.rowcount}")

        # Restore crops when the contract is newly rejected
        if status_to_set == 'rejected' and restore_source and old_status != 'rejected':
            try:
                farmer_id = restore_source[1]
                crop_name = restore_source[2]
                variety = restore_source[3]
                contract_quantity = float(restore_source[4]) if restore_source[4] else 0
                if farmer_id and crop_name and variety and contract_quantity > 0:
                    if kind == 'mysql':
                        cur.execute(
                            "UPDATE crops SET quantity_kg = quantity_kg + %s WHERE seller_id=%s AND crop_name=%s AND variety=%s",
                            (contract_quantity, farmer_id, crop_name, variety)
                        )
                        restored_count = cur.rowcount
                    else:
                        cur.execute(
                            "UPDATE crops SET quantity_kg = quantity_kg + ? WHERE seller_id=? AND crop_name=? AND variety=?",
                            (contract_quantity, farmer_id, crop_name, variety)
                        )
                        restored_count = cur.rowcount
                    print(f"✅ accept_contract: restored {restored_count} crop(s) quantity for farmer_id={farmer_id} after rejection")
                else:
                    print(f"⚠️ accept_contract: rejection restoration skipped due missing data for {contract_number}")
            except Exception as e:
                print(f"⚠️ accept_contract: failed to restore crops on rejection for {contract_number}: {e}")
        
        conn.commit()
        
        # Verify contract was updated based on the action type
        contract_found = False
        verification_msg = ""
        
        if is_buyer_action:
            # For buyer actions, require contracts table to have the record
            if kind == 'mysql':
                cur.execute("SELECT COUNT(*) FROM contracts WHERE contract_number=%s", (contract_number,))
            else:
                cur.execute("SELECT COUNT(*) FROM contracts WHERE contract_number=?", (contract_number,))
            contract_found = cur.fetchone()[0] > 0
            verification_msg = f"contracts table (buyer): found={contract_found}"
            
            # Also check if contract_b was updated (if it exists)
            if kind == 'mysql':
                cur.execute("SELECT COUNT(*) FROM contract_b WHERE contract_number=%s", (contract_number,))
            else:
                cur.execute("SELECT COUNT(*) FROM contract_b WHERE contract_number=?", (contract_number,))
            contract_b_found = cur.fetchone()[0] > 0
            verification_msg += f", contract_b (farmer): found={contract_b_found}"
        else:
            # For farmer actions, require contract_b table to have the record
            if kind == 'mysql':
                cur.execute("SELECT COUNT(*) FROM contract_b WHERE contract_number=%s", (contract_number,))
            else:
                cur.execute("SELECT COUNT(*) FROM contract_b WHERE contract_number=?", (contract_number,))
            contract_found = cur.fetchone()[0] > 0
            verification_msg = f"contract_b table (farmer): found={contract_found}"
        
        if not contract_found:
            print(f"⚠️ accept_contract: contract not found - {verification_msg}")
            return jsonify({'ok': False, 'error': 'contract_not_found', 'verification': verification_msg}), 404
        
        print(f"✅ accept_contract: contract verification passed - {verification_msg}")
        
        print(f"✅ accept_contract: successfully updated contract {contract_number} status to {status_to_set}")
        return jsonify({'ok': True}), 200
    except Exception as e:
        print(f'❌ accept_contract error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass



@app.route('/contracts/delete/<contract_number>', methods=['DELETE'])
def delete_contract(contract_number):
    """Remove a contract row (used by both farmer and buyer when cancelling a pending deal).
    Also removes the same contract from contract_b table if it exists (cascading delete).
    Also restores quantity to farmer's crops if contract has farmer_id, crop_name, variety.
    Does NOT perform any authentication; caller must ensure only rightful user
    can delete (frontend restricts button visibility to owner and pending status).
    """
    ensure_contracts_table()
    kind, conn = get_db_connection()
    cur = get_cursor(kind, conn)
    try:
        print(f"🔧 delete_contract called: contract_number={contract_number}")

        # First, fetch contract details from contract_b to get farmer_id, crop_name, variety, and quantity for restoration
        try:
            if kind == 'mysql':
                cur.execute("SELECT farmer_id, crop_name, variety, quantity_kg FROM contract_b WHERE contract_number=%s LIMIT 1", (contract_number,))
            else:
                cur.execute("SELECT farmer_id, crop_name, variety, quantity_kg FROM contract_b WHERE contract_number=? LIMIT 1", (contract_number,))
            contract_row = cur.fetchone()
            farmer_id = None
            crop_name = None
            variety = None
            contract_quantity = 0
            if contract_row:
                farmer_id = contract_row[0]
                crop_name = contract_row[1]
                variety = contract_row[2]
                contract_quantity = float(contract_row[3]) if contract_row[3] else 0
        except Exception as e:
            print(f"⚠️ delete_contract: failed to fetch contract_b details: {e}")
            contract_row = None
            farmer_id = None
            crop_name = None
            variety = None
            contract_quantity = 0

        # Delete from contracts table
        if kind == 'mysql':
            cur.execute("DELETE FROM contracts WHERE contract_number=%s", (contract_number,))
            contracts_deleted = cur.rowcount
        else:
            cur.execute("DELETE FROM contracts WHERE contract_number=?", (contract_number,))
            contracts_deleted = cur.rowcount

        # Also delete from contract_b table if it exists (cascading delete)
        try:
            if kind == 'mysql':
                cur.execute("DELETE FROM contract_b WHERE contract_number=%s", (contract_number,))
                contract_b_deleted = cur.rowcount
            else:
                cur.execute("DELETE FROM contract_b WHERE contract_number=?", (contract_number,))
                contract_b_deleted = cur.rowcount
            print(f"✅ delete_contract: removed {contracts_deleted} from contracts, {contract_b_deleted} from contract_b")
        except Exception as e:
            print(f"⚠️ delete_contract: contract_b deletion skipped (table may not exist): {e}")
            contract_b_deleted = 0

        # Restore quantity to farmer's crops if farmer_id, crop_name, variety are available
        crops_restored = 0
        try:
            if farmer_id and crop_name and variety and contract_quantity > 0:
                # Find the crop(s) for this farmer with matching crop_name and variety, then update quantity
                try:
                    if kind == 'mysql':
                        cur.execute(
                            "UPDATE crops SET quantity_kg = quantity_kg + %s WHERE seller_id=%s AND crop_name=%s AND variety=%s",
                            (contract_quantity, farmer_id, crop_name, variety)
                        )
                        crops_restored = cur.rowcount
                    else:
                        cur.execute(
                            "UPDATE crops SET quantity_kg = quantity_kg + ? WHERE seller_id=? AND crop_name=? AND variety=?",
                            (contract_quantity, farmer_id, crop_name, variety)
                        )
                        crops_restored = cur.rowcount
                    print(f"✅ delete_contract: restored {crops_restored} crop(s) quantity for farmer_id={farmer_id}")
                except Exception as e:
                    print(f"⚠️ delete_contract: failed to restore crops quantity: {e}")
                    crops_restored = 0
        except Exception as e:
            print(f"⚠️ delete_contract: error in crops restoration logic: {e}")

        conn.commit()

        if contracts_deleted == 0 and contract_b_deleted == 0:
            print(f"⚠️ delete_contract: no rows deleted for {contract_number}")
            return jsonify({'ok': False, 'error': 'contract_not_found'}), 404

        print(f"✅ delete_contract: successfully removed contract {contract_number}")
        return jsonify({'ok': True, 'deleted_from_contracts': contracts_deleted, 'deleted_from_contract_b': contract_b_deleted, 'crops_restored': crops_restored}), 200
    except Exception as e:
        print(f'❌ delete_contract error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'ok': False, 'error': str(e)}), 500
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


@app.route('/buyer/delete_contract', methods=['POST'])
def buyer_delete_contract():
    """Allow buyer to delete their own pending contracts.
    Requires buyer_id and contract_number in JSON payload.
    Only allows deletion of pending contracts owned by the buyer.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'ok': False, 'error': 'missing_json'}), 400
        
        buyer_id = data.get('buyer_id')
        contract_number = data.get('contract_number')
        
        if not buyer_id or not contract_number:
            return jsonify({'ok': False, 'error': 'missing_buyer_id_or_contract_number'}), 400
        
        ensure_contracts_table()
        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        
        # Resolve buyer_id: could be integer id, phone, or email
        actual_buyer_id = None
        try:
            # Try to parse as integer (direct id)
            actual_buyer_id = int(buyer_id)
        except ValueError:
            # Not an integer, treat as phone or email
            if kind == 'mysql':
                cur.execute("SELECT id FROM buyer WHERE phone=%s OR email=%s LIMIT 1", (buyer_id, buyer_id))
            else:
                cur.execute("SELECT id FROM buyer WHERE phone=? OR email=? LIMIT 1", (buyer_id, buyer_id))
            buyer_row = cur.fetchone()
            if buyer_row:
                actual_buyer_id = buyer_row[0]
            else:
                return jsonify({'ok': False, 'error': 'buyer_not_found'}), 404
        
        # First, verify the contract exists and belongs to this buyer and is pending
        try:
            if kind == 'mysql':
                cur.execute(
                    "SELECT status FROM contract_b WHERE contract_number=%s AND buyer_id=%s LIMIT 1",
                    (contract_number, actual_buyer_id)
                )
            else:
                cur.execute(
                    "SELECT status FROM contract_b WHERE contract_number=? AND buyer_id=? LIMIT 1",
                    (contract_number, actual_buyer_id)
                )
            contract_row = cur.fetchone()
            
            if not contract_row:
                return jsonify({'ok': False, 'error': 'contract_not_found_or_not_owned'}), 404
            
            status = contract_row[0]
            if str(status).lower() != 'pending':
                return jsonify({'ok': False, 'error': 'can_only_delete_pending_contracts'}), 400
                
        except Exception as e:
            print(f"⚠️ buyer_delete_contract: failed to verify contract: {e}")
            return jsonify({'ok': False, 'error': 'verification_failed'}), 500
        
        # Now perform the deletion logic similar to delete_contract
        # Fetch contract details for quantity restoration
        try:
            if kind == 'mysql':
                cur.execute("SELECT crop_name, quantity_kg FROM contract_b WHERE contract_number=%s LIMIT 1", (contract_number,))
            else:
                cur.execute("SELECT crop_name, quantity_kg FROM contract_b WHERE contract_number=? LIMIT 1", (contract_number,))
            contract_row = cur.fetchone()
            crop_name = None
            contract_quantity = 0
            if contract_row:
                crop_name = contract_row[0]
                contract_quantity = float(contract_row[1]) if contract_row[1] else 0
        except Exception as e:
            print(f"⚠️ buyer_delete_contract: failed to fetch contract details: {e}")
            crop_name = None
            contract_quantity = 0
        
        # Delete from contracts table
        if kind == 'mysql':
            cur.execute("DELETE FROM contracts WHERE contract_number=%s", (contract_number,))
            contracts_deleted = cur.rowcount
        else:
            cur.execute("DELETE FROM contracts WHERE contract_number=?", (contract_number,))
            contracts_deleted = cur.rowcount
        
        # Also delete from contract_b table if it exists
        try:
            if kind == 'mysql':
                cur.execute("DELETE FROM contract_b WHERE contract_number=%s", (contract_number,))
                contract_b_deleted = cur.rowcount
            else:
                cur.execute("DELETE FROM contract_b WHERE contract_number=?", (contract_number,))
                contract_b_deleted = cur.rowcount
            print(f"✅ buyer_delete_contract: removed {contracts_deleted} from contracts, {contract_b_deleted} from contract_b")
        except Exception as e:
            print(f"⚠️ buyer_delete_contract: contract_b deletion skipped: {e}")
            contract_b_deleted = 0
        
        # For buyer deletion, we don't restore quantity to deals since buyer is removing their own demand
        # (unlike farmer deletion which restores buyer's demand)
        
        conn.commit()
        
        if contracts_deleted == 0 and contract_b_deleted == 0:
            return jsonify({'success': False, 'error': 'contract_not_found'}), 404
        
        print(f"✅ buyer_delete_contract: successfully removed contract {contract_number}")
        return jsonify({'success': True, 'message': 'Contract deleted successfully'}), 200
        
    except Exception as e:
        print(f'❌ buyer_delete_contract error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


@app.route('/contracts/debug/<farmer_id>', methods=['GET'])
def debug_farmer_contracts(farmer_id):
    """DEBUGGING: List all contracts for a farmer to verify data."""
    try:
        farmer_id = int(farmer_id)
        kind, conn = get_db_connection()
        cur = get_cursor(kind, conn)
        
        print(f"🔍 debug_farmer_contracts: farmer_id={farmer_id}")
        
        try:
            if kind == 'mysql':
                cur.execute('SELECT contract_number, farmer_id, buyer_id, crop_name, amount, created_at FROM contracts WHERE farmer_id = %s ORDER BY created_at DESC', (farmer_id,))
            else:
                cur.execute('SELECT contract_number, farmer_id, buyer_id, crop_name, amount, created_at FROM contracts WHERE farmer_id = ? ORDER BY created_at DESC', (farmer_id,))
            
            cols = [d[0] for d in cur.description]
            rows = []
            for row in cur.fetchall():
                rows.append(dict(zip(cols, row)))
            
            print(f"✅ Found {len(rows)} contracts for farmer {farmer_id}")
            for r in rows:
                print(f"   - {r}")
            
            return jsonify({'ok': True, 'farmer_id': farmer_id, 'count': len(rows), 'contracts': rows}), 200
        finally:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
    except Exception as e:
        print(f'❌ debug_farmer_contracts error: {e}')
        return jsonify({'ok': False, 'error': str(e)}), 500
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/cart/add', methods=['POST'])
def cart_add():
    """Add one or more items to the cart. JSON: { user_type, user_id, user_phone, items: [ { crop_id, crop_name, variety, quantity_kg, price_per_kg, image_path } ] }
    Accepts single-item payload with `item` as well.
    """
    ensure_cart_table()
    data = request.get_json(silent=True) or {}
    user_type = (data.get('user_type') or '').strip() or None
    user_id = data.get('user_id')
    user_phone = data.get('user_phone') or data.get('phone')
    items = data.get('items') or ([] if data.get('item') is None else [data.get('item')])
    if not items:
        return jsonify({'ok': False, 'error': 'items_required'}), 400
    # Debug: log incoming payload and DB mode to help diagnose persistence issues
    try:
        print('cart_add: received payload keys ->', list(data.keys()) if isinstance(data, dict) else 'no-data')
        try:
            print('cart_add: items ->', items)
        except Exception:
            pass
        print('cart_add: env DB_USE=', os.environ.get('DB_USE'))
    except Exception:
        pass
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    table_name = 'cart' if (user_type and str(user_type).lower() == 'farmer') else 'cart_b'

    # Precompute totals when inserting buyer cart items so we can store them on each row
    total_qty_for_payload = 0.0
    total_price_for_payload = 0.0
    try:
        for it in items:
            qty = float(it.get('quantity_kg') or it.get('order_quantity') or 0)
            price = float(it.get('price_per_kg') or it.get('price') or 0)
            total_qty_for_payload += qty
            total_price_for_payload += (qty * price)
    except Exception:
        total_qty_for_payload = 0.0
        total_price_for_payload = 0.0

    # Parse incoming ids.
    tmp_user_id = None
    try:
        if user_id is not None and str(user_id).strip() != '':
            try:
                tmp_user_id = int(user_id)
            except Exception:
                tmp_user_id = None
    except Exception:
        tmp_user_id = None

    # parsed_user_id will hold a farmer id ONLY (never a buyer id).
    parsed_user_id = None
    try:
        if tmp_user_id is not None and str(user_type).lower() == 'farmer':
            try:
                kind_check, conn_check = get_db_connection()
                cur_check = conn_check.cursor()
                if kind_check == 'mysql':
                    cur_check.execute('SELECT id FROM farmer WHERE id=%s LIMIT 1', (tmp_user_id,))
                else:
                    cur_check.execute('SELECT id FROM farmer WHERE id=? LIMIT 1', (tmp_user_id,))
                r = cur_check.fetchone()
                try: cur_check.close()
                except Exception: pass
                try: conn_check.close()
                except Exception: pass
                if r:
                    parsed_user_id = tmp_user_id
            except Exception:
                parsed_user_id = None

        # If still not resolved and phone provided, try to resolve farmer by phone
        if parsed_user_id is None and user_phone:
            try:
                tbl, row = find_user_by_phone(user_phone)
                if tbl == 'farmer' and row:
                    try:
                        parsed_user_id = int(row[0])
                        user_type = 'farmer'
                    except Exception:
                        parsed_user_id = None
            except Exception:
                parsed_user_id = None
    except Exception:
        parsed_user_id = None

    # parsed_buyer_id will hold buyer id when provided or when caller is buyer
    parsed_buyer_id = None
    try:
        bval = data.get('buyer_id') if isinstance(data, dict) else None
        if bval is not None and str(bval).strip() != '':
            try:
                parsed_buyer_id = int(bval)
            except Exception:
                parsed_buyer_id = None
        # If caller did not provide explicit buyer_id but role is buyer and tmp_user_id exists, treat tmp_user_id as buyer id
        if parsed_buyer_id is None and str(user_type).lower() == 'buyer' and tmp_user_id is not None:
            parsed_buyer_id = tmp_user_id
    except Exception:
        parsed_buyer_id = None

    inserted = []
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
            for it in items:
                crop_id = it.get('crop_id') or it.get('id')
                crop_name = (it.get('crop_name') or '')
                variety = it.get('variety') or it.get('Variety') or None
                qty = it.get('quantity_kg') or it.get('order_quantity') or 0
                price = it.get('price_per_kg') or it.get('price') or None
                image = it.get('image_path') or it.get('image_url') or None

                # Determine farmer id to store in user_id column: prefer parsed_user_id (explicit farmer),
                # otherwise resolve from crops.seller_id.
                insert_user_id = None
                if parsed_user_id is not None:
                    insert_user_id = parsed_user_id
                try:
                    if crop_id is not None and insert_user_id is None:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT seller_id, category FROM crops WHERE id=%s LIMIT 1', (int(crop_id),))
                        rr = cur2.fetchone()
                        try: cur2.close()
                        except Exception: pass
                        if rr and len(rr) > 0:
                            seller_from_crop = rr[0] if len(rr) > 0 else None
                            crop_category_from_db = rr[1] if len(rr) > 1 else None
                            if seller_from_crop is not None:
                                insert_user_id = seller_from_crop
                            if (it.get('category') is None or str(it.get('category')).strip() == '') and crop_category_from_db:
                                category = crop_category_from_db
                except Exception:
                    pass

                # Determine buyer id to store in buyer_id column (if available)
                insert_buyer_id = parsed_buyer_id if parsed_buyer_id is not None else None

                # Prevent duplicate cart rows for same crop + owner: check by farmer (user_id), buyer_id, or phone
                try:
                    cur_check = conn.cursor()
                    sql_check = f"SELECT id FROM {table_name} WHERE crop_id=%s AND user_type=%s AND ((user_id IS NOT NULL AND user_id=%s) OR (buyer_id IS NOT NULL AND buyer_id=%s) OR (user_phone IS NOT NULL AND user_phone=%s)) LIMIT 1"
                    params_check = (
                        int(crop_id) if crop_id is not None else None,
                        user_type,
                        insert_user_id if insert_user_id is not None else None,
                        insert_buyer_id if insert_buyer_id is not None else None,
                        user_phone if user_phone is not None else None
                    )
                    cur_check.execute(sql_check, params_check)
                    existing_row = cur_check.fetchone()
                    try: cur_check.close()
                    except Exception: pass
                    if existing_row:
                        try:
                            exist_id = existing_row[0] if isinstance(existing_row, (list, tuple)) else (existing_row.get('id') if isinstance(existing_row, dict) else existing_row)
                        except Exception:
                            exist_id = existing_row
                        inserted.append({'id': exist_id, 'crop_id': crop_id, 'crop_name': crop_name, 'note': 'duplicate_skipped'})
                        continue
                except Exception:
                    try: cur_check.close()
                    except Exception: pass

                # Read category from payload if present; fallback to None. Compute per-item totals
                category = it.get('category') or it.get('Category') or None
                
                # Fetch delivery_date from deals table based on crop_id or crop_name
                delivery_date = None
                try:
                    if crop_id is not None:
                        cur_deals = conn.cursor()
                        # Primary: try to fetch by crop_id
                        cur_deals.execute('SELECT delivery_date FROM deals WHERE crop_id=%s AND delivery_date IS NOT NULL ORDER BY created_at DESC LIMIT 1', (int(crop_id),))
                        deals_row = cur_deals.fetchone()
                        
                        # Fallback: if crop_id didn't work, try by crop_name
                        if not deals_row and crop_name:
                            cur_deals.execute('SELECT delivery_date FROM deals WHERE crop_name=%s AND delivery_date IS NOT NULL ORDER BY created_at DESC LIMIT 1', (crop_name,))
                            deals_row = cur_deals.fetchone()
                        
                        try: cur_deals.close()
                        except Exception: pass
                        
                        if deals_row and deals_row[0] is not None:
                            delivery_date = deals_row[0]
                            print(f'delivery_date fetched for crop_id {crop_id}: {delivery_date}')
                        else:
                            print(f'No delivery_date found in deals for crop_id {crop_id} or crop_name {crop_name}')
                except Exception as e:
                    print(f'Error fetching delivery_date from deals: {e}')
                    import traceback
                    traceback.print_exc()
                    pass
                
                try:
                    qty_val = float(qty) if qty is not None else 0.0
                except Exception:
                    qty_val = 0.0
                try:
                    price_val = float(price) if price is not None else 0.0
                except Exception:
                    price_val = 0.0
                item_total_price = round(qty_val * price_val, 2)

                cur.execute(
                    f'INSERT INTO {table_name} (user_type, user_id, buyer_id, user_phone, crop_id, crop_name, variety, quantity_kg, price_per_kg, image_path, category, total_quantity, total_price, delivery_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                    (
                        user_type,
                        insert_user_id if insert_user_id is not None else None,
                        insert_buyer_id if insert_buyer_id is not None else None,
                        user_phone if user_phone else None,
                        int(crop_id) if crop_id is not None else None,
                        crop_name if crop_name else None,
                        variety,
                        qty_val,
                        price_val if price is not None else None,
                        image,
                        category,
                        qty_val,
                        item_total_price,
                        delivery_date
                    )
                )
                try:
                    inserted_id = cur.lastrowid
                except Exception:
                    inserted_id = None
                inserted.append({'id': inserted_id, 'crop_id': crop_id, 'crop_name': crop_name})
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'inserted': inserted}), 200
        except Exception as e:
            print('cart_add mysql error:', e)
            try:
                import traceback
                traceback.print_exc()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': str(e)}), 500
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            for it in items:
                crop_id = it.get('crop_id') or it.get('id')
                crop_name = (it.get('crop_name') or '')
                variety = it.get('variety') or it.get('Variety') or None
                qty = it.get('quantity_kg') or it.get('order_quantity') or 0
                price = it.get('price_per_kg') or it.get('price') or None
                image = it.get('image_path') or it.get('image_url') or None

                # Determine farmer id to store in user_id column: prefer parsed_user_id (explicit farmer),
                # otherwise resolve from crops.seller_id.
                insert_user_id = None
                if parsed_user_id is not None:
                    insert_user_id = parsed_user_id
                try:
                    if crop_id is not None and insert_user_id is None:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT seller_id, category FROM crops WHERE id=? LIMIT 1', (int(crop_id),))
                        rr = cur2.fetchone()
                        try: cur2.close()
                        except Exception: pass
                        if rr and len(rr) > 0:
                            seller_from_crop = rr[0] if len(rr) > 0 else None
                            crop_category_from_db = rr[1] if len(rr) > 1 else None
                            if seller_from_crop is not None:
                                insert_user_id = seller_from_crop
                            if (it.get('category') is None or str(it.get('category')).strip() == '') and crop_category_from_db:
                                category = crop_category_from_db
                except Exception:
                    pass

                # Determine buyer id to store in buyer_id column (if available)
                insert_buyer_id = parsed_buyer_id if parsed_buyer_id is not None else None

                # Prevent duplicate cart rows for same crop + owner: check by farmer (user_id), buyer_id, or phone
                try:
                    cur_check = conn.cursor()
                    sql_check = f"SELECT id FROM {table_name} WHERE crop_id=? AND user_type=? AND ((user_id IS NOT NULL AND user_id=?) OR (buyer_id IS NOT NULL AND buyer_id=?) OR (user_phone IS NOT NULL AND user_phone=?)) LIMIT 1"
                    params_check = (int(crop_id) if crop_id is not None else None, user_type, insert_user_id if insert_user_id is not None else None, insert_buyer_id if insert_buyer_id is not None else None, user_phone if user_phone is not None else None)
                    cur_check.execute(sql_check, params_check)
                    existing_row = cur_check.fetchone()
                    try: cur_check.close()
                    except Exception: pass
                    if existing_row:
                        inserted_id = existing_row[0] if isinstance(existing_row, (list, tuple)) else existing_row
                        inserted.append({'id': inserted_id, 'crop_id': crop_id, 'crop_name': crop_name, 'note': 'duplicate_skipped'})
                        continue
                except Exception:
                    try: cur_check.close()
                    except Exception: pass

                # Read category from payload if present; fallback to None. Compute per-item totals (store item-level total_price and total_quantity)
                category = it.get('category') or it.get('Category') or None
                
                # Fetch delivery_date from deals table based on crop_id or crop_name
                delivery_date = None
                try:
                    if crop_id is not None:
                        cur_deals = conn.cursor()
                        # Primary: try to fetch by crop_id
                        cur_deals.execute('SELECT delivery_date FROM deals WHERE crop_id=? AND delivery_date IS NOT NULL ORDER BY created_at DESC LIMIT 1', (int(crop_id),))
                        deals_row = cur_deals.fetchone()
                        
                        # Fallback: if crop_id didn't work, try by crop_name
                        if not deals_row and crop_name:
                            cur_deals.execute('SELECT delivery_date FROM deals WHERE crop_name=? AND delivery_date IS NOT NULL ORDER BY created_at DESC LIMIT 1', (crop_name,))
                            deals_row = cur_deals.fetchone()
                        
                        try: cur_deals.close()
                        except Exception: pass
                        
                        if deals_row and deals_row[0] is not None:
                            delivery_date = deals_row[0]
                            print(f'delivery_date fetched for crop_id {crop_id}: {delivery_date}')
                        else:
                            print(f'No delivery_date found in deals for crop_id {crop_id} or crop_name {crop_name}')
                except Exception as e:
                    print(f'Error fetching delivery_date from deals: {e}')
                    import traceback
                    traceback.print_exc()
                    pass
                
                try:
                    qty_val = float(qty) if qty is not None else 0.0
                except Exception:
                    qty_val = 0.0
                try:
                    price_val = float(price) if price is not None else 0.0
                except Exception:
                    price_val = 0.0
                item_total_price = round(qty_val * price_val, 2)
                cur.execute(f'INSERT INTO {table_name} (user_type, user_id, buyer_id, user_phone, crop_id, crop_name, variety, quantity_kg, price_per_kg, image_path, category, total_quantity, total_price, delivery_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (
                    user_type,
                    insert_user_id if insert_user_id is not None else None,
                    insert_buyer_id if insert_buyer_id is not None else None,
                    user_phone if user_phone else None,
                    int(crop_id) if crop_id is not None else None,
                    crop_name if crop_name else None,
                    variety,
                    qty_val,
                    price_val if price is not None else None,
                    image,
                    category,
                    qty_val,
                    item_total_price,
                    delivery_date

                ))
                inserted_id = cur.lastrowid
                inserted.append({'id': inserted_id, 'crop_id': crop_id, 'crop_name': crop_name})
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'inserted': inserted}), 200
        except Exception as e:
            print('cart_add sqlite error:', e)
            try:
                import traceback
                traceback.print_exc()
            except Exception:
                pass
            return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/cart/list', methods=['GET'])
def cart_list():
    """List cart items for a specific user. Query params: user_type, user_id, user_phone"""
    ensure_cart_table()
    user_type = (request.args.get('user_type') or '').strip()
    user_id = request.args.get('user_id')
    user_phone = request.args.get('user_phone')
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    table_name = 'cart' if (user_type and str(user_type).lower() == 'farmer') else 'cart_b'
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
            cur = conn.cursor(dictionary=True) if hasattr(mysql, 'connect') else conn.cursor()
            where = []
            params = []
            if user_type:
                where.append('user_type=%s'); params.append(user_type)
            if user_id:
                where.append('user_id=%s'); params.append(user_id)
            if user_phone:
                where.append('user_phone=%s'); params.append(user_phone)
            sql = f'SELECT id, user_type, user_id, buyer_id, user_phone, crop_id, crop_name, variety, quantity_kg, price_per_kg, image_path, category, total_quantity, total_price, delivery_date, added_at FROM {table_name}'
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += ' ORDER BY id DESC'
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            for r in rows:
                if isinstance(r, dict):
                    results.append(r)
                else:
                    results.append({
                        'id': r[0], 'user_type': r[1], 'user_id': r[2], 'buyer_id': r[3], 'user_phone': r[4], 'crop_id': r[5], 'crop_name': r[6], 'variety': r[7], 'quantity_kg': r[8], 'price_per_kg': r[9], 'image_path': r[10], 'category': r[11], 'total_quantity': r[12], 'total_price': r[13], 'delivery_date': r[14], 'added_at': r[15]
                    })
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'cart': results}), 200
        except Exception as e:
            print('cart_list mysql error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500
    else:
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            where = []
            params = []
            if user_type:
                where.append('user_type=?'); params.append(user_type)
            if user_id:
                where.append('user_id=?'); params.append(user_id)
            if user_phone:
                where.append('user_phone=?'); params.append(user_phone)
            sql = f'SELECT id, user_type, user_id, buyer_id, user_phone, crop_id, crop_name, variety, quantity_kg, price_per_kg, image_path, category, total_quantity, total_price, delivery_date, added_at FROM {table_name}'
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += ' ORDER BY id DESC'
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            for r in rows:
                results.append({
                    'id': r[0], 'user_type': r[1], 'user_id': r[2], 'buyer_id': r[3], 'user_phone': r[4], 'crop_id': r[5], 'crop_name': r[6], 'variety': r[7], 'quantity_kg': r[8], 'price_per_kg': r[9], 'image_path': r[10], 'category': r[11], 'total_quantity': r[12], 'total_price': r[13], 'delivery_date': r[14], 'added_at': r[15]
                })
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'cart': results}), 200
        except Exception as e:
            print('cart_list sqlite error:', e)
            return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/cart/remove', methods=['POST'])
def cart_remove():
    """Remove cart rows for the current user. JSON: { ids: [..], user_type, user_id, user_phone }"""
    ensure_cart_table()
    data = request.get_json(silent=True) or {}
    ids = data.get('ids') or []
    if not isinstance(ids, list) or not ids:
        return jsonify({'ok': False, 'error': 'ids_required'}), 400
    user_type = (data.get('user_type') or '').strip()
    user_id = data.get('user_id')
    user_phone = data.get('user_phone')
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    table_name = 'cart' if (user_type and str(user_type).lower() == 'farmer') else 'cart_b'
    try:
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            in_clause = ','.join(['%s'] * len(ids))
            where_owner = []
            params = list(ids)
            if user_type:
                where_owner.append('user_type=%s'); params.append(user_type)
            if user_id:
                where_owner.append('user_id=%s'); params.append(user_id)
            if user_phone:
                where_owner.append('user_phone=%s'); params.append(user_phone)
            if where_owner:
                sql = f'DELETE FROM {table_name} WHERE id IN ({in_clause}) AND ' + ' AND '.join(where_owner)
                cur.execute(sql, tuple(params))
            else:
                return jsonify({'ok': False, 'error': 'owner_required'}), 400
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            in_clause = ','.join(['?'] * len(ids))
            where_owner = []
            params = list(ids)
            if user_type:
                where_owner.append('user_type=?'); params.append(user_type)
            if user_id:
                where_owner.append('user_id=?'); params.append(user_id)
            if user_phone:
                where_owner.append('user_phone=?'); params.append(user_phone)
                if where_owner:
                    sql = 'DELETE FROM ' + table_name + ' WHERE id IN (' + in_clause + ') AND ' + ' AND '.join(where_owner)
                    cur.execute(sql, tuple(params))
            else:
                return jsonify({'ok': False, 'error': 'owner_required'}), 400
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('cart_remove error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/cart/clear', methods=['POST'])
def cart_clear():
    """Clear all cart rows for the given user. JSON: { user_type, user_id, user_phone }"""
    ensure_cart_table()
    data = request.get_json(silent=True) or {}
    user_type = (data.get('user_type') or '').strip()
    user_id = data.get('user_id')
    user_phone = data.get('user_phone')
    if not (user_type and (user_id or user_phone)):
        return jsonify({'ok': False, 'error': 'owner_required'}), 400
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    table_name = 'cart' if (user_type and str(user_type).lower() == 'farmer') else 'cart_b'
    try:
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            params = [user_type]
            sql = f'DELETE FROM {table_name} WHERE user_type=%s'
            if user_id:
                sql += ' AND user_id=%s'; params.append(user_id)
            elif user_phone:
                sql += ' AND user_phone=%s'; params.append(user_phone)
            cur.execute(sql, tuple(params))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            params = [user_type]
            sql = 'DELETE FROM ' + table_name + ' WHERE user_type=?'
            if user_id:
                sql += ' AND user_id=?'; params.append(user_id)
            elif user_phone:
                sql += ' AND user_phone=?'; params.append(user_phone)
            cur.execute(sql, tuple(params))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('cart_clear error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/cart/update', methods=['POST'])
def cart_update():
    """Update quantity for a cart row. JSON: { id, quantity_kg, user_type, user_id, user_phone }"""
    ensure_cart_table()
    data = request.get_json(silent=True) or {}
    row_id = data.get('id')
    qty = data.get('quantity_kg')
    if row_id is None or qty is None:
        return jsonify({'ok': False, 'error': 'id_and_quantity_required'}), 400
    user_type = (data.get('user_type') or '').strip()
    user_id = data.get('user_id')
    user_phone = data.get('user_phone')
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    table_name = 'cart' if (user_type and str(user_type).lower() == 'farmer') else 'cart_b'
    try:
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # Read existing row values so updates may be partial (qty and/or price)
            cur_get = conn.cursor()
            try:
                cur_get.execute(f'SELECT quantity_kg, price_per_kg FROM {table_name} WHERE id=%s LIMIT 1', (row_id,))
                rowp = cur_get.fetchone()
                existing_qty = 0.0
                existing_price = 0.0
                if rowp:
                    try:
                        existing_qty = float(rowp[0]) if rowp[0] is not None else 0.0
                    except Exception:
                        existing_qty = 0.0
                    try:
                        existing_price = float(rowp[1]) if rowp[1] is not None else 0.0
                    except Exception:
                        existing_price = 0.0
            except Exception:
                existing_qty = 0.0; existing_price = 0.0
            try: cur_get.close()
            except Exception: pass

            # Use provided values when present, otherwise fall back to existing row values
            try:
                qty_val = float(qty) if qty is not None else existing_qty
            except Exception:
                qty_val = existing_qty
            pval = data.get('price_per_kg')
            try:
                price_val = float(pval) if pval is not None else existing_price
            except Exception:
                price_val = existing_price

            new_total_price = round(qty_val * (price_val or 0.0), 2)

            params = [qty_val, price_val, new_total_price, row_id]
            sql = f'UPDATE {table_name} SET quantity_kg=%s, price_per_kg=%s, total_price=%s WHERE id=%s'
            if user_type:
                sql += ' AND user_type=%s'; params.append(user_type)
            if user_id:
                sql += ' AND user_id=%s'; params.append(user_id)
            if user_phone:
                sql += ' AND user_phone=%s'; params.append(user_phone)
            cur.execute(sql, tuple(params))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            # Read existing row values so updates may be partial
            try:
                cur_get = conn.cursor()
                cur_get.execute('SELECT quantity_kg, price_per_kg FROM ' + table_name + ' WHERE id=? LIMIT 1', (row_id,))
                rowp = cur_get.fetchone()
                existing_qty = 0.0
                existing_price = 0.0
                if rowp:
                    try:
                        existing_qty = float(rowp[0]) if rowp[0] is not None else 0.0
                    except Exception:
                        existing_qty = 0.0
                    try:
                        existing_price = float(rowp[1]) if rowp[1] is not None else 0.0
                    except Exception:
                        existing_price = 0.0
                try: cur_get.close()
                except Exception: pass
            except Exception:
                existing_qty = 0.0; existing_price = 0.0

            try:
                qty_val = float(qty) if qty is not None else existing_qty
            except Exception:
                qty_val = existing_qty
            pval = data.get('price_per_kg')
            try:
                price_val = float(pval) if pval is not None else existing_price
            except Exception:
                price_val = existing_price

            new_total_price = round(qty_val * (price_val or 0.0), 2)

            params = [qty_val, price_val, new_total_price, row_id]
            sql = 'UPDATE ' + table_name + ' SET quantity_kg=?, price_per_kg=?, total_price=? WHERE id=?'
            if user_type:
                sql += ' AND user_type=?'; params.append(user_type)
            if user_id:
                sql += ' AND user_id=?'; params.append(user_id)
            if user_phone:
                sql += ' AND user_phone=?'; params.append(user_phone)
            cur.execute(sql, tuple(params))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
        return jsonify({'ok': True}), 200
    except Exception as e:
        print('cart_update error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


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
    # optional fields from form: category and variety
    category = (data.get('category') or data.get('Category') or '').strip()
    variety = (data.get('variety') or data.get('Variety') or '').strip()
    # optional fields: category and variety may be provided by the client
    category = (data.get('category') or data.get('Category') or '').strip()
    variety = (data.get('variety') or data.get('Variety') or '').strip()
    # optional fields
    category = (data.get('category') or '').strip()
    variety = (data.get('variety') or '').strip()
    category = (data.get('category') or '').strip()
    variety = (data.get('variety') or '').strip()
    category = (data.get('category') or '').strip()
    variety = (data.get('variety') or '').strip()
    category = (data.get('category') or '').strip()
    variety = (data.get('variety') or '').strip()
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
            add_if_exists('variety', variety if variety else None)
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
                    _lang = (data.get('lang') if isinstance(data, dict) else None) or request.values.get('lang') or 'en'
                    threading.Thread(target=send_crop_uploaded_email, args=(seller_email, seller_name, crop_name, variety, quantity_kg, price_per_kg, _lang)).start()
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
                variety TEXT DEFAULT NULL,
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

        # Prepare image data for SQLite insert
        # First check if image_path was set from file upload (above)
        # Otherwise check for base64 image in JSON
        final_image_path = image_path_val  # This was set from file upload above if present
        final_image_blob = None
        final_image_mime = None
        
        # If no file upload, check for base64 image
        if not final_image_path:
            img_b64 = data.get('image_base64') if isinstance(data, dict) else None
            if img_b64:
                try:
                    if isinstance(img_b64, str) and img_b64.startswith('data:'):
                        final_image_mime = img_b64.split(';',1)[0].split(':',1)[1]
                        img_b64 = img_b64.split(',',1)[1]
                    import base64
                    final_image_blob = base64.b64decode(img_b64)
                except Exception:
                    final_image_blob = None

        if seller_id_val:
            if final_image_path:
                sqlite_cur.execute('INSERT INTO crops (seller_id, seller_name, seller_phone, region, state, crop_name, variety, category, quantity_kg, price_per_kg, image_path, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                                   (seller_id_val, seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, variety if variety else None, category if category else None, quantity_kg, price_per_kg, final_image_path, expiry_date_val))
            elif final_image_blob:
                sqlite_cur.execute('INSERT INTO crops (seller_id, seller_name, seller_phone, region, state, crop_name, variety, category, quantity_kg, price_per_kg, image_blob, image_mime, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                                   (seller_id_val, seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, variety if variety else None, category if category else None, quantity_kg, price_per_kg, final_image_blob, final_image_mime, expiry_date_val))
            else:
                sqlite_cur.execute('INSERT INTO crops (seller_id, seller_name, seller_phone, region, state, crop_name, variety, category, quantity_kg, price_per_kg, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                                   (seller_id_val, seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, variety if variety else None, category if category else None, quantity_kg, price_per_kg, expiry_date_val))
        else:
            if final_image_path:
                sqlite_cur.execute('INSERT INTO crops (seller_name, seller_phone, region, state, crop_name, variety, category, quantity_kg, price_per_kg, image_path, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                                   (seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, variety if variety else None, category if category else None, quantity_kg, price_per_kg, final_image_path, expiry_date_val))
            elif final_image_blob is not None:
                sqlite_cur.execute('INSERT INTO crops (seller_name, seller_phone, region, state, crop_name, variety, category, quantity_kg, price_per_kg, image_blob, image_mime, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                                   (seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, variety if variety else None, category if category else None, quantity_kg, price_per_kg, final_image_blob, final_image_mime, expiry_date_val))
            else:
                sqlite_cur.execute('INSERT INTO crops (seller_name, seller_phone, region, state, crop_name, variety, category, quantity_kg, price_per_kg, expiry_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
                                   (seller_name, seller_phone if seller_phone else None, region if region else None, state if state else None, crop_name, variety if variety else None, category if category else None, quantity_kg, price_per_kg, expiry_date_val))
        sqlite_conn.commit()
        # send crop-uploaded email asynchronously if provided
        try:
            if seller_email:
                _lang = (data.get('lang') if isinstance(data, dict) else None) or (request.values.get('lang') if request.values else None) or 'en'
                threading.Thread(target=send_crop_uploaded_email, args=(seller_email, seller_name, crop_name, variety, quantity_kg, price_per_kg, _lang)).start()
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

    # Debug: log incoming keys to help verify which fields the client sent
    try:
        print('add_deal: received data keys ->', list(data.keys()) if isinstance(data, dict) else 'no-data')
        try:
            # If multipart/form-data, request.form keys may also contain values
            print('add_deal: request.form keys ->', list(request.form.keys()))
        except Exception:
            pass
    except Exception:
        pass

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

    # Parse delivery_date (optional)
    delivery_date_val = None
    try:
        dd_raw = (data.get('delivery_date') or '').strip()
        if dd_raw:
            # Accept YYYY-MM-DD; pass-through to MySQL DATE
            delivery_date_val = dd_raw
    except Exception:
        delivery_date_val = None

    # Parse crop_id (optional) - links deal to specific crop for quantity tracking
    crop_id_val = None
    try:
        crop_id_raw = data.get('crop_id')
        if crop_id_raw is not None and str(crop_id_raw).strip() != '':
            crop_id_val = int(crop_id_raw)
    except Exception:
        crop_id_val = None

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
        # Dynamically detect which columns exist in the deals table and insert only those
        try:
            cols = None
            try:
                cur.execute("SHOW COLUMNS FROM deals")
                cols = [r[0] for r in cur.fetchall()]
            except Exception:
                # fallback: try information_schema
                try:
                    dbname = cfg.get('database')
                    cur.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s", (dbname, 'deals'))
                    cols = [r[0] for r in cur.fetchall()]
                except Exception:
                    cols = None

            # prepare values map
            def _none(v):
                return v if (v is not None and v != '') else None

            buyer_id_val = None
            try:
                buyer_id_val = int(buyer_id) if buyer_id is not None and str(buyer_id).strip() != '' else None
            except Exception:
                buyer_id_val = None

            # ensure we read optional category/variety from submitted data
            category = (data.get('category') or data.get('Category') or '').strip()
            variety = (data.get('variety') or data.get('Variety') or '').strip()

            values_map = {
                'crop_id': crop_id_val,
                'buyer_id': buyer_id_val,
                'buyer_name': buyer_name,
                'buyer_phone': _none(buyer_phone),
                'region': _none(region),
                'state': _none(state),
                'category': _none(category),
                'crop_name': crop_name,
                'variety': _none(variety),
                'quantity_kg': quantity_kg,
                'image_path': _none(image_path_val),
                'delivery_date': _none(delivery_date_val),
            }

            desired_order = ['crop_id','buyer_id','buyer_name','buyer_phone','region','state','category','crop_name','variety','quantity_kg','image_path','delivery_date']
            if cols and isinstance(cols, (list,tuple)):
                insert_cols = [c for c in desired_order if c in cols]
            else:
                # best-effort: use the desired order
                insert_cols = desired_order

            placeholders = ','.join(['%s'] * len(insert_cols))
            insert_sql = f"INSERT INTO deals ({','.join(insert_cols)}) VALUES ({placeholders})"
            params = [values_map.get(c) for c in insert_cols]
            cur.execute(insert_sql, tuple(params))
        except Exception as e:
            # If dynamic insert fails, re-raise to be handled by outer except
            raise
        conn.commit()
        # After successful insert, send buyer deal-uploaded notification email if an email was provided
        try:
            if buyer_email:
                # Determine language from submitted data (supports 'lang' or 'language')
                language_raw = (data.get('lang') or data.get('language') or '').strip().lower()
                if language_raw in ('hi', 'hindi'):
                    lang_code = 'hi'
                elif language_raw in ('kn', 'kannada'):
                    lang_code = 'kn'
                else:
                    lang_code = 'en'
                # Schedule localized email including variety, quantity and delivery date
                threading.Thread(
                    target=send_buyer_deal_uploaded_email,
                    args=(buyer_email, buyer_name, crop_name, variety, quantity_kg, delivery_date_val, lang_code),
                    daemon=True
                ).start()
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
    category_q = (request.args.get('category') or '').strip()
    variety_q = (request.args.get('variety') or '').strip()
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
            if category_q:
                where.append('category=%s'); params.append(category_q)
            if variety_q:
                where.append('variety=%s'); params.append(variety_q)

            if buyer_id_q:
                try:
                    where.append('buyer_id=%s'); params.append(int(buyer_id_q))
                except Exception:
                    pass
            elif buyer_phone_q:
                where.append('buyer_phone=%s'); params.append(buyer_phone_q)

            # include crop_id, category and variety columns when present in deals table
            # SELECT includes crop_id at index 1 now
            sql = 'SELECT id,crop_id,buyer_id,buyer_name,buyer_phone,region,state,category,crop_name,variety,quantity_kg,image_path,delivery_date,created_at FROM deals'
            if where:
                sql += ' WHERE ' + ' AND '.join(where)
            sql += ' ORDER BY created_at DESC LIMIT 200'
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            result = []
            for r in rows:
                deal_id = r[0]
                crop_id = r[1]
                current_quantity_kg = r[10]  # quantity_kg from deal
                
                # Try to get current available quantity from crops table if crop_id is present
                try:
                    if crop_id:
                        cur2 = conn.cursor()
                        cur2.execute('SELECT quantity_kg FROM crops WHERE id=%s LIMIT 1', (crop_id,))
                        crop_row = cur2.fetchone()
                        if crop_row and crop_row[0] is not None:
                            current_quantity_kg = float(crop_row[0])
                        try: cur2.close()
                        except Exception: pass
                except Exception:
                    pass  # fallback to deal quantity
                
                image_url = None
                try:
                    # image_path is now at index 11
                    if r[11]:
                        image_url = request.host_url.rstrip('/') + '/images/' + str(r[11])
                except Exception:
                    image_url = None
                # attempt to resolve buyer address from buyer table if buyer_id present
                buyer_address = None
                try:
                    if r[2]:
                        try:
                            cur2 = conn.cursor()
                            cur2.execute('SELECT address FROM buyer WHERE id=%s LIMIT 1', (r[2],))
                            rr = cur2.fetchone()
                            buyer_address = rr[0] if rr else None
                            try: cur2.close()
                            except Exception: pass
                        except Exception:
                            buyer_address = None
                except Exception:
                    buyer_address = None
                result.append({
                    'id': r[0], 'crop_id': crop_id, 'buyer_id': r[2], 'buyer_name': r[3], 'buyer_phone': r[4],
                    'region': r[5], 'state': r[6], 'category': r[7], 'crop_name': r[8], 'variety': r[9], 'quantity_kg': current_quantity_kg,
                    'image_url': image_url, 'delivery_date': str(r[12]) if r[12] is not None else None, 'created_at': str(r[13]), 'address': buyer_address
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

        sql = 'SELECT id,crop_id,buyer_id,buyer_name,buyer_phone,region,state,category,crop_name,variety,quantity_kg,image_path,delivery_date,created_at FROM deals'
        where = []
        params = []
        if region:
            where.append('region=?'); params.append(region)
        if state:
            where.append('state=?'); params.append(state)
        if crop_name:
            where.append('crop_name LIKE ?'); params.append('%' + crop_name + '%')
        if category_q:
            where.append('category=?'); params.append(category_q)
        if variety_q:
            where.append('variety=?'); params.append(variety_q)
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
            deal_id = r[0]
            crop_id = r[1]
            current_quantity_kg = r[10]  # quantity_kg from deal
            
            # Try to get current available quantity from crops table if crop_id is present
            try:
                if crop_id:
                    cur2 = sqlite_conn.cursor()
                    cur2.execute('SELECT quantity_kg FROM crops WHERE id=? LIMIT 1', (crop_id,))
                    crop_row = cur2.fetchone()
                    if crop_row and crop_row[0] is not None:
                        current_quantity_kg = float(crop_row[0])
                    try: cur2.close()
                    except Exception: pass
            except Exception:
                pass  # fallback to deal quantity
            
            image_url = None
            try:
                # image_path at index 11
                if r[11]:
                    image_url = request.host_url.rstrip('/') + '/images/' + str(r[11])
            except Exception:
                image_url = None
            # resolve buyer address from buyer table when possible
            buyer_address = None
            try:
                if r[2] is not None:
                    cur2 = sqlite_conn.cursor()
                    cur2.execute('SELECT address FROM buyer WHERE id=? LIMIT 1', (r[2],))
                    rr = cur2.fetchone()
                    buyer_address = rr[0] if rr else None
                    try: cur2.close()
                    except Exception: pass
            except Exception:
                buyer_address = None
            result.append({
                'id': r[0], 'crop_id': crop_id, 'buyer_id': r[2], 'buyer_name': r[3], 'buyer_phone': r[4],
                'region': r[5], 'state': r[6], 'category': r[7], 'crop_name': r[8], 'variety': r[9], 'quantity_kg': current_quantity_kg,
                'image_url': image_url, 'delivery_date': str(r[12]) if r[12] is not None else None, 'created_at': str(r[13]), 'address': buyer_address
            })
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

@app.route('/buyer-orders', methods=['POST'])
def add_buyer_order():
    """Accept new buyer orders and insert into the MySQL buyer_orders table."""
    if os.environ.get('DB_USE', 'mysql').lower() != 'mysql' or mysql is None:
        return jsonify({'ok': False, 'error': 'mysql_required'}), 500

    # Ensure table exists (idempotent)
    try:
        cfg = {
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': int(os.environ.get('DB_PORT', '3306')),
            'user': os.environ.get('DB_USER', 'root'),
            'password': os.environ.get('DB_PASSWORD', ''),
            'database': os.environ.get('DB_NAME', 'agri_ai'),
        }
        _conn = mysql.connect(**cfg)
        _cur = _conn.cursor()
        _cur.execute(
            """
            CREATE TABLE IF NOT EXISTS buyer_orders (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                invoice_id VARCHAR(64) NOT NULL,
                farmer_id BIGINT NOT NULL,
                buyer_id BIGINT NULL,
                crop_name VARCHAR(255) NOT NULL,
                quantity_kg DECIMAL(12,3) NOT NULL,
                price_per_kg DECIMAL(12,2) NOT NULL,
                total DECIMAL(12,2) NOT NULL,
                payment_method VARCHAR(16) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_invoice_id (invoice_id),
                INDEX idx_farmer_id (farmer_id),
                INDEX idx_buyer_id (buyer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )
        _conn.commit()
        try:
            _cur.close()
        except Exception:
            pass
        try:
            _conn.close()
        except Exception:
            pass
    except Exception as e:
        # If table creation fails, continue to attempt insert; error will be surfaced then
        try:
            print('ensure buyer_orders table error:', e)
        except Exception:
            pass

    data = request.get_json(silent=True) or {}
    orders = data.get('orders')
    if not orders or not isinstance(orders, list):
        return jsonify({'ok': False, 'error': 'orders_required'}), 400

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
        insert_sql = (
            "INSERT INTO buyer_orders (invoice_id, farmer_id, buyer_id, crop_name, quantity_kg, price_per_kg, total, payment_method) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        # derive farmer_id if missing using crop_id -> crops.seller_id
        for od in orders:
            farmer_id = od.get('farmer_id')
            if farmer_id is None:
                crop_id = od.get('crop_id')
                if crop_id is not None:
                    try:
                        cur.execute('SELECT seller_id FROM crops WHERE id=%s LIMIT 1', (crop_id,))
                        row = cur.fetchone()
                        if row:
                            farmer_id = row[0]
                    except Exception:
                        farmer_id = None
            if farmer_id is None:
                try:
                    cur.close()
                except Exception:
                    pass
                try:
                    conn.close()
                except Exception:
                    pass
                return jsonify({'ok': False, 'error': 'farmer_id_required'}), 400
            cur.execute(insert_sql, (
                od.get('invoice_id'),
                farmer_id,
                od.get('buyer_id'),
                od.get('crop_name'),
                od.get('quantity_kg'),
                od.get('price_per_kg'),
                od.get('total'),
                od.get('payment_method'),
            ))
        conn.commit()
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass
        return jsonify({'ok': True, 'inserted': len(orders)}), 200
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/deals/<int:deal_id>', methods=['PATCH'])
def update_deal(deal_id):
    """Update fields of a deal. Allowed updates: quantity_kg, delivery_date (only to a later date).
    Accepts buyer_id/buyer_phone in JSON body or query params for ownership verification.
    """
    data = request.get_json(silent=True) or {}
    # allow passing quantity via JSON body or querystring
    new_qty = data.get('quantity_kg') if 'quantity_kg' in data else request.args.get('quantity_kg')
    # allow passing delivery_date (YYYY-MM-DD)
    new_delivery_date = (data.get('delivery_date') or request.args.get('delivery_date') or '').strip()
    buyer_id_body = data.get('buyer_id') or request.args.get('buyer_id') or None
    buyer_phone_body = (data.get('buyer_phone') or request.args.get('buyer_phone') or '').strip()

    # validate presence of at least one field
    if new_qty is None and not new_delivery_date:
        return jsonify({'ok': False, 'error': 'no_fields'}), 400

    # validate quantity if provided
    new_qty_val = None
    if new_qty is not None:
        try:
            new_qty_val = float(new_qty)
        except Exception:
            return jsonify({'ok': False, 'error': 'invalid_quantity'}), 400

    # validate delivery_date format if provided
    new_dd_val = None
    if new_delivery_date:
        try:
            # basic validation: YYYY-MM-DD
            datetime.datetime.strptime(new_delivery_date, '%Y-%m-%d')
            new_dd_val = new_delivery_date
        except Exception:
            return jsonify({'ok': False, 'error': 'invalid_delivery_date'}), 400

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
            # fetch existing owner and current delivery_date
            cur.execute('SELECT buyer_id,buyer_phone,delivery_date FROM deals WHERE id=%s', (deal_id,))
            row = cur.fetchone()
            if not row:
                try: cur.close()
                except Exception: pass
                try: conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'not_found'}), 404
            existing_buyer_id = row[0]
            existing_buyer_phone = (row[1] if len(row) > 1 else None)
            existing_delivery_date = row[2] if len(row) > 2 else None

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

            # if delivery_date is requested, ensure it is not in the past relative to today
            if new_dd_val is not None:
                try:
                    today = datetime.date.today()
                    new_dt = datetime.datetime.strptime(new_dd_val, '%Y-%m-%d').date()
                    if new_dt < today:
                        try: cur.close()
                        except Exception: pass
                        try: conn.close()
                        except Exception: pass
                        return jsonify({'ok': False, 'error': 'delivery_date_past_disallowed'}), 400
                except Exception:
                    pass

            # build dynamic update
            sets = []
            params = []
            if new_qty_val is not None:
                sets.append('quantity_kg=%s'); params.append(new_qty_val)
            if new_dd_val is not None:
                sets.append('delivery_date=%s'); params.append(new_dd_val)
            if not sets:
                try: cur.close()
                except Exception: pass
                try: conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'no_fields'}), 400
            params.append(deal_id)
            sql = 'UPDATE deals SET ' + ','.join(sets) + ' WHERE id=%s'
            cur.execute(sql, tuple(params))
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
        sqlite_cur.execute('SELECT buyer_id,buyer_phone,delivery_date FROM deals WHERE id=?', (deal_id,))
        row = sqlite_cur.fetchone()
        if not row:
            try: sqlite_cur.close()
            except Exception: pass
            try: sqlite_conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'not_found'}), 404
        existing_buyer_id, existing_buyer_phone = row[0], (row[1] if len(row) > 1 else None)
        existing_delivery_date = row[2] if len(row) > 2 else None

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

        # delivery_date not in past relative to today
        if new_dd_val is not None:
            try:
                today = datetime.date.today()
                new_dt = datetime.datetime.strptime(new_dd_val, '%Y-%m-%d').date()
                if new_dt < today:
                    try: sqlite_cur.close()
                    except Exception: pass
                    try: sqlite_conn.close()
                    except Exception: pass
                    return jsonify({'ok': False, 'error': 'delivery_date_past_disallowed'}), 400
            except Exception:
                pass

        sets = []
        params = []
        if new_qty_val is not None:
            sets.append('quantity_kg=?'); params.append(new_qty_val)
        if new_dd_val is not None:
            sets.append('delivery_date=?'); params.append(new_dd_val)
        if not sets:
            try: sqlite_cur.close()
            except Exception: pass
            try: sqlite_conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'no_fields'}), 400
        params.append(deal_id)
        sql = 'UPDATE deals SET ' + ','.join(sets) + ' WHERE id=?'
        sqlite_cur.execute(sql, tuple(params))
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
            select_cols = ['id','seller_id','seller_name','seller_phone','region','state','crop_name','variety','category','quantity_kg','price_per_kg','created_at']
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
                    'crop_name': rowmap.get('crop_name'), 'variety': rowmap.get('variety'), 'category': rowmap.get('category'), 'quantity_kg': float(rowmap.get('quantity_kg')) if rowmap.get('quantity_kg') is not None else None, 'price_per_kg': float(rowmap.get('price_per_kg')) if rowmap.get('price_per_kg') is not None else None,
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

                base_select = 'id,seller_id,seller_name,seller_phone,region,state,crop_name,variety,category,quantity_kg,price_per_kg'
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
            rowmap['variety'] = r[idx]; idx += 1
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

            result.append({'id': rowmap.get('id'), 'seller_id': rowmap.get('seller_id'), 'seller_name': rowmap.get('seller_name'), 'seller_phone': rowmap.get('seller_phone'), 'region': rowmap.get('region'), 'state': rowmap.get('state'), 'created_day': created_day, 'created_month': created_month, 'created_year': created_year, 'crop_name': rowmap.get('crop_name'), 'variety': rowmap.get('variety'), 'category': rowmap.get('category') if 'category' in rowmap else None, 'quantity_kg': float(rowmap.get('quantity_kg')) if rowmap.get('quantity_kg') is not None else None, 'price_per_kg': float(rowmap.get('price_per_kg')) if rowmap.get('price_per_kg') is not None else None, 'image_url': image_url, 'expiry_date': rowmap.get('expiry_date') if 'expiry_date' in rowmap else None, 'is_expired': is_expired, 'created_at': str(created_at), 'seller_email': seller_email, 'seller_address': seller_address, 'seller_region': seller_region, 'seller_state': seller_state})
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


# ---- Load Groq API key ----
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_groq_api_key_here")
# ---- Groq AI Chat Route ----
@app.route('/ai/groq', methods=['POST'])
def agri_ai_chat():
    try:
        data = request.get_json(silent=True) or {}
        query = (data.get('q') or '').strip()

        if not query:
            return jsonify({"error": "Empty query"}), 400

        # Read optional language and mode flags (short/detailed/stepwise)
        lang = (data.get('lang') or 'en').strip().lower()
        mode = (data.get('mode') or 'short').strip().lower()

        # Build a system instruction that requires the assistant to reply in the requested language
        base_instr = (
            "You are AgriAI, an intelligent Indian farming assistant that provides clear, helpful answers to farmers' questions. "
            "Be practical and use simple, locally understandable language suitable for Indian farmers."
        )
        lang_instr = ''
        if lang in ('hi', 'hindi'):
            lang_instr = (
                "Answer the user only in Hindi (Devanagari). Use polite, simple and locally understandable phrasing. "
                "If the user requests step-by-step guidance, present numbered steps. If they request a detailed answer, provide a thorough explanation in Hindi."
            )
        elif lang in ('kn', 'kannada'):
            lang_instr = (
                "Answer the user only in Kannada. Use polite, simple and locally understandable phrasing. "
                "If the user requests step-by-step guidance, present numbered steps. If they request a detailed answer, provide a thorough explanation in Kannada."
            )
        else:
            lang_instr = (
                "Answer the user only in simple English tailored to Indian farmers. "
                "If the user requests step-by-step guidance, present numbered steps. If they request a detailed answer, provide a thorough explanation in English."
            )

        # Instruct the model to produce only the answer text and not to include meta commentary
        mode_instr = ''
        post_req = (
            "Respond ONLY with the direct answer text. Do NOT include meta commentary, explanations about language, or any headers like 'Answer:'; do not include code fences or JSON wrappers. "
            "If numeric lists are requested, use simple numbered lines (1., 2., 3.). Keep formatting plain text."
        )
        if mode == 'stepwise':
            mode_instr = "When appropriate, present the answer as numbered steps."
        elif mode == 'detailed':
            mode_instr = "Provide a detailed, thorough answer; include steps, examples and practical tips where relevant."
        else:
            mode_instr = "Prefer short, direct answers unless the user explicitly requests more detail or stepwise instructions."

        system_instr = base_instr + ' ' + lang_instr + ' ' + mode_instr + ' ' + post_req

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_instr},
                    {"role": "user", "content": query}
                ]
            },
            timeout=20
        )

        if response.status_code != 200:
            print("⚠️ [AgriAI] Groq API returned error:", response.status_code)
            return jsonify({"error": "Groq API error"}), 500

        groq_reply = response.json()
        answer = groq_reply["choices"][0]["message"]["content"]
        # Ensure result is a string
        if not isinstance(answer, str):
            try:
                answer = str(answer)
            except Exception:
                answer = json.dumps(answer, ensure_ascii=False)

        # ✅ Clean, branded log output
        print(f"🌾 [AgriAI] Q: {query} → Reply sent successfully.")

        return jsonify({
            "reply_by": "AgriAI",
            "result": answer
        })

    except Exception as e:
        print("❌ [AgriAI] Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/email/send-test', methods=['POST'])
def send_test_email():
    data = request.get_json() or {}
    to_email = (data.get('to') or '').strip()
    lang = (data.get('lang') or 'en').strip().lower()
    if lang not in ('en', 'hi', 'kn'):
        lang = 'en'
    if not to_email:
        return jsonify({'error': 'to_required'}), 400
    try:
        # Use same send_thankyou_email helper
        send_thankyou_email(to_email, 'Friend', '', language=lang)
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

                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass

                if ok:
                    # success — include basic profile fields (id, name, phone, email, aadhar, region/state/address)
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
        try:
            cur.close()
        except Exception:
            pass
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
                    cur2.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,expiry_date,category,variety,image_path FROM crops WHERE (seller_id=%s OR RIGHT(REPLACE(seller_phone, "+", ""),10) = RIGHT(%s,10)) ORDER BY created_at DESC LIMIT 3', (farmer['id'], farmer['phone']))
                    crops_rows = cur2.fetchall()
                    farmer['crop_samples'] = []
                    for cr in crops_rows:
                        farmer['crop_samples'].append({'id': cr[0], 'seller_id': cr[1], 'seller_name': cr[2], 'seller_phone': cr[3], 'crop_name': cr[4], 'quantity_kg': float(cr[5]) if cr[5] is not None else None, 'price_per_kg': float(cr[6]) if cr[6] is not None else None, 'expiry_date': cr[7], 'category': cr[8], 'variety': cr[9], 'image_path': cr[10]})
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
            sqlite_cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,expiry_date,category,variety,image_path FROM crops WHERE seller_id=? OR seller_phone=? ORDER BY created_at DESC LIMIT 3', (farmer['id'], farmer['phone']))
            crops_rows = sqlite_cur.fetchall()
            farmer['crop_samples'] = [{'id': cr[0], 'seller_id': cr[1], 'seller_name': cr[2], 'seller_phone': cr[3], 'crop_name': cr[4], 'quantity_kg': float(cr[5]) if cr[5] is not None else None, 'price_per_kg': float(cr[6]) if cr[6] is not None else None, 'expiry_date': cr[7], 'category': cr[8], 'variety': cr[9], 'image_path': cr[10]} for cr in crops_rows]
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

    # row: id,name,phone,email,aadhar,password_hash,region,state,address,lang
    user = {
        'role': tbl,
        'id': row[0],
        'name': row[1],
        'phone': row[2],
        'email': row[3],
        'aadhar': row[4],
        'region': row[6] if len(row) > 6 else None,
        'state': row[7] if len(row) > 7 else None,
        'address': row[8] if len(row) > 8 else None,
        'lang': row[9] if len(row) > 9 else None
    }
    return jsonify({'user': user}), 200


@app.route('/farmer/get', methods=['GET'])
def farmer_get():
    """Return farmer info by id/phone/email.

    Mirrors the logic of /buyer/get but queries the `farmer` table so the
    frontend can obtain the correct name/region/state/address for contract
    previews.  Accepts query params `id`/`farmer_id`, `phone`/`farmer_phone`
    or `email`.
    """
    fid = request.args.get('id') or request.args.get('farmer_id')
    phone = request.args.get('phone') or request.args.get('farmer_phone')
    email = request.args.get('email')

    if not (fid or phone or email):
        return jsonify({'error': 'id_or_phone_required'}), 400

    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)
        row = None

        if fid:
            try:
                fid_int = int(fid)
            except Exception:
                return jsonify({'error': 'invalid_id'}), 400
            if kind == 'mysql':
                cur.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE id=%s LIMIT 1', (fid_int,))
            else:
                cur.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE id=? LIMIT 1', (fid_int,))
            row = cur.fetchone()
        else:
            if phone:
                if kind == 'mysql':
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE phone=%s LIMIT 1', (phone,))
                else:
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE phone=? LIMIT 1', (phone,))
            elif email:
                if kind == 'mysql':
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE email=%s LIMIT 1', (email,))
                else:
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE email=? LIMIT 1', (email,))
            row = cur.fetchone()

        try: cur.close()
        except Exception: pass
        try: conn.close()
        except Exception: pass

        if not row and (phone or email):
            try:
                kind2, conn2 = get_db_connection()
                cur2 = get_cursor(kind2, conn2)
                if phone:
                    if kind2 == 'mysql':
                        cur2.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE phone=%s LIMIT 1', (phone,))
                    else:
                        cur2.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE phone=? LIMIT 1', (phone,))
                elif email:
                    if kind2 == 'mysql':
                        cur2.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE email=%s LIMIT 1', (email,))
                    else:
                        cur2.execute('SELECT id,name,phone,email,region,state,address FROM farmer WHERE email=? LIMIT 1', (email,))
                row = cur2.fetchone()
                try: cur2.close()
                except Exception: pass
                try: conn2.close()
                except Exception: pass
            except Exception:
                try: conn2.close()
                except Exception: pass

        if not row:
            return jsonify({'error': 'not_found'}), 404

        farmer = {
            'id': row[0],
            'name': row[1] if len(row) > 1 else None,
            'phone': row[2] if len(row) > 2 else None,
            'email': row[3] if len(row) > 3 else None,
            'region': row[4] if len(row) > 4 else None,
            'state': row[5] if len(row) > 5 else None,
            'address': row[6] if len(row) > 6 else None,
        }
        return jsonify({'ok': True, 'farmer': farmer}), 200
    except Exception:
        try: conn.close()
        except Exception: pass
        return jsonify({'error': 'server_error'}), 500


@app.route('/buyer/get', methods=['GET'])
def buyer_get():
    """Return buyer info.

    The route is primarily looked up by numeric id (query param `id` or
    `buyer_id`), which is what most callers use.  However in some cases the
    client may not have a reliable id (eg. localStorage got out of sync), so
    we also support lookups by phone or email.  If an `id` is provided it will
    always be used first, otherwise we attempt to resolve from `phone` or
    `email`.

    Response: { ok: True, buyer: { id, name, phone, email, region, state, address } }
    """
    # accept multiple forms of identification
    bid = request.args.get('id') or request.args.get('buyer_id')
    phone = request.args.get('phone') or request.args.get('buyer_phone')
    email = request.args.get('email')

    if not (bid or phone or email):
        return jsonify({'error': 'id_or_phone_required'}), 400

    kind, conn = get_db_connection()
    try:
        cur = get_cursor(kind, conn)

        # if we have an explicit id, try that first
        if bid:
            try:
                bid_int = int(bid)
            except Exception:
                return jsonify({'error': 'invalid_id'}), 400

            if kind == 'mysql':
                cur.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE id=%s LIMIT 1', (bid_int,))
            else:
                cur.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE id=? LIMIT 1', (bid_int,))
            row = cur.fetchone()
        else:
            # lookup by phone/email
            if phone:
                if kind == 'mysql':
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE phone=%s LIMIT 1', (phone,))
                else:
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE phone=? LIMIT 1', (phone,))
            elif email:
                if kind == 'mysql':
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE email=%s LIMIT 1', (email,))
                else:
                    cur.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE email=? LIMIT 1', (email,))
            row = cur.fetchone()

        try: cur.close()
        except Exception: pass
        try: conn.close()
        except Exception: pass

        if not row and bid:
            # If buyer not found in `buyer` table and we searched by id, try to
            # recover some info from `deals` table as a fallback.  This keeps
            # existing behaviour for legacy ids that may not have a buyer row.
            try:
                kind2, conn2 = get_db_connection()
                cur2 = get_cursor(kind2, conn2)
                if kind2 == 'mysql':
                    cur2.execute('SELECT buyer_name,buyer_phone,region,state FROM deals WHERE buyer_id=%s ORDER BY id DESC LIMIT 1', (bid_int,))
                else:
                    cur2.execute('SELECT buyer_name,buyer_phone,region,state FROM deals WHERE buyer_id=? ORDER BY id DESC LIMIT 1', (bid_int,))
                dr = cur2.fetchone()
                try: cur2.close()
                except Exception: pass
                try: conn2.close()
                except Exception: pass
                if dr:
                    buyer = {
                        'id': bid_int,
                        'name': dr[0] if len(dr) > 0 else None,
                        'phone': dr[1] if len(dr) > 1 else None,
                        'email': None,
                        'region': dr[2] if len(dr) > 2 else None,
                        'state': dr[3] if len(dr) > 3 else None,
                        'address': None,
                    }
                    return jsonify({'ok': True, 'buyer': buyer}), 200
            except Exception:
                try: conn2.close()
                except Exception: pass

        # if id lookup failed but the caller supplied phone/email we can
        # still try resolving by that information.  this covers cases where
        # localStorage had an outdated id but the user still has the correct
        # phone number saved.
        if not row and (phone or email):
            try:
                kind3, conn3 = get_db_connection()
                cur3 = get_cursor(kind3, conn3)
                if phone:
                    if kind3 == 'mysql':
                        cur3.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE phone=%s LIMIT 1', (phone,))
                    else:
                        cur3.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE phone=? LIMIT 1', (phone,))
                elif email:
                    if kind3 == 'mysql':
                        cur3.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE email=%s LIMIT 1', (email,))
                    else:
                        cur3.execute('SELECT id,name,phone,email,region,state,address FROM buyer WHERE email=? LIMIT 1', (email,))
                row = cur3.fetchone()
                try: cur3.close()
                except Exception: pass
                try: conn3.close()
                except Exception: pass
            except Exception:
                try: conn3.close()
                except Exception: pass

        if not row:
            return jsonify({'error': 'not_found'}), 404

        buyer = {
            'id': row[0],
            'name': row[1] if len(row) > 1 else None,
            'phone': row[2] if len(row) > 2 else None,
            'email': row[3] if len(row) > 3 else None,
            'region': row[4] if len(row) > 4 else None,
            'state': row[5] if len(row) > 5 else None,
            'address': row[6] if len(row) > 6 else None,
        }
        return jsonify({'ok': True, 'buyer': buyer}), 200
    except Exception:
        try: conn.close()
        except Exception: pass
        return jsonify({'error': 'server_error'}), 500
    except Exception as e:
        try:
            conn.close()
        except Exception:
            pass
        print('buyer_get error:', e)
        return jsonify({'error': str(e)}), 500


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
                       "AND (expiry_date IS NULL OR expiry_date >= %s) AND (quantity_kg IS NULL OR quantity_kg > 0) ORDER BY crop_name")
                cur.execute(sql, (today_iso,))
                rows = cur.fetchall()
                names = [r[0] for r in rows if r and r[0]]
            else:
                # SQLite: use date('now') for current date comparison
                sql = ("SELECT DISTINCT crop_name FROM crops WHERE crop_name IS NOT NULL AND crop_name <> '' "
                       "AND (expiry_date IS NULL OR expiry_date >= date('now')) AND (quantity_kg IS NULL OR quantity_kg > 0) ORDER BY crop_name")
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

    # ensure lang is defined (accept 'lang' or 'language' in payload)
    lang = (data.get('lang') or data.get('language') or '').strip().lower() or None
    if lang and lang not in ('en', 'hi', 'kn'):
        lang = None
    ok = update_user(tbl, user_id, name, phone, email, aadhar, region=region, state=state, address=address, lang=lang)
    if not ok:
        return jsonify({'error': 'update_failed'}), 500

    return jsonify({'success': True}), 200


@app.route('/contracts/save', methods=['POST'])
def save_contract():
    """Save contract details to the contracts table."""
    ensure_contracts_table()
    data = request.get_json(silent=True) or {}
    # Log incoming contract save request for debugging
    try:
        dbg_path = os.path.join(os.path.dirname(__file__), 'contracts_save.log')
        with open(dbg_path, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.datetime.utcnow().isoformat()} {request.remote_addr} SAVE_CONTRACT_PAYLOAD: {json.dumps(data, default=str)}\n")
    except Exception:
        pass
    
    # Extract contract details from request
    contract_number = (data.get('contract_number') or f"CNT{int(datetime.datetime.now().timestamp())}").strip()
    original_contract_number = contract_number
    farmer_id = (data.get('farmer_id') or '').strip()
    farmer_name = (data.get('farmer_name') or '').strip()
    farmer_address = (data.get('farmer_address') or '').strip()
    farmer_state = (data.get('farmer_state') or '').strip()
    farmer_email = (data.get('farmer_email') or '').strip()
    buyer_id = (data.get('buyer_id') or '').strip()
    buyer_name = (data.get('buyer_name') or '').strip()
    buyer_address = (data.get('buyer_address') or '').strip()
    buyer_state = (data.get('buyer_state') or '').strip()
    buyer_email = (data.get('buyer_email') or '').strip()
    crop_name = (data.get('crop_name') or '').strip()
    variety = (data.get('variety') or '').strip()
    quantity = float(data.get('quantity') or data.get('quantity_kg') or 0)
    price_per_kg = float(data.get('price_per_kg') or 0)
    amount = float(data.get('amount') or (quantity * price_per_kg))
    contract_nature = (data.get('contract_nature') or 'post-harvest').strip()
    contract_duration = (data.get('contract_duration') or 'one-time').strip()
    start_date_raw = (data.get('start_date') or '').strip()
    end_date_raw = (data.get('end_date') or '').strip()
    duration = int(data.get('duration') or 0)
    farmer_platform_fee = float(data.get('farmer_platform_fee') or 0)
    farmer_gst = float(data.get('farmer_gst') or 0)
    buyer_platform_fee = float(data.get('buyer_platform_fee') or 0)
    buyer_gst = float(data.get('buyer_gst') or 0)
    # compute totals if not explicitly provided: buyer_total = amount + buyer fees; farmer_total = amount - farmer fees
    try:
        buyer_total = float(data.get('buyer_total')) if (data.get('buyer_total') is not None) else (amount + buyer_platform_fee + buyer_gst)
    except Exception:
        buyer_total = (amount + buyer_platform_fee + buyer_gst)
    try:
        farmer_total = float(data.get('farmer_total')) if (data.get('farmer_total') is not None) else (amount - farmer_platform_fee - farmer_gst)
    except Exception:
        farmer_total = (amount - farmer_platform_fee - farmer_gst)
    
    # Extract sender - either from request or determine from context (farmer or buyer)
    sender = (data.get('sender') or '').strip().lower()
    if sender not in ['farmer', 'buyer']:
        sender = 'farmer'  # default to farmer if not specified or invalid
    
    # Handle delivery_cost - can be a string like "₹18 / km" or numeric
    delivery_cost_raw = data.get('delivery_cost') or ''
    try:
        # Try to extract numeric value if it's a formatted string
        if isinstance(delivery_cost_raw, str) and delivery_cost_raw:
            numeric_val = float(''.join(c for c in delivery_cost_raw if c.isdigit() or c == '.'))
            delivery_cost = numeric_val
        else:
            delivery_cost = float(delivery_cost_raw or 0)
    except:
        # If conversion fails, keep original string (database column is VARCHAR)
        delivery_cost = delivery_cost_raw or None
    
    # Convert dates from DD/MM/YYYY format to YYYY-MM-DD
    def convert_date_format(date_str):
        """Convert DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD"""
        if not date_str:
            return None
        try:
            parts = date_str.split('/')
            if len(parts) == 3:
                # Try DD/MM/YYYY first (en-GB format)
                try:
                    d = int(parts[0])
                    m = int(parts[1])
                    y = int(parts[2])
                    if 1 <= d <= 31 and 1 <= m <= 12 and y > 1900:
                        return f"{y:04d}-{m:02d}-{d:02d}"
                except:
                    pass
        except:
            pass
        return None
    
    start_date = convert_date_format(start_date_raw) or None
    end_date = convert_date_format(end_date_raw) or None
    
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    
    try:
        # open connection
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()

        # Fetch farmer_state and farmer_email from farmer table if not provided
        if (not farmer_state or not farmer_email) and farmer_id:
            try:
                if use_mysql:
                    cur.execute("SELECT state, email FROM farmer WHERE id = %s", (int(farmer_id),))
                else:
                    cur.execute("SELECT state, email FROM farmer WHERE id = ?", (int(farmer_id),))
                result = cur.fetchone()
                if result:
                    if not farmer_state and result[0]:
                        farmer_state = result[0].strip()
                    if not farmer_email and result[1]:
                        farmer_email = result[1].strip()
            except Exception as e:
                pass  # If query fails, values remain empty

        # Fetch buyer_state and buyer_email from buyer table if not provided
        if (not buyer_state or not buyer_email) and buyer_id:
            try:
                if use_mysql:
                    cur.execute("SELECT state, email FROM buyer WHERE id = %s", (int(buyer_id),))
                else:
                    cur.execute("SELECT state, email FROM buyer WHERE id = ?", (int(buyer_id),))
                result = cur.fetchone()
                if result:
                    if not buyer_state and result[0]:
                        buyer_state = result[0].strip()
                    if not buyer_email and result[1]:
                        buyer_email = result[1].strip()
            except Exception as e:
                pass  # If query fails, values remain empty

        # determine columns present in contracts table
        try:
            if use_mysql:
                cur.execute('SHOW COLUMNS FROM contracts')
                cols = [r[0] for r in cur.fetchall()]
            else:
                cur.execute("PRAGMA table_info(contracts)")
                cols = [r[1] for r in cur.fetchall()]
        except Exception as e:
            try:
                dbg_path = os.path.join(os.path.dirname(__file__), 'contracts_save.log')
                with open(dbg_path, 'a', encoding='utf-8') as f:
                    f.write(f"{datetime.datetime.utcnow().isoformat()} {request.remote_addr} SAVE_CONTRACT_TABLE_INFO_ERROR: {str(e)}\n")
            except Exception:
                pass
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'table_info_error', 'details': str(e)}), 500

        # map payload to possible columns
        payload_map = {
            'contract_number': contract_number,
            'farmer_id': farmer_id or None,
            'farmer_name': farmer_name or None,
            'farmer_address': farmer_address or None,
            'farmer_state': farmer_state or None,
            'buyer_id': buyer_id or None,
            'buyer_name': buyer_name or None,
            'buyer_address': buyer_address or None,
            'buyer_state': buyer_state or None,
            'crop_name': crop_name or None,
            'variety': variety or None,
            'quantity_kg': quantity or 0,
            'quantity': quantity or 0,
            'price_per_kg': price_per_kg or 0,
            'amount': amount or (quantity * price_per_kg),
            'contract_nature': contract_nature or None,
            'contract_duration': contract_duration or None,
            'start_date': start_date or None,
            'end_date': end_date or None,
            'duration': duration or 0,
            'farmer_platform_fee': farmer_platform_fee or 0,
            'farmer_gst': farmer_gst or 0,
            'buyer_platform_fee': buyer_platform_fee or 0,
            'buyer_gst': buyer_gst or 0,
            'buyer_total': buyer_total,
            'farmer_total': farmer_total,
            'delivery_cost': delivery_cost or None,
            # optional signature and status fields (if present in payload and table)
            'status': (data.get('status') or 'pending'),
            'sender': sender or 'farmer',
            'signature_method': (data.get('signature_method') or None),
            'signature_timestamp': (data.get('signature_timestamp') or None)
        }

        insert_cols = []
        insert_vals = []
        for k, v in payload_map.items():
            if k in cols:
                insert_cols.append(k)
                insert_vals.append(v)

        if not insert_cols:
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'no_matching_columns'}), 500

        placeholders = ','.join(['%s'] * len(insert_cols)) if use_mysql else ','.join(['?'] * len(insert_cols))
        col_list_sql = ','.join(insert_cols)
        sql = f"INSERT INTO contracts ({col_list_sql}) VALUES ({placeholders})"

        try:
            cur.execute(sql, tuple(insert_vals))
            conn.commit()

            # Attempt to email the buyer a simple contract notification if email available
            try:
                buyer_email_to_send = buyer_email or None
                if buyer_email_to_send:
                    try:
                        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
                        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
                        smtp_user = os.environ.get('SMTP_USER', 'agriai.team7@gmail.com')
                        smtp_password = os.environ.get('SMTP_PASSWORD')
                        from_addr = os.environ.get('SMTP_FROM', smtp_user)

                        subj = f"AgriAI Contract: {contract_number}"
                        body_lines = [
                            f"Dear {buyer_name or 'Buyer'},",
                            "", 
                            f"You have received a new contract from {farmer_name or 'a Farmer'} via AgriAI.",
                            "",
                            "The contract details are as follows:",
                            f"Contract Number: {contract_number}",
                            f"Crop: {crop_name}",
                            f"Variety: {variety}",
                            f"Quantity: {quantity}",
                            f"Price per kg: {price_per_kg}",
                            f"Total Amount: ₹{amount}",
                            f"Start Date: {start_date_raw}",
                            f"End Date: {end_date_raw}",
                            "",
                            "Kindly log in to your AgriAI account to review and accept the contract at your earliest convenience.",
                            "If you have any questions or require further clarification, please feel free to contact us.",
                            "Regards,",
                            "AgriAI Team"
                        ]
                        msg = EmailMessage()
                        msg['Subject'] = subj
                        msg['From'] = from_addr
                        msg['To'] = buyer_email_to_send
                        msg.set_content('\n'.join(body_lines))

                        context = ssl.create_default_context()
                        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                            try:
                                server.ehlo()
                                server.starttls(context=context)
                                server.ehlo()
                            except Exception:
                                pass
                            if smtp_password:
                                try:
                                    server.login(smtp_user, smtp_password)
                                except Exception:
                                    pass
                            try:
                                server.send_message(msg)
                            except Exception as e:
                                print('send contract email failed:', e)
                    except Exception as e:
                        print('send contract email outer error:', e)
            except Exception:
                pass

            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'contract_number': contract_number}), 200
        except Exception as db_e:
            try:
                dbg_path = os.path.join(os.path.dirname(__file__), 'contracts_save.log')
                with open(dbg_path, 'a', encoding='utf-8') as f:
                    f.write(f"{datetime.datetime.utcnow().isoformat()} {request.remote_addr} SAVE_CONTRACT_DB_ERROR: {str(db_e)}\n")
            except Exception:
                pass
            msg = str(db_e).lower()
            if ('duplicate' in msg) or ('unique' in msg) or ('1062' in msg) or ('unique constraint' in msg):
                try:
                    new_cn = f"{original_contract_number}-{int(time.time()*1000)}"
                    if 'contract_number' in insert_cols:
                        idx = insert_cols.index('contract_number')
                        insert_vals[idx] = new_cn
                    cur.execute(sql, tuple(insert_vals))
                    conn.commit()
                    try: cur.close()
                    except Exception: pass
                    try: conn.close()
                    except Exception: pass
                    return jsonify({'ok': True, 'contract_number': new_cn, 'note': 'contract_number_modified_due_to_duplicate'}), 200
                except Exception as retry_e:
                    try:
                        with open(dbg_path, 'a', encoding='utf-8') as f:
                            f.write(f"{datetime.datetime.utcnow().isoformat()} {request.remote_addr} SAVE_CONTRACT_RETRY_FAILED: {str(retry_e)}\n")
                    except Exception:
                        pass
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': False, 'error': 'db_error', 'details': str(db_e)}), 500
    except Exception as e:
        print('save_contract error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/contracts/save-buyer', methods=['POST'])
def save_contract_buyer():
    """Save buyer contract details to the contract_b table (for buyer-sent contracts)."""
    # Same logic as save_contract but targets contract_b table instead
    data = request.get_json(silent=True) or {}
    
    # Extract contract details from request
    contract_number = (data.get('contract_number') or f"CNT{int(datetime.datetime.now().timestamp())}").strip()
    original_contract_number = contract_number
    farmer_id = (data.get('farmer_id') or '').strip()
    farmer_name = (data.get('farmer_name') or '').strip()
    farmer_address = (data.get('farmer_address') or '').strip()
    farmer_state = (data.get('farmer_state') or '').strip()
    farmer_email = (data.get('farmer_email') or '').strip()
    buyer_id = (data.get('buyer_id') or '').strip()
    buyer_name = (data.get('buyer_name') or '').strip()
    buyer_address = (data.get('buyer_address') or '').strip()
    buyer_state = (data.get('buyer_state') or '').strip()
    buyer_email = (data.get('buyer_email') or '').strip()
    crop_name = (data.get('crop_name') or '').strip()
    variety = (data.get('variety') or '').strip()
    quantity = float(data.get('quantity') or data.get('quantity_kg') or 0)
    price_per_kg = float(data.get('price_per_kg') or 0)
    amount = float(data.get('amount') or (quantity * price_per_kg))
    contract_nature = (data.get('contract_nature') or 'post-harvest').strip()
    contract_duration = (data.get('contract_duration') or 'one-time').strip()
    start_date_raw = (data.get('start_date') or '').strip()
    end_date_raw = (data.get('end_date') or '').strip()
    duration = int(data.get('duration') or 0)
    farmer_platform_fee = float(data.get('farmer_platform_fee') or 0)
    farmer_gst = float(data.get('farmer_gst') or 0)
    buyer_platform_fee = float(data.get('buyer_platform_fee') or 0)
    buyer_gst = float(data.get('buyer_gst') or 0)
    try:
        buyer_total = float(data.get('buyer_total')) if (data.get('buyer_total') is not None) else (amount + buyer_platform_fee + buyer_gst)
    except Exception:
        buyer_total = (amount + buyer_platform_fee + buyer_gst)
    try:
        farmer_total = float(data.get('farmer_total')) if (data.get('farmer_total') is not None) else (amount - farmer_platform_fee - farmer_gst)
    except Exception:
        farmer_total = (amount - farmer_platform_fee - farmer_gst)
    
    sender = (data.get('sender') or 'buyer').strip().lower()
    if sender not in ['farmer', 'buyer']:
        sender = 'buyer'  # default to buyer for this endpoint
    
    # Handle delivery_cost
    delivery_cost_raw = data.get('delivery_cost') or ''
    try:
        if isinstance(delivery_cost_raw, str) and delivery_cost_raw:
            numeric_val = float(''.join(c for c in delivery_cost_raw if c.isdigit() or c == '.'))
            delivery_cost = numeric_val
        else:
            delivery_cost = float(delivery_cost_raw or 0)
    except:
        delivery_cost = delivery_cost_raw or None
    
    # Convert dates from DD/MM/YYYY format to YYYY-MM-DD
    def convert_date_format(date_str):
        if not date_str:
            return None
        try:
            parts = date_str.split('/')
            if len(parts) == 3:
                try:
                    d = int(parts[0])
                    m = int(parts[1])
                    y = int(parts[2])
                    if 1 <= d <= 31 and 1 <= m <= 12 and y > 1900:
                        return f"{y:04d}-{m:02d}-{d:02d}"
                except:
                    pass
        except:
            pass
        return None
    
    start_date = convert_date_format(start_date_raw) or None
    end_date = convert_date_format(end_date_raw) or None
    
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    
    try:
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()

        # determine columns present in contract_b table
        try:
            if use_mysql:
                cur.execute('SHOW COLUMNS FROM contract_b')
                cols = [r[0] for r in cur.fetchall()]
            else:
                cur.execute("PRAGMA table_info(contract_b)")
                cols = [r[1] for r in cur.fetchall()]
        except Exception as e:
            print('Error getting contract_b table info:', e)
            # If contract_b doesn't exist, try to create it
            try:
                if use_mysql:
                    cur.execute('''
                        CREATE TABLE IF NOT EXISTS contract_b (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            contract_number VARCHAR(100) UNIQUE,
                            farmer_id INT,
                            farmer_name VARCHAR(255),
                            farmer_address VARCHAR(255),
                            farmer_state VARCHAR(100),
                            buyer_id INT,
                            buyer_name VARCHAR(255),
                            buyer_address VARCHAR(255),
                            buyer_state VARCHAR(100),
                            crop_name VARCHAR(255),
                            variety VARCHAR(255),
                            quantity_kg FLOAT,
                            price_per_kg FLOAT,
                            amount FLOAT,
                            contract_nature VARCHAR(100),
                            contract_duration VARCHAR(100),
                            start_date DATE,
                            end_date DATE,
                            duration INT,
                            farmer_platform_fee FLOAT DEFAULT 0,
                            farmer_gst FLOAT DEFAULT 0,
                            buyer_platform_fee FLOAT DEFAULT 0,
                            buyer_gst FLOAT DEFAULT 0,
                            buyer_total FLOAT,
                            farmer_total FLOAT,
                            delivery_cost VARCHAR(255),
                            status VARCHAR(50) DEFAULT 'pending',
                            sender VARCHAR(50),
                            signature_method VARCHAR(255),
                            signature_timestamp DATETIME,
                            read INT DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                    ''')
                    conn.commit()
                    cur.execute('SHOW COLUMNS FROM contract_b')
                    cols = [r[0] for r in cur.fetchall()]
                else:
                    cur.execute('''
                        CREATE TABLE IF NOT EXISTS contract_b (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            contract_number TEXT UNIQUE,
                            farmer_id INTEGER,
                            farmer_name TEXT,
                            farmer_address TEXT,
                            farmer_state TEXT,
                            buyer_id INTEGER,
                            buyer_name TEXT,
                            buyer_address TEXT,
                            buyer_state TEXT,
                            crop_name TEXT,
                            variety TEXT,
                            quantity_kg REAL,
                            price_per_kg REAL,
                            amount REAL,
                            contract_nature TEXT,
                            contract_duration TEXT,
                            start_date DATE,
                            end_date DATE,
                            duration INTEGER,
                            farmer_platform_fee REAL DEFAULT 0,
                            farmer_gst REAL DEFAULT 0,
                            buyer_platform_fee REAL DEFAULT 0,
                            buyer_gst REAL DEFAULT 0,
                            buyer_total REAL,
                            farmer_total REAL,
                            delivery_cost TEXT,
                            status TEXT DEFAULT 'pending',
                            sender TEXT,
                            signature_method TEXT,
                            signature_timestamp DATETIME,
                            read INTEGER DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    ''')
                    conn.commit()
                    cur.execute("PRAGMA table_info(contract_b)")
                    cols = [r[1] for r in cur.fetchall()]
            except Exception as create_err:
                print('Error creating contract_b table:', create_err)
                try: cur.close()
                except: pass
                try: conn.close()
                except: pass
                return jsonify({'ok': False, 'error': 'table_create_error', 'details': str(create_err)}), 500

        # map payload to possible columns
        payload_map = {
            'contract_number': contract_number,
            'farmer_id': farmer_id or None,
            'farmer_name': farmer_name or None,
            'farmer_address': farmer_address or None,
            'farmer_state': farmer_state or None,
            'buyer_id': buyer_id or None,
            'buyer_name': buyer_name or None,
            'buyer_address': buyer_address or None,
            'buyer_state': buyer_state or None,
            'crop_name': crop_name or None,
            'variety': variety or None,
            'quantity_kg': quantity or 0,
            'price_per_kg': price_per_kg or 0,
            'amount': amount or (quantity * price_per_kg),
            'contract_nature': contract_nature or None,
            'contract_duration': contract_duration or None,
            'start_date': start_date or None,
            'end_date': end_date or None,
            'duration': duration or 0,
            'farmer_platform_fee': farmer_platform_fee or 0,
            'farmer_gst': farmer_gst or 0,
            'buyer_platform_fee': buyer_platform_fee or 0,
            'buyer_gst': buyer_gst or 0,
            'buyer_total': buyer_total,
            'farmer_total': farmer_total,
            'delivery_cost': delivery_cost or None,
            'status': (data.get('status') or 'pending'),
            'sender': sender,
            'signature_method': (data.get('signature_method') or None),
            'signature_timestamp': (data.get('signature_timestamp') or None)
        }

        insert_cols = []
        insert_vals = []
        for k, v in payload_map.items():
            if k in cols:
                insert_cols.append(k)
                insert_vals.append(v)

        if not insert_cols:
            try: cur.close()
            except: pass
            try: conn.close()
            except: pass
            return jsonify({'ok': False, 'error': 'no_matching_columns'}), 500

        placeholders = ','.join(['%s'] * len(insert_cols)) if use_mysql else ','.join(['?'] * len(insert_cols))
        col_list_sql = ','.join(insert_cols)
        sql = f"INSERT INTO contract_b ({col_list_sql}) VALUES ({placeholders})"

        try:
            cur.execute(sql, tuple(insert_vals))
            conn.commit()
            
            try: cur.close()
            except: pass
            try: conn.close()
            except: pass
            return jsonify({'ok': True, 'contract_number': contract_number}), 200
        except Exception as db_e:
            msg = str(db_e).lower()
            if ('duplicate' in msg) or ('unique' in msg) or ('1062' in msg) or ('unique constraint' in msg):
                try:
                    new_cn = f"{original_contract_number}-{int(time.time()*1000)}"
                    if 'contract_number' in insert_cols:
                        idx = insert_cols.index('contract_number')
                        insert_vals[idx] = new_cn
                    cur.execute(sql, tuple(insert_vals))
                    conn.commit()
                    try: cur.close()
                    except: pass
                    try: conn.close()
                    except: pass
                    return jsonify({'ok': True, 'contract_number': new_cn}), 200
                except Exception as retry_e:
                    pass
            try: cur.close()
            except: pass
            try: conn.close()
            except: pass
            return jsonify({'ok': False, 'error': 'db_error', 'details': str(db_e)}), 500
    except Exception as e:
        print('save_contract_buyer error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/deals/reduce-quantity', methods=['POST'])
def reduce_deal_quantity():
    """Reduce the quantity of a buyer deal after contract confirmation."""
    ensure_deals_table()
    data = request.get_json(silent=True) or {}
    
    deal_id = data.get('deal_id', None)
    quantity_to_reduce = float(data.get('quantity_to_reduce') or 0)
    
    if not deal_id or quantity_to_reduce <= 0:
        return jsonify({'ok': False, 'error': 'deal_id and quantity_to_reduce required'}), 400
    
    use_mysql = (mysql is not None and os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
    
    try:
        if use_mysql:
            cfg = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'port': int(os.environ.get('DB_PORT', '3306')),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'agri_ai'),
            }
            conn = mysql.connect(**cfg)
            cur = conn.cursor()
            # Get current quantity
            cur.execute('SELECT quantity_kg FROM deals WHERE id = %s', (deal_id,))
            row = cur.fetchone()
            if not row:
                try: cur.close()
                except Exception: pass
                try: conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'deal_not_found'}), 404
            
            current_qty = float(row[0])
            new_qty = max(0, current_qty - quantity_to_reduce)
            
            # Update quantity
            cur.execute('UPDATE deals SET quantity_kg = %s WHERE id = %s', (new_qty, deal_id))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'new_quantity': new_qty}), 200
        else:
            db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            # Get current quantity
            cur.execute('SELECT quantity_kg FROM deals WHERE id = ?', (deal_id,))
            row = cur.fetchone()
            if not row:
                try: cur.close()
                except Exception: pass
                try: conn.close()
                except Exception: pass
                return jsonify({'ok': False, 'error': 'deal_not_found'}), 404
            
            current_qty = float(row[0])
            new_qty = max(0, current_qty - quantity_to_reduce)
            
            # Update quantity
            cur.execute('UPDATE deals SET quantity_kg = ? WHERE id = ?', (new_qty, deal_id))
            conn.commit()
            try: cur.close()
            except Exception: pass
            try: conn.close()
            except Exception: pass
            return jsonify({'ok': True, 'new_quantity': new_qty}), 200
    except Exception as e:
        print('reduce_deal_quantity error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500


if __name__ == '__main__':
    print("GROQ_API_KEY loaded:", os.getenv("GROQ_API_KEY"))  
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
    # Ensure contracts table exists (MySQL and SQLite fallback)
    try:
        ensure_contracts_table()
    except Exception as e:
        print('ensure_contracts_table error:', e)
    # Ensure purchase notifications table exists
    try:
        ensure_purchase_notifications_table()
    except Exception as e:
        print('ensure_purchase_notifications_table bootstrap error:', e)
    # Ensure expiry notifications table exists and start background notifier
    try:
        ensure_expiry_notifications_table()
        start_expiry_notifier_thread()
        print('Expiry notifier started.')
    except Exception as e:
        print('Failed to start expiry notifier:', e)
    app.run(debug=True)

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)

