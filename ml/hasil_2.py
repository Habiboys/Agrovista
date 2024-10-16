import joblib
from flask import Flask, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import mysql.connector

# Download NLTK resources (if not already downloaded)
# nltk.download('punkt')
# nltk.download('stopwords')

app = Flask(__name__)

# Text preprocessing
def preprocess_text(text):
    text = text.lower()
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('indonesian'))
    tokens = [word for word in tokens if word not in stop_words and word.isalpha()]
    return " ".join(tokens)

# Load the saved model
def load_model():
    model = joblib.load('model_sentimen.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
    return model, vectorizer

# Process reviews and predict sentiment
def predict_sentiment(ulasan_baru):
    ulasan_baru_processed = [preprocess_text(ul) for ul in ulasan_baru]
    model, vectorizer = load_model()
    X_new = vectorizer.transform(ulasan_baru_processed)
    prediksi = model.predict(X_new)
    return prediksi

# Connect to the database
def connect_to_database():
    try:
        connection = mysql.connector.connect(
            host='localhost', 
            user='root',     
            password='',     
            database='ulasan' 
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

# Retrieve all reviews from the database
def get_all_reviews():
    connection = connect_to_database()
    if connection is not None:
        cursor = connection.cursor()
        cursor.execute("SELECT ulasan FROM dataulasans")
        reviews = cursor.fetchall()
        cursor.close()
        connection.close()
        return [review[0] for review in reviews]  # Extract reviews as a list
    else:
        print("Failed to connect to the database.")
        return []

def save_to_database(ulasan, sentimen):
    connection = connect_to_database()
    if connection is not None:
        cursor = connection.cursor()
        sql = "UPDATE dataulasans SET label = %s WHERE ulasan = %s"
        cursor.execute(sql, (sentimen, ulasan))
        connection.commit()
        cursor.close()
        connection.close()
        print(f"Review: '{ulasan}' saved with label: '{sentimen}'")
    else:
        print("Failed to connect to the database.")

@app.route('/predict', methods=['GET'])
def predict():
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
