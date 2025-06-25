import json
from flask import Flask, jsonify, request, abort, make_response
# from flask import Flask
from confluent_kafka import Consumer, KafkaException, KafkaError
import os
from functools import wraps
import jwt
import hmac
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv
import threading
import time
import psycopg2
from psycopg2 import sql
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import func
import threading
import resource
from urllib.parse import parse_qsl


from prometheus_client import (
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    disable_created_metrics,
    platform_collector,
    process_collector,
    gc_collector,
)

# отключаем время создания Counter_Prometheus
disable_created_metrics()

# Загружаем переменные окружения
load_dotenv()

app = Flask(__name__)

# Настройки Kafka
KAFKA_BROKER = os.getenv('KAFKA_BROKER', 'redpanda:9092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'honeypot-alerts')
GROUP_ID = os.getenv('GROUP_ID', 'honeypot-consumer-group')

# Настройки PostgreSQL
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'db')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'honeypot')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'user')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'password')

TELEGRAM_BOT_TOKEN = os.getenv("BOT_TOKEN")
JWT_AT_SECRET = os.getenv("JWT_AT_SECRET", "jwt_at_secret")
JWT_RT_SECRET = os.getenv("JWT_RT_SECRET", "jwt_rt_secret")

# === Маршрут для авторизации ===
#@app.route('/auth/telegram', methods=['POST'])
from urllib.parse import parse_qs

from urllib.parse import parse_qs
import json

@app.route('/auth/telegram', methods=['POST'])
def telegram_auth():
    data = request.get_json()
    print("Received data:", data)

    if not data or 'init_data' not in data:
        return jsonify({'error': 'Missing init_data'}), 400

    # Распарсим initData как query string
    parsed = parse_qs(data['init_data'])
    fields = {k: v[0] for k, v in parsed.items()}

    if 'user' not in fields:
        return jsonify({'error': 'Missing user field in init_data'}), 400

    try:
        user_data = json.loads(fields['user'])
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid user JSON'}), 400

    required_keys = ['id', 'first_name', 'username']
    if not all(key in user_data and user_data[key] for key in required_keys):
        return jsonify({'error': 'Missing required user fields'}), 400

    # Успешная (небезопасная) авторизация
    response = make_response(jsonify({'success': True}))
    response.set_cookie(
        'LOGGED_IN', 'true',
        httponly=True, secure=False, samesite='Lax', path='/'
    )
    return response

def check_response(data):
    check_hash = data.pop('hash', None)
    data.pop('signature', None)

    if not check_hash:
        return False

    data_check_arr = [f"{k}={v}" for k, v in sorted(data.items())]
    data_check_string = '\n'.join(data_check_arr)

    secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode('utf-8')).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()

    if calculated_hash != check_hash:
        print("❌ Hash mismatch")
        return False

    try:
        if (time.time() - int(data.get('auth_date', 0))) > 86400:
            print("❌ Data expired")
            return False
    except:
        return False

    return True

ACCESS_SECRET = 'jwt_at_secret'
REFRESH_SECRET = 'jwt_rt_secret'

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.cookies.get('LOGGED_IN') != 'true':
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# Настройки Flask-SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация SQLAlchemy
db = SQLAlchemy(app)

# Модель для таблицы logs
class Log(db.Model):
    __tablename__ = 'logs'

    id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.String(50), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    method = db.Column(db.String(10), nullable=False)
    url = db.Column(db.Text, nullable=False)
    user_agent = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f"<Log {self.id} - {self.ip}>"


import time
from confluent_kafka import Consumer, KafkaException, KafkaError

# Настройки Kafka Consumer
conf = {
    'bootstrap.servers': KAFKA_BROKER,
    'group.id': GROUP_ID,
    'auto.offset.reset': 'earliest'
}

# Функция для создания Consumer с повторными попытками
def create_kafka_consumer(max_retries=5, retry_delay=2):
    retries = 0
    while retries < max_retries:
        try:
            # Создаем Consumer
            consumer = Consumer(conf)
            print("Successfully connected to Kafka.")
            return consumer
        except Exception as e:
            retries += 1
            print(f"Failed to connect to Kafka (attempt {retries}/{max_retries}): {e}")
            if retries < max_retries:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
    
    # Если все попытки неудачны
    raise Exception("Failed to connect to Kafka after multiple retries.")

# Подключаем Consumer к топику
try:
    consumer = create_kafka_consumer(max_retries=5, retry_delay=5)
    consumer.subscribe([KAFKA_TOPIC])
except Exception as e:
    print(f"Error: {e}")
    exit(1)

def connect_to_postgres():
    """
    Подключаемся к PostgreSQL и возвращаем соединение и курсор.
    """
    conn = psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )
    return conn, conn.cursor()

