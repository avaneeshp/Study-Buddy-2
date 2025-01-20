import google.generativeai as genai
import os
from tqdm import tqdm
from pypdf import PdfReader
import pytesseract
from PIL import Image

os.environ["GOOGLE_API_KEY"] = 'AIzaSyA4U95OPm8gMXZ63Q63xjZCAydnb9mE0Tg'
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-pro-latest")
def converter(file_path, topic):
    try:
        prompt = f"I am having trouble understanding '{topic}'. Here is the information associated with it. As a student focusing on that field, write an in-depth summary in plain text format without any additional metadata."
        if file_path.endswith(".pdf"):
            reader = PdfReader(file_path)
            text = "".join(page.extract_text() for page in reader.pages)
            print("Extracted text from PDF")
        elif file_path.endswith(".txt"):
            with open(file_path, "r") as f:
                text = f.read()
            print("Extracted text from TXT file")
        elif file_path.lower().endswith((".png", ".jpg")):
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            print("Extracted text from image file")
        else:
            raise ValueError("Unsupported file format")
        response = model.generate_content([prompt, text])
        raw_response = response.text.strip()
        output_path = f"{file_path[:-4]}_summary.txt"
        with open(output_path, "w") as f:
            f.write(raw_response)
        print(f"Summary saved to: {output_path}")

    except Exception as e:
        print(f"Error in converter: {e}")
        raise

def generate_quiz(summary, num_questions):
    try:
        print(f"Generating {num_questions} quiz questions based on summary.")
        prompt = f"""
        Based on the following summary, generate {num_questions} multiple-choice quiz questions. 
        
        Use this JSON schema: 
        Questions = {{"Question": "Question 1","answers": ["A", "B", "C", "D"],"correctAnswer": "A"}}
        Return: list[Questions]
        
        Summary:
        {summary}
        """
        response = model.generate_content(prompt)
        quiz = response.text
        print(quiz)
        return quiz
    except Exception as e:
        print(f"Error in generate_quiz: {e}")
        raise