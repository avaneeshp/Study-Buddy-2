from flask import Flask, request, jsonify
import os
import json
from generator import converter, generate_quiz
import atexit
import shutil
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure the folder exists
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER  # Add to app config
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'jpg', 'png'}  # Allowed file types


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


summaries_cache = {}  # Dictionary to temporarily store summaries by session

@app.route('/process_summary', methods=['POST'])
def process_summary():
    if "files" not in request.files:
        print("No files part found")
        return jsonify({"message": "No files part"}), 400

    files = request.files.getlist("files")  # Get all files from the request
    topic = request.form.get("topic", "General")
    session_id = request.form.get("session_id", "default")  # Optional session ID for tracking
    print(f"Received {len(files)} file(s), Topic: {topic}")

    summaries = []  # Store summaries for all files

    for file in files:
        if file and allowed_file(file.filename):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(file_path)
            print(f"File saved to: {file_path}")

            try:
                # Pass the saved file path to the converter
                converter(file_path, topic)
                output_path = f"{file_path[:-4]}_summary.txt"

                # Read the plain text summary
                if not os.path.exists(output_path):
                    raise FileNotFoundError(f"Summary file not created for {file.filename}")

                with open(output_path, "r") as f:
                    summary = f.read()
                summaries.append(summary)
            except Exception as e:
                print(f"Error processing file {file.filename}: {e}")
                summaries.append(f"Error processing {file.filename}: {e}")
        else:
            print(f"Invalid file: {file.filename}")
            summaries.append(f"Invalid file: {file.filename}")

    # Cache the combined summary for quiz generation
    combined_summary = "\n\n".join(summaries)
    summaries_cache[session_id] = combined_summary

    return jsonify({"Summaries": summaries}), 200

@app.route('/generate_quiz', methods=['POST'])
def quiz_generation():
    data = request.get_json()
    session_id = data.get("session_id", "default")  # Retrieve the session ID
    num_questions = data.get("numQuestions", 5)

    # Retrieve the summary from the cache
    summary = summaries_cache.get(session_id)
    if not summary:
        return jsonify({"message": "No summary available. Please generate a summary first."}), 400

    try:
        # Call the generate_quiz function
        quiz = generate_quiz(summary, num_questions)
        return jsonify({"Quiz": quiz}), 200
    except Exception as e:
        print(f"Error in quiz_generation: {e}")
        return jsonify({"message": "Error generating quiz."}), 500
    
def cleanup_uploads():
    print("Cleaning up uploads folder...")
    if os.path.exists(UPLOAD_FOLDER):
        shutil.rmtree(UPLOAD_FOLDER)  # Deletes the entire folder and its contents
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Recreate the folder for future use
    print("Uploads folder cleaned.")
atexit.register(cleanup_uploads)

if __name__ == '__main__':
    app.run(debug=True)