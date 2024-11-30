from flask import Flask, request, jsonify
import google.generativeai as genai
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import mysql.connector
from dotenv import load_dotenv
import os
from pathlib import Path

# Download NLTK resources if necessary
nltk.download('punkt')
nltk.download('stopwords')

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = Flask(__name__)

# Konfigurasi API untuk Google Generative AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Text preprocessing
def preprocess_text(text):
    text = text.lower()
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('indonesian'))
    tokens = [word for word in tokens if word.isalpha() and word not in stop_words]
    return " ".join(tokens)

# Load AI model for sentiment analysis
def load_model():
    model = joblib.load('model_sentimen.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
    return model, vectorizer

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
        print(f"Error: {err}")
        return None

# Chat API
def load_text_file(file_path):
    """Membaca konten dari file .txt."""
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def generate_response(user_prompt, document_content):
    """Generate response using Google Gemini AI based on prompt and document content."""
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    # Gabungkan konten dokumen dengan prompt
    full_prompt = (
        f"Anggap Anda adalah seorang sales desa lewuimalang yang ramah, berikan jawaban yang baik, "
        f"pastikan semua jawaban Anda berdasarkan dokumen ini:\n"
        f"Dokumen: {document_content}\n"
        f"Pertahankan nada yang ramah dan komunikatif dan selalu jawab dalam bahasa Indonesia dan tanpa atribut markdown,tanpa (*, #, dll). kalah ada list beri saja angka"
        f"Jika bagian tersebut tidak relevan, jangan ragu untuk mengabaikannya.\n\n "
        # f"Pastikan pembicaraan berlanjut, cek memori percakapan pastikan terus berlanjut dan tidak putus,jika pengunjung menjawab respon ada sebelumnya tolong balas sesuai dengan respon yg ada kasih sebelumnya,  .\n\n "
        f"Pertanyaan: {user_prompt} berikan respon tanpa atribut markdown."
    )
    answer = model.generate_content(full_prompt)
    return answer.text

file_path = 'data.txt'
document_content = load_text_file(file_path)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_question = data.get('question')
    
    if not user_question:
        return jsonify({"error": "No question provided"}), 400
    
    response = generate_response(user_question, document_content)
    return jsonify({"response": response})

# Predict Sentiment API
def predict_sentiment(ulasan_baru):
    ulasan_baru_processed = [preprocess_text(ul) for ul in ulasan_baru]
    model, vectorizer = load_model()
    X_new = vectorizer.transform(ulasan_baru_processed)
    prediksi = model.predict(X_new)
    return prediksi

def get_all_reviews():
    connection = connect_to_database()
    if connection:
        cursor = connection.cursor()
        cursor.execute("SELECT ulasan FROM data_ulasan")
        reviews = cursor.fetchall()
        cursor.close()
        connection.close()
        return [review[0] for review in reviews]
    else:
        print("Failed to connect to the database.")
        return []

def save_to_database(ulasan, sentimen):
    connection = connect_to_database()
    if connection:
        cursor = connection.cursor()
        sql = "UPDATE data_ulasan SET label = %s WHERE ulasan = %s"
        cursor.execute(sql, (sentimen, ulasan))
        connection.commit()
        cursor.close()
        connection.close()
        print(f"Review: '{ulasan}' saved with label: '{sentimen}'")
    else:
        print("Failed to connect to the database.")

@app.route('/predict', methods=['GET'])
def predict():
    nltk.download('punkt')
    nltk.download('stopwords')
    ulasan_baru = get_all_reviews()
    hasil_prediksi = predict_sentiment(ulasan_baru)

    results = []
    for ulasan, sentimen in zip(ulasan_baru, hasil_prediksi):
        save_to_database(ulasan, sentimen)
        results.append({
            "review": ulasan,
            "predicted_sentiment": sentimen
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
