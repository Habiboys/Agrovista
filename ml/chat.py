from flask import Flask, request, jsonify
import google.generativeai as genai

app = Flask(__name__)

# Konfigurasi API
genai.configure(api_key="AIzaSyDn3vqgBjnGpH6dyaCYUYTwktL0KRxv2vI")

def load_text_file(file_path):
    """Membaca konten dari file .txt."""
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def generate_response(user_prompt, document_content):
    """Menghasilkan respons dari Gemini berdasarkan prompt dan konten dokumen."""
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    # Gabungkan konten dokumen dengan prompt
    full_prompt = (
        f"Anggap Anda adalah seorang sales desa lewuimalang yang ramah, berikan jawaban yang baik, "
        f"pastikan semua jawaban Anda berdasarkan dokumen ini:\n"
        f"Dokumen: {document_content}\n"
        f"Pertahankan nada yang ramah dan komunikatif dan selalu jawab dalam bahasa Indonesia dan tanpa atribut markdown,tanpa (*, #, dll). "
        f"Jika bagian tersebut tidak relevan, jangan ragu untuk mengabaikannya.\n\n"
        f"Pertanyaan: {user_prompt} berikan respon tanpa atribut markdown."
    )
    answer = model.generate_content(full_prompt)
    return answer.text

# Ganti dengan path file Anda
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

if __name__ == "__main__":
    app.run(debug=True)