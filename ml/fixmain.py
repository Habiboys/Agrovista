from flask import Flask, request, jsonify
import google.generativeai as genai
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
import ssl
import logging
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import mysql.connector
from dotenv import load_dotenv
import os

# Konfigurasi SSL untuk download NLTK
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Konfigurasi logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Download NLTK resources
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = Flask(__name__)

# Konfigurasi API untuk Google Generative AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Text preprocessing
def preprocess_text(text):
    if not text or not isinstance(text, str):
        return ""
    
    text = text.lower()
    try:
        tokens = word_tokenize(text)
        stop_words = set(stopwords.words('indonesian'))
        tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
        return " ".join(tokens)
    except Exception as e:
        logging.error(f"Error preprocessing text: {e}")
        return text

# Load AI model for sentiment analysis
def load_model():
    try:
        model = joblib.load('model_sentimen.pkl')
        vectorizer = joblib.load('vectorizer.pkl')
        return model, vectorizer
    except Exception as e:
        logging.error(f"Error loading model: {e}")
        raise

# Konfigurasi akses database
def connect_to_database():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"), 
            user=os.getenv("DB_USER"),     
            password=os.getenv("DB_PASS"),     
            database=os.getenv("DB_NAME") 
        )
        return connection
    except mysql.connector.Error as err:
        logging.error(f"Database connection error: {err}")
        return None

# Chat API
def load_text_file(file_path):
    """Membaca konten dari file .txt."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        logging.error(f"Error loading text file: {e}")
        return ""

def generate_response(user_prompt, document_content):
    """Generate response using Google Gemini AI based on prompt and document content."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        # Gabungkan konten dokumen dengan prompt
        full_prompt = (
            f"Anggap Anda adalah seorang sales desa lewuimalang yang ramah, berikan jawaban yang baik, "
            f"pastikan semua jawaban Anda berdasarkan dokumen ini:\n"
            f"Dokumen: {document_content}\n"
            f"Pertahankan nada yang ramah dan komunikatif dan selalu jawab dalam bahasa Indonesia dan tanpa atribut markdown,tanpa (*, #, dll). kalau ada list beri saja angka"
            f"Jika bagian tersebut tidak relevan, jangan ragu untuk mengabaikannya.\n\n "
            f"Pertanyaan: {user_prompt} berikan respon tanpa atribut markdown."
        )
        answer = model.generate_content(full_prompt)
        return answer.text
    except Exception as e:
        logging.error(f"Error generating response: {e}")
        return "Maaf, terjadi kesalahan dalam memproses permintaan Anda."

# Lokasi file
file_path = 'data.txt'
document_content = load_text_file(file_path)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_question = data.get('question')
        
        if not user_question:
            return jsonify({"error": "No question provided"}), 400
        
        response = generate_response(user_question, document_content)
        return jsonify({"response": response})
    except Exception as e:
        logging.error(f"Chat route error: {e}")
        return jsonify({"error": "Internal server error"}), 500

# Predict Sentiment API
def predict_sentiment(ulasan_baru):
    try:
        ulasan_baru_processed = [preprocess_text(ul) for ul in ulasan_baru]
        model, vectorizer = load_model()
        X_new = vectorizer.transform(ulasan_baru_processed)
        prediksi = model.predict(X_new)
        return prediksi
    except Exception as e:
        logging.error(f"Sentiment prediction error: {e}")
        raise

def get_all_reviews():
    connection = connect_to_database()
    if connection:
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT ulasan FROM data_ulasan")
            reviews = cursor.fetchall()
            cursor.close()
            connection.close()
            
            # Filter out None or non-string reviews
            reviews = [review[0] for review in reviews if review[0] and isinstance(review[0], str)]
            logging.info(f"Retrieved {len(reviews)} reviews")
            return reviews
        except mysql.connector.Error as err:
            logging.error(f"Database error: {err}")
            return []
    else:
        logging.error("Failed to connect to the database.")
        return []

def save_to_database(ulasan, sentimen):
    connection = connect_to_database()
    if connection:
        try:
            cursor = connection.cursor()
            sql = "UPDATE data_ulasan SET label = %s WHERE ulasan = %s"
            cursor.execute(sql, (sentimen, ulasan))
            connection.commit()
            cursor.close()
            connection.close()
            logging.info(f"Review: '{ulasan}' saved with label: '{sentimen}'")
        except mysql.connector.Error as err:
            logging.error(f"Database save error: {err}")
    else:
        logging.error("Failed to connect to the database.")

@app.route('/predict', methods=['GET'])
def predict():
    try:
        ulasan_baru = get_all_reviews()
        
        if not ulasan_baru:
            return jsonify({"error": "No reviews found"}), 404
        
        hasil_prediksi = predict_sentiment(ulasan_baru)

        results = []
        for ulasan, sentimen in zip(ulasan_baru, hasil_prediksi):
            save_to_database(ulasan, sentimen)
            results.append({
                "review": ulasan,
                "predicted_sentiment": sentimen
            })

        return jsonify(results)
    
    except Exception as e:
        logging.error(f"Error in predict route: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)