def write_to_postgres(message_data):
    """
    Записываем сообщение в PostgreSQL.
    """
    conn, cursor = connect_to_postgres()
    try:
        # Парсим JSON сообщение
        data = json.loads(message_data)
        
        # Вставляем данные в таблицу
        insert_query = sql.SQL("""
            INSERT INTO logs (ip, port, method, url, user_agent, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
        """)
        cursor.execute(insert_query, (data['ip'], int(data['port']), data['method'], data['url'], data['userAgent'], data['timestamp']))
        conn.commit()
    except Exception as e:
        print(f"Error inserting data into PostgreSQL: {e}")
    finally:
        cursor.close()
        conn.close()

def write_to_file(message):
    """
    Записываем сообщение в файл.
    Если файл не существует, создаем новый.
    """
    with open("messages.log", "a") as file:
        file.write(message + "\n")


def consume_messages():
    """
    Получаем сообщения из Kafka и записываем их в PostgreSQL.
    """
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                # Если сообщений нет, продолжаем ожидать
                continue
            elif msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print("End of partition reached")
                else:
                    raise KafkaException(msg.error())
            else:
                # Десериализуем сообщение
                message_data = msg.value().decode('utf-8')
                print(f"Received message: {message_data}")
                
                # Записываем сообщение в PostgreSQL
                write_to_file(message_data)
                write_to_postgres(message_data)
            
            # Чтобы не загружать процессор, добавляем небольшую задержку
            time.sleep(1)

    except KeyboardInterrupt:
        print("Consumer interrupted by user.")
    finally:
        # Закрываем Consumer после завершения работы
        consumer.close()

@app.route('/')
def index():
    return "Honeypot Backend is Running!"

# === Защищённый маршрут для логов ===
@app.route('/attempts', methods=['GET'])
@require_auth
def get_attempts():
    logs = Log.query.all()
    attempts = [
        {
            "timestamp": log.timestamp.isoformat(),
            "ip": log.ip,
            "port": log.port,
            "method": log.method,
            "url": log.url,
            "user_agent": log.user_agent
        }
        for log in logs
    ]
    return jsonify(attempts)

@app.route('/activity', methods=['GET'])
@require_auth
def get_activity():
    try:
        activity_data = (
            db.session.query(
                func.date(Log.timestamp).label('date'),
                func.count(Log.id).label('count')
            )
            .group_by(func.date(Log.timestamp))
            .order_by(func.date(Log.timestamp))
            .all()
        )

        result = [
            {"timestamp": activity.date.isoformat(), "count": activity.count}
            for activity in activity_data
        ]

        return jsonify({"ok": True, "activity": result})
    
    except Exception as e:
        print("Error in /activity:", str(e))  # 🔍 Для отладки
        return jsonify({"error": str(e)}), 500

# Create a custom registry
registry = CollectorRegistry()

gc_collector.GCCollector(registry=registry)
platform_collector.PlatformCollector(registry=registry)
process_collector.ProcessCollector(registry=registry)

# Create a counter metric
http_requests_total = Counter(
    "http_requests_total",
    "Total number of HTTP requests received",
    ["status", "path", "method"],
    registry=registry,
)




@app.route('/metrics')
def metrics():
    """ Exposes only explicitly registered metrics. """
    return generate_latest(registry), 200, {'Content-Type': CONTENT_TYPE_LATEST}


@app.before_request
def before_request():
    """Track start of request processing"""
    request.start_time = time.time()

@app.after_request
def after_request(response):
    """Increment counter after each request"""
    http_requests_total.labels(
        status=str(response.status_code), path=request.path, method=request.method
    ).inc()

    duration = time.time() - request.start_time
    latency_histogram.labels(
        status=str(response.status_code), path=request.path, method=request.method
    ).observe(duration)

    return response



###########################################
# Define a Gauge metric for tracking memory usage
memory_usage_gauge = Gauge(
    "memory_usage_Kbytes",
    "Current memory usage of the service in bytes",
    ["hostname"],
    registry=registry,
)
def collect_memory_metrics():
    """Background thread to collect memory metrics"""
    while True:
        memory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        # Multiply by 1024 since maxrss is in KB on Unix
        memory_usage_gauge.labels(hostname="honeypot-backend").set(memory)
        time.sleep(1)
metrics_thread = threading.Thread(target=collect_memory_metrics, daemon=True)
metrics_thread.start()
###########################################

# Define a Histogram metric for request duration
latency_histogram = Histogram(
    "http_request_duration_seconds",
    "Duration of HTTP requests",
    ["status", "path", "method"],
    registry=registry,
)


# Настройка CORS
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})  # Добавлено supports_credentials

if __name__ == '__main__':
    # Запускаем Consumer в отдельном потоке
    consumer_thread = threading.Thread(target=consume_messages)
    consumer_thread.daemon = True  # Поток завершится, когда завершится основное приложение
    consumer_thread.start()

    # Запускаем Flask приложение
    app.run(host='0.0.0.0', port=5000)